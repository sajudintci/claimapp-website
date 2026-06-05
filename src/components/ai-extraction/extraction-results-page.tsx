"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Brain,
  FileSearch,
  Filter,
  Plus,
  RefreshCw,
  ScanLine,
  Search,
  ShieldCheck,
} from "lucide-react";
import { ClaimsListOcrCredits } from "@/components/claims-list/claims-list-ocr-credits";
import { ErrorState } from "@/components/claimora/states";
import { ConfidenceBadge, StatusBadge } from "@/components/claimora/badges";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiAuthedFetch } from "@/lib/api/client";
import { apiAuthedFetchPaginated } from "@/lib/api/paginated-fetch";
import { mapClaimFromApi } from "@/lib/api/mappers";
import { ReportSummaryResponse } from "@/types/api";
import { ClaimRecord, ClaimStatus } from "@/types/claim";
import { cn } from "@/lib/utils";

type StatusFilter = "" | ClaimStatus;
type ConfidenceFilter = "" | "high" | "medium" | "low";

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "Extracted", label: "Extracted" },
  { value: "Needs Attention", label: "Needs attention" },
  { value: "Processing", label: "Processing" },
  { value: "Reviewed", label: "Reviewed" },
  { value: "Failed", label: "Failed" },
  { value: "", label: "All statuses" },
];

const CONFIDENCE_FILTERS: Array<{ value: ConfidenceFilter; label: string }> = [
  { value: "", label: "Any confidence" },
  { value: "high", label: "High (≥80%)" },
  { value: "medium", label: "Medium (65–79%)" },
  { value: "low", label: "Low (<65%)" },
];

const PAGE_SIZE = 25;

function llmStatusLabel(status?: string): { text: string; tone: string } {
  switch (status) {
    case "ok":
      return {
        text: "AI enhanced",
        tone: "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800",
      };
    case "failed":
      return {
        text: "AI failed",
        tone: "bg-red-50 text-red-800 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800",
      };
    case "skipped":
      return {
        text: "AI skipped",
        tone: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
      };
    default:
      return {
        text: "Pending",
        tone: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
      };
  }
}

export function ExtractionResultsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Extracted");
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>("");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: summary } = useApiQuery(
    () => apiAuthedFetch<ReportSummaryResponse>("/reports/summary"),
    [refreshKey],
  );

  const { data: extractedCount } = useApiQuery(async () => {
    const { pagination } = await apiAuthedFetchPaginated<{ items: unknown[] }>(
      "/claims?status=Extracted&page=1&limit=1",
    );
    return pagination?.totalRows ?? 0;
  }, [refreshKey]);

  const queryPath = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    if (statusFilter) params.set("status", statusFilter);
    return `/claims?${params.toString()}`;
  }, [page, statusFilter]);

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
          error: err instanceof Error ? err.message : "Failed to load extraction results",
        });
      });

    return () => {
      active = false;
    };
  }, [queryPath, refreshKey, page]);

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return fetchState.rows.filter((row) => {
      const conf = row.confidence;
      if (confidenceFilter === "high" && conf < 80) return false;
      if (confidenceFilter === "medium" && (conf < 65 || conf >= 80)) return false;
      if (confidenceFilter === "low" && conf >= 65) return false;
      if (!needle) return true;
      return [row.claimNumber, row.patientName, row.provider, row.status, row.llmStatus]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [fetchState.rows, search, confidenceFilter]);

  const kpis = summary?.kpis ?? {};
  const processing = summary?.processing ?? {};

  return (
    <div className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <nav className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">AI Extraction</span>
            <span className="mx-1 text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-600 dark:text-slate-400">Results</span>
          </nav>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Extraction results
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Review OCR and AI-structured outputs. Open a claim to validate fields, line items,
            and billing before marking reviewed.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className="size-4" />
            Refresh
          </button>
          <Link
            href="/ai-extraction/confidence-review"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 text-sm font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-950/70"
          >
            <ShieldCheck className="size-4" />
            Confidence review
          </Link>
          <Link
            href="/claims/upload"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
          >
            <Plus className="size-4" />
            Upload claim
          </Link>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Extracted"
          value={String(extractedCount ?? 0)}
          icon={ScanLine}
          tone="blue"
          hint="Ready for validation"
        />
        <KpiCard
          label="Needs attention"
          value={String(kpis.needsAttention ?? 0)}
          icon={ShieldCheck}
          tone="amber"
          hint="Low confidence or validation flags"
        />
        <KpiCard
          label="In pipeline"
          value={String(
            Number(processing.queuedJobs ?? 0) + Number(processing.processingJobs ?? 0),
          )}
          icon={Brain}
          tone="violet"
          hint="Queued + processing jobs"
        />
        <KpiCard
          label="Reviewed"
          value={String(kpis.reviewedClaims ?? 0)}
          icon={FileSearch}
          tone="emerald"
          hint="Completed reviews"
        />
      </div>

      <ClaimsListOcrCredits />

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative min-w-0 flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search claim, patient, provider…"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500"
              aria-label="Search extraction results"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="size-3.5" />
            Confidence
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <FilterPill
              key={f.label}
              active={statusFilter === f.value}
              onClick={() => {
                setStatusFilter(f.value);
                setPage(1);
              }}
            >
              {f.label}
            </FilterPill>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {CONFIDENCE_FILTERS.map((f) => (
            <FilterPill
              key={f.label}
              active={confidenceFilter === f.value}
              onClick={() => setConfidenceFilter(f.value)}
              variant="subtle"
            >
              {f.label}
            </FilterPill>
          ))}
        </div>
      </section>

      {fetchState.error ? (
        <ErrorState message={fetchState.error} />
      ) : (
        <ResultsTable
          rows={filteredRows}
          isLoading={fetchState.isLoading}
          page={fetchState.pagination.page}
          totalPages={fetchState.pagination.totalPages}
          totalRows={fetchState.pagination.totalRows}
          onPageChange={setPage}
          emptyHref={statusFilter === "Extracted" ? "/claims/upload" : "/claims"}
        />
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "blue" | "amber" | "violet" | "emerald";
}) {
  const tones = {
    blue: "bg-primary-50 text-primary-dark ring-primary/20 dark:bg-primary/10 dark:text-primary dark:ring-primary/30",
    amber: "bg-amber-50 text-amber-800 ring-amber-100 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900",
    violet: "bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-900",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900",
  };

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className={cn("inline-flex size-9 items-center justify-center rounded-xl ring-1", tones[tone])}>
        <Icon className="size-4" />
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{hint}</p>
    </article>
  );
}

function FilterPill({
  children,
  active,
  onClick,
  variant = "default",
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  variant?: "default" | "subtle";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
        active && variant === "default" && "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900",
        active && variant === "subtle" && "bg-primary-light text-neutral-900 dark:bg-primary/10 dark:text-primary",
        !active && variant === "default" && "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
        !active && variant === "subtle" && "bg-slate-50 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-800/80 dark:text-slate-400 dark:ring-slate-700 dark:hover:bg-slate-800",
      )}
    >
      {children}
    </button>
  );
}

function ResultsTable({
  rows,
  isLoading,
  page,
  totalPages,
  totalRows,
  onPageChange,
  emptyHref,
}: {
  rows: ClaimRecord[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  totalRows: number;
  onPageChange: (p: number) => void;
  emptyHref: string;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/50">
        <FileSearch className="mb-3 size-10 text-slate-400 dark:text-slate-500" />
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">No extraction results match your filters</p>
        <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
          Try another status tab, upload a new claim, or open the confidence review queue.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link
            href={emptyHref}
            className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Upload claim
          </Link>
          <Link
            href="/ai-extraction/confidence-review"
            className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Confidence review
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-[1080px] w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-800/50">
              <Th>Claim</Th>
              <Th>Patient</Th>
              <Th>Provider</Th>
              <Th>AI / OCR</Th>
              <Th>Confidence</Th>
              <Th>OCR credits</Th>
              <Th>Status</Th>
              <Th className="text-right">Action</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const llm = llmStatusLabel(row.llmStatus);
              return (
                <tr
                  key={row.id}
                  className="border-b border-slate-50 transition-colors hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{row.claimNumber}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{row.submittedAt}</p>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200">{row.patientName}</td>
                  <td className="max-w-[160px] truncate px-4 py-3.5 text-slate-600 dark:text-slate-400" title={row.provider}>
                    {row.provider}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-1">
                      <span
                        className={cn(
                          "inline-flex w-fit rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1",
                          llm.tone,
                        )}
                      >
                        {llm.text}
                      </span>
                      {row.extractionSource ? (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{row.extractionSource}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <ConfidenceBadge confidence={row.confidence} />
                  </td>
                  <td className="px-4 py-3.5 tabular-nums text-slate-700 dark:text-slate-300">
                    {typeof row.ocrCreditsCharged === "number" ? (
                      <span className="font-semibold text-emerald-800 dark:text-emerald-400">{row.ocrCreditsCharged}</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/claims/${row.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-primary dark:hover:bg-primary-dark"
                    >
                      Review
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Page {page} of {totalPages} · {totalRows.toLocaleString()} claims in filter
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
          >
            Next
          </button>
        </div>
      </div>
    </section>
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
