"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { NotificationListItem } from "@/components/notifications/notification-list-item";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiAuthedFetch } from "@/lib/api/client";
import { NotificationsResponse } from "@/types/api";
import { cn } from "@/lib/utils";

const headerIconBtn =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white";

export function HeaderNotifications() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, refetch } = useApiQuery(
    () => apiAuthedFetch<NotificationsResponse>("/notifications"),
    [],
  );

  const unread = data?.unread ?? 0;
  const items = data?.items ?? [];

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refetch();
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [refetch]);

  useEffect(() => {
    if (!open) return;
    refetch();
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, refetch]);

  async function markRead(id: string) {
    await apiAuthedFetch(`/notifications/${id}/read`, { method: "PATCH" });
    refetch();
  }

  async function markAllRead() {
    await apiAuthedFetch("/notifications/read-all", { method: "PATCH" });
    refetch();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className={cn(headerIconBtn, "relative h-8 w-8 bg-white shadow-sm dark:bg-slate-900")}
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="size-[17px]" />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-semibold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
              {unread > 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">{unread} unread</p>
              ) : null}
            </div>
            {unread > 0 ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-xs font-semibold text-primary hover:text-primary-hover dark:text-primary dark:hover:text-primary"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-slate-500 dark:text-slate-400">
                <Loader2 className="size-4 animate-spin" />
                Loading…
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-10 text-center">
                <Bell className="mb-2 size-8 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">No notifications</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Updates about claims, extractions, and account activity appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item) => (
                  <li key={item.id}>
                    <NotificationListItem
                      item={item}
                      onMarkRead={() => void markRead(item.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            >
              View All Notification
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
