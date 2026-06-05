"use client";

import { Crosshair } from "lucide-react";
import { ExtractionClaim } from "@/lib/extraction/claim-extraction";
import { createFocusFromLineItem, createFocusFromTestResult } from "@/lib/extraction/document-focus";
import { DocumentFocusTarget } from "@/components/claim-detail/types";
import { cn } from "@/lib/utils";

type ClaimLineItemsTabProps = {
  claim: ExtractionClaim | undefined;
  isPdfDocument?: boolean;
  activeFocusLabel?: string | null;
  onFocusField?: (focus: DocumentFocusTarget) => void;
};

export function ClaimLineItemsTab({
  claim,
  isPdfDocument = false,
  activeFocusLabel,
  onFocusField,
}: ClaimLineItemsTabProps) {
  const lineItems = (claim?.items as Array<Record<string, unknown>> | undefined) ?? [];
  const tests = (claim?.tests as Array<Record<string, unknown>> | undefined) ?? [];
  const canFocusPdf = isPdfDocument && Boolean(onFocusField);

  return (
    <div className="space-y-6">
      {canFocusPdf ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Click a row in line items or laboratory tests to locate it in the PDF.
        </p>
      ) : null}

      <DataTable
        title="Line items"
        emptyLabel="No line items extracted."
        columns={["Description", "Qty", "Amount", "Doctor", "Conf.", "Page"]}
        canFocusPdf={canFocusPdf}
        activeFocusLabel={activeFocusLabel}
        onFocusField={onFocusField}
        rows={lineItems.map((item, index) => {
          const label = `Line item · ${String(item.description ?? index + 1).slice(0, 40)}`;
          const focus = canFocusPdf ? createFocusFromLineItem(label, item) : null;
          return {
            key: String(index),
            focus,
            cells: [
              String(item.description ?? "-"),
              String(item.quantity ?? "-"),
              String(item.amount ?? "-"),
              String(item.related_doctor ?? "-"),
              `${Math.round(Number(item.confidence ?? 0) * 100)}%`,
              item.page != null ? String(item.page) : "-",
            ],
          };
        })}
      />

      <DataTable
        title="Laboratory tests"
        emptyLabel="No laboratory tests extracted."
        columns={["Category", "Test", "Result", "Unit", "Reference", "Conf.", "Page"]}
        canFocusPdf={canFocusPdf}
        activeFocusLabel={activeFocusLabel}
        onFocusField={onFocusField}
        rows={tests.map((test, index) => {
          const label = `Lab test · ${String(test.test_name ?? index + 1).slice(0, 40)}`;
          const focus = canFocusPdf ? createFocusFromTestResult(label, test) : null;
          return {
            key: String(index),
            focus,
            cells: [
              String(test.test_category ?? "-"),
              String(test.test_name ?? "-"),
              String(test.result ?? "-"),
              String(test.unit ?? "-"),
              String(test.reference_range ?? "-"),
              `${Math.round(Number(test.confidence ?? 0) * 100)}%`,
              test.page != null ? String(test.page) : "-",
            ],
          };
        })}
      />
    </div>
  );
}

function DataTable({
  title,
  emptyLabel,
  columns,
  rows,
  canFocusPdf,
  activeFocusLabel,
  onFocusField,
}: {
  title: string;
  emptyLabel: string;
  columns: string[];
  rows: Array<{ key: string; focus: DocumentFocusTarget | null; cells: string[] }>;
  canFocusPdf?: boolean;
  activeFocusLabel?: string | null;
  onFocusField?: (focus: DocumentFocusTarget) => void;
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </h3>
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="max-h-[min(40vh,360px)] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-4 text-slate-500 dark:text-slate-400">
                    {emptyLabel}
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const clickable = canFocusPdf && row.focus != null;
                  return (
                    <tr
                      key={row.key}
                      className={cn(
                        "border-t border-slate-100 dark:border-slate-800",
                        clickable &&
                          "cursor-pointer hover:bg-primary-50/60 dark:hover:bg-primary/10",
                        row.focus?.label === activeFocusLabel && "bg-amber-50/80 dark:bg-amber-950/25",
                      )}
                      onClick={
                        clickable && row.focus
                          ? () => onFocusField?.(row.focus!)
                          : undefined
                      }
                      title={clickable ? "Locate in PDF" : undefined}
                    >
                      {row.cells.map((cell, i) => (
                        <td key={`${row.key}-${i}`} className="px-3 py-2 text-slate-700 dark:text-slate-300">
                          {i === 0 && clickable ? (
                            <span className="inline-flex items-center gap-1.5">
                              {cell}
                              <Crosshair className="size-3 shrink-0 text-primary/70 dark:text-primary" />
                            </span>
                          ) : (
                            cell
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
