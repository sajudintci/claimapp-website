"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronDown, Download, FileText, Filter, Search } from "lucide-react";
import { ClaimRecord, ClaimStatus } from "@/types/claim";
<<<<<<< HEAD
import { StatusBadge } from "@/components/claimora/badges";
=======
import {
  dashboardStatusClassName,
  formatClaimDate,
  toDashboardDisplayStatus,
} from "@/components/claimora/dashboard/dashboard-utils";
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
import { cn } from "@/lib/utils";

type ClaimsListTableProps = {
  rows: ClaimRecord[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  totalRows: number;
  search: string;
  statusFilter: "" | ClaimStatus;
  reviewerFilter: "" | "unassigned" | string;
  statusOptions: Array<{ value: "" | ClaimStatus; label: string }>;
  reviewers: Array<{ id: string; name: string }>;
  showMoreFilters: boolean;
  isExporting: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: "" | ClaimStatus) => void;
  onReviewerChange: (value: "" | "unassigned" | string) => void;
  onToggleMoreFilters: () => void;
  onExport: () => void;
  onPageChange: (page: number) => void;
};

export function ClaimsListTable({
  rows,
  isLoading,
  page,
  totalPages,
  totalRows,
  search,
  statusFilter,
  reviewerFilter,
  statusOptions,
  reviewers,
  showMoreFilters,
  isExporting,
  onSearchChange,
  onStatusChange,
  onReviewerChange,
  onToggleMoreFilters,
  onExport,
  onPageChange,
}: ClaimsListTableProps) {
<<<<<<< HEAD
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
=======
  const visibleCount = rows.length;
  const pageNumbers = buildPageNumbers(page, totalPages);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by claim, patient, provider, or file name."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
            aria-label="Search documents"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="relative">
            <span className="sr-only">Filter by status</span>
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value as "" | ClaimStatus)}
              className="h-11 appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              {statusOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          </label>

          <button
            type="button"
            onClick={onToggleMoreFilters}
            aria-expanded={showMoreFilters}
            className={cn(
              "inline-flex h-11 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors",
              showMoreFilters
                ? "border-primary/20 bg-primary/10 text-primary-hover dark:border-primary/30 dark:bg-primary/15 dark:text-primary"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900",
            )}
          >
            <Filter className="size-4 text-slate-500" />
            More filters
          </button>

          <button
            type="button"
            onClick={onExport}
            disabled={isExporting || isLoading}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <Download className="size-4 text-slate-500" />
            {isExporting ? "Exporting…" : "Export"}
          </button>
        </div>
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
      </div>

      {showMoreFilters ? (
        <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5">
          <div className="grid gap-3 sm:max-w-xs">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Reviewer
              <div className="relative mt-1.5">
                <select
                  value={reviewerFilter}
                  onChange={(e) => onReviewerChange(e.target.value)}
                  className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="">All reviewers</option>
                  <option value="unassigned">Unassigned</option>
                  {reviewers.map((reviewer) => (
                    <option key={reviewer.id} value={reviewer.id}>
                      {reviewer.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              </div>
            </label>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-0 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="my-2 h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <FileText className="mx-auto mb-3 size-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">No documents found</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Try adjusting your search or filters, or upload a new claim document.
          </p>
          <Link
            href="/claims/upload"
            className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Upload claim
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/40">
                <Th>Claim Ref.</Th>
                <Th>Claim Date</Th>
                <Th>Documents</Th>
                <Th>Patient</Th>
                <Th>Provider</Th>
                <Th>Upload Date</Th>
                <Th>Status</Th>
                <Th>Reviewer</Th>
                <Th className="text-right">Action</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((claim) => {
                const displayStatus = toDashboardDisplayStatus(claim.status);
                const fileName = claim.documentFileName ?? `${claim.claimNumber}.pdf`;
                const pageLabel =
                  typeof claim.pageCount === "number" && claim.pageCount > 0
                    ? `${claim.pageCount} page${claim.pageCount === 1 ? "" : "s"}`
                    : "—";

                return (
                  <tr
                    key={claim.id}
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-4">
                      <Link
                        href={`/claims/${claim.id}`}
                        className="font-semibold text-slate-900 hover:text-primary-hover dark:text-slate-100 dark:hover:text-primary"
                      >
                        {claim.claimNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
                      {claim.claimDate ? formatClaimDate(claim.claimDate) : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/claims/${claim.id}`} className="flex items-start gap-3 group">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
                          <FileText className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900 group-hover:text-primary-hover dark:text-slate-100 dark:group-hover:text-primary">
                            {fileName}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {claim.claimNumber} • {pageLabel}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-800 dark:text-slate-200">
                      {claim.patientName}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-4 text-slate-600 dark:text-slate-400" title={claim.provider}>
                      {claim.provider}
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
                      {formatClaimDate(claim.submittedAt)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
                          dashboardStatusClassName(displayStatus),
                        )}
                      >
                        {displayStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
                      {claim.reviewerName ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/claims/${claim.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-primary dark:hover:bg-primary-hover"
                      >
                        Open
                        <ArrowUpRight className="size-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Showing {visibleCount} of {totalRows.toLocaleString("id-ID")} documents
        </p>

        <div className="flex flex-wrap items-center gap-1.5">
          <PaginationButton
            label="Previous page"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </PaginationButton>

          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onPageChange(pageNumber)}
              disabled={isLoading}
              aria-current={pageNumber === page ? "page" : undefined}
              className={cn(
                "inline-flex min-w-9 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                pageNumber === page
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900",
              )}
            >
              {pageNumber}
            </button>
          ))}

          <PaginationButton
            label="Next page"
            disabled={page >= totalPages || isLoading}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </PaginationButton>
        </div>
      </div>
    </section>
  );
}

function buildPageNumbers(current: number, total: number): number[] {
  if (total <= 1) return [1];
  const maxButtons = 5;
  let start = Math.max(1, current - Math.floor(maxButtons / 2));
  const end = Math.min(total, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);

  const pages: number[] = [];
  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
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
      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
    >
      {children}
    </button>
  );
}
