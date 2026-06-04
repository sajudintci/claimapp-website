import {
  createDocumentFocus,
  DocumentFocusTarget,
  TracedFieldDisplay,
} from "@/components/claim-detail/types";
import { FieldRow, TracedField, tracedFieldValue } from "@/lib/extraction/claim-extraction";

export function isPdfDocument(mimeType: string | undefined): boolean {
  return mimeType === "application/pdf";
}

function hasPdfTrace(page: number | null, sourceText: string, value?: string): boolean {
  if (page != null && page > 0) return true;
  if (sourceText.trim().length >= 2) return true;
  const v = value?.trim();
  return Boolean(v && v !== "-" && v.toLowerCase() !== "not_found");
}

export function tracedFieldCanFocus(field: unknown): boolean {
  if (!field || typeof field !== "object") return false;
  const f = field as TracedField;
  return hasPdfTrace(
    typeof f.page === "number" ? f.page : null,
    String(f.source_text ?? ""),
    tracedFieldValue(f),
  );
}

export function createFocusFromTracedField(
  label: string,
  field: unknown,
): DocumentFocusTarget | null {
  if (!tracedFieldCanFocus(field)) return null;
  const f = field as TracedField;
  const value = tracedFieldValue(f);
  return createDocumentFocus({
    page: typeof f.page === "number" ? f.page : null,
    sourceText: String(f.source_text ?? ""),
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
  const page = row.page !== "-" ? Number.parseInt(row.page, 10) : null;
  if (
    !hasPdfTrace(
      Number.isFinite(page) ? page : null,
      row.sourceText,
      row.value !== "-" ? row.value : undefined,
    )
  ) {
    return null;
  }
  return createDocumentFocus({
    page: Number.isFinite(page) ? page : null,
    sourceText: row.sourceText,
    value: row.value !== "-" ? row.value : undefined,
    label: `${row.section} · ${row.field}`,
  });
}

export function createFocusFromLineItem(
  label: string,
  item: Record<string, unknown>,
): DocumentFocusTarget | null {
  const page = typeof item.page === "number" ? item.page : null;
  const sourceText = String(item.source_text ?? item.description ?? "");
  const value = String(item.description ?? item.amount ?? "").trim();
  if (!hasPdfTrace(page, sourceText, value || undefined)) return null;
  return createDocumentFocus({
    page,
    sourceText,
    value: value || undefined,
    label,
  });
}

export function createFocusFromTestResult(
  label: string,
  test: Record<string, unknown>,
): DocumentFocusTarget | null {
  const page = typeof test.page === "number" ? test.page : null;
  const sourceText = String(test.source_text ?? "").trim();
  const name = String(test.test_name ?? "").trim();
  const result = String(test.result ?? "").trim();
  const category = String(test.test_category ?? "").trim();
  const fallbackSnippet = [category, name, result].filter(Boolean).join(" ").trim();
  const searchText = sourceText || fallbackSnippet;
  const value = sourceText || name || result || undefined;
  if (!hasPdfTrace(page, searchText, value)) return null;
  return createDocumentFocus({
    page,
    sourceText: searchText,
    value,
    label,
  });
}
