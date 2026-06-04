"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { ErrorState } from "@/components/claimora/states";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiAuthedFetch } from "@/lib/api/client";
import { apiAuthedFetchPaginated } from "@/lib/api/paginated-fetch";
import { AuditLogRecord } from "@/types/api";
import { cn } from "@/lib/utils";
import { AuditLogDetailPanel } from "@/components/audit-logs/audit-log-detail-panel";

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
    return `/audit-logs?${params.toString()}`;
  }, [page, debouncedQ, actionFilter, entityFilter, resultFilter]);

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

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search action, entity, actor, IP…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        <div className="mt-4 space-y-2">
          <FilterRow label="Result">
            {RESULT_FILTERS.map((f) => (
              <FilterPill
                key={f.value}
                active={resultFilter === f.value}
                onClick={() => {
                  setResultFilter(f.value);
                  setPage(1);
                }}
              >
                {f.label}
              </FilterPill>
            ))}
          </FilterRow>
          <FilterRow label="Entity">
            {ENTITY_FILTERS.map((f) => (
              <FilterPill
                key={f.value}
                active={entityFilter === f.value}
                onClick={() => {
                  setEntityFilter(f.value);
                  setPage(1);
                }}
              >
                {f.label}
              </FilterPill>
            ))}
          </FilterRow>
          <FilterRow label="Action">
            <FilterPill
              active={actionFilter === ""}
              onClick={() => {
                setActionFilter("");
                setPage(1);
              }}
            >
              All actions
            </FilterPill>
            {(actionList?.actions ?? []).map((action) => (
              <FilterPill
                key={action}
                active={actionFilter === action}
                onClick={() => {
                  setActionFilter(action);
                  setPage(1);
                }}
              >
                {formatAction(action)}
              </FilterPill>
            ))}
          </FilterRow>
        </div>
      </section>

      {fetchState.error ? (
        <ErrorState message={fetchState.error} />
      ) : fetchState.isLoading ? (
        <TableSkeleton />
      ) : fetchState.rows.length === 0 ? (
        <EmptyState />
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-[960px] w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-800/50">
                  <Th>Timestamp</Th>
                  <Th>Actor</Th>
                  <Th>Action</Th>
                  <Th>Target</Th>
                  <Th>Result</Th>
                  <Th>IP</Th>
                  <Th className="text-right">Details</Th>
                </tr>
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
            </table>
          </div>
          <PaginationBar
            page={fetchState.pagination.page}
            totalPages={fetchState.pagination.totalPages}
            totalRows={fetchState.pagination.totalRows}
            onPageChange={setPage}
          />
        </section>
      )}
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
  const targetHref =
    log.entityType === "claim" ? `/claims/${log.entityId}` : undefined;

  return (
    <>
      <tr className="border-b border-slate-50 hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/50">
        <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400">
          {new Date(log.createdAt).toLocaleString()}
        </td>
        <td className="px-4 py-3.5">
          <p className="font-medium text-slate-900 dark:text-slate-100">{log.actorName ?? "System"}</p>
          {log.actorEmail ? (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{log.actorEmail}</p>
          ) : null}
        </td>
        <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200">{formatAction(log.action)}</td>
        <td className="px-4 py-3.5">
          {targetHref ? (
            <Link
              href={targetHref}
              className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              {log.entityType}:{log.entityId.slice(0, 8)}…
              <ArrowUpRight className="size-3" />
            </Link>
          ) : (
            <span className="text-slate-600 dark:text-slate-400">
              {log.entityType}:{log.entityId.slice(0, 12)}…
            </span>
          )}
        </td>
        <td className="px-4 py-3.5">
          <span
            className={cn(
              "inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1",
              resultStyles[log.result] ?? resultStyles.Success,
            )}
          >
            {log.result}
          </span>
        </td>
        <td className="px-4 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">{log.ipAddress || "—"}</td>
        <td className="px-4 py-3.5 text-right">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            {expanded ? "Hide" : "View"}
          </button>
        </td>
      </tr>
      {expanded ? (
        <tr className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/60">
          <td colSpan={7} className="px-4 py-4">
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

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <Filter className="size-3" />
        {label}
      </span>
      {children}
    </div>
  );
}

function FilterPill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
        active ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
      )}
    >
      {children}
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/50">
      <ClipboardList className="mb-3 size-10 text-slate-400 dark:text-slate-500" />
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">No audit events yet</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Activity appears when users sign in, upload claims, run extractions, or update reviews.
      </p>
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <ShieldCheck className="size-4" />
        Retained per organization for compliance review
      </div>
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
