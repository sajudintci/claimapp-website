"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ClaimDetailHeader } from "@/components/claim-detail/claim-detail-header";
import { ClaimDocumentPanel } from "@/components/claim-detail/claim-document-panel";
import { ClaimExtractionPanel } from "@/components/claim-detail/claim-extraction-panel";
import { ClaimMetadataBar } from "@/components/claim-detail/claim-metadata-bar";
import { MobileWorkspaceTabs } from "@/components/claim-detail/mobile-workspace-tabs";
import {
  ClaimDetailData,
  DocumentFocusTarget,
  MobileWorkspaceTab,
} from "@/components/claim-detail/types";
import { buildExtractionContext } from "@/components/claim-detail/utils";
import { ExtractionProgress } from "@/lib/extraction/extraction-progress";
import { buildFieldRows, resolveClaimsFromPayload } from "@/lib/extraction/claim-extraction";
import {
  buildReviewedPayload,
  fieldValuesFromRows,
  initReviewStateFromPayload,
} from "@/lib/extraction/claim-review";
import { parseOcrPagesFromPayload } from "@/lib/pdf/pdf-ocr-pages";
import { LoadingSkeleton } from "@/components/claimora/states";
import { useApiQuery } from "@/hooks/use-api-query";
import { API_BASE_URL, apiAuthedFetch, getSessionToken } from "@/lib/api/client";
import { ClaimStatus } from "@/types/claim";
import { cn } from "@/lib/utils";

export default function ClaimDetailPage() {
  const params = useParams<{ id: string }>();
  const claimId = params?.id;

  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileWorkspaceTab>("document");
  const [documentFocus, setDocumentFocus] = useState<DocumentFocusTarget | null>(null);
  const [activeClaimIndex, setActiveClaimIndex] = useState(0);
  const [fieldValuesByClaim, setFieldValuesByClaim] = useState<Record<number, Record<string, string>>>(
    {},
  );
  const [originalValuesByClaim, setOriginalValuesByClaim] = useState<
    Record<number, Record<string, string>>
  >({});
  const [reviewedKeysByClaim, setReviewedKeysByClaim] = useState<Record<number, string[]>>({});
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, refetch, setData } = useApiQuery(
    () => apiAuthedFetch<ClaimDetailData>(`/claims/${claimId}`),
    [claimId],
  );

  const documents = data?.documents ?? [];
  const ctx = useMemo(
    () => buildExtractionContext(data ?? undefined, documents.length),
    [data, documents.length],
  );
  const ocrPages = useMemo(() => parseOcrPagesFromPayload(ctx.payload), [ctx.payload]);
  const extractionPayload = ctx.payload;

  const selectedDocument =
    documents.find((doc) => doc.id === selectedDocumentId) ?? documents[0];
  const isPdfDocument = selectedDocument?.mimeType === "application/pdf";
  const currentStatus = (data?.claim?.status as ClaimStatus) ?? "Processing";

  const patientNameFallback = useMemo(() => {
    const summary = ctx.payload.summary as { insuredName?: string } | undefined;
    return summary?.insuredName ?? undefined;
  }, [ctx.payload.summary]);

  const isRefreshing = isLoading && Boolean(data);
  const isExtractionActive =
    data?.latestJob?.status === "QUEUED" || data?.latestJob?.status === "PROCESSING";

  useEffect(() => {
    if (!claimId || !isExtractionActive) return;

    let active = true;

    async function pollExtractionStatus() {
      try {
        const job = await apiAuthedFetch<{
          status: string;
          progress?: ExtractionProgress;
          progressStage?: string | null;
        }>(`/claims/${claimId}/extraction-status`);

        if (!active) return;

        setData((prev) =>
          prev?.latestJob
            ? {
                ...prev,
                latestJob: {
                  ...prev.latestJob,
                  status: job.status ?? prev.latestJob.status,
                  progress: job.progress ?? prev.latestJob.progress,
                  progressStage: job.progressStage ?? prev.latestJob.progressStage,
                },
              }
            : prev,
        );

        if (job.status === "COMPLETED" || job.status === "FAILED") {
          await refetch();
        }
      } catch {
        // Ignore transient polling errors.
      }
    }

    void pollExtractionStatus();
    const timer = setInterval(pollExtractionStatus, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [claimId, isExtractionActive, refetch, setData]);

  useEffect(() => {
    if (!data) return;

    const baseExtraction =
      (data.latestResult?.payload ?? data.claim?.extractionResult ?? {}) as Record<string, unknown>;
    const workingPayload =
      (data.claim?.reviewedResult as Record<string, unknown> | null | undefined) ?? baseExtraction;
    const reviewState = initReviewStateFromPayload(workingPayload);

    const originals: Record<number, Record<string, string>> = {};
    const claims = resolveClaimsFromPayload(baseExtraction);
    claims.forEach((claim, index) => {
      originals[index] = fieldValuesFromRows(buildFieldRows(claim));
    });

    setFieldValuesByClaim(reviewState.fieldValuesByClaim);
    setOriginalValuesByClaim(originals);
    setReviewedKeysByClaim(reviewState.reviewedKeysByClaim);

    const savedAt = (workingPayload._review as { updatedAt?: string } | undefined)?.updatedAt;
    setDraftSavedAt(savedAt ? new Date(savedAt) : null);
  }, [data]);

  useEffect(() => {
    if (!selectedDocumentId && documents.length > 0) {
      setSelectedDocumentId(documents[0]?.id ?? null);
    }
  }, [documents, selectedDocumentId]);

  useEffect(() => {
    let active = true;
    let nextPreviewUrl: string | null = null;

    async function loadPreview() {
      if (!claimId || !selectedDocument) {
        setPreviewUrl(null);
        setPreviewError(null);
        return;
      }

      setIsPreviewLoading(true);
      setPreviewError(null);
      try {
        const token = getSessionToken();
        if (!token) throw new Error("Missing session token");

        const response = await fetch(
          `${API_BASE_URL}/claims/${claimId}/documents/${selectedDocument.id}/preview`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!response.ok) throw new Error("Failed loading document preview");

        const blob = await response.blob();
        nextPreviewUrl = URL.createObjectURL(blob);
        if (active) setPreviewUrl(nextPreviewUrl);
      } catch (err) {
        if (active) {
          setPreviewUrl(null);
          setPreviewError(err instanceof Error ? err.message : "Failed loading preview");
        }
      } finally {
        if (active) setIsPreviewLoading(false);
      }
    }

    loadPreview();
    return () => {
      active = false;
      if (nextPreviewUrl) URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [claimId, selectedDocument]);

  const reviewPayload = useMemo(
    () =>
      buildReviewedPayload({
        basePayload: extractionPayload,
        fieldValuesByClaim,
        reviewedKeysByClaim,
      }),
    [extractionPayload, fieldValuesByClaim, reviewedKeysByClaim],
  );

  const activeFieldValues = fieldValuesByClaim[activeClaimIndex] ?? {};
  const activeOriginalValues = originalValuesByClaim[activeClaimIndex] ?? {};
  const activeReviewedKeys = useMemo(
    () => new Set(reviewedKeysByClaim[activeClaimIndex] ?? []),
    [reviewedKeysByClaim, activeClaimIndex],
  );

  const updateFieldValue = useCallback(
    (key: string, value: string) => {
      setFieldValuesByClaim((current) => ({
        ...current,
        [activeClaimIndex]: {
          ...(current[activeClaimIndex] ?? {}),
          [key]: value,
        },
      }));
    },
    [activeClaimIndex],
  );

  const toggleReviewed = useCallback(
    (key: string) => {
      setReviewedKeysByClaim((current) => {
        const existing = new Set(current[activeClaimIndex] ?? []);
        if (existing.has(key)) existing.delete(key);
        else existing.add(key);
        return {
          ...current,
          [activeClaimIndex]: Array.from(existing),
        };
      });
    },
    [activeClaimIndex],
  );

  const saveReview = useCallback(
    async (nextStatus: ClaimStatus, mode: "draft" | "submit") => {
      if (!claimId) return;
      const setter = mode === "draft" ? setIsSavingDraft : setIsSubmitting;
      setter(true);
      try {
        const payload = buildReviewedPayload({
          basePayload: extractionPayload,
          fieldValuesByClaim,
          reviewedKeysByClaim,
        });

        await apiAuthedFetch(`/claims/${claimId}/review`, {
          method: "PATCH",
          body: JSON.stringify({
            status: nextStatus,
            reviewedResult: payload,
          }),
        });

        setData((prev) =>
          prev?.claim
            ? { ...prev, claim: { ...prev.claim, status: nextStatus } }
            : prev,
        );

        if (mode === "draft") {
          setDraftSavedAt(new Date());
          toast.success("Draft saved");
        } else {
          toast.success("Claim submitted");
        }
        await refetch();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save review");
      } finally {
        setter(false);
      }
    },
    [claimId, extractionPayload, fieldValuesByClaim, reviewedKeysByClaim, refetch, setData],
  );

  const handleFocusField = useCallback((focus: DocumentFocusTarget) => {
    setDocumentFocus(focus);
    setMobileTab("document");
  }, []);

  if (!claimId) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Invalid claim ID.</p>;
  }

  return (
    <div className="space-y-5 pb-8">
      <ClaimDetailHeader
        status={currentStatus}
        draftSavedAt={draftSavedAt}
        isRefreshing={isRefreshing}
        onRefresh={refetch}
      />

      {isLoading && !data ? <LoadingSkeleton /> : null}

      {data ? (
        <>
          <ClaimMetadataBar
            claimNumber={data.claim?.claimNumber}
            metadata={data.claim?.metadata}
            patientNameFallback={patientNameFallback}
            reviewerName={data.claim?.reviewer?.name ?? null}
          />

          <MobileWorkspaceTabs active={mobileTab} onChange={setMobileTab} />

          <div className="grid gap-4 xl:grid-cols-5 xl:items-start">
            <div
              className={cn(
                "xl:col-span-3",
                mobileTab === "extraction" ? "hidden xl:block" : "block",
              )}
            >
              <ClaimDocumentPanel
                selectedDocument={selectedDocument}
                previewUrl={previewUrl}
                isPreviewLoading={isPreviewLoading}
                previewError={previewError}
                documentFocus={documentFocus}
                ocrPages={ocrPages}
              />
            </div>

            <div
              className={cn(
                "min-w-0 xl:col-span-2",
                mobileTab === "document" ? "hidden xl:block" : "block",
              )}
            >
              <ClaimExtractionPanel
                claimId={claimId}
                ctx={ctx}
                reviewPayload={reviewPayload}
                activeClaimIndex={activeClaimIndex}
                onActiveClaimIndexChange={setActiveClaimIndex}
                fieldValues={activeFieldValues}
                originalValues={activeOriginalValues}
                reviewedKeys={activeReviewedKeys}
                onFieldChange={updateFieldValue}
                onToggleReviewed={toggleReviewed}
                isPdfDocument={isPdfDocument}
                onFocusField={isPdfDocument ? handleFocusField : undefined}
                onSaveDraft={() => saveReview("Draft", "draft")}
                onSubmit={() => saveReview("Reviewed", "submit")}
                isSavingDraft={isSavingDraft}
                isSubmitting={isSubmitting}
                canSubmit={currentStatus !== "Reviewed"}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
