"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronDown, Download, FileText, Filter, Search, X } from "lucide-react";
import { ClaimRecord, ClaimStatus } from "@/types/claim";
import {
  dashboardStatusClassName,
  formatClaimDate,
  toDashboardDisplayStatus,
} from "@/components/claimora/dashboard/dashboard-utils";
import { cn } from "@/lib/utils";
import {
  DataTable,
  DataTableHeadRow,
  DataTableScroll,
  Td,
  Th,
} from "@/components/ui/data-table";

type ClaimsListTableProps = {
  rows: ClaimRecord[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  totalRows: number;
  search: string;
  searchQuery: string;
  statusFilter: "" | ClaimStatus;
  reviewerFilter: "" | "unassigned" | string;
  dateFrom: string;
  dateTo: string;
  activeFilterCount: number;
  advancedFilterCount: number;
  statusOptions: Array<{ value: "" | ClaimStatus; label: string }>;
  reviewers: Array<{ id: string; name: string }>;
  showMoreFilters: boolean;
  isExporting: boolean;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  onStatusChange: (value: "" | ClaimStatus) => void;
  onReviewerChange: (value: "" | "unassigned" | string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClearFilters: () => void;
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
  searchQuery,
  statusFilter,
  reviewerFilter,
  dateFrom,
  dateTo,
  activeFilterCount,
  advancedFilterCount,
  statusOptions,
  reviewers,
  showMoreFilters,
  isExporting,
  onSearchChange,
  onSearchClear,
  onStatusChange,
  onReviewerChange,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
  onToggleMoreFilters,
  onExport,
  onPageChange,
}: ClaimsListTableProps) {
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
            placeholder="Search by claim reference, patient, hospital, or file name."
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
              showMoreFilters || advancedFilterCount > 0
                ? "border-primary/20 bg-primary/10 text-primary-hover dark:border-primary/30 dark:bg-primary/15 dark:text-primary"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900",
            )}
          >
            <Filter className="size-4 text-slate-500" />
            More filters
            {advancedFilterCount > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                {advancedFilterCount}
              </span>
            ) : null}
          </button>

          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              <X className="size-4" />
              Reset filters
            </button>
          ) : null}

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
      </div>

      {showMoreFilters ? (
        <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Upload date from
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
                max={dateTo || undefined}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Upload date to
              <input
                type="date"
                value={dateTo}
                onChange={(e) => onDateToChange(e.target.value)}
                min={dateFrom || undefined}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              />
            </label>
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
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Date filter uses document upload time (createdAt).
          </p>
          {advancedFilterCount > 0 ? (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                <X className="size-3.5" />
                Reset filters
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {activeFilterCount > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active:</span>
          {searchQuery ? (
            <FilterChip
              label={`Search: ${searchQuery}`}
              onRemove={onSearchClear}
            />
          ) : null}
          {statusFilter ? (
            <FilterChip
              label={statusOptions.find((o) => o.value === statusFilter)?.label ?? statusFilter}
              onRemove={() => {
                onStatusChange("");
              }}
            />
          ) : null}
          {reviewerFilter === "unassigned" ? (
            <FilterChip label="Unassigned reviewer" onRemove={() => onReviewerChange("")} />
          ) : reviewerFilter ? (
            <FilterChip
              label={`Reviewer: ${reviewers.find((r) => r.id === reviewerFilter)?.name ?? reviewerFilter}`}
              onRemove={() => onReviewerChange("")}
            />
          ) : null}
          {dateFrom ? (
            <FilterChip
              label={`Upload from ${dateFrom}`}
              onRemove={() => onDateFromChange("")}
            />
          ) : null}
          {dateTo ? (
            <FilterChip
              label={`Upload to ${dateTo}`}
              onRemove={() => onDateToChange("")}
            />
          ) : null}
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
            {activeFilterCount > 0
              ? "Try adjusting your search or filters."
              : "Upload a new claim document to get started."}
          </p>
          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <X className="size-4" />
              Reset filters
            </button>
          ) : (
            <Link
              href="/claims/upload"
              className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              Upload claim
            </Link>
          )}
        </div>
      ) : (
        <DataTableScroll className="border-t border-slate-100 dark:border-slate-800">
          <DataTable minWidth="min-w-[1320px]">
            <thead>
              <DataTableHeadRow>
                <Th className="min-w-[120px]">Claim Ref.</Th>
                <Th className="min-w-[220px]">Document</Th>
                <Th className="min-w-[140px]">Patient</Th>
                <Th className="min-w-[160px]">Document Type</Th>
                <Th className="min-w-[100px]">Priority</Th>
                <Th className="min-w-[180px]">Rumah Sakit</Th>
                <Th className="min-w-[120px]">Upload Date</Th>
                <Th className="min-w-[130px]">Status</Th>
                <Th className="min-w-[120px]">Reviewer</Th>
                <Th className="min-w-[100px] text-right">Action</Th>
              </DataTableHeadRow>
            </thead>
            <tbody>
              {rows.map((claim) => {
                const displayStatus = toDashboardDisplayStatus(claim.status);
                const fileName = claim.documentFileName ?? `${claim.claimNumber}.pdf`;
                const documentTypesLabel = claim.documentTypes.join(", ");
                const pageLabel =
                  typeof claim.pageCount === "number" && claim.pageCount > 0
                    ? `${claim.pageCount} page${claim.pageCount === 1 ? "" : "s"}`
                    : "—";

                return (
                  <tr
                    key={claim.id}
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/40"
                  >
                    <Td title={claim.claimNumber}>
                      <Link
                        href={`/claims/${claim.id}`}
                        className="block truncate font-semibold text-slate-900 hover:text-primary-hover dark:text-slate-100 dark:hover:text-primary"
                      >
                        {claim.claimNumber}
                      </Link>
                    </Td>
                    <Td title={`${fileName} (${pageLabel})`}>
                      <Link href={`/claims/${claim.id}`} className="group flex min-w-0 items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
                          <FileText className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900 group-hover:text-primary-hover dark:text-slate-100 dark:group-hover:text-primary">
                            {fileName}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                            {pageLabel}
                          </p>
                        </div>
                      </Link>
                    </Td>
                    <Td title={claim.patientName} className="font-medium text-slate-800 dark:text-slate-200">
                      <span className="block truncate">{claim.patientName}</span>
                    </Td>
                    <Td title={documentTypesLabel || undefined}>
                      {claim.documentTypes.length > 0 ? (
                        <div className="flex max-w-[200px] flex-wrap gap-1">
                          {claim.documentTypes.map((type) => (
                            <span
                              key={type}
                              title={type}
                              className="inline-flex max-w-full truncate rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </Td>
                    <Td title={claim.priority ?? undefined} className="text-slate-600 dark:text-slate-400">
                      <span className="block truncate">{claim.priority ?? "—"}</span>
                    </Td>
                    <Td title={claim.hospitalName} className="text-slate-600 dark:text-slate-400">
                      <span className="block truncate">{claim.hospitalName}</span>
                    </Td>
                    <Td
                      title={formatClaimDate(claim.submittedAt)}
                      className="whitespace-nowrap text-slate-600 dark:text-slate-400"
                    >
                      {formatClaimDate(claim.submittedAt)}
                    </Td>
                    <Td title={displayStatus}>
                      <span
                        className={cn(
                          "inline-flex max-w-full truncate rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
                          dashboardStatusClassName(displayStatus),
                        )}
                      >
                        {displayStatus}
                      </span>
                    </Td>
                    <Td title={claim.reviewerName ?? undefined} className="text-slate-600 dark:text-slate-400">
                      <span className="block truncate">{claim.reviewerName ?? "—"}</span>
                    </Td>
                    <Td align="right" className="last:border-r-0">
                      <Link
                        href={`/claims/${claim.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-primary dark:hover:bg-primary-hover"
                      >
                        Open
                        <ArrowUpRight className="size-3.5" />
                      </Link>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        </DataTableScroll>
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

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1 rounded-lg bg-slate-100 py-1 pl-2.5 pr-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700"
    >
      {label}
      <X className="size-3 opacity-60" />
    </button>
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
