"use client";

import { ExtractionContext } from "@/components/claim-detail/types";

export function ClaimDebugTab({
  ctx,
  extractionSource,
  jobAttempts,
  abbyyTransactionId,
}: {
  ctx: ExtractionContext;
  extractionSource?: string;
  jobAttempts?: number;
  abbyyTransactionId?: string | null;
}) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Extraction source", value: extractionSource ?? "N/A" },
    { label: "Job status", value: ctx.jobStatus },
    { label: "Job attempts", value: String(jobAttempts ?? 0) },
    { label: "LLM status", value: ctx.llmStatus || "N/A" },
    { label: "OCR sufficient", value: ctx.ocrSufficient ? "Yes" : "No" },
    { label: "OCR filtered", value: ctx.ocrFiltered ? "Yes" : "No" },
    { label: "OCR char count", value: ctx.ocrCharCount.toLocaleString() },
    { label: "OCR page count", value: ctx.ocrPageCount != null ? String(ctx.ocrPageCount) : "N/A" },
    { label: "Confidence", value: `${ctx.confidence}%` },
    {
      label: "ABBYY transaction",
      value: abbyyTransactionId ?? "N/A",
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Pipeline metadata for support and auditing. Not shown to end claimants.
      </p>
      <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50 dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-800/50">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-1 px-4 py-2.5 sm:grid-cols-[minmax(140px,200px)_1fr]"
          >
            <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">{row.label}</dt>
            <dd className="break-all font-mono text-xs text-slate-800 dark:text-slate-200">{row.value}</dd>
          </div>
        ))}
      </dl>
      {ctx.llmError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
          <p className="font-semibold">LLM error</p>
          <p className="mt-1 whitespace-pre-wrap">{ctx.llmError}</p>
        </div>
      ) : null}
    </div>
  );
}
