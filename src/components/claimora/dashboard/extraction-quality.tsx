"use client";

import { DashboardMetricsResponse } from "@/types/api";

type ExtractionQualityProps = {
  buckets?: DashboardMetricsResponse["extractionQuality"];
  isLoading?: boolean;
};

export function ExtractionQuality({ buckets, isLoading }: ExtractionQualityProps) {
  const rows = buckets ?? [
    { label: "High Confidence", pct: 0, count: 0 },
    { label: "Needs Verification", pct: 0, count: 0 },
    { label: "Missing or Unreadable", pct: 0, count: 0 },
  ];

  return (
    <section className="h-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Extraction Quality</h2>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Confidence distribution this week
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.label}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">{row.label}</span>
                <span className="tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                  {row.pct}%
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-slate-500 transition-all dark:bg-slate-400"
                  style={{ width: `${row.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
