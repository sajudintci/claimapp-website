"use client";

import Link from "next/link";
import { ArrowUpRight, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardMetricsResponse } from "@/types/api";
import { formatRelativeTime } from "@/components/claimora/dashboard/dashboard-utils";

type RecentActivityProps = {
  items?: DashboardMetricsResponse["recentActivity"];
  isLoading?: boolean;
};

export function RecentActivity({ items, isLoading }: RecentActivityProps) {
  const rows = items ?? [];

  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Recent Activity</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Latest workflow events</p>
        </div>
        <Link
          href="/audit-logs"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover dark:text-primary dark:hover:text-primary"
        >
          View all
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <ul className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <ClipboardList className="mb-2 size-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No recent activity recorded.</p>
        </div>
      ) : (
        <ul className="relative space-y-0">
          <span
            className="absolute bottom-2 left-[7px] top-2 w-px bg-slate-200 dark:bg-slate-700"
            aria-hidden
          />
          {rows.map((item, index) => (
            <li key={item.id} className={cn("relative flex gap-3", index !== rows.length - 1 && "pb-5")}>
              <span
                className="relative z-10 mt-1.5 size-3.5 shrink-0 rounded-full border-2 border-white bg-slate-400 ring-1 ring-slate-200 dark:border-slate-900 dark:bg-slate-500 dark:ring-slate-700"
                aria-hidden
              />
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {item.actorName ?? "System"}
                  {item.createdAt ? ` • ${formatRelativeTime(item.createdAt)}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
