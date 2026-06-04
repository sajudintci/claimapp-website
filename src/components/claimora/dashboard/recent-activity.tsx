"use client";

import Link from "next/link";
import { ArrowUpRight, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiAuthedFetchPaginated } from "@/lib/api/paginated-fetch";
import { AuditLogRecord } from "@/types/api";

const dotColor: Record<string, string> = {
  Success: "bg-emerald-500",
  Warning: "bg-amber-500",
  Failed: "bg-red-500",
};

function formatAction(action: string): string {
  return action
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function RecentActivity() {
  const { data, isLoading } = useApiQuery(async () => {
    const res = await apiAuthedFetchPaginated<{ items: AuditLogRecord[] }>(
      "/audit-logs?page=1&limit=6",
    );
    return res.data.items ?? [];
  }, []);
  const items = data ?? [];

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Recent activity</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Audit trail and system events</p>
        </div>
        <Link
          href="/audit-logs"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View all
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <ul className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <ClipboardList className="mb-2 size-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No recent activity recorded.</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Sign in or upload a claim to generate audit events.
          </p>
        </div>
      ) : (
        <ul className="space-y-0">
          {items.map((item, index) => (
            <li
              key={item.id}
              className={cn(
                "relative flex gap-3 py-3",
                index !== items.length - 1 && "border-b border-slate-100 dark:border-slate-800",
              )}
            >
              <span
                className={cn(
                  "mt-1.5 size-2 shrink-0 rounded-full",
                  dotColor[item.result] ?? "bg-blue-500",
                )}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-800 dark:text-slate-200">
                  <span className="font-semibold">{item.actorName ?? "System"}</span>{" "}
                  <span className="text-slate-600 dark:text-slate-400">{formatAction(item.action)}</span>
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {item.entityType}
                  {item.entityId ? ` · ${item.entityId.slice(0, 12)}` : ""}
                  {item.createdAt
                    ? ` · ${new Date(item.createdAt).toLocaleString()}`
                    : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
