"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { apiAuthedFetchPaginated } from "@/lib/api/paginated-fetch";
import { mapClaimFromApi } from "@/lib/api/mappers";
import { useApiQuery } from "@/hooks/use-api-query";
import { ClaimRecord } from "@/types/claim";
import { ConfidenceBadge, StatusBadge } from "@/components/claimora/badges";
import { cn } from "@/lib/utils";

const PRIORITY_STATUSES = ["Needs Attention", "Processing", "Extracted", "Failed"] as const;

export function DashboardClaimsTable({ refreshKey = 0 }: { refreshKey?: number }) {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useApiQuery(async () => {
    const merged: ClaimRecord[] = [];
    for (const status of PRIORITY_STATUSES) {
      const { data: payload } = await apiAuthedFetchPaginated<{ items: unknown[] }>(
        `/claims?status=${encodeURIComponent(status)}&page=1&limit=5`,
      );
      merged.push(...(payload.items ?? []).map((item) => mapClaimFromApi(item)));
    }
    const seen = new Set<string>();
    return merged.filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });
  }, [refreshKey]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return (data ?? []).slice(0, 8);
    return (data ?? [])
      .filter((row) =>
        [row.claimNumber, row.patientName, row.provider, row.status]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
      .slice(0, 8);
  }, [data, search]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Priority claims</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Needs attention, in progress, and recent extractions
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="h-9 w-full min-w-[160px] rounded-xl border border-slate-200 bg-slate-50/80 pl-8 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 sm:w-48"
              aria-label="Search priority claims"
            />
          </div>
          <Link
            href="/claims"
            className="inline-flex h-9 items-center gap-1 rounded-xl bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            View all claims
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
          No priority claims right now.{" "}
          <Link href="/claims/upload" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
            Upload a claim
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[880px] w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-800/50">
                <Th>Claim</Th>
                <Th>Patient</Th>
                <Th>Provider</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th>Confidence</Th>
                <Th className="text-right">Action</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((claim) => (
                <tr
                  key={claim.id}
                  className="border-b border-slate-50 transition-colors hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{claim.claimNumber}</p>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-200">{claim.patientName}</td>
                  <td className="max-w-[160px] truncate px-5 py-3.5 text-slate-600 dark:text-slate-400" title={claim.provider}>
                    {claim.provider}
                  </td>
                  <td className="px-5 py-3.5 tabular-nums font-medium text-slate-900 dark:text-slate-100">
                    {claim.amount > 0
                      ? `IDR ${claim.amount.toLocaleString("id-ID")}`
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={claim.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <ConfidenceBadge confidence={claim.confidence} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/claims/${claim.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                      Open
                      <ArrowUpRight className="size-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
        "px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400",
        className,
      )}
    >
      {children}
    </th>
  );
}
