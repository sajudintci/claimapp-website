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
    <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 text-xs text-slate-500 dark:text-slate-400">
          {filteredRows.length} of {rows.length} fields
          {issueCount > 0 ? ` · ${issueCount} need attention` : ""}
          {isPdfDocument && onFocusField ? " · Click row to locate in PDF" : ""}
        </p>
        <div className="inline-flex shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800/80">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterChip>
          <FilterChip active={filter === "issues"} onClick={() => setFilter("issues")}>
            Missing / low conf.
          </FilterChip>
        </div>
      </div>

      <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="max-h-[min(52vh,520px)] space-y-2 overflow-y-auto p-2">
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
              <article
                key={rowKey}
                role={canFocus ? "button" : undefined}
                tabIndex={canFocus ? 0 : undefined}
                className={cn(
                  "min-w-0 rounded-lg border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/40",
                  canFocus && "cursor-pointer hover:border-primary/30 hover:bg-primary-50/50 dark:hover:bg-primary/10",
                  activeFocusLabel === rowLabel && "border-amber-300 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/25",
                )}
                onClick={canFocus ? () => handleFocusRow(row) : undefined}
                onKeyDown={
                  canFocus
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleFocusRow(row);
                        }
                      }
                    : undefined
                }
                title={canFocus ? "Locate in PDF" : undefined}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {row.section}
                    </p>
                    <p className="mt-0.5 flex min-w-0 items-start gap-1.5 break-words text-sm font-semibold text-slate-800 dark:text-slate-200">
                      <span className="min-w-0 break-words [overflow-wrap:anywhere]">{row.field}</span>
                      {canFocus ? (
                        <Crosshair className="mt-0.5 size-3.5 shrink-0 text-primary/70 dark:text-primary" />
                      ) : null}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <ConfidencePill value={row.confidence} low={isLowConf} />
                    <span className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                      p.{row.page}
                    </span>
                  </div>
                </div>

                <div className="mt-2 min-w-0 border-t border-slate-100 pt-2 dark:border-slate-800">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Value</p>
                  <p
                    className={cn(
<<<<<<< HEAD
                      "mt-0.5 break-words [overflow-wrap:anywhere] text-sm font-medium leading-relaxed",
                      isMissing ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-slate-100",
=======
                      "border-t border-slate-100 align-top dark:border-slate-800",
                      canFocus && "cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/15",
                      activeFocusLabel === rowLabel && "bg-amber-50/80 dark:bg-amber-950/25",
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
                    )}
                  >
<<<<<<< HEAD
                    {row.value}
                  </p>
                </div>

                {row.sourceText ? (
                  <div className="mt-2 min-w-0 border-t border-slate-100 pt-2 dark:border-slate-800">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Source</p>
                    <button
                      type="button"
                      className="mt-0.5 block w-full min-w-0 break-words [overflow-wrap:anywhere] text-left text-xs leading-relaxed text-primary-dark hover:underline dark:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedSource(sourceExpanded ? null : rowKey);
                      }}
                    >
                      {sourceExpanded ? (
                        row.sourceText
=======
                    <td className="px-3 py-2 text-slate-600 break-words dark:text-slate-400">{row.section}</td>
                    <td className="px-3 py-2 font-medium break-words text-slate-800 dark:text-slate-200">
                      <span className="inline-flex flex-wrap items-center gap-1.5">
                        {row.field}
                        {canFocus ? <Crosshair className="size-3 shrink-0 text-primary/70 dark:text-primary" /> : null}
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
                          className="block w-full break-words text-left text-xs leading-relaxed text-primary-hover hover:underline dark:text-primary"
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
                                <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wide text-primary/80 dark:text-primary/80">
                                  Show more
                                </span>
                              ) : null}
                            </>
                          )}
                        </button>
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
                      ) : (
                        <>
                          <span className="line-clamp-4">{row.sourceText}</span>
                          {row.sourceText.length > 100 ? (
                            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-primary/80">
                              Show more
                            </span>
                          ) : null}
                        </>
                      )}
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}
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
        "inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold",
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
