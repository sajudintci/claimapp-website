"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiAuthedFetch } from "@/lib/api/client";
import { SettingsResponse } from "@/types/api";

export type OrganizationFormState = {
  organizationName: string;
  timezone: string;
};

export function toOrganizationForm(data: SettingsResponse): OrganizationFormState {
  return {
    organizationName: data.organizationName ?? "",
    timezone: data.timezone ?? "Asia/Jakarta",
  };
}

export const settingsInputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100";

export function useSettingsData(refreshKey: number) {
  return useApiQuery(() => apiAuthedFetch<SettingsResponse>("/settings"), [refreshKey]);
}

export function useSettingsRefresh() {
  const [refreshKey, setRefreshKey] = useState(0);
  return {
    refreshKey,
    bumpRefresh: () => setRefreshKey((k) => k + 1),
  };
}

export function SettingsPageShell({
  title,
  description,
  onRefresh,
  children,
}: {
  title: string;
  description: string;
  onRefresh: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <nav className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">Administration</span>
            <span className="mx-1 text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-600 dark:text-slate-400">Settings</span>
            <span className="mx-1 text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-600 dark:text-slate-400">{title}</span>
          </nav>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">{description}</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className="size-4" />
          Refresh
        </button>
      </header>

      {children}
    </div>
  );
}

export function SettingsField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</label>
      {hint ? <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function SettingsInfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/50">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-slate-100">
        {Icon ? <Icon className="size-3.5 shrink-0 text-slate-400" /> : null}
        {value}
      </dd>
    </div>
  );
}

export function SettingsSectionSkeleton() {
  return <div className="h-48 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />;
}
