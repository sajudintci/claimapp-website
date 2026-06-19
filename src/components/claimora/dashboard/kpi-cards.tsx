"use client";

import Link from "next/link";
import { CheckCircle2, ClipboardCheck, FileStack, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardMetricsResponse } from "@/types/api";

type KpiCard = {
  label: string;
  value: string;
  subtext: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type DashboardKpiCardsProps = {
  kpis?: DashboardMetricsResponse["kpis"];
  isLoading?: boolean;
};

export function DashboardKpiCards({ kpis, isLoading }: DashboardKpiCardsProps) {
  if (isLoading || !kpis) {
    return (
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800" />
        ))}
      </section>
    );
  }

  const cards: KpiCard[] = [
    {
      label: "Total Uploaded",
      value: kpis.totalUploaded.toLocaleString("id-ID"),
      subtext: kpis.uploadTrend,
      href: "/claims",
      icon: FileStack,
    },
    {
      label: "Pending Review",
      value: kpis.pendingReview.toLocaleString("id-ID"),
      subtext:
        kpis.highPriorityCount > 0
          ? `${kpis.highPriorityCount} high priority`
          : "Awaiting reviewer action",
      href: `/claims?status=${encodeURIComponent("Needs Attention")}`,
      icon: FileText,
    },
    {
      label: "Pending Approval",
      value: kpis.pendingApproval.toLocaleString("id-ID"),
      subtext: kpis.dueTodayCount > 0 ? `${kpis.dueTodayCount} due today` : "Ready for approval",
      href: `/claims?status=${encodeURIComponent("Extracted")}`,
      icon: ClipboardCheck,
    },
    {
      label: "Approved",
      value: kpis.approved.toLocaleString("id-ID"),
      subtext: `${kpis.approvalRate.toFixed(1).replace(".", ",")}% rate`,
      href: `/claims?status=${encodeURIComponent("Reviewed")}`,
      icon: CheckCircle2,
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{kpi.label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {kpi.value}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{kpi.subtext}</p>
              </div>
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-200",
                  "dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700",
                )}
              >
                <Icon className="size-5" />
              </div>
            </div>
          </Link>
        );
      })}
    </section>
  );
}
