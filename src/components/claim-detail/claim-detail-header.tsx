"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Copy, Download, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ConfidenceBadge, StatusBadge } from "@/components/claimora/badges";
import { ExtractionContext } from "@/components/claim-detail/types";
import { downloadJson } from "@/components/claim-detail/utils";
import { cn } from "@/lib/utils";

type ClaimDetailHeaderProps = {
  claimId: string;
  claimNumber?: string;
  createdAt?: string;
  extractionSource?: string;
  ctx: ExtractionContext;
  isRetrying: boolean;
  isRefreshing?: boolean;
  isUpdatingStatus: "Reviewed" | "Needs Attention" | null;
  onRefresh?: () => void;
  onRetry: () => void;
  onMarkReviewed: () => void;
  onNeedsAttention: () => void;
};

export function ClaimDetailHeader({
  claimId,
  claimNumber,
  createdAt,
  extractionSource,
  ctx,
  isRetrying,
  isRefreshing = false,
  isUpdatingStatus,
  onRefresh,
  onRetry,
  onMarkReviewed,
  onNeedsAttention,
}: ClaimDetailHeaderProps) {
  const displayId = claimNumber ?? claimId.slice(0, 8);

  async function copyClaimId() {
    try {
      await navigator.clipboard.writeText(claimId);
      toast.success("Claim ID copied");
    } catch {
      toast.error("Could not copy claim ID");
    }
  }

  return (
    <header className="sticky top-0 z-20 -mx-3 border-b border-slate-200/80 bg-white/95 px-3 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:-mx-4 sm:px-4 lg:-mx-6 lg:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <nav className="flex flex-wrap items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Link href="/claims" className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100">
              <ArrowLeft className="size-3.5" />
              Claims
            </Link>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">{displayId}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
              Claim Review
            </h1>
            <StatusBadge status={ctx.currentStatus} />
            <ConfidenceBadge confidence={ctx.confidence} />
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400">
            Validate extracted fields against the source document and finalize review status.
          </p>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={copyClaimId}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-mono hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              <Copy className="size-3" />
              {claimId.slice(0, 8)}…
            </button>
            {createdAt ? (
              <span>Created {new Date(createdAt).toLocaleString()}</span>
            ) : null}
            {extractionSource ? (
              <span>
                Source: <span className="font-medium text-slate-700 dark:text-slate-300">{extractionSource}</span>
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {onRefresh ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={onRefresh}
              disabled={isRefreshing || isRetrying || isUpdatingStatus !== null}
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
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => downloadJson(`claim-${claimId}-extraction.json`, ctx.payload)}
          >
            <Download className="size-4" />
            Export JSON
          </button>
          {ctx.canRetryExtraction ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
              onClick={onRetry}
              disabled={isRetrying || isUpdatingStatus !== null}
            >
              {isRetrying ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Retry
            </button>
          ) : null}
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            onClick={onMarkReviewed}
            disabled={isUpdatingStatus !== null || isRetrying || ctx.isJobActive}
          >
            {isUpdatingStatus === "Reviewed" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Reviewed
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold disabled:opacity-60",
              "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-950/70",
            )}
            onClick={onNeedsAttention}
            disabled={isUpdatingStatus !== null || isRetrying || ctx.isJobActive}
          >
            {isUpdatingStatus === "Needs Attention" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Needs Attention
          </button>
        </div>
      </div>
    </header>
  );
}
