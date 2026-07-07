"use client";

import { ScanText } from "lucide-react";
import { ErrorState } from "@/components/claimora/states";
import {
  SettingsPageShell,
  SettingsSectionSkeleton,
  useSettingsData,
  useSettingsRefresh,
} from "@/components/settings/settings-shared";

function CreditRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <dt className="text-slate-600 dark:text-slate-400">{label}</dt>
      <dd className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}

export function OcrCreditsSettingsPage() {
  const { refreshKey, bumpRefresh } = useSettingsRefresh();
  const { data, isLoading, error, refetch } = useSettingsData(refreshKey);

  const creditsUsed = data?.ocrCreditsUsedThisMonth ?? 0;
  const creditsQuota = data?.ocrMonthlyQuota ?? 0;
  const creditsRemaining = data?.ocrCreditsRemaining ?? 0;
  const usagePercent = creditsQuota > 0 ? Math.min(100, Math.round((creditsUsed / creditsQuota) * 100)) : 0;

  return (
    <SettingsPageShell
      title="OCR Credits"
      description="Organization-wide extraction quota and monthly usage."
      onRefresh={() => {
        bumpRefresh();
        refetch();
      }}
    >
      {error ? <ErrorState message={error} /> : null}

      {isLoading ? (
        <SettingsSectionSkeleton />
      ) : (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <ScanText className="size-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Usage</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Each document page consumed during extraction uses one OCR credit.
          </p>

          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
              <span>Used this month</span>
              <span>
                {creditsUsed.toLocaleString()} / {creditsQuota.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all dark:bg-emerald-400"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>

          <dl className="mt-5 space-y-3">
            <CreditRow label="Remaining" value={creditsRemaining.toLocaleString()} />
            <CreditRow label="Used this month" value={creditsUsed.toLocaleString()} />
            <CreditRow label="Monthly quota" value={creditsQuota.toLocaleString()} />
          </dl>

          <p className="mt-5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            When credits run low, extractions may fail until the monthly quota resets or additional
            credits are provisioned by your administrator.
          </p>
        </section>
      )}
    </SettingsPageShell>
  );
}
