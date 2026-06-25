"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { JsonViewer } from "@/components/claimora/json-viewer";
import { ClaimAuditTab } from "@/components/claim-detail/claim-audit-tab";
import { ClaimCommentTab } from "@/components/claim-detail/claim-comment-tab";
import { ClaimDataTab } from "@/components/claim-detail/claim-data-tab";
import { ExtractionDataLoading } from "@/components/claim-detail/extraction-data-loading";
import { fallbackExtractionProgress } from "@/lib/extraction/extraction-progress";
import { ExtractionContext, ExtractionTab, DocumentFocusTarget } from "@/components/claim-detail/types";
import {
  buildFieldRows,
  ExtractionClaim,
  resolveClaimsFromPayload,
  tracedFieldValue,
  type TracedField,
} from "@/lib/extraction/claim-extraction";
import { formatTracePages, tracesFromField } from "@/lib/extraction/field-trace";
import { cn } from "@/lib/utils";

const TABS: Array<{ id: ExtractionTab; label: string }> = [
  { id: "data", label: "Data" },
  { id: "json", label: "JSON" },
  { id: "audit", label: "Audit" },
  { id: "comment", label: "Comment" },
];

const OVERVIEW_FIELD_KEYS = [
  { section: "Patient", field: "name" },
  { section: "Provider", field: "hospital_name" },
  { section: "Diagnosis", field: "icd10_description" },
  { section: "Billing", field: "total_amount_read" },
] as const;

type ClaimExtractionPanelProps = {
  claimId: string;
  ctx: ExtractionContext;
  reviewPayload: Record<string, unknown>;
  activeClaimIndex: number;
  onActiveClaimIndexChange: (index: number) => void;
  fieldValues: Record<string, string>;
  originalValues: Record<string, string>;
  reviewedKeys: Set<string>;
  onFieldChange: (key: string, value: string) => void;
  onToggleReviewed: (key: string) => void;
  isPdfDocument?: boolean;
  onFocusField?: (focus: DocumentFocusTarget) => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  isSavingDraft: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;
};

function buildOverviewRows(activeClaim: ExtractionClaim | undefined, allRows: ReturnType<typeof buildFieldRows>) {
  if (!activeClaim) return [];

  const overview: ReturnType<typeof buildFieldRows> = [];
  for (const spec of OVERVIEW_FIELD_KEYS) {
    const existing = allRows.find((row) => row.section === spec.section && row.field === spec.field);
    if (existing) {
      overview.push(existing);
      continue;
    }

    const sectionData = activeClaim[spec.section.toLowerCase() as keyof ExtractionClaim] as
      | Record<string, unknown>
      | undefined;
    const traced = sectionData?.[spec.field];
    if (!traced) continue;

    const tracedField = traced as TracedField;
    const sourceText =
      typeof tracedField.source_text === "string" ? tracedField.source_text : "";
    const pageNum = tracedField.page ?? null;
    const traces = tracesFromField(tracedField);

    overview.push({
      section: spec.section,
      field: spec.field,
      value: tracedFieldValue(traced),
      confidence:
        traced && typeof traced === "object" && "confidence" in traced
          ? Math.round(Number((traced as { confidence?: number }).confidence) * 100) || 0
          : 0,
      sourceText,
      page: formatTracePages({ source_text: sourceText, page: pageNum, traces }),
      traces,
    });
  }

  return overview;
}

export function ClaimExtractionPanel({
  claimId,
  ctx,
  reviewPayload,
  activeClaimIndex,
  onActiveClaimIndexChange,
  fieldValues,
  originalValues,
  reviewedKeys,
  onFieldChange,
  onToggleReviewed,
  isPdfDocument = false,
  onFocusField,
  onSaveDraft,
  onSubmit,
  isSavingDraft,
  isSubmitting,
  canSubmit,
}: ClaimExtractionPanelProps) {
  const [activeTab, setActiveTab] = useState<ExtractionTab>("data");

  const claims = useMemo(() => resolveClaimsFromPayload(ctx.payload), [ctx.payload]);
  const activeClaim = claims[activeClaimIndex] ?? claims[0];
  const fieldRows = useMemo(() => (activeClaim ? buildFieldRows(activeClaim) : []), [activeClaim]);
  const overviewRows = useMemo(
    () => buildOverviewRows(activeClaim, fieldRows),
    [activeClaim, fieldRows],
  );

  const overviewKeys = new Set(overviewRows.map((row) => `${row.section}-${row.field}`));
  const detailFieldRows = fieldRows.filter((row) => !overviewKeys.has(`${row.section}-${row.field}`));
  const isExtracting =
    ctx.isJobActive || (ctx.currentStatus === "Processing" && claims.length === 0);

  if (isExtracting) {
    return (
      <section className="relative flex max-h-[min(78vh,820px)] min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <ExtractionDataLoading progress={ctx.extractionProgress ?? fallbackExtractionProgress(ctx.jobStatus)} />
      </section>
    );
  }

  return (
    <section className="relative flex max-h-[min(78vh,820px)] min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="shrink-0 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="shrink-0 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Extraction Output
          </h2>

          <div className="flex min-w-0 flex-1 flex-wrap gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800/50">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  activeTab === tab.id
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {claims.length > 1 ? (
            <div className="flex shrink-0 flex-wrap gap-0.5">
              {claims.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => onActiveClaimIndexChange(index)}
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                    activeClaimIndex === index
                      ? "border-primary/30 bg-primary/10 text-primary-hover dark:border-primary/30 dark:bg-primary/15 dark:text-primary"
                      : "border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400",
                  )}
                >
                  #{index + 1}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto p-2.5">
        {activeTab === "data" ? (
          <ClaimDataTab
            overviewRows={overviewRows}
            fieldRows={detailFieldRows}
            fieldValues={fieldValues}
            originalValues={originalValues}
            reviewedKeys={reviewedKeys}
            onFieldChange={onFieldChange}
            onToggleReviewed={onToggleReviewed}
            isPdfDocument={isPdfDocument}
            onFocusField={onFocusField}
          />
        ) : null}
        {activeTab === "json" ? <JsonViewer value={reviewPayload} /> : null}
        {activeTab === "audit" ? <ClaimAuditTab claimId={claimId} /> : null}
        {activeTab === "comment" ? <ClaimCommentTab claimId={claimId} /> : null}
      </div>

      <div className="shrink-0 border-t border-slate-100 px-2.5 py-2 dark:border-slate-800">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSavingDraft || isSubmitting}
            className="inline-flex h-8 flex-1 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-800 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            {isSavingDraft ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              "Save draft"
            )}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit || isSubmitting || isSavingDraft}
            className="inline-flex h-8 flex-1 items-center justify-center rounded-lg bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                Submitting…
              </>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
