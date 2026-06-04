"use client";

import { Coins, Wallet } from "lucide-react";
import { ExtractionContext } from "@/components/claim-detail/types";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiAuthedFetch } from "@/lib/api/client";
import { ReportSummaryResponse } from "@/types/api";
import { cn } from "@/lib/utils";

type ClaimOcrCreditsPanelProps = {
  ctx: ExtractionContext;
};

export function ClaimOcrCreditsPanel({ ctx }: ClaimOcrCreditsPanelProps) {
  const { data: summary, isLoading: summaryLoading } = useApiQuery(
    () => apiAuthedFetch<ReportSummaryResponse>("/reports/summary"),
    [],
  );

  const credit = summary?.creditUsage ?? {
    remainingCredits: 0,
    usedThisMonth: 0,
    monthlyQuota: 0,
  };
  const usedThisMonth = Number(credit.usedThisMonth ?? 0);
  const remaining = Number(credit.remainingCredits ?? 0);
  const monthlyQuota = Number(credit.monthlyQuota ?? 0);

  const pages = ctx.ocrPageCount;
  const charged = ctx.ocrCreditsCharged;
  const hasCharge = typeof charged === "number";
  const pendingCharge = ctx.isJobActive || (!hasCharge && ctx.jobStatus !== "FAILED");

  return (
    <section className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/40 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-400">
              <Coins className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-emerald-950 dark:text-emerald-300">OCR credit usage</h2>
              <p className="text-xs text-emerald-800/85 dark:text-emerald-400/85">1 page = 1 credit on successful extraction</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <ClaimMetric
              label="Credits charged (this claim)"
              value={
                hasCharge
                  ? String(charged)
                  : pendingCharge
                    ? "Pending"
                    : "—"
              }
              highlight={hasCharge}
              muted={!hasCharge && !pendingCharge}
            />
            <ClaimMetric
              label="Document pages (OCR)"
              value={pages != null && pages > 0 ? String(pages) : "—"}
            />
            <ClaimMetric
              label="Extraction job"
              value={ctx.jobStatus}
              muted={ctx.jobStatus === "FAILED"}
            />
          </div>

          {hasCharge && pages != null && pages > 0 && charged !== pages ? (
            <p className="mt-2 text-[11px] text-amber-800 dark:text-amber-400">
              Page count ({pages}) differs from charged credits ({charged}) — check ledger for
              retries or partial runs.
            </p>
          ) : null}

          {!hasCharge && ctx.jobStatus === "FAILED" ? (
            <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">
              No credits charged — extraction did not complete successfully.
            </p>
          ) : null}
        </div>

        <div className="w-full shrink-0 rounded-xl border border-emerald-200/60 bg-white/80 p-3 dark:border-emerald-800/50 dark:bg-slate-900/80 lg:w-64">
          <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300">
            <Wallet className="size-3.5" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Organization balance
            </span>
          </div>
          {summaryLoading ? (
            <div className="mt-3 h-14 animate-pulse rounded-lg bg-emerald-100/80 dark:bg-emerald-900/40" />
          ) : (
            <dl className="mt-3 space-y-2 text-xs">
              <OrgRow label="Used this month" value={usedThisMonth.toLocaleString()} bold />
              <OrgRow label="Remaining" value={remaining.toLocaleString()} />
              <OrgRow label="Monthly quota" value={monthlyQuota.toLocaleString()} />
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}

function ClaimMetric({
  label,
  value,
  highlight,
  muted,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="rounded-xl border border-emerald-200/50 bg-white/70 px-3 py-2.5 dark:border-emerald-800/50 dark:bg-slate-900/60">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800/80 dark:text-emerald-400/80">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-lg font-bold tabular-nums",
          highlight && "text-emerald-900 dark:text-emerald-300",
          muted && "text-slate-400 dark:text-slate-500",
          !highlight && !muted && "text-emerald-800 dark:text-emerald-400",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function OrgRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-emerald-800/80 dark:text-emerald-400/80">{label}</dt>
      <dd
        className={cn(
          "tabular-nums text-emerald-950 dark:text-emerald-300",
          bold ? "text-sm font-bold" : "font-semibold",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
