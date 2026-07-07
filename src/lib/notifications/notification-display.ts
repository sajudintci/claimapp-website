import { AlertTriangle, CheckCircle2, Info, LucideIcon } from "lucide-react";

export function formatNotificationRelativeTime(iso: string): string {
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

export function formatNotificationDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type NotificationTypeStyles = {
  icon: LucideIcon;
  dot: string;
  bg: string;
  iconColor: string;
  badge: string;
};

export function notificationTypeStyles(type: string): NotificationTypeStyles {
  switch (type) {
    case "success":
      return {
        icon: CheckCircle2,
        dot: "bg-emerald-500",
        bg: "bg-emerald-50 dark:bg-emerald-950/50",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        badge: "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800",
      };
    case "warning":
      return {
        icon: AlertTriangle,
        dot: "bg-amber-500",
        bg: "bg-amber-50 dark:bg-amber-950/50",
        iconColor: "text-amber-600 dark:text-amber-400",
        badge: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
      };
    case "error":
      return {
        icon: AlertTriangle,
        dot: "bg-red-500",
        bg: "bg-red-50 dark:bg-red-950/50",
        iconColor: "text-red-600 dark:text-red-400",
        badge: "bg-red-50 text-red-800 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800",
      };
    default:
      return {
        icon: Info,
        dot: "bg-primary/100",
        bg: "bg-primary/10 dark:bg-primary/15",
        iconColor: "text-primary dark:text-primary",
        badge: "bg-primary/10 text-primary-hover ring-primary/20 dark:bg-primary/15 dark:text-primary dark:ring-primary/30",
      };
  }
}
