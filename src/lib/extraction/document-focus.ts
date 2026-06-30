import {
  createDocumentFocus,
  DocumentFocusTarget,
  FieldTraceFocus,
  TracedFieldDisplay,
} from "@/components/claim-detail/types";
import { FieldRow, TracedField, tracedFieldValue } from "@/lib/extraction/claim-extraction";
import { FieldTrace, tracesFromField, tracePagesFromRow } from "@/lib/extraction/field-trace";

export function isPdfDocument(mimeType: string | undefined): boolean {
  return mimeType === "application/pdf";
}

function hasPdfTrace(page: number | null, sourceText: string, value?: string): boolean {
  if (page != null && page > 0) return true;
  if (sourceText.trim().length >= 2) return true;
  const v = value?.trim();
  return Boolean(v && v !== "-" && v.toLowerCase() !== "not_found");
}

function tracesCanFocus(
  traces: FieldTraceFocus[],
  value?: string,
): boolean {
  return traces.some((trace) => hasPdfTrace(trace.page, trace.sourceText, value));
}

function traceToFocus(trace: FieldTrace): FieldTraceFocus {
  return {
    page: trace.page,
    sourceText: trace.source_text,
    ...(trace.region ? { region: trace.region } : {}),
  };
}

function tracesFromUnknownField(field: unknown): FieldTraceFocus[] {
  if (!field || typeof field !== "object") return [];
  const traced = field as TracedField;
  return tracesFromField({
    source_text: traced.source_text,
    page: traced.page ?? null,
    traces: traced.traces,
  }).map(traceToFocus);
}

export function listFocusTraces(focus: DocumentFocusTarget): FieldTraceFocus[] {
  if (focus.traces && focus.traces.length > 0) return focus.traces;
  return [{ page: focus.page, sourceText: focus.sourceText }];
}

export function focusAppliesToPage(focus: DocumentFocusTarget, pageNumber: number): boolean {
  if (focus.page != null && focus.page > 0) {
    return focus.page === pageNumber;
  }
  return listFocusTraces(focus).some(
    (trace) => trace.page == null || trace.page === pageNumber,
  );
}

export function tracedFieldCanFocus(field: unknown): boolean {
  const traces = tracesFromUnknownField(field);
  if (traces.length === 0) return false;
  return tracesCanFocus(traces, tracedFieldValue(field));
}

export function createFocusFromTracedField(
  label: string,
  field: unknown,
): DocumentFocusTarget | null {
  const traces = tracesFromUnknownField(field);
  const value = tracedFieldValue(field);
  if (!tracesCanFocus(traces, value !== "-" ? value : undefined)) return null;

  const primary = traces[0]!;
  return createDocumentFocus({
    page: primary.page,
    sourceText: primary.sourceText,
    traces,
    value: value !== "-" ? value : undefined,
    label,
  });
}

export function createFocusFromPreExtracted(
  label: string,
  field: TracedFieldDisplay,
): DocumentFocusTarget | null {
  return createFocusFromTracedField(label, field);
}

export function createFocusFromFieldRow(row: FieldRow): DocumentFocusTarget | null {
  const pages = tracePagesFromRow(row);
  const preferredPage = pages[0] ?? null;
  return createFocusFromFieldRowAtPage(row, preferredPage);
}

export function createFocusFromFieldRowAtPage(
  row: FieldRow,
  page: number | null,
): DocumentFocusTarget | null {
  const traces =
    row.traces.length > 0
      ? row.traces.map(traceToFocus)
      : [
          {
            page: row.page !== "-" ? Number.parseInt(row.page, 10) : null,
            sourceText: row.sourceText,
          },
        ];

  if (!tracesCanFocus(traces, row.value !== "not_found" ? row.value : undefined)) return null;

  const activeTraces =
    page != null ? traces.filter((trace) => trace.page === page) : traces;
  const selected =
    activeTraces[0] ??
    traces.find((trace) => trace.page != null) ??
    traces[0];
  if (!selected) return null;

  const fieldKey = `${row.section}-${row.field}`.replace(/\s+/g, "-").toLowerCase();

  return createDocumentFocus({
    id: `${fieldKey}-p${selected.page ?? "na"}-n${activeTraces.length}`,
    page: selected.page,
    sourceText: selected.sourceText,
    traces: activeTraces,
    value: row.value !== "not_found" ? row.value : undefined,
    label: `${row.section} · ${row.field}`,
  });
}

export function createFocusFromLineItem(
  label: string,
  item: Record<string, unknown>,
): DocumentFocusTarget | null {
  const traces = tracesFromField({
    source_text: String(item.source_text ?? item.description ?? ""),
    page: typeof item.page === "number" ? item.page : null,
    traces: Array.isArray(item.traces) ? (item.traces as TracedField["traces"]) : undefined,
  }).map((trace) => ({ page: trace.page, sourceText: trace.source_text }));
  const value = String(item.description ?? item.amount ?? "").trim();
  if (!tracesCanFocus(traces, value || undefined)) return null;
  const primary = traces[0]!;
  return createDocumentFocus({
    page: primary.page,
    sourceText: primary.sourceText,
    traces,
    value: value || undefined,
    label,
  });
}

export function createFocusFromTestResult(
  label: string,
  test: Record<string, unknown>,
): DocumentFocusTarget | null {
  const name = String(test.test_name ?? "").trim();
  const result = String(test.result ?? "").trim();
  const category = String(test.test_category ?? "").trim();
  const fallbackSnippet = [category, name, result].filter(Boolean).join(" ").trim();
  const sourceText = String(test.source_text ?? "").trim() || fallbackSnippet;
  const traces = tracesFromField({
    source_text: sourceText,
    page: typeof test.page === "number" ? test.page : null,
    traces: Array.isArray(test.traces) ? (test.traces as TracedField["traces"]) : undefined,
  }).map((trace) => ({ page: trace.page, sourceText: trace.source_text }));
  const value = sourceText || name || result || undefined;
  if (!tracesCanFocus(traces, value)) return null;
  const primary = traces[0]!;
  return createDocumentFocus({
    page: primary.page,
    sourceText: primary.sourceText,
    traces,
    value,
    label,
  });
}
