"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiAuthedFetch } from "@/lib/api/client";
import { ReportSummaryResponse } from "@/types/api";

const STATUS_COLORS: Record<string, string> = {
  Reviewed: "bg-emerald-500",
  "Needs Attention": "bg-amber-500",
  Failed: "bg-red-500",
  "In pipeline": "bg-primary-500",
  Other: "bg-slate-400",
};

export function ClaimsStatusChart() {
  const { data, isLoading } = useApiQuery(
    () => apiAuthedFetch<ReportSummaryResponse>("/reports/summary"),
    [],
  );

  if (isLoading) {
    return <section className="h-72 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800" />;
  }

  const kpi = data?.kpis ?? {};
  const processing = data?.processing ?? {};
  const total = Number(kpi.totalClaims ?? 0) || 1;

  const inPipeline =
    Number(processing.queuedJobs ?? 0) + Number(processing.processingJobs ?? 0);
  const accounted =
    Number(kpi.reviewedClaims ?? 0) +
    Number(kpi.needsAttention ?? 0) +
    Number(kpi.failedClaims ?? 0) +
    inPipeline;

  const statuses = [
    { status: "Reviewed", count: Number(kpi.reviewedClaims ?? 0) },
    { status: "Needs Attention", count: Number(kpi.needsAttention ?? 0) },
    { status: "In pipeline", count: inPipeline },
    { status: "Failed", count: Number(kpi.failedClaims ?? 0) },
    {
      status: "Other",
      count: Math.max(0, Number(kpi.totalClaims ?? 0) - accounted),
    },
  ].filter((s) => s.count > 0 || s.status !== "Other");

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Claims by status</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Portfolio distribution</p>
        </div>
        <Link
          href="/claims"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark dark:text-primary dark:hover:text-primary"
        >
          View all
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      <div className="mt-5 space-y-3.5">
        {statuses.map((item) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          const color = STATUS_COLORS[item.status] ?? "bg-slate-400";
          return (
            <div key={item.status}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">{item.status}</span>
                <span className="tabular-nums text-slate-500 dark:text-slate-400">
                  {item.count.toLocaleString()}{" "}
                  <span className="text-xs text-slate-400 dark:text-slate-500">({pct}%)</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full ${color} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 border-t border-slate-100 pt-5 dark:border-slate-800">
        <StatPill label="Queued" value={Number(processing.queuedJobs ?? 0)} />
        <StatPill label="Active jobs" value={Number(processing.processingJobs ?? 0)} />
      </div>
    </section>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-2 text-center dark:bg-slate-800/80">
      <p className="text-base font-bold tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
