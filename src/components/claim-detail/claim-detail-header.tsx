"use client";

import { Cloud, Loader2, RefreshCw } from "lucide-react";
import {
  dashboardStatusClassName,
  toDashboardDisplayStatus,
} from "@/components/claimora/dashboard/dashboard-utils";
import { ClaimStatus } from "@/types/claim";
import { cn } from "@/lib/utils";

type ClaimDetailHeaderProps = {
  status: ClaimStatus;
  draftSavedAt: Date | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
};

function formatDraftSaved(at: Date | null): string | null {
  if (!at) return null;
  const diffMs = Date.now() - at.getTime();
  const mins = Math.max(1, Math.round(diffMs / 60_000));
  if (mins < 60) return `Draft saved ${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  return `Draft saved ${hours} hour${hours === 1 ? "" : "s"} ago`;
}

function resolveDisplayStatus(status: ClaimStatus, draftSavedAt: Date | null): string {
  if (status === "Draft") return "Draft";
  if (
    draftSavedAt &&
    status !== "Reviewed" &&
    status !== "Archived"
  ) {
    return "Draft";
  }
  return status;
}

export function ClaimDetailHeader({
  status,
  draftSavedAt,
  isRefreshing = false,
  onRefresh,
}: ClaimDetailHeaderProps) {
  const draftLabel = formatDraftSaved(draftSavedAt);
  const displayStatus = toDashboardDisplayStatus(resolveDisplayStatus(status, draftSavedAt));

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Claim Review
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Validate extracted fields against the source document and finalize review status.
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {draftLabel ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <Cloud className="size-4" />
            {draftLabel}
          </span>
        ) : null}
        <span
          className={cn(
            "inline-flex rounded-xl px-3 py-2 text-sm font-semibold ring-1 ring-inset",
            dashboardStatusClassName(displayStatus),
          )}
        >
          {displayStatus}
        </span>
        {onRefresh ? (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh claim data"
          >
            {isRefreshing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Refresh
          </button>
        ) : null}
      </div>
    </header>
  );
}
