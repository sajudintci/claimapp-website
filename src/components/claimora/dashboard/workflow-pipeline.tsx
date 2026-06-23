"use client";

import Link from "next/link";
import { ArrowRight, Brain, Clock, ScanLine, UserCheck } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiAuthedFetch } from "@/lib/api/client";
import { ReportSummaryResponse } from "@/types/api";
import { cn } from "@/lib/utils";

type Stage = {
  label: string;
  count: number;
  detail: string;
  icon: React.ReactNode;
  href: string;
  tone: string;
};

export function WorkflowPipeline() {
  const { data, isLoading } = useApiQuery(
    () => apiAuthedFetch<ReportSummaryResponse>("/reports/summary"),
    [],
  );

  if (isLoading) {
    return (
      <section className="h-full min-h-[280px] animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800" />
    );
  }

  const kpis = data?.kpis ?? {};
  const processing = data?.processing ?? {};
  const total = Number(kpis.totalClaims ?? 0) || 1;

  const stages: Stage[] = [
    {
      label: "Queued",
      count: Number(processing.queuedJobs ?? 0),
      detail: "Waiting in extraction queue",
      icon: <Clock className="size-4" />,
      href: "/claims?status=Processing",
      tone: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200",
    },
    {
      label: "Processing",
      count: Number(processing.processingJobs ?? 0),
      detail: "OCR / AI running now",
      icon: <ScanLine className="size-4" />,
      href: "/claims?status=Processing",
      tone: "border-primary/20 bg-primary/10 text-primary-hover dark:border-primary/30 dark:bg-primary/15 dark:text-primary",
    },
    {
      label: "Needs attention",
      count: Number(kpis.needsAttention ?? 0),
      detail: "Human review required",
      icon: <UserCheck className="size-4" />,
      href: `/claims?status=${encodeURIComponent("Needs Attention")}`,
      tone: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
    },
    {
      label: "Reviewed",
      count: Number(kpis.reviewedClaims ?? 0),
      detail: "Closed by reviewer",
      icon: <Brain className="size-4" />,
      href: `/claims?status=${encodeURIComponent("Reviewed")}`,
      tone: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
    },
  ];

  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Extraction pipeline</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Live queue and review workload ({total.toLocaleString()} total claims)
          </p>
        </div>
        <span className="shrink-0 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary-hover dark:bg-primary/15 dark:text-primary">
          Live
        </span>
      </div>

      <div className="grid flex-1 gap-3 sm:grid-cols-2">
        {stages.map((stage, index) => {
          const pct = Math.min(100, Math.round((stage.count / total) * 100));
          return (
            <Link
              key={stage.label}
              href={stage.href}
              className={cn(
                "group flex flex-col rounded-xl border p-4 transition-shadow hover:shadow-md",
                stage.tone,
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {stage.icon}
                  <p className="text-xs font-semibold">{stage.label}</p>
                </div>
                {index < stages.length - 1 ? (
                  <ArrowRight className="hidden size-4 opacity-40 sm:block" aria-hidden />
                ) : null}
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">{stage.count.toLocaleString()}</p>
              <p className="mt-1 text-[11px] opacity-90">{stage.detail}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/60 dark:bg-black/20">
                <div
                  className="h-full rounded-full bg-current opacity-40 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] opacity-75">{pct}% of portfolio</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
