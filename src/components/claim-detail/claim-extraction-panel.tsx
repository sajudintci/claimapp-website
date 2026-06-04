"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { JsonViewer } from "@/components/claimora/json-viewer";
import { ClaimDebugTab } from "@/components/claim-detail/claim-debug-tab";
import { ClaimFieldsTable } from "@/components/claim-detail/claim-fields-table";
import { ClaimLineItemsTab } from "@/components/claim-detail/claim-line-items-tab";
import { ClaimOverviewTab } from "@/components/claim-detail/claim-overview-tab";
import { ExtractionContext, ExtractionTab, DocumentFocusTarget } from "@/components/claim-detail/types";
import {
  buildFieldRows,
  ExtractionClaim,
  resolveClaimsFromPayload,
} from "@/lib/extraction/claim-extraction";
import { cn } from "@/lib/utils";

const TABS: Array<{ id: ExtractionTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "fields", label: "Fields" },
  { id: "lineitems", label: "Line items" },
  { id: "json", label: "JSON" },
  { id: "debug", label: "Debug" },
];

type ClaimExtractionPanelProps = {
  ctx: ExtractionContext;
  extractionSource?: string;
  jobAttempts?: number;
  abbyyTransactionId?: string | null;
  isPdfDocument?: boolean;
  documentFocus?: DocumentFocusTarget | null;
  onFocusField?: (focus: DocumentFocusTarget) => void;
};

export function ClaimExtractionPanel({
  ctx,
  extractionSource,
  jobAttempts,
  abbyyTransactionId,
  isPdfDocument = false,
  documentFocus,
  onFocusField,
}: ClaimExtractionPanelProps) {
  const [activeTab, setActiveTab] = useState<ExtractionTab>("overview");
  const [activeClaimIndex, setActiveClaimIndex] = useState(0);

  const claims = useMemo(
    () => resolveClaimsFromPayload(ctx.payload),
    [ctx.payload],
  );
  const activeClaim = claims[activeClaimIndex] ?? claims[0];
  const fieldRows = useMemo(
    () => (activeClaim ? buildFieldRows(activeClaim) : []),
    [activeClaim],
  );
  const summary =
    (ctx.payload.summary as Record<string, unknown> | undefined) ?? {};

  return (
    <section className="flex min-h-[520px] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Extraction output</h2>
          {ctx.isJobActive ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-400">
              <Loader2 className="size-3.5 animate-spin" />
              Updating…
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                activeTab === tab.id
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {claims.length > 1 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {claims.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveClaimIndex(index)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-semibold",
                  activeClaimIndex === index
                    ? "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                    : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400",
                )}
              >
                Claim {index + 1}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {activeTab === "overview" ? (
          <ClaimOverviewTab
            claims={claims}
            activeClaim={activeClaim}
            summary={summary}
            ctx={ctx}
            isPdfDocument={isPdfDocument}
            activeFocusLabel={documentFocus?.label ?? null}
            onFocusField={onFocusField}
          />
        ) : null}
        {activeTab === "fields" ? (
          <ClaimFieldsTable
            rows={fieldRows}
            isPdfDocument={isPdfDocument}
            activeFocusLabel={documentFocus?.label ?? null}
            onFocusField={onFocusField}
          />
        ) : null}
        {activeTab === "lineitems" ? (
          <ClaimLineItemsTab
            claim={activeClaim}
            isPdfDocument={isPdfDocument}
            activeFocusLabel={documentFocus?.label ?? null}
            onFocusField={onFocusField}
          />
        ) : null}
        {activeTab === "json" ? (
          <div className="max-h-[min(60vh,640px)] overflow-auto">
            <JsonViewer value={ctx.payload} />
          </div>
        ) : null}
        {activeTab === "debug" ? (
          <ClaimDebugTab
            ctx={ctx}
            extractionSource={extractionSource}
            jobAttempts={jobAttempts}
            abbyyTransactionId={abbyyTransactionId}
          />
        ) : null}
      </div>
    </section>
  );
}
