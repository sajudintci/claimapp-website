"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { ErrorState } from "@/components/claimora/states";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiAuthedFetch } from "@/lib/api/client";
import { apiAuthedFetchPaginated } from "@/lib/api/paginated-fetch";
import { AuditLogRecord } from "@/types/api";
import { cn } from "@/lib/utils";
import { AuditLogDetailPanel } from "@/components/audit-logs/audit-log-detail-panel";
import {
  DataTable,
  DataTableBodyRow,
  DataTableHeadRow,
  DataTableScroll,
  Td,
  Th,
} from "@/components/ui/data-table";

const PAGE_SIZE = 25;

const RESULT_FILTERS = [
  { value: "", label: "All results" },
  { value: "Success", label: "Success" },
  { value: "Failed", label: "Failed" },
  { value: "Warning", label: "Warning" },
];

const ENTITY_FILTERS = [
  { value: "", label: "All entities" },
  { value: "claim", label: "Claims" },
  { value: "user", label: "Users" },
];

const selectClassName =
  "h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200";

const dateInputClassName =
  "mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200";

const fieldLabelClassName =
  "block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";

function formatAction(action: string): string {
  return action
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const resultStyles: Record<string, string> = {
  Success: "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800",
  Failed: "bg-red-50 text-red-800 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800",
  Warning: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
};

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: actionList } = useApiQuery(
    () => apiAuthedFetch<{ actions: string[] }>("/audit-logs/actions"),
    [refreshKey],
  );

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const queryPath = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    if (debouncedQ) params.set("q", debouncedQ);
    if (actionFilter) params.set("action", actionFilter);
    if (entityFilter) params.set("entityType", entityFilter);
    if (resultFilter) params.set("result", resultFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return `/audit-logs?${params.toString()}`;
  }, [page, debouncedQ, actionFilter, entityFilter, resultFilter, dateFrom, dateTo]);

  const [fetchState, setFetchState] = useState<{
    rows: AuditLogRecord[];
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

    apiAuthedFetchPaginated<{ items: AuditLogRecord[] }>(queryPath)
      .then(({ data, pagination }) => {
        if (!active) return;
        let rows = data.items ?? [];
        if (resultFilter) {
          rows = rows.filter((r) => r.result === resultFilter);
        }
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
          error: err instanceof Error ? err.message : "Failed to load audit logs",
        });
      });

    return () => {
      active = false;
    };
  }, [queryPath, refreshKey, page, resultFilter]);

  const successOnPage = fetchState.rows.filter((r) => r.result === "Success").length;
  const failedOnPage = fetchState.rows.filter((r) => r.result === "Failed").length;

  const advancedFilterCount = [actionFilter, dateFrom, dateTo].filter(Boolean).length;
  const activeFilterCount =
    [debouncedQ, resultFilter, entityFilter, actionFilter, dateFrom, dateTo].filter(Boolean)
      .length;

  function resetPage() {
    setPage(1);
  }

  function clearAllFilters() {
    setSearch("");
    setDebouncedQ("");
    setResultFilter("");
    setEntityFilter("");
    setActionFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  return (
    <div className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <nav className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">Administration</span>
            <span className="mx-1 text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-600 dark:text-slate-400">Audit logs</span>
          </nav>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Audit trail
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Compliance log of sign-ins, claim uploads, reviews, extractions, and OCR credit
            usage for your organization.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setRefreshKey((k) => k + 1);
            setPage(1);
          }}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className="size-4" />
          Refresh
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Events (total)" value={fetchState.pagination.totalRows.toLocaleString()} />
        <StatCard label="Success on page" value={String(successOnPage)} tone="emerald" />
        <StatCard label="Failed on page" value={String(failedOnPage)} tone="red" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              placeholder="Search action, entity, actor, IP…"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
              aria-label="Search audit logs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-[9.5rem]">
              <span className="sr-only">Filter by result</span>
              <select
                value={resultFilter}
                onChange={(e) => {
                  setResultFilter(e.target.value);
                  resetPage();
                }}
                className={selectClassName}
              >
                {RESULT_FILTERS.map((f) => (
                  <option key={f.label} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            </label>

            <label className="relative min-w-[9.5rem]">
              <span className="sr-only">Filter by entity</span>
              <select
                value={entityFilter}
                onChange={(e) => {
                  setEntityFilter(e.target.value);
                  resetPage();
                }}
                className={selectClassName}
              >
                {ENTITY_FILTERS.map((f) => (
                  <option key={f.label} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            </label>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters((open) => !open)}
              aria-expanded={showAdvancedFilters}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors",
                showAdvancedFilters || advancedFilterCount > 0
                  ? "border-primary/20 bg-primary/10 text-primary-hover dark:border-primary/30 dark:bg-primary/15 dark:text-primary"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900",
              )}
            >
              <Filter className="size-4 text-slate-500" />
              Advanced
              {advancedFilterCount > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white dark:bg-primary">
                  {advancedFilterCount}
                </span>
              ) : null}
            </button>

            {activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                <X className="size-4" />
                Reset filters
              </button>
            ) : null}
          </div>
        </div>

        {showAdvancedFilters ? (
          <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/40 sm:px-5">
            <p className="mb-3 text-xs font-medium text-slate-500 dark:text-slate-400">
              Narrow by event timestamp (createdAt), action type, or custom date range.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className={fieldLabelClassName}>
                Date from
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    resetPage();
                  }}
                  max={dateTo || undefined}
                  className={dateInputClassName}
                />
              </label>
              <label className={fieldLabelClassName}>
                Date to
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    resetPage();
                  }}
                  min={dateFrom || undefined}
                  className={dateInputClassName}
                />
              </label>
              <label className={fieldLabelClassName}>
                Action
                <div className="relative mt-1.5">
                  <select
                    value={actionFilter}
                    onChange={(e) => {
                      setActionFilter(e.target.value);
                      resetPage();
                    }}
                    className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                  >
                    <option value="">All actions</option>
                    {(actionList?.actions ?? []).map((action) => (
                      <option key={action} value={action}>
                        {formatAction(action)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                </div>
              </label>
            </div>
            {activeFilterCount > 0 ? (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={clearAllFilters}
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
            {debouncedQ ? (
              <FilterChip
                label={`Search: ${debouncedQ}`}
                onRemove={() => {
                  setSearch("");
                  setDebouncedQ("");
                  resetPage();
                }}
              />
            ) : null}
            {resultFilter ? (
              <FilterChip
                label={RESULT_FILTERS.find((f) => f.value === resultFilter)?.label ?? resultFilter}
                onRemove={() => {
                  setResultFilter("");
                  resetPage();
                }}
              />
            ) : null}
            {entityFilter ? (
              <FilterChip
                label={ENTITY_FILTERS.find((f) => f.value === entityFilter)?.label ?? entityFilter}
                onRemove={() => {
                  setEntityFilter("");
                  resetPage();
                }}
              />
            ) : null}
            {actionFilter ? (
              <FilterChip
                label={formatAction(actionFilter)}
                onRemove={() => {
                  setActionFilter("");
                  resetPage();
                }}
              />
            ) : null}
            {dateFrom ? (
              <FilterChip
                label={`From ${dateFrom}`}
                onRemove={() => {
                  setDateFrom("");
                  resetPage();
                }}
              />
            ) : null}
            {dateTo ? (
              <FilterChip
                label={`To ${dateTo}`}
                onRemove={() => {
                  setDateTo("");
                  resetPage();
                }}
              />
            ) : null}
          </div>
        ) : null}

        {fetchState.error ? (
          <div className="p-4 sm:p-5">
            <ErrorState message={fetchState.error} />
          </div>
        ) : fetchState.isLoading ? (
          <TableSkeleton />
        ) : fetchState.rows.length === 0 ? (
          <EmptyState hasFilters={activeFilterCount > 0} onClearFilters={clearAllFilters} />
        ) : (
          <>
            <DataTableScroll>
              <DataTable minWidth="min-w-[880px]">
                <thead>
                  <DataTableHeadRow>
                    <Th className="min-w-[160px]">Timestamp</Th>
                    <Th className="min-w-[180px]">Actor</Th>
                    <Th className="min-w-[140px]">Action</Th>
                    <Th className="min-w-[100px]">Result</Th>
                    <Th className="min-w-[120px]">IP</Th>
                    <Th className="min-w-[100px] text-right">Details</Th>
                  </DataTableHeadRow>
                </thead>
                <tbody>
                  {fetchState.rows.map((log) => (
                    <AuditRow
                      key={log.id}
                      log={log}
                      expanded={expandedId === log.id}
                      onToggle={() =>
                        setExpandedId((id) => (id === log.id ? null : log.id))
                      }
                    />
                  ))}
                </tbody>
              </DataTable>
            </DataTableScroll>
            <PaginationBar
              page={fetchState.pagination.page}
              totalPages={fetchState.pagination.totalPages}
              totalRows={fetchState.pagination.totalRows}
              onPageChange={setPage}
            />
          </>
        )}
      </section>
    </div>
  );
}

function AuditRow({
  log,
  expanded,
  onToggle,
}: {
  log: AuditLogRecord;
  expanded: boolean;
  onToggle: () => void;
}) {
  const timestamp = new Date(log.createdAt).toLocaleString();
  const actorLabel = log.actorEmail
    ? `${log.actorName ?? "System"} (${log.actorEmail})`
    : (log.actorName ?? "System");
  const actionLabel = formatAction(log.action);

  return (
    <>
      <DataTableBodyRow className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
        <Td title={timestamp} className="whitespace-nowrap text-slate-600 dark:text-slate-400">
          {timestamp}
        </Td>
        <Td title={actorLabel}>
          <p className="truncate font-medium text-slate-900 dark:text-slate-100">
            {log.actorName ?? "System"}
          </p>
          {log.actorEmail ? (
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{log.actorEmail}</p>
          ) : null}
        </Td>
        <Td title={actionLabel} className="font-medium text-slate-800 dark:text-slate-200">
          <span className="block truncate">{actionLabel}</span>
        </Td>
        <Td title={log.result}>
          <span
            className={cn(
              "inline-flex max-w-full truncate rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1",
              resultStyles[log.result] ?? resultStyles.Success,
            )}
          >
            {log.result}
          </span>
        </Td>
        <Td title={log.ipAddress || undefined} className="font-mono text-xs text-slate-500 dark:text-slate-400">
          <span className="block truncate">{log.ipAddress || "—"}</span>
        </Td>
        <Td align="right" className="last:border-r-0">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            {expanded ? "Hide" : "View"}
          </button>
        </Td>
      </DataTableBodyRow>
      {expanded ? (
        <tr className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/60">
          <td colSpan={6} className="px-4 py-4">
            <AuditLogDetailPanel log={log} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "emerald" | "red";
}) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold tabular-nums",
          tone === "emerald" && "text-emerald-700 dark:text-emerald-400",
          tone === "red" && "text-red-700 dark:text-red-400",
          !tone && "text-slate-900 dark:text-slate-100",
        )}
      >
        {value}
      </p>
    </article>
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

function PaginationBar({
  page,
  totalPages,
  totalRows,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalRows: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Page {page} of {totalPages} · {totalRows.toLocaleString()} events
      </p>
      <div className="flex gap-2">
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
  );
}

function EmptyState({
  hasFilters,
  onClearFilters,
}: {
  hasFilters?: boolean;
  onClearFilters?: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <ClipboardList className="mb-3 size-10 text-slate-400 dark:text-slate-500" />
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {hasFilters ? "No events match your filters" : "No audit events yet"}
      </p>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        {hasFilters
          ? "Try adjusting search, date range, or other filters."
          : "Activity appears when users sign in, upload claims, run extractions, or update reviews."}
      </p>
      {hasFilters && onClearFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <X className="size-4" />
          Reset filters
        </button>
      ) : (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="size-4" />
          Retained per organization for compliance review
        </div>
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
      ))}
    </div>
  );
}
