"use client";

import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardMetricsResponse } from "@/types/api";
import {
  dashboardStatusClassName,
  formatClaimDate,
} from "@/components/claimora/dashboard/dashboard-utils";

type WorkQueueProps = {
  items?: DashboardMetricsResponse["workQueue"];
  isLoading?: boolean;
};

export function WorkQueue({ items, isLoading }: WorkQueueProps) {
  const rows = items ?? [];

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Work Queue</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Claims requiring attention today
          </p>
        </div>
        <Link
          href="/claims"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover dark:text-primary dark:hover:text-primary"
        >
          View all documents
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-0 p-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="mx-3 my-2 h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
          No claims in the queue right now.{" "}
          <Link href="/claims/upload" className="font-semibold text-primary hover:underline dark:text-primary">
            Upload a claim
          </Link>
        </div>
      ) : (
        <ul>
          {rows.map((claim, index) => (
            <li
              key={claim.id}
              className={cn(
                index !== rows.length - 1 && "border-b border-slate-100 dark:border-slate-800",
              )}
            >
              <Link
                href={`/claims/${claim.id}`}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 sm:px-6"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
                  <FileText className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                    {claim.patientName !== "—" ? claim.patientName : claim.claimNumber}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
                    {claim.claimNumber}
                    {claim.provider !== "—" ? ` • ${claim.provider}` : ""}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
                      dashboardStatusClassName(claim.displayStatus),
                    )}
                  >
                    {claim.displayStatus}
                  </span>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {formatClaimDate(claim.submittedAt)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
