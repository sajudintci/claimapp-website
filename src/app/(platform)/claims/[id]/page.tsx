"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ClaimDetailHeader } from "@/components/claim-detail/claim-detail-header";
import { ClaimDocumentPanel } from "@/components/claim-detail/claim-document-panel";
import { ClaimExtractionPanel } from "@/components/claim-detail/claim-extraction-panel";
import { ClaimIssuesPanel } from "@/components/claim-detail/claim-issues-panel";
import { ClaimProcessingTimeline } from "@/components/claim-detail/claim-processing-timeline";
import { MobileWorkspaceTabs } from "@/components/claim-detail/mobile-workspace-tabs";
import { ClaimDetailData, DocumentFocusTarget, MobileWorkspaceTab } from "@/components/claim-detail/types";
import { buildExtractionContext } from "@/components/claim-detail/utils";
import { parseOcrPagesFromPayload } from "@/lib/pdf/pdf-ocr-pages";
import { LoadingSkeleton } from "@/components/claimora/states";
import { useApiQuery } from "@/hooks/use-api-query";
import { API_BASE_URL, apiAuthedFetch, getSessionToken } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export default function ClaimDetailPage() {
  const params = useParams<{ id: string }>();
  const claimId = params?.id;

  const [isUpdatingStatus, setIsUpdatingStatus] = useState<"Reviewed" | "Needs Attention" | null>(
    null,
  );
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileWorkspaceTab>("document");
  const [documentFocus, setDocumentFocus] = useState<DocumentFocusTarget | null>(null);

  const { data, isLoading, refetch } = useApiQuery(
    () => apiAuthedFetch<ClaimDetailData>(`/claims/${claimId}`),
    [claimId],
  );

  const documents = data?.documents ?? [];
  const ctx = useMemo(
    () => buildExtractionContext(data ?? undefined, documents.length),
    [data, documents.length],
  );
  const ocrPages = useMemo(() => parseOcrPagesFromPayload(ctx.payload), [ctx.payload]);

  const selectedDocument =
    documents.find((doc) => doc.id === selectedDocumentId) ?? documents[0];
  const isPdfDocument = selectedDocument?.mimeType === "application/pdf";

  const abbyyTransactionId =
    (ctx.payload.abbyyTransactionId as string | null | undefined) ?? null;

  const isRefreshing = isLoading && Boolean(data);

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

  const retryExtraction = useCallback(async () => {
    if (!claimId || !ctx.canRetryExtraction) return;
    setIsRetrying(true);
    try {
      await apiAuthedFetch(`/claims/${claimId}/extraction/retry`, { method: "POST" });
      toast.success("Extraction retry queued");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to retry extraction");
    } finally {
      setIsRetrying(false);
    }
  }, [claimId, ctx.canRetryExtraction, refetch]);

  const updateReviewStatus = useCallback(
    async (nextStatus: "Reviewed" | "Needs Attention") => {
      if (!claimId) return;
      setIsUpdatingStatus(nextStatus);
      try {
        await apiAuthedFetch(`/claims/${claimId}/review`, {
          method: "PATCH",
          body: JSON.stringify({
            status: nextStatus,
            reviewedResult: ctx.payload,
          }),
        });
        toast.success(`Claim marked as ${nextStatus}`);
        await refetch();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update status");
      } finally {
        setIsUpdatingStatus(null);
      }
    },
    [claimId, ctx.payload, refetch],
  );

  const handleFocusField = useCallback((focus: DocumentFocusTarget) => {
    setDocumentFocus(focus);
    setMobileTab("document");
  }, []);

  if (!claimId) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Invalid claim ID.</p>;
  }

  return (
    <div className="space-y-4 pb-8">
      <ClaimDetailHeader
        claimId={claimId}
        claimNumber={data?.claim?.claimNumber}
        createdAt={data?.claim?.createdAt}
        extractionSource={data?.latestResult?.source}
        ctx={ctx}
        isRetrying={isRetrying}
        isRefreshing={isRefreshing}
        isUpdatingStatus={isUpdatingStatus}
        onRefresh={refetch}
        onRetry={retryExtraction}
        onMarkReviewed={() => updateReviewStatus("Reviewed")}
        onNeedsAttention={() => updateReviewStatus("Needs Attention")}
      />

      {isLoading && !data ? <LoadingSkeleton /> : null}

      {data ? (
        <>
          <ClaimProcessingTimeline ctx={ctx} hasDocuments={documents.length > 0} />
          <ClaimIssuesPanel ctx={ctx} jobError={data.latestJob?.errorMessage} />

          <MobileWorkspaceTabs active={mobileTab} onChange={setMobileTab} />

          <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
            <div className={mobileTab === "extraction" ? "hidden xl:block" : "block"}>
              <ClaimDocumentPanel
                selectedDocument={selectedDocument}
                previewUrl={previewUrl}
                isPreviewLoading={isPreviewLoading}
                previewError={previewError}
                documentFocus={documentFocus}
                ocrPages={ocrPages}
              />
            </div>

            <div className={cn(mobileTab === "document" ? "hidden xl:block" : "block", "min-w-0")}>
              <ClaimExtractionPanel
                ctx={ctx}
                extractionSource={data.latestResult?.source}
                jobAttempts={data.latestJob?.attempts}
                abbyyTransactionId={abbyyTransactionId}
                isPdfDocument={isPdfDocument}
                documentFocus={documentFocus}
                onFocusField={isPdfDocument ? handleFocusField : undefined}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
