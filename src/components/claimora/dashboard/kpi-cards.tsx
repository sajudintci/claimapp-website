"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  FileStack,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiAuthedFetch } from "@/lib/api/client";
import { ReportSummaryResponse } from "@/types/api";

const icons = {
  primary: FileStack,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
};

const accent = {
  primary: "from-primary/10 to-primary/5 text-primary ring-primary/20",
  success: "from-emerald-500/10 to-emerald-600/5 text-emerald-600 ring-emerald-500/20",
  warning: "from-amber-500/10 to-amber-600/5 text-amber-600 ring-amber-500/20",
  danger: "from-red-500/10 to-red-600/5 text-red-600 ring-red-500/20",
};

type KpiItem = {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  tone: keyof typeof icons;
  subtext: string;
  href: string;
};

export function DashboardKpiCards() {
  const { data, isLoading } = useApiQuery(async () => {
    const summary = await apiAuthedFetch<ReportSummaryResponse>("/reports/summary");
    const kpis = summary.kpis ?? {};
    const trends = summary.trends ?? {
      totalClaims: "+0%",
      reviewedClaims: "+0%",
      failedClaims: "-0%",
      needsAttention: "-0%",
    };
    const items: KpiItem[] = [
      {
        label: "Total claims",
        value: String(kpis.totalClaims ?? 0),
        trend: trends.totalClaims ?? "+0%",
        trendUp: true,
        tone: "primary",
        subtext: "All claims in organization",
        href: "/claims",
      },
      {
        label: "Needs attention",
        value: String(kpis.needsAttention ?? 0),
        trend: trends.needsAttention ?? "-0%",
        trendUp: false,
        tone: "warning",
        subtext: "Awaiting reviewer action",
        href: `/claims?status=${encodeURIComponent("Needs Attention")}`,
      },
      {
        label: "Reviewed",
        value: String(kpis.reviewedClaims ?? 0),
        trend: trends.reviewedClaims ?? "+0%",
        trendUp: true,
        tone: "success",
        subtext: "Completed reviews",
        href: `/claims?status=${encodeURIComponent("Reviewed")}`,
      },
      {
        label: "Failed extraction",
        value: String(kpis.failedClaims ?? 0),
        trend: trends.failedClaims ?? "-0%",
        trendUp: false,
        tone: "danger",
        subtext: "Retry or re-upload required",
        href: `/claims?status=${encodeURIComponent("Failed")}`,
      },
    ];
    return items;
  }, []);

  if (isLoading) {
    return (
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800" />
        ))}
      </section>
    );
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {(data ?? []).map((kpi) => {
        const Icon = icons[kpi.tone];
        const trendPositive =
          (kpi.trendUp && kpi.tone !== "danger") || (!kpi.trendUp && kpi.tone === "danger");
        return (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary/40"
          >
            <div
              className={cn(
                "absolute -right-4 -top-4 size-24 rounded-full bg-gradient-to-br opacity-60 blur-2xl transition-opacity group-hover:opacity-100",
                kpi.tone === "primary" && "from-primary/30",
                kpi.tone === "success" && "from-emerald-200",
                kpi.tone === "warning" && "from-amber-200",
                kpi.tone === "danger" && "from-red-200",
              )}
            />
            <div className="relative flex items-start justify-between gap-3">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ring-1",
                  accent[kpi.tone],
                )}
              >
                <Icon className="size-5" />
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                  trendPositive
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
                )}
              >
                {trendPositive ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {kpi.trend}
              </span>
            </div>
            <div className="relative mt-4">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{kpi.label}</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900 group-hover:text-primary-dark dark:text-slate-100 dark:group-hover:text-primary">
                {kpi.value}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{kpi.subtext}</p>
            </div>
          </Link>
        );
      })}
    </section>
  );
}
