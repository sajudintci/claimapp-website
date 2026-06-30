"use client";

import Link from "next/link";
import { CheckCircle2, ClipboardCheck, FileStack, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardMetricsResponse } from "@/types/api";

<<<<<<< HEAD
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
=======
type KpiCard = {
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
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
<<<<<<< HEAD
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
=======
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
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-200",
                  "dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700",
                )}
              >
                <Icon className="size-5" />
              </div>
<<<<<<< HEAD
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
=======
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
            </div>
          </Link>
        );
      })}
    </section>
  );
}
