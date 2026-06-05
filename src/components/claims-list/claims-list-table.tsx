"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  FileSearch,
} from "lucide-react";
import { ClaimRecord, ClaimStatus } from "@/types/claim";
import { ConfidenceBadge, StatusBadge } from "@/components/claimora/badges";
import { cn } from "@/lib/utils";

const statusHint: Partial<Record<ClaimStatus, string>> = {
  Processing: "Extraction running",
  Extracted: "Ready for review",
  "Needs Attention": "Action required",
  Reviewed: "Completed",
  Failed: "Re-upload or retry",
};

type ClaimsListTableProps = {
  rows: ClaimRecord[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  totalRows: number;
  onPageChange: (page: number) => void;
};

export function ClaimsListTable({
  rows,
  isLoading,
  page,
  totalPages,
  totalRows,
  onPageChange,
}: ClaimsListTableProps) {
  if (isLoading) {
    return <TableSkeleton />;
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/50">
        <FileSearch className="mb-3 size-10 text-slate-400 dark:text-slate-500" />
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">No claims match your filters</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          Upload a new claim document or clear filters to see more results.
        </p>
        <Link
          href="/claims/upload"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Upload claim
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-[1040px] w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-800/50">
              <Th>Claim</Th>
              <Th>Patient</Th>
              <Th>Provider</Th>
              <Th>Amount</Th>
              <Th>OCR credits</Th>
              <Th>Submitted</Th>
              <Th>Status</Th>
              <Th>Confidence</Th>
              <Th className="text-right">Action</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((claim) => (
              <tr
                key={claim.id}
                className="border-b border-slate-50 transition-colors hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/50"
              >
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{claim.claimNumber}</p>
                  <p className="font-mono text-[10px] text-slate-400 dark:text-slate-500" title={claim.id}>
                    {claim.id.slice(0, 8)}…
                  </p>
                </td>
                <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200">{claim.patientName}</td>
                <td className="max-w-[180px] truncate px-4 py-3.5 text-slate-600 dark:text-slate-400" title={claim.provider}>
                  {claim.provider}
                </td>
                <td className="px-4 py-3.5 tabular-nums font-medium text-slate-900 dark:text-slate-100">
                  {claim.amount > 0
                    ? `IDR ${claim.amount.toLocaleString("id-ID")}`
                    : "—"}
                </td>
                <td className="px-4 py-3.5 tabular-nums text-slate-700 dark:text-slate-300">
                  {typeof claim.ocrCreditsCharged === "number" ? (
                    <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                      {claim.ocrCreditsCharged}
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">{claim.submittedAt}</td>
                <td className="px-4 py-3.5">
                  <div className="space-y-1">
                    <StatusBadge status={claim.status} />
                    {statusHint[claim.status] ? (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{statusHint[claim.status]}</p>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <ConfidenceBadge confidence={claim.confidence} />
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Link
                    href={`/claims/${claim.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-primary dark:hover:bg-primary-dark"
                  >
                    Open
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Showing page {page} of {totalPages} · {totalRows.toLocaleString()} total claims
        </p>
        <div className="flex items-center gap-2">
          <PaginationButton
            label="Previous"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="size-4" />
          </PaginationButton>
          <span className="min-w-[4rem] text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
            {page} / {totalPages}
          </span>
          <PaginationButton
            label="Next"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="size-4" />
          </PaginationButton>
        </div>
      </div>
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400",
        className,
      )}
    >
      {children}
    </th>
  );
}

function PaginationButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {children}
    </button>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
      ))}
    </div>
  );
}
