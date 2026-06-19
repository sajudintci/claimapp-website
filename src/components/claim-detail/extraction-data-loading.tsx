"use client";

import { Loader2 } from "lucide-react";
import { ExtractionProgress } from "@/lib/extraction/extraction-progress";

type ExtractionDataLoadingProps = {
  progress: ExtractionProgress;
};

function FieldCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/40">
      <div className="mb-3 h-3 w-24 animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />
      <div className="h-10 w-full animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}

export function ExtractionDataLoading({ progress }: ExtractionDataLoadingProps) {
  const progressPercent = Math.round((progress.current / Math.max(progress.total, 1)) * 100);

  return (
    <div className="relative flex min-h-[min(78vh,820px)] flex-1 flex-col p-4">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="h-10 flex-1 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200 sm:w-28 dark:bg-slate-800" />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-8 w-28 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-8 w-32 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="space-y-3 pt-2">
          <FieldCardSkeleton />
          <FieldCardSkeleton />
        </div>
      </div>

      <div className="absolute inset-0 flex items-start justify-center bg-white/70 px-4 pt-16 backdrop-blur-[1px] dark:bg-slate-900/75">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <Loader2 className="mx-auto size-8 animate-spin text-slate-600 dark:text-slate-300" />
          <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Extracting data…
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            {progress.label}. This may take longer for documents with many pages.
          </p>
          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-slate-900 transition-all duration-500 dark:bg-slate-100"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              {progress.current} / {progress.total}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
