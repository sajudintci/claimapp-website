export type DashboardDisplayStatus =
  | "Pending Review"
  | "Pending Approval"
  | "Extracting"
  | "Draft"
  | "Approved"
  | "Rejected";

const displayStatusStyle: Record<DashboardDisplayStatus, string> = {
  "Pending Review": "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700",
  "Pending Approval": "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700",
  Extracting: "bg-primary/10 text-primary-hover ring-primary/10 dark:bg-primary/15 dark:text-primary dark:ring-primary/30",
  Draft: "bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-900",
  Approved: "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900",
  Rejected: "bg-red-50 text-red-700 ring-red-100 dark:bg-red-950 dark:text-red-300 dark:ring-red-900",
};

export function dashboardStatusClassName(status: string): string {
  return displayStatusStyle[status as DashboardDisplayStatus] ?? displayStatusStyle["Pending Review"];
}

const claimStatusToDisplay: Record<string, DashboardDisplayStatus> = {
  Processing: "Extracting",
  Extracted: "Pending Approval",
  Draft: "Draft",
  "Needs Attention": "Pending Review",
  Reviewed: "Approved",
  Failed: "Rejected",
  Archived: "Approved",
};

export function toDashboardDisplayStatus(status: string): DashboardDisplayStatus {
  return claimStatusToDisplay[status] ?? "Pending Review";
}

export function formatClaimDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  return dateStr;
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
