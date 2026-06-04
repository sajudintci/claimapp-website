"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FileSearch,
  Filter,
  ListChecks,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { ErrorState } from "@/components/claimora/states";
import { ConfidenceBadge, StatusBadge } from "@/components/claimora/badges";
import { apiAuthedFetchPaginated } from "@/lib/api/paginated-fetch";
import { mapClaimFromApi } from "@/lib/api/mappers";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiAuthedFetch } from "@/lib/api/client";
import { ReportSummaryResponse } from "@/types/api";
import { ClaimRecord } from "@/types/claim";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

type Priority = "critical" | "high" | "medium";
type ReasonFilter = "" | "confidence" | "llm" | "ocr" | "billing";

type ReviewReason = {
  id: string;
  label: string;
  severity: "error" | "warning";
};

type ReviewRow = ClaimRecord & {
  reviewReasons: ReviewReason[];
  priority: Priority;
};

const REASON_FILTERS: Array<{ value: ReasonFilter; label: string }> = [
  { value: "", label: "All issues" },
  { value: "confidence", label: "Low confidence" },
  { value: "llm", label: "AI failed" },
  { value: "ocr", label: "OCR insufficient" },
  { value: "billing", label: "Billing mismatch" },
];

const PRIORITY_ORDER: Record<Priority, number> = { critical: 0, high: 1, medium: 2 };

function enrichClaimForReview(item: unknown): ReviewRow {
  const base = mapClaimFromApi(item);
  const raw = item as { extractionResult?: Record<string, unknown> };
  const er = raw.extractionResult ?? {};
  const reasons: ReviewReason[] = [];

  if (er.ocrSufficient === false) {
    reasons.push({ id: "ocr", label: "OCR insufficient", severity: "error" });
  }
  if (er.llmStatus === "failed") {
    reasons.push({ id: "llm", label: "AI extraction failed", severity: "error" });
  }
  const validation = er.validation as { hasBillingMismatch?: boolean } | undefined;
  if (validation?.hasBillingMismatch) {
    reasons.push({ id: "billing", label: "Billing mismatch", severity: "warning" });
  }
  if (base.confidence < 65) {
    reasons.push({ id: "confidence", label: "Low confidence", severity: "warning" });
  }
  if (reasons.length === 0) {
    reasons.push({ id: "manual", label: "Manual review required", severity: "warning" });
  }

  let priority: Priority = "medium";
  if (er.llmStatus === "failed" || er.ocrSufficient === false || base.confidence < 50) {
    priority = "critical";
  } else if (validation?.hasBillingMismatch || base.confidence < 65) {
    priority = "high";
  }

  return { ...base, reviewReasons: reasons, priority };
}

function llmStatusLabel(status?: string): { text: string; tone: string } {
  switch (status) {
    case "ok":
      return {
        text: "AI OK",
        tone: "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800",
      };
    case "failed":
      return {
        text: "AI failed",
        tone: "bg-red-50 text-red-800 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800",
      };
    default:
      return {
        text: "AI pending",
        tone: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
      };
  }
}

export function ConfidenceReviewPage() {
  const [page, setPage] = useState(1);
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>("");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: summary } = useApiQuery(
    () => apiAuthedFetch<ReportSummaryResponse>("/reports/summary"),
    [refreshKey],
  );

  const queryPath = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      status: "Needs Attention",
    });
    return `/claims?${params.toString()}`;
  }, [page]);

  const [fetchState, setFetchState] = useState<{
    rows: ReviewRow[];
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
        const rows = (data.items ?? []).map(enrichClaimForReview);
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
          error: err instanceof Error ? err.message : "Failed to load review queue",
        });
      });

    return () => {
      active = false;
    };
  }, [queryPath, refreshKey, page]);

  const sortedFiltered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return fetchState.rows
      .filter((row) => {
        if (reasonFilter && !row.reviewReasons.some((r) => r.id === reasonFilter)) {
          return false;
        }
        if (!needle) return true;
        const haystack = [
          row.claimNumber,
          row.patientName,
          row.provider,
          ...row.reviewReasons.map((r) => r.label),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(needle);
      })
      .sort((a, b) => {
        const pd = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        if (pd !== 0) return pd;
        return a.confidence - b.confidence;
      });
  }, [fetchState.rows, search, reasonFilter]);

  const queueStats = useMemo(() => {
    const rows = fetchState.rows;
    const critical = rows.filter((r) => r.priority === "critical").length;
    const billing = rows.filter((r) => r.reviewReasons.some((x) => x.id === "billing")).length;
    const avg =
      rows.length > 0
        ? Math.round(rows.reduce((s, r) => s + r.confidence, 0) / rows.length)
        : 0;
    return { critical, billing, avg };
  }, [fetchState.rows]);

  const queueTotal = Number(summary?.kpis?.needsAttention ?? fetchState.pagination.totalRows);

  return (
    <div className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <nav className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">AI Extraction</span>
            <span className="mx-1 text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-600 dark:text-slate-400">Confidence review</span>
          </nav>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Confidence review queue
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Prioritize claims flagged for low confidence, OCR quality, AI failures, or billing
            validation. Review against the source document, then mark Reviewed or Needs Attention.
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
            href="/ai-extraction/results"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FileSearch className="size-4" />
            All results
          </Link>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="grid gap-3 sm:grid-cols-3">
            <KpiCard
              label="In queue"
              value={queueTotal.toLocaleString()}
              hint="Needs attention status"
              icon={ShieldAlert}
              tone="amber"
            />
            <KpiCard
              label="Critical (this page)"
              value={String(queueStats.critical)}
              hint="AI/OCR failure or under 50% confidence"
              icon={AlertTriangle}
              tone="red"
            />
            <KpiCard
              label="Avg confidence (page)"
              value={queueStats.avg > 0 ? `${queueStats.avg}%` : "—"}
              hint={`${queueStats.billing} with billing flags on page`}
              icon={Sparkles}
              tone="violet"
            />
          </div>

          <section className="rounded-2xl border border-amber-200/60 bg-amber-50/40 p-4 dark:border-amber-900/50 dark:bg-amber-950/30 sm:p-5">
            <div className="relative min-w-0">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-700/60 dark:text-amber-400/60" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search claim, patient, issue type…"
                className="h-10 w-full rounded-xl border border-amber-200/80 bg-white pl-10 pr-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-amber-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-amber-600"
                aria-label="Search review queue"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Filter className="size-3.5 text-amber-800/70 dark:text-amber-400/70" />
              {REASON_FILTERS.map((f) => (
                <FilterPill
                  key={f.value}
                  active={reasonFilter === f.value}
                  onClick={() => setReasonFilter(f.value)}
                >
                  {f.label}
                </FilterPill>
              ))}
            </div>
          </section>

          {fetchState.error ? (
            <ErrorState message={fetchState.error} />
          ) : (
            <ReviewQueueTable
              rows={sortedFiltered}
              isLoading={fetchState.isLoading}
              page={fetchState.pagination.page}
              totalPages={fetchState.pagination.totalPages}
              totalRows={fetchState.pagination.totalRows}
              onPageChange={setPage}
            />
          )}
        </div>

        <aside className="space-y-4">
          <ReviewerGuideCard />
          <PriorityLegendCard />
        </aside>
      </div>
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
  tone: "amber" | "red" | "violet";
}) {
  const tones = {
    amber: "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900",
    red: "bg-red-100 text-red-800 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900",
    violet: "bg-violet-100 text-violet-800 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-900",
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
        "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "bg-amber-800 text-white dark:bg-amber-600"
          : "bg-white text-amber-900/80 ring-1 ring-amber-200 hover:bg-amber-100 dark:bg-slate-900 dark:text-amber-300 dark:ring-amber-800 dark:hover:bg-amber-950/50",
      )}
    >
      {children}
    </button>
  );
}

function ReviewQueueTable({
  rows,
  isLoading,
  page,
  totalPages,
  totalRows,
  onPageChange,
}: {
  rows: ReviewRow[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  totalRows: number;
  onPageChange: (p: number) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-emerald-200/80 bg-emerald-50/50 px-6 py-16 text-center dark:border-emerald-900/50 dark:bg-emerald-950/40">
        <CheckCircle2 className="mb-3 size-12 text-emerald-600 dark:text-emerald-400" />
        <p className="text-base font-semibold text-emerald-950 dark:text-emerald-300">Review queue is clear</p>
        <p className="mt-1 max-w-sm text-sm text-emerald-900/80 dark:text-emerald-300/80">
          No claims need attention right now. Check extraction results or upload new documents.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link
            href="/ai-extraction/results"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            View extraction results
          </Link>
          <Link
            href="/claims"
            className="inline-flex h-10 items-center rounded-xl border border-emerald-300 bg-white px-4 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
          >
            All claims
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/50">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Sorted by priority (critical first), then lowest confidence
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[1000px] w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-800/50">
              <Th>Priority</Th>
              <Th>Claim</Th>
              <Th>Patient</Th>
              <Th>Issues</Th>
              <Th>Confidence</Th>
              <Th>AI</Th>
              <Th className="text-right">Action</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const llm = llmStatusLabel(row.llmStatus);
              return (
                <tr
                  key={row.id}
                  className="border-b border-slate-50 transition-colors hover:bg-amber-50/30 dark:border-slate-800 dark:hover:bg-amber-950/20"
                >
                  <td className="px-4 py-3.5">
                    <PriorityBadge priority={row.priority} />
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{row.claimNumber}</p>
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200">{row.patientName}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex max-w-[240px] flex-wrap gap-1">
                      {row.reviewReasons.map((reason) => (
                        <span
                          key={reason.id}
                          className={cn(
                            "rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1",
                            reason.severity === "error"
                              ? "bg-red-50 text-red-800 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800"
                              : "bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
                          )}
                        >
                          {reason.label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <ConfidenceBadge confidence={row.confidence} />
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={cn(
                        "inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1",
                        llm.tone,
                      )}
                    >
                      {llm.text}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/claims/${row.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800"
                    >
                      Review now
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
          Page {page} of {totalPages} · {totalRows.toLocaleString()} in queue
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

function PriorityBadge({ priority }: { priority: Priority }) {
  const styles = {
    critical: "bg-red-100 text-red-900 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800",
    high: "bg-amber-100 text-amber-900 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
    medium: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  };
  const labels = { critical: "Critical", high: "High", medium: "Medium" };

  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1",
        styles[priority],
      )}
    >
      {labels[priority]}
    </span>
  );
}

function ReviewerGuideCard() {
  const steps = [
    "Open the claim workspace and compare Fields / Line items to the document.",
    "Fix or confirm low-confidence values; note OCR gaps in the Issues panel.",
    "Resolve billing mismatches before approval.",
    "Mark Reviewed when complete, or leave Needs Attention for escalation.",
  ];

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <ListChecks className="size-4 text-slate-700 dark:text-slate-300" />
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Reviewer checklist</h2>
      </div>
      <ol className="mt-3 space-y-2.5">
        {steps.map((text, i) => (
          <li key={text} className="flex gap-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {i + 1}
            </span>
            {text}
          </li>
        ))}
      </ol>
    </section>
  );
}

function PriorityLegendCard() {
  const items: Array<{ level: Priority; desc: string }> = [
    { level: "critical", desc: "AI failed, OCR insufficient, or confidence below 50%." },
    { level: "high", desc: "Billing mismatch or confidence 50–64%." },
    { level: "medium", desc: "Other flags requiring human validation." },
  ];

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/80">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Priority levels</h2>
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li key={item.level} className="flex gap-2">
            <PriorityBadge priority={item.level} />
            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">{item.desc}</p>
          </li>
        ))}
      </ul>
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
