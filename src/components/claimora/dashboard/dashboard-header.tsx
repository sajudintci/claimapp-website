"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiAuthedFetch } from "@/lib/api/client";
import { ReportSummaryResponse } from "@/types/api";
import { Download, RefreshCw, Upload, Wallet } from "lucide-react";

type DashboardHeaderProps = {
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

export function DashboardHeader({ onRefresh, isRefreshing }: DashboardHeaderProps) {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const { data, refetch } = useApiQuery(
    () => apiAuthedFetch<ReportSummaryResponse>("/reports/summary"),
    [],
  );

  const credit = data?.creditUsage ?? {
    remainingCredits: 0,
    usedThisMonth: 0,
    monthlyQuota: 0,
  };
  const monthlyQuota = Number(credit.monthlyQuota ?? 0);
  const usedThisMonth = Number(credit.usedThisMonth ?? 0);
  const usedPct =
    monthlyQuota > 0 ? Math.round((usedThisMonth / monthlyQuota) * 100) : 0;

  function handleRefresh() {
    refetch();
    onRefresh?.();
  }

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Operations dashboard
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          {greeting}, {user?.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Monitor claim intake, AI extraction health, and items that need reviewer attention.
        </p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="flex shrink-0 flex-col gap-3 sm:items-end">
        <div className="w-full min-w-[240px] rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/40 sm:w-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">OCR credits</span>
            </div>
            <span className="text-sm font-bold tabular-nums text-emerald-800 dark:text-emerald-300">
              {Number(credit.remainingCredits).toLocaleString()} left
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/60">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all dark:bg-emerald-400"
              style={{ width: `${Math.min(usedPct, 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-emerald-800/90 dark:text-emerald-300/90">
            {usedThisMonth.toLocaleString()} used of{" "}
            {monthlyQuota.toLocaleString()} monthly quota ({usedPct}%)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            title="Export coming soon"
          >
            <Download className="size-4 text-slate-500" />
            Export
          </button>
          <Link
            href="/claims/upload"
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm shadow-primary/20 hover:bg-primary-dark"
          >
            <Upload className="size-4" />
            Upload claim
          </Link>
        </div>
      </div>
    </header>
  );
}
