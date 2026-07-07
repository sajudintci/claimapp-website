"use client";

import {
  formatNotificationDateTime,
  formatNotificationRelativeTime,
  notificationTypeStyles,
} from "@/lib/notifications/notification-display";
import { NotificationItem } from "@/types/api";
import { cn } from "@/lib/utils";

type NotificationListItemProps = {
  item: NotificationItem;
  onMarkRead?: () => void;
  variant?: "compact" | "full";
};

export function NotificationListItem({
  item,
  onMarkRead,
  variant = "compact",
}: NotificationListItemProps) {
  const styles = notificationTypeStyles(item.type);
  const Icon = styles.icon;
  const isFull = variant === "full";

  return (
    <button
      type="button"
      onClick={onMarkRead}
      disabled={!onMarkRead}
      className={cn(
        "flex w-full gap-3 text-left transition-colors",
        isFull ? "rounded-xl border px-4 py-4" : "px-4 py-3",
        onMarkRead && "hover:bg-slate-50 dark:hover:bg-slate-800/60",
        !item.isRead && "bg-primary/10 dark:bg-primary/15",
        isFull
          ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          : undefined,
        !onMarkRead && "cursor-default",
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg",
          isFull ? "size-10" : "mt-0.5 size-8",
          styles.bg,
        )}
      >
        <Icon className={cn(isFull ? "size-5" : "size-4", styles.iconColor)} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-start gap-2">
          <span
            className={cn(
              "font-semibold text-slate-900 dark:text-slate-100",
              isFull ? "text-base" : "text-sm",
            )}
          >
            {item.title}
          </span>
          {!item.isRead ? (
            <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", styles.dot)} aria-hidden />
          ) : null}
          {isFull ? (
            <span
              className={cn(
                "inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1",
                styles.badge,
              )}
            >
              {item.type}
            </span>
          ) : null}
        </span>
        <span
          className={cn(
            "mt-0.5 text-slate-600 dark:text-slate-400",
            isFull ? "text-sm" : "line-clamp-2 text-xs",
          )}
        >
          {item.message}
        </span>
        <span className="mt-1.5 block text-[11px] text-slate-400 dark:text-slate-500">
          {isFull ? formatNotificationDateTime(item.createdAt) : formatNotificationRelativeTime(item.createdAt)}
          {isFull ? (
            <span className="text-slate-300 dark:text-slate-600"> · </span>
          ) : null}
          {isFull ? (
            <span className="text-slate-400 dark:text-slate-500">
              {formatNotificationRelativeTime(item.createdAt)}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}
