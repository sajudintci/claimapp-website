"use client";

import { useMemo, useState } from "react";
import {
  buildFieldRows,
  ExtractionClaim,
  tracedFieldReviewValue,
  tracedFieldValue,
} from "@/lib/extraction/claim-extraction";

type ExtractionClaimsViewProps = {
  claims: ExtractionClaim[];
  summary?: Record<string, unknown>;
};

export function ExtractionClaimsView({ claims, summary }: ExtractionClaimsViewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeClaim = claims[activeIndex] ?? claims[0];
  const fieldRows = useMemo(
    () => (activeClaim ? buildFieldRows(activeClaim) : []),
    [activeClaim],
  );
  const lineItems = (activeClaim?.items as Array<Record<string, unknown>> | undefined) ?? [];
  const tests = (activeClaim?.tests as Array<Record<string, unknown>> | undefined) ?? [];

  if (claims.length === 0) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryCard label="Patient" value={String(summary?.insuredName ?? "-")} />
          <SummaryCard label="Provider" value={String(summary?.provider ?? "-")} />
          <SummaryCard label="Diagnosis" value={String(summary?.diagnosis ?? "-")} />
          <SummaryCard
            label="Amount"
            value={
              summary?.amount != null
                ? `IDR ${Number(summary.amount).toLocaleString("id-ID")}`
                : "-"
            }
          />
        </div>
        <p className="text-sm text-slate-500">
          No structured claims yet. Re-upload the document after LLM extraction is enabled.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {claims.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {claims.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeIndex === index
<<<<<<< HEAD
                  ? "border-primary/40 bg-primary-50 text-primary-dark"
=======
                  ? "border-primary/30 bg-primary/10 text-primary-hover"
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Claim {index + 1}
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryCard
          label="Patient"
          value={tracedFieldReviewValue(activeClaim?.patient?.name)}
        />
        <SummaryCard
          label="Provider"
          value={
            tracedFieldValue(activeClaim?.provider?.hospital_name) ||
            String(summary?.provider ?? "-")
          }
        />
        <SummaryCard
          label="Diagnosis"
          value={
            tracedFieldValue(activeClaim?.diagnosis?.icd10_description) ||
            tracedFieldValue(activeClaim?.diagnosis?.icd10_code) ||
            String(summary?.diagnosis ?? "-")
          }
        />
        <SummaryCard
          label="Total (read)"
          value={tracedFieldValue(activeClaim?.billing?.total_amount_read)}
        />
      </div>

      <div className="max-h-[280px] overflow-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                Section
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                Field
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                Value
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                Conf.
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                Page
              </th>
            </tr>
          </thead>
          <tbody>
            {fieldRows.map((row) => (
              <tr key={`${row.section}-${row.field}`} className="border-t border-slate-100">
                <td className="px-3 py-2 text-slate-600">{row.section}</td>
                <td className="px-3 py-2 font-medium text-slate-800">{row.field}</td>
                <td className="max-w-[200px] truncate px-3 py-2 text-slate-900" title={row.value}>
                  {row.value}
                </td>
                <td className="px-3 py-2 text-slate-600">{row.confidence}%</td>
                <td className="px-3 py-2 text-slate-600">{row.page}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionTable
        title="Line Items"
        emptyLabel="No line items extracted."
        columns={["description", "quantity", "amount", "related_doctor", "confidence"]}
        rows={lineItems.map((item, index) => ({
          key: String(index),
          cells: [
            String(item.description ?? "-"),
            String(item.quantity ?? "-"),
            String(item.amount ?? "-"),
            String(item.related_doctor ?? "-"),
            `${Math.round(Number(item.confidence ?? 0) * 100)}%`,
          ],
        }))}
      />

      <SectionTable
        title="Laboratory Tests"
        emptyLabel="No laboratory tests extracted."
        columns={["test_category", "test_name", "result", "unit", "reference_range"]}
        rows={tests.map((test, index) => ({
          key: String(index),
          cells: [
            String(test.test_category ?? "-"),
            String(test.test_name ?? "-"),
            String(test.result ?? "-"),
            String(test.unit ?? "-"),
            String(test.reference_range ?? "-"),
          ],
        }))}
      />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function SectionTable({
  title,
  emptyLabel,
  columns,
  rows,
}: {
  title: string;
  emptyLabel: string;
  columns: string[];
  rows: Array<{ key: string; cells: string[] }>;
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="max-h-[220px] overflow-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-3 text-slate-500">
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.key} className="border-t border-slate-100">
                  {row.cells.map((cell, index) => (
                    <td key={`${row.key}-${index}`} className="px-3 py-2 text-slate-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
