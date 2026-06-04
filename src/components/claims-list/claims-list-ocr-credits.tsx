"use client";

import { Wallet } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiAuthedFetch } from "@/lib/api/client";
import { ReportSummaryResponse } from "@/types/api";

export function ClaimsListOcrCredits() {
  const { data, isLoading } = useApiQuery(
    () => apiAuthedFetch<ReportSummaryResponse>("/reports/summary"),
    [],
  );

  if (isLoading) {
    return (
      <div className="h-[88px] animate-pulse rounded-2xl border border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/30" />
    );
  }

  const credit = data?.creditUsage ?? {
    remainingCredits: 0,
    usedThisMonth: 0,
    monthlyQuota: 0,
  };
  const monthlyQuota = Number(credit.monthlyQuota ?? 0);
  const usedThisMonth = Number(credit.usedThisMonth ?? 0);
  const remaining = Number(credit.remainingCredits ?? 0);
  const usedPct =
    monthlyQuota > 0 ? Math.round((usedThisMonth / monthlyQuota) * 100) : 0;

  return (
    <section className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3.5 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/40 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-400">
            <Wallet className="size-4" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900 dark:text-emerald-300">
              OCR credits
            </p>
            <p className="text-sm text-emerald-800/90 dark:text-emerald-300/90">
              1 page processed = 1 credit charged on successful extraction
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 sm:gap-8">
          <CreditStat label="Used this month" value={usedThisMonth} highlight />
          <CreditStat label="Remaining" value={remaining} />
          <CreditStat label="Monthly quota" value={monthlyQuota} />
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[11px] font-medium text-emerald-900/90 dark:text-emerald-300/90">
          <span>Monthly usage</span>
          <span className="tabular-nums">
            {usedThisMonth.toLocaleString()} / {monthlyQuota.toLocaleString()} ({usedPct}%)
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/60">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all dark:bg-emerald-400"
            style={{ width: `${Math.min(usedPct, 100)}%` }}
          />
        </div>
      </div>
    </section>
  );
}

function CreditStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="text-center sm:text-right">
      <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-800/80 dark:text-emerald-400/80">
        {label}
      </p>
      <p
        className={`text-lg font-bold tabular-nums ${
          highlight
            ? "text-emerald-900 dark:text-emerald-300"
            : "text-emerald-800 dark:text-emerald-400"
        }`}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}
