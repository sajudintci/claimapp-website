"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  Loader2,
} from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiAuthedFetch } from "@/lib/api/client";
import { NotificationItem, NotificationsResponse } from "@/types/api";
import { cn } from "@/lib/utils";

const headerIconBtn =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white";

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = date.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  for (const [unit, secondsInUnit] of units) {
    if (Math.abs(diffSec) >= secondsInUnit || unit === "second") {
      return rtf.format(Math.round(diffSec / secondsInUnit), unit);
    }
  }

  return date.toLocaleString();
}

function typeStyles(type: string) {
  switch (type) {
    case "success":
      return {
        icon: CheckCircle2,
        dot: "bg-emerald-500",
        bg: "bg-emerald-50 dark:bg-emerald-950/50",
        iconColor: "text-emerald-600 dark:text-emerald-400",
      };
    case "warning":
      return {
        icon: AlertTriangle,
        dot: "bg-amber-500",
        bg: "bg-amber-50 dark:bg-amber-950/50",
        iconColor: "text-amber-600 dark:text-amber-400",
      };
    case "error":
      return {
        icon: AlertTriangle,
        dot: "bg-red-500",
        bg: "bg-red-50 dark:bg-red-950/50",
        iconColor: "text-red-600 dark:text-red-400",
      };
    default:
      return {
        icon: Info,
        dot: "bg-primary/100",
        bg: "bg-primary/10 dark:bg-primary/15",
        iconColor: "text-primary dark:text-primary",
      };
  }
}

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
                  <NotificationRow
                    key={item.id}
                    item={item}
                    onMarkRead={() => void markRead(item.id)}
                  />
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
            <Link
              href="/audit-logs"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            >
              View activity log
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NotificationRow({
  item,
  onMarkRead,
}: {
  item: NotificationItem;
  onMarkRead: () => void;
}) {
  const styles = typeStyles(item.type);
  const Icon = styles.icon;

  return (
    <li>
      <button
        type="button"
        onClick={onMarkRead}
        className={cn(
          "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60",
          !item.isRead && "bg-primary/10 dark:bg-primary/15",
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
            styles.bg,
          )}
        >
          <Icon className={cn("size-4", styles.iconColor)} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start gap-2">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</span>
            {!item.isRead ? (
              <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", styles.dot)} aria-hidden />
            ) : null}
          </span>
          <span className="mt-0.5 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">{item.message}</span>
          <span className="mt-1 block text-[10px] text-slate-400 dark:text-slate-500">
            {formatRelativeTime(item.createdAt)}
          </span>
        </span>
      </button>
    </li>
  );
}
