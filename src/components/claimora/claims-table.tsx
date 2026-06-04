"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { apiAuthedFetchPaginated } from "@/lib/api/paginated-fetch";
import { mapClaimFromApi } from "@/lib/api/mappers";
import { useApiQuery } from "@/hooks/use-api-query";
import { ClaimRecord } from "@/types/claim";
import { ConfidenceBadge, StatusBadge } from "./badges";
import { cn } from "@/lib/utils";

const col = createColumnHelper<ClaimRecord>();

const columns = [
  col.accessor("claimNumber", {
    header: "Claim",
    cell: (ctx) => (
      <div>
        <p className="font-semibold text-slate-900">{ctx.getValue()}</p>
        <p className="font-mono text-[10px] text-slate-400">{ctx.row.original.id.slice(0, 8)}…</p>
      </div>
    ),
  }),
  col.accessor("patientName", { header: "Patient" }),
  col.accessor("provider", {
    header: "Provider",
    cell: (ctx) => <span className="text-slate-600">{ctx.getValue()}</span>,
  }),
  col.accessor("amount", {
    header: "Amount",
    cell: (ctx) => {
      const v = ctx.getValue();
      return (
        <span className="font-medium tabular-nums text-slate-900">
          {v > 0 ? `IDR ${v.toLocaleString("id-ID")}` : "—"}
        </span>
      );
    },
  }),
  col.accessor("status", {
    header: "Status",
    cell: (ctx) => <StatusBadge status={ctx.getValue()} />,
  }),
  col.accessor("confidence", {
    header: "Confidence",
    cell: (ctx) => <ConfidenceBadge confidence={ctx.getValue()} />,
  }),
  col.display({
    id: "action",
    header: "",
    cell: (ctx) => (
      <Link
        href={`/claims/${ctx.row.original.id}`}
        className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
      >
        Open
        <ArrowUpRight className="size-3" />
      </Link>
    ),
  }),
];

export function ClaimsTable({ status }: { status?: string }) {
  const { data, isLoading, error } = useApiQuery(async () => {
    const params = new URLSearchParams({ page: "1", limit: "50" });
    if (status) params.set("status", status);
    const { data: payload } = await apiAuthedFetchPaginated<{ items: unknown[] }>(
      `/claims?${params.toString()}`,
    );
    return (payload.items ?? []).map((item) => mapClaimFromApi(item));
  }, [status]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data: data ?? [], columns, getCoreRowModel: getCoreRowModel() });

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[800px] w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id} className="border-b border-slate-100 bg-slate-50/80">
                {group.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                  No claims found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn("border-b border-slate-50 transition-colors hover:bg-slate-50/80")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
