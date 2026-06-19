import { ClaimStatus } from "@/types/claim";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: ClaimStatus }) {
  const styleMap: Record<ClaimStatus, string> = {
    Processing: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    Extracted: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    Draft: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    Reviewed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    "Needs Attention": "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    Failed: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    Archived: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  };

  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", styleMap[status])}>
      {status}
    </span>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: number }) {
  const state =
    confidence >= 85
      ? { label: "High", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" }
      : confidence >= 60
        ? { label: "Medium", className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" }
        : { label: "Low", className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" };

  return (
    <span
      className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", state.className)}
      title={`Confidence ${state.label} (${confidence}%)`}
    >
      {confidence}% ({state.label})
    </span>
  );
}
