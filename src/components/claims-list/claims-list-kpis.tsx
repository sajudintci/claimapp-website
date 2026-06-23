"use client";

import { AlertTriangle, CheckCircle2, FileStack, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiAuthedFetch } from "@/lib/api/client";
import { ReportSummaryResponse } from "@/types/api";

type KpiCard = {
  label: string;
  value: string;
  sub: string;
  icon: typeof FileStack;
  tone: "primary" | "warning" | "success" | "neutral";
};

export function ClaimsListKpis() {
  const { data, isLoading } = useApiQuery(async () => {
    const summary = await apiAuthedFetch<ReportSummaryResponse>("/reports/summary");
    const kpis = summary.kpis ?? {};
    const cards: KpiCard[] = [
      {
        label: "Total claims",
        value: String(kpis.totalClaims ?? 0),
        sub: "In your organization",
        icon: FileStack,
        tone: "primary",
      },
      {
        label: "Needs attention",
        value: String(kpis.needsAttention ?? 0),
        sub: "Requires reviewer action",
        icon: AlertTriangle,
        tone: "warning",
      },
      {
        label: "Reviewed",
        value: String(kpis.reviewedClaims ?? 0),
        sub: "Completed reviews",
        icon: CheckCircle2,
        tone: "success",
      },
      {
        label: "Failed extraction",
        value: String(kpis.failedClaims ?? 0),
        sub: "Retry or re-upload",
        icon: XCircle,
        tone: "neutral",
      },
    ];
    return cards;
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800" />
        ))}
      </div>
    );
  }

  const toneStyles = {
    primary: "bg-primary/10 text-primary-hover ring-primary/10 dark:bg-primary/15 dark:text-primary dark:ring-primary/30",
    warning: "bg-amber-50 text-amber-800 ring-amber-100 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900",
    neutral: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {(data ?? []).map((kpi) => {
        const Icon = kpi.icon;
        return (
          <article
            key={kpi.label}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl ring-1",
                  toneStyles[kpi.tone],
                )}
              >
                <Icon className="size-4" />
              </div>
            </div>
            <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">{kpi.label}</p>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{kpi.value}</p>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{kpi.sub}</p>
          </article>
        );
      })}
    </div>
  );
}
