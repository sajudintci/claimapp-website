"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { apiAuthedFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type AuditLogItem = {
  id: string;
  action: string;
  actorName: string | null;
  actorEmail: string | null;
  entityId: string;
  createdAt: string;
  result: string;
};

type ClaimAuditTabProps = {
  claimId: string;
};

const ACTION_LABELS: Record<string, string> = {
  CLAIM_UPLOADED: "Uploaded document",
  CLAIM_REVIEW_UPDATED: "Saved review draft",
  CLAIM_EXTRACTION_RETRY: "Retried extraction",
  EXTRACTION_COMPLETED: "Extracted fields",
  EXTRACTION_FAILED: "Extraction failed",
  OCR_CREDITS_DEBITED: "OCR credits debited",
};

function formatAuditTitle(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function ClaimAuditTab({ claimId }: ClaimAuditTabProps) {
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    apiAuthedFetch<{ items: AuditLogItem[] }>(`/audit-logs?q=${encodeURIComponent(claimId)}&limit=50`)
      .then((payload) => {
        if (!active) return;
        const filtered = (payload.items ?? []).filter((row) => row.entityId === claimId);
        setItems(filtered);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load audit trails");
          setItems([]);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [claimId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-1.5 py-6 text-xs text-slate-500 dark:text-slate-400">
        <Loader2 className="size-4 animate-spin" />
        Loading audit…
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-4 text-center text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
        {error}
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-5 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
        No audit activity recorded for this claim yet.
      </p>
    );
  }

  return (
    <ol className="divide-y divide-slate-100 dark:divide-slate-800">
      {items.map((item) => {
        const actor = item.actorName ?? item.actorEmail ?? "System";

        return (
          <li key={item.id} className="flex items-start gap-2 py-2 first:pt-0 last:pb-0">
            <div
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                item.action === "CLAIM_UPLOADED"
                  ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
              )}
            >
              {item.action === "CLAIM_UPLOADED" ? (
                <Upload className="size-3" />
              ) : (
                <CheckCircle2 className="size-3" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {formatAuditTitle(item.action)}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  {formatRelativeDate(item.createdAt)}
                </p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{actor}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
