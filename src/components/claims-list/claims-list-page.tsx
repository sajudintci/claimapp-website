"use client";

import { useEffect, useMemo, useState } from "react";
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
    <div className="space-y-6 pb-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Documents
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Search, filter, and review uploaded claim documents across your organization.
        </p>
      </header>

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
