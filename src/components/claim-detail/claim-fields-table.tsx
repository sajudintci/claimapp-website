"use client";

import { useMemo, useState } from "react";
import { Crosshair } from "lucide-react";
import { FieldRow } from "@/lib/extraction/claim-extraction";
import { createFocusFromFieldRow } from "@/lib/extraction/document-focus";
import { DocumentFocusTarget } from "@/components/claim-detail/types";
import { cn } from "@/lib/utils";

type ClaimFieldsTableProps = {
  rows: FieldRow[];
  isPdfDocument?: boolean;
  activeFocusLabel?: string | null;
  onFocusField?: (focus: DocumentFocusTarget) => void;
};

export function ClaimFieldsTable({
  rows,
  isPdfDocument = false,
  activeFocusLabel,
  onFocusField,
}: ClaimFieldsTableProps) {
  const [filter, setFilter] = useState<"all" | "issues">("all");
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  const filteredRows = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter(
      (row) =>
        row.value === "-" ||
        row.confidence < 70 ||
        row.value.toLowerCase() === "not_found",
    );
  }, [rows, filter]);

  const issueCount = useMemo(
    () =>
      rows.filter(
        (row) =>
          row.value === "-" ||
          row.confidence < 70 ||
          row.value.toLowerCase() === "not_found",
      ).length,
    [rows],
  );

  function handleFocusRow(row: FieldRow) {
    if (!onFocusField || !isPdfDocument) return;
    const focus = createFocusFromFieldRow(row);
    if (focus) onFocusField(focus);
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
        No traced fields extracted yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {filteredRows.length} of {rows.length} fields
          {issueCount > 0 ? ` · ${issueCount} need attention` : ""}
          {isPdfDocument && onFocusField ? " · Click row to locate in PDF" : ""}
        </p>
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800/80">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterChip>
          <FilterChip active={filter === "issues"} onClick={() => setFilter("issues")}>
            Missing / low conf.
          </FilterChip>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="max-h-[min(52vh,520px)] overflow-auto">
          <table className="w-full min-w-[32rem] table-fixed text-sm">
            <colgroup>
              <col className="w-[14%]" />
              <col className="w-[16%]" />
              <col className="w-[28%]" />
              <col className="w-[8%]" />
              <col className="w-[6%]" />
              <col className="w-[28%]" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm dark:bg-slate-800">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Section</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Field</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Value</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Conf.</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Page</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Source</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const rowKey = `${row.section}-${row.field}`;
                const rowLabel = `${row.section} · ${row.field}`;
                const isMissing = row.value === "-" || row.value.toLowerCase() === "not_found";
                const isLowConf = row.confidence < 70 && !isMissing;
                const sourceExpanded = expandedSource === rowKey;
                const canFocus =
                  isPdfDocument &&
                  Boolean(onFocusField) &&
                  createFocusFromFieldRow(row) != null;

                return (
                  <tr
                    key={rowKey}
                    className={cn(
                      "border-t border-slate-100 align-top dark:border-slate-800",
                      canFocus && "cursor-pointer hover:bg-blue-50/60 dark:hover:bg-blue-950/20",
                      activeFocusLabel === rowLabel && "bg-amber-50/80 dark:bg-amber-950/25",
                    )}
                    onClick={canFocus ? () => handleFocusRow(row) : undefined}
                    title={canFocus ? "Locate in PDF" : undefined}
                  >
                    <td className="px-3 py-2 text-slate-600 break-words dark:text-slate-400">{row.section}</td>
                    <td className="px-3 py-2 font-medium break-words text-slate-800 dark:text-slate-200">
                      <span className="inline-flex flex-wrap items-center gap-1.5">
                        {row.field}
                        {canFocus ? <Crosshair className="size-3 shrink-0 text-blue-600/70 dark:text-blue-400" /> : null}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "block break-words font-medium leading-snug",
                          isMissing ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-slate-100",
                        )}
                      >
                        {row.value}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <ConfidencePill value={row.confidence} low={isLowConf} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-600 dark:text-slate-400">{row.page}</td>
                    <td className="px-3 py-2">
                      {row.sourceText ? (
                        <button
                          type="button"
                          className="block w-full break-words text-left text-xs leading-relaxed text-blue-700 hover:underline dark:text-blue-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedSource(sourceExpanded ? null : rowKey);
                          }}
                        >
                          {sourceExpanded ? (
                            row.sourceText
                          ) : (
                            <>
                              <span className="line-clamp-3">{row.sourceText}</span>
                              {row.sourceText.length > 120 ? (
                                <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wide text-blue-600/80 dark:text-blue-400/80">
                                  Show more
                                </span>
                              ) : null}
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
        active
          ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
      )}
    >
      {children}
    </button>
  );
}

function ConfidencePill({ value, low }: { value: number; low: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
        low
          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
          : value >= 85
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      )}
    >
      {value}%
    </span>
  );
}
