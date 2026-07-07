"use client";

import { useMemo, useState } from "react";
import { Bell, Loader2, RefreshCw } from "lucide-react";
import { ErrorState } from "@/components/claimora/states";
import { NotificationListItem } from "@/components/notifications/notification-list-item";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiAuthedFetch } from "@/lib/api/client";
import { NotificationsResponse } from "@/types/api";
import { cn } from "@/lib/utils";

type FilterMode = "all" | "unread";

function buildNotificationsPath(filter: FilterMode): string {
  const params = new URLSearchParams({ limit: "100" });
  if (filter === "unread") params.set("unreadOnly", "true");
  return `/notifications?${params.toString()}`;
}

export function NotificationsPage() {
  const [filter, setFilter] = useState<FilterMode>("all");
  const { data, isLoading, error, refetch } = useApiQuery(
    () => apiAuthedFetch<NotificationsResponse>(buildNotificationsPath(filter)),
    [filter],
  );

  const unread = data?.unread ?? 0;
  const items = data?.items ?? [];

  const filterOptions = useMemo(
    () => [
      { value: "all" as const, label: "All" },
      { value: "unread" as const, label: `Unread${unread > 0 ? ` (${unread})` : ""}` },
    ],
    [unread],
  );

  async function markRead(id: string) {
    await apiAuthedFetch(`/notifications/${id}/read`, { method: "PATCH" });
    refetch();
  }

  async function markAllRead() {
    await apiAuthedFetch("/notifications/read-all", { method: "PATCH" });
    refetch();
  }

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            All updates about claims, extractions, and account activity for your organization.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
            Refresh
          </button>
          {unread > 0 ? (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              Mark all read
            </button>
          ) : null}
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-950">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
                  filter === option.value
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {items.length.toLocaleString("id-ID")} notification{items.length === 1 ? "" : "s"}
          </p>
        </div>

        {error ? (
          <div className="p-4 sm:p-5">
            <ErrorState message={error} />
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-16 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="size-5 animate-spin" />
            Loading notifications…
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <Bell className="mb-3 size-10 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </p>
            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {filter === "unread"
                ? "You are all caught up. Switch to All to browse previous updates."
                : "Updates about claims, extractions, and account activity will appear here."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3 p-4 sm:p-5">
            {items.map((item) => (
              <li key={item.id}>
                <NotificationListItem
                  item={item}
                  variant="full"
                  onMarkRead={item.isRead ? undefined : () => void markRead(item.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
