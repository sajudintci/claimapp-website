"use client";

import { DashboardMetricsResponse } from "@/types/api";

type ThroughputChartProps = {
  days?: DashboardMetricsResponse["throughput"];
  isLoading?: boolean;
};

export function ThroughputChart({ days, isLoading }: ThroughputChartProps) {
  const rows = days ?? [];
  const maxTotal = Math.max(1, ...rows.map((day) => day.uploaded + day.processed));

  return (
    <section className="h-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Throughput</h2>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Documents processed over the last 7 days
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-end gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 animate-pulse rounded-t-md bg-slate-100 dark:bg-slate-800"
              style={{ height: `${40 + i * 8}%` }}
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="flex h-48 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
          No throughput data for the last 7 days.
        </p>
      ) : (
        <>
          <div className="flex h-48 gap-2 sm:gap-3">
            {rows.map((day) => {
              const total = day.uploaded + day.processed;
              const barHeightPct = total > 0 ? Math.max(8, (total / maxTotal) * 100) : 4;
              const processedPct = total > 0 ? Math.round((day.processed / total) * 100) : 0;
              const uploadedPct = 100 - processedPct;

              return (
                <div key={day.label} className="flex min-w-0 flex-1 flex-col items-center">
                  <div className="flex w-full max-w-12 flex-1 flex-col justify-end">
                    <div
                      className="flex w-full flex-col justify-end overflow-hidden rounded-t-md bg-slate-200 dark:bg-slate-700"
                      style={{ height: `${barHeightPct}%` }}
                      title={`${day.uploaded} uploaded, ${day.processed} processed`}
                    >
                      {uploadedPct > 0 ? (
                        <div
                          className="w-full bg-slate-300 dark:bg-slate-500"
                          style={{ height: `${uploadedPct}%` }}
                        />
                      ) : null}
                      {processedPct > 0 ? (
                        <div
                          className="w-full bg-slate-500 dark:bg-slate-400"
                          style={{ height: `${processedPct}%` }}
                        />
                      ) : null}
                    </div>
                  </div>
                  <span className="mt-2 shrink-0 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span className="inline-flex items-center gap-2">
              <span className="size-2.5 rounded-sm bg-slate-500 dark:bg-slate-400" />
              Processed
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="size-2.5 rounded-sm bg-slate-300 dark:bg-slate-500" />
              Uploaded
            </span>
          </div>
        </>
      )}
    </section>
  );
}
