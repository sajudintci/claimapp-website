"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Crosshair, HelpCircle, Minus, Search, X } from "lucide-react";
import { FieldRow, FIELD_SECTION_ORDER, isExtractedValueMissing } from "@/lib/extraction/claim-extraction";
import {
  DEFAULT_FIELD_FLAG_STATUS,
  fieldRowKey,
  isFieldFlagged,
  type FieldFlagStatus,
} from "@/lib/extraction/claim-review";
import { createFocusFromFieldRow, createFocusFromFieldRowAtPage } from "@/lib/extraction/document-focus";
import { tracePagesFromRow } from "@/lib/extraction/field-trace";
import { DocumentFocusTarget } from "@/components/claim-detail/types";
import { cn } from "@/lib/utils";

type FlagFilter = "all" | "flagged" | "neutral";

const FIELD_FLAG_OPTIONS: Array<{
  value: FieldFlagStatus;
  icon: typeof Minus;
  label: string;
}> = [
  { value: 0, icon: Minus, label: "Neutral" },
  { value: 1, icon: HelpCircle, label: "Question" },
  { value: 2, icon: Check, label: "Verified" },
  { value: 3, icon: X, label: "Rejected" },
];

type ClaimDataTabProps = {
  overviewRows: FieldRow[];
  fieldRows: FieldRow[];
  fieldValues: Record<string, string>;
  originalValues: Record<string, string>;
  fieldFlags: Record<string, FieldFlagStatus>;
  onFieldChange: (key: string, value: string) => void;
  onSetFieldFlag: (key: string, status: FieldFlagStatus) => void;
  isPdfDocument?: boolean;
  onFocusField?: (focus: DocumentFocusTarget) => void;
};

export function ClaimDataTab({
  overviewRows,
  fieldRows,
  fieldValues,
  originalValues,
  fieldFlags,
  onFieldChange,
  onSetFieldFlag,
  isPdfDocument = false,
  onFocusField,
}: ClaimDataTabProps) {
  const [search, setSearch] = useState("");
  const [flagFilter, setFlagFilter] = useState<FlagFilter>("all");
  const [visibleKeysSnapshot, setVisibleKeysSnapshot] = useState<Set<string> | null>(null);
  const [overviewOpen, setOverviewOpen] = useState(true);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const allRows = useMemo(() => {
    const seen = new Set<string>();
    const merged: FieldRow[] = [];
    for (const row of [...overviewRows, ...fieldRows]) {
      const key = fieldRowKey(row.section, row.field);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(row);
    }
    return merged;
  }, [overviewRows, fieldRows]);

  function fieldFlag(key: string): FieldFlagStatus {
    return fieldFlags[key] ?? DEFAULT_FIELD_FLAG_STATUS;
  }

  const flaggedCount = useMemo(
    () => allRows.filter((row) => isFieldFlagged(fieldFlag(fieldRowKey(row.section, row.field)))).length,
    [allRows, fieldFlags],
  );
  const neutralCount = allRows.length - flaggedCount;

  function displayValue(row: FieldRow) {
    const key = fieldRowKey(row.section, row.field);
    const stored = fieldValues[key];
    if (stored !== undefined) return stored;
    return row.value;
  }

  function applyFlagFilter(filter: FlagFilter) {
    setFlagFilter(filter);
    if (filter === "all") {
      setVisibleKeysSnapshot(null);
      return;
    }

    const keys = new Set<string>();
    for (const row of allRows) {
      const key = fieldRowKey(row.section, row.field);
      const status = fieldFlag(key);
      if (filter === "flagged" && isFieldFlagged(status)) keys.add(key);
      if (filter === "neutral" && !isFieldFlagged(status)) keys.add(key);
    }
    setVisibleKeysSnapshot(keys);
  }

  function matchesFilters(row: FieldRow) {
    const key = fieldRowKey(row.section, row.field);
    const haystack = `${row.section} ${row.field} ${displayValue(row)}`.toLowerCase();
    if (search.trim() && !haystack.includes(search.trim().toLowerCase())) return false;
    if (flagFilter === "all") return true;
    return visibleKeysSnapshot?.has(key) ?? true;
  }

  const filteredOverview = overviewRows.filter(matchesFilters);

  const fieldSections = useMemo(() => {
    const grouped = new Map<string, FieldRow[]>();
    for (const row of fieldRows) {
      const list = grouped.get(row.section) ?? [];
      list.push(row);
      grouped.set(row.section, list);
    }

    const orderedSections: string[] = FIELD_SECTION_ORDER.filter((section) => grouped.has(section));
    for (const section of grouped.keys()) {
      if (!orderedSections.includes(section)) {
        orderedSections.push(section);
      }
    }

    return orderedSections
      .map((section) => ({
        section,
        rows: (grouped.get(section) ?? []).filter(matchesFilters),
      }))
      .filter((entry) => entry.rows.length > 0);
  }, [fieldRows, search, flagFilter, visibleKeysSnapshot, fieldValues, fieldFlags]);

  const hasVisibleFields = fieldSections.length > 0;

  if (allRows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-5 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
        No extracted fields yet. Extraction may still be in progress.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fields…"
            className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          <ReviewChip
            active={flagFilter === "all"}
            onClick={() => applyFlagFilter("all")}
            label={`All (${allRows.length})`}
          />
          <ReviewChip
            active={flagFilter === "flagged"}
            onClick={() => applyFlagFilter("flagged")}
            label={`Flagged (${flaggedCount})`}
          />
          <ReviewChip
            active={flagFilter === "neutral"}
            onClick={() => applyFlagFilter("neutral")}
            label={`Neutral (${neutralCount})`}
          />
        </div>
      </div>

      {filteredOverview.length > 0 ? (
        <CollapsibleSection
          title="Overview"
          open={overviewOpen}
          onToggle={() => setOverviewOpen((v) => !v)}
        >
          <div className="space-y-1.5">
            {filteredOverview.map((row) => (
              <FieldCard
                key={fieldRowKey(row.section, row.field)}
                row={row}
                value={displayValue(row)}
                originalValue={originalValues[fieldRowKey(row.section, row.field)] ?? ""}
                flagStatus={fieldFlag(fieldRowKey(row.section, row.field))}
                onValueChange={(value) =>
                  onFieldChange(fieldRowKey(row.section, row.field), value)
                }
                onSetFlag={(status) =>
                  onSetFieldFlag(fieldRowKey(row.section, row.field), status)
                }
                isPdfDocument={isPdfDocument}
                onFocusField={onFocusField}
              />
            ))}
          </div>
        </CollapsibleSection>
      ) : null}

      {fieldSections.map(({ section, rows }) => (
        <CollapsibleSection
          key={section}
          title={section}
          open={openSections[section] ?? true}
          onToggle={() =>
            setOpenSections((current) => ({
              ...current,
              [section]: !(current[section] ?? true),
            }))
          }
        >
          <div className="space-y-1.5">
            {rows.map((row) => (
              <FieldCard
                key={fieldRowKey(row.section, row.field)}
                row={row}
                value={displayValue(row)}
                originalValue={originalValues[fieldRowKey(row.section, row.field)] ?? ""}
                flagStatus={fieldFlag(fieldRowKey(row.section, row.field))}
                onValueChange={(value) =>
                  onFieldChange(fieldRowKey(row.section, row.field), value)
                }
                onSetFlag={(status) =>
                  onSetFieldFlag(fieldRowKey(row.section, row.field), status)
                }
                isPdfDocument={isPdfDocument}
                onFocusField={onFocusField}
              />
            ))}
          </div>
        </CollapsibleSection>
      ))}

      {filteredOverview.length === 0 && !hasVisibleFields ? (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          No fields match your search or filters.
        </p>
      ) : null}
    </div>
  );
}

function ReviewChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold transition-colors",
        active
          ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
      )}
    >
      {active ? <Check className="size-3.5" /> : null}
      {label}
    </button>
  );
}

function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 dark:border-slate-700">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-2.5 py-1.5 text-left"
      >
        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{title}</span>
        <ChevronDown
          className={cn("size-3.5 text-slate-500 transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? <div className="border-t border-slate-100 px-2.5 py-1.5 dark:border-slate-800">{children}</div> : null}
    </section>
  );
}

function FieldFlagDropdown({
  status,
  onChange,
}: {
  status: FieldFlagStatus;
  onChange: (status: FieldFlagStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = FIELD_FLAG_OPTIONS.find((option) => option.value === status) ?? FIELD_FLAG_OPTIONS[0]!;
  const CurrentIcon = current.icon;

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((value) => !value);
        }}
        aria-label={`Field flag: ${current.label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "inline-flex size-6 items-center justify-center rounded-md border transition-colors",
          status === 2
            ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500"
            : status === 3
              ? "border-rose-600 bg-rose-600 text-white dark:border-rose-500 dark:bg-rose-500"
              : status === 1
                ? "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-950 dark:text-amber-300"
                : "border-slate-300 bg-white text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400",
        )}
      >
        <CurrentIcon className="size-3.5" />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Field flag"
          className="absolute right-0 top-full z-20 mt-1 min-w-[9.5rem] overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          {FIELD_FLAG_OPTIONS.map((option) => {
            const OptionIcon = option.icon;
            const selected = option.value === status;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800",
                  selected && "bg-slate-50 font-semibold dark:bg-slate-800",
                )}
              >
                <OptionIcon className="size-3.5 shrink-0 text-slate-600 dark:text-slate-300" />
                <span className="text-slate-700 dark:text-slate-200">{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function FieldCard({
  row,
  value,
  originalValue,
  flagStatus,
  onValueChange,
  onSetFlag,
  isPdfDocument,
  onFocusField,
}: {
  row: FieldRow;
  value: string;
  originalValue: string;
  flagStatus: FieldFlagStatus;
  onValueChange: (value: string) => void;
  onSetFlag: (status: FieldFlagStatus) => void;
  isPdfDocument?: boolean;
  onFocusField?: (focus: DocumentFocusTarget) => void;
}) {
  const pageOptions = tracePagesFromRow(row);
  const [selectedPage, setSelectedPage] = useState<number | null>(
    pageOptions.length > 0 ? pageOptions[0]! : null,
  );
  const label = row.field
    .replace(/^\d+-/, (match) => `#${match.slice(0, -1)} `)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const isEdited = value.trim() !== originalValue.trim();
  const isNotFound = isExtractedValueMissing(value);
  const isLlmField = row.valueOrigin === "llm";
  const showDocumentTrace = !isNotFound && !isLlmField;
  const canLocate =
    showDocumentTrace &&
    isPdfDocument &&
    Boolean(onFocusField) &&
    createFocusFromFieldRowAtPage(row, selectedPage ?? pageOptions[0] ?? null) != null;

  function focusPage(page: number | null) {
    if (!onFocusField) return;
    const focus = createFocusFromFieldRowAtPage(row, page);
    if (focus) onFocusField(focus);
  }

  function handleLocate() {
    focusPage(selectedPage ?? pageOptions[0] ?? null);
  }

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50/60 p-2 dark:border-slate-700 dark:bg-slate-800/40">
      <div className="mb-1 flex items-center justify-between gap-1.5">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </p>
          {isEdited ? (
            <p className="text-[10px] font-medium text-amber-700 dark:text-amber-400">Edited</p>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          {canLocate ? (
            <button
              type="button"
              onClick={handleLocate}
              aria-label="Locate in document"
              title="Locate in document"
              className="inline-flex size-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:border-primary/40 hover:text-primary dark:border-slate-600 dark:bg-slate-900 dark:hover:text-primary"
            >
              <Crosshair className="size-3" />
            </button>
          ) : null}
          <FieldFlagDropdown status={flagStatus} onChange={onSetFlag} />
        </div>
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="not_found"
        readOnly={false}
        className={cn(
          "h-8 w-full rounded-md border px-2 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-100 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100",
          isNotFound
            ? "border-dashed border-slate-300 bg-slate-100 italic text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
            : "border-slate-200 bg-white text-slate-900",
        )}
      />

      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        {showDocumentTrace ? (
          <>
            {pageOptions.length > 1 ? (
              <select
                value={selectedPage ?? pageOptions[0]}
                onChange={(e) => {
                  const page = Number.parseInt(e.target.value, 10);
                  setSelectedPage(page);
                  focusPage(page);
                }}
                className="h-6 rounded-md border border-sky-200 bg-sky-50 px-2 text-[10px] font-semibold uppercase tracking-wide text-sky-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300"
                aria-label={`Pages for ${label}`}
              >
                {pageOptions.map((page) => (
                  <option key={page} value={page}>
                    Page {page}
                  </option>
                ))}
              </select>
            ) : pageOptions.length === 1 ? (
              <MetaTag variant="page">Page {pageOptions[0]}</MetaTag>
            ) : row.page !== "-" ? (
              <MetaTag variant="page">Page {row.page}</MetaTag>
            ) : null}
          </>
        ) : null}
        {row.valueOrigin === "ocr" && row.confidence > 0 ? (
          <MetaTag variant="confidence">{row.confidence}%</MetaTag>
        ) : null}
        {row.valueOrigin === "ocr" ? <MetaTag variant="ocr">OCR</MetaTag> : null}
        {row.valueOrigin === "llm" ? <MetaTag variant="llm">LLM</MetaTag> : null}
      </div>
    </div>
  );
}

type MetaTagVariant = "page" | "confidence" | "ocr" | "llm";

const META_TAG_STYLES: Record<MetaTagVariant, string> = {
  page: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  confidence: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  ocr: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  llm: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

function MetaTag({
  variant,
  children,
}: {
  variant: MetaTagVariant;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full truncate rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        META_TAG_STYLES[variant],
      )}
    >
      {children}
    </span>
  );
}
