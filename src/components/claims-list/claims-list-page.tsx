"use client";

import { useEffect, useMemo, useState } from "react";
<<<<<<< HEAD
import { Filter, Plus, RefreshCw, Search } from "lucide-react";
import { ClaimsListKpis } from "@/components/claims-list/claims-list-kpis";
=======
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
import { ClaimsListTable } from "@/components/claims-list/claims-list-table";
import { ErrorState } from "@/components/claimora/states";
import { exportClaimsCsv } from "@/lib/api/claims-export";
import { apiAuthedFetch } from "@/lib/api/client";
import { apiAuthedFetchPaginated } from "@/lib/api/paginated-fetch";
import { mapClaimFromApi } from "@/lib/api/mappers";
import { ClaimRecord, ClaimStatus } from "@/types/claim";

const STATUS_FILTERS: Array<{ value: "" | ClaimStatus; label: string }> = [
  { value: "", label: "All status" },
  { value: "Needs Attention", label: "Pending Review" },
  { value: "Draft", label: "Draft" },
  { value: "Extracted", label: "Pending Approval" },
  { value: "Processing", label: "Extracting" },
  { value: "Reviewed", label: "Approved" },
  { value: "Failed", label: "Rejected" },
];

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

type ReviewerOption = { id: string; name: string };

export function ClaimsListPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"" | ClaimStatus>("");
  const [reviewerFilter, setReviewerFilter] = useState<"" | "unassigned" | string>("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [reviewers, setReviewers] = useState<ReviewerOption[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    apiAuthedFetch<{ items: ReviewerOption[] }>("/claims/reviewers")
      .then((payload) => {
        if (active) setReviewers(payload.items ?? []);
      })
      .catch(() => {
        if (active) setReviewers([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const queryPath = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    if (statusFilter) params.set("status", statusFilter);
    if (searchQuery) params.set("q", searchQuery);
    if (reviewerFilter === "unassigned") params.set("reviewer", "unassigned");
    else if (reviewerFilter) params.set("reviewer", reviewerFilter);
    return `/claims?${params.toString()}`;
  }, [page, statusFilter, searchQuery, reviewerFilter]);

  const [fetchState, setFetchState] = useState<{
    rows: ClaimRecord[];
    pagination: { page: number; totalPages: number; totalRows: number };
    isLoading: boolean;
    error: string | null;
  }>({
    rows: [],
    pagination: { page: 1, totalPages: 1, totalRows: 0 },
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    setFetchState((s) => ({ ...s, isLoading: true, error: null }));

    apiAuthedFetchPaginated<{ items: unknown[] }>(queryPath)
      .then(({ data, pagination }) => {
        if (!active) return;
        const rows = (data.items ?? []).map((item) => mapClaimFromApi(item));
        setFetchState({
          rows,
          pagination: {
            page: pagination?.page ?? page,
            totalPages: pagination?.totalPages ?? 1,
            totalRows: pagination?.totalRows ?? rows.length,
          },
          isLoading: false,
          error: null,
        });
      })
      .catch((err) => {
        if (!active) return;
        setFetchState({
          rows: [],
          pagination: { page: 1, totalPages: 1, totalRows: 0 },
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to load claims",
        });
      });

    return () => {
      active = false;
    };
  }, [queryPath, page]);

  function handleStatusChange(next: "" | ClaimStatus) {
    setStatusFilter(next);
    setPage(1);
  }

  function handleReviewerChange(next: "" | "unassigned" | string) {
    setReviewerFilter(next);
    setPage(1);
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      await exportClaimsCsv({
        status: statusFilter || undefined,
        q: searchQuery || undefined,
        reviewer: reviewerFilter || undefined,
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
<<<<<<< HEAD
    <div className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <nav className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">Claims</span>
          </nav>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">All claims</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Monitor extraction pipeline, review structured output, and manage claim workflow.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className="size-4" />
            Refresh
          </button>
          <Link
            href="/claims/upload"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            <Plus className="size-4" />
            Upload claim
          </Link>
        </div>
      </header>

      <ClaimsListKpis />

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search claim #, patient, provider…"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500"
              aria-label="Search claims on this page"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="size-3.5" />
            Status filter
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.label}
              type="button"
              onClick={() => handleStatusChange(filter.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                statusFilter === filter.value
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {search.trim() ? (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Search applies to the current page ({filteredRows.length} match
            {filteredRows.length === 1 ? "" : "es"}).
          </p>
        ) : null}
      </section>

=======
    <div className="space-y-6 pb-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Documents
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Search, filter, and review uploaded claim documents across your organization.
        </p>
      </header>

>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
      {fetchState.error ? (
        <ErrorState message={fetchState.error} />
      ) : (
        <ClaimsListTable
          rows={fetchState.rows}
          isLoading={fetchState.isLoading}
          page={fetchState.pagination.page}
          totalPages={fetchState.pagination.totalPages}
          totalRows={fetchState.pagination.totalRows}
          search={searchInput}
          statusFilter={statusFilter}
          reviewerFilter={reviewerFilter}
          statusOptions={STATUS_FILTERS}
          reviewers={reviewers}
          showMoreFilters={showMoreFilters}
          isExporting={isExporting}
          onSearchChange={setSearchInput}
          onStatusChange={handleStatusChange}
          onReviewerChange={handleReviewerChange}
          onToggleMoreFilters={() => setShowMoreFilters((open) => !open)}
          onExport={handleExport}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
