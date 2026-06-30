import type { FieldTrace } from "@/lib/extraction/field-trace";
import {
  formatTracePages,
  normalizeFieldTraces,
  tracesFromField,
} from "@/lib/extraction/field-trace";

export type { FieldTrace };

export type TracedField = {
  value?: string | number;
  source_text?: string;
  page?: number | null;
  confidence?: number;
  traces?: FieldTrace[];
  /** Legacy extractions may still store synthesis metadata. */
  value_origin?: "ocr" | "llm_synthesis";
};

export type ExtractionLineItem = {
  description?: string;
  quantity?: string;
  amount?: string;
  related_doctor?: string;
  source_text?: string;
  page?: number | null;
  confidence?: number;
  traces?: FieldTrace[];
};

export type ExtractionTestResult = {
  test_category?: string;
  test_name?: string;
  result?: string;
  unit?: string;
  reference_range?: string;
  source_text?: string;
  page?: number | null;
  confidence?: number;
  traces?: FieldTrace[];
};

export type ExtractionClaim = Record<string, unknown> & {
  provider?: Record<string, TracedField>;
  billing?: Record<string, TracedField>;
  patient?: Record<string, TracedField>;
  encounter?: Record<string, TracedField>;
  medical_summary?: TracedField;
  diagnosis?: Record<string, TracedField>;
  items?: ExtractionLineItem[];
  tests?: ExtractionTestResult[];
};

export const TRACED_SECTION_FIELDS = {
  Provider: ["hospital_name", "address", "city", "phone", "email"],
  Billing: [
    "currency",
    "tax_amount",
    "total_amount_read",
    "total_amount_calculated",
    "payment_status",
  ],
  Patient: ["patient_id", "name", "dob"],
  Encounter: ["encounter_type", "admission_date", "discharge_date"],
  Diagnosis: ["icd10_code", "icd10_description"],
} as const;

export function isExtractedValueMissing(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "" || normalized === "-" || normalized === "not_found";
}

export function tracedFieldValue(field: unknown): string {
  if (!field || typeof field !== "object") return "-";
  const raw = (field as TracedField).value;
  if (raw == null) return "-";
  const text = String(raw).trim();
  if (!text || text === "not_found") return "-";
  return text;
}

/** Preserves LLM/OCR values for review UI, including explicit not_found. */
export function tracedFieldReviewValue(field: unknown): string {
  if (!field || typeof field !== "object") return "not_found";
  const raw = (field as TracedField).value;
  if (raw == null) return "not_found";
  const text = String(raw).trim();
  return text.length > 0 ? text : "not_found";
}

export function tracedFieldConfidence(field: unknown): number {
  if (!field || typeof field !== "object") return 0;
  const confidence = Number((field as TracedField).confidence);
  return Number.isFinite(confidence) ? Math.round(confidence * 100) : 0;
}

export function resolveClaimsFromPayload(payload: Record<string, unknown>): ExtractionClaim[] {
  if (Array.isArray(payload.claims) && payload.claims.length > 0) {
    return payload.claims as ExtractionClaim[];
  }
  const structured = payload.structuredData as Record<string, unknown> | undefined;
  if (Array.isArray(structured?.claims) && structured.claims.length > 0) {
    return structured.claims as ExtractionClaim[];
  }
  return [];
}

export type FieldValueOrigin = "ocr" | "llm";

export type FieldRow = {
  section: string;
  field: string;
  value: string;
  confidence: number;
  sourceText: string;
  page: string;
  traces: FieldTrace[];
  valueOrigin?: FieldValueOrigin;
};

export const FIELD_SECTION_ORDER = [
  "Provider",
  "Patient",
  "Encounter",
  "Billing",
  "Diagnosis",
  "Medical",
  "Line Items",
  "Laboratory",
] as const;

const LINE_ITEM_FIELDS = ["description", "quantity", "amount", "related_doctor"] as const;
const LABORATORY_FIELDS = [
  "test_category",
  "test_name",
  "result",
  "unit",
  "reference_range",
] as const;

function scalarFieldValue(raw: unknown): string {
  if (raw == null) return "not_found";
  const text = String(raw).trim();
  return text.length > 0 ? text : "not_found";
}

function readTracedField(
  field: unknown,
): Pick<FieldRow, "value" | "confidence" | "sourceText" | "page" | "traces" | "valueOrigin"> {
  if (!field || typeof field !== "object") {
    return { value: "not_found", confidence: 0, sourceText: "", page: "-", traces: [] };
  }

  const traced = field as TracedField;
  const reviewValue = tracedFieldReviewValue(traced);
  const valueOrigin: FieldValueOrigin | undefined = isExtractedValueMissing(reviewValue)
    ? undefined
    : traced.value_origin === "llm_synthesis"
      ? "llm"
      : "ocr";
  const sourceText = typeof traced.source_text === "string" ? traced.source_text : "";
  const pageNum = traced.page != null ? traced.page : null;
  const traces = tracesFromField({
    source_text: sourceText,
    page: pageNum,
    traces: traced.traces,
  });

  return {
    value: tracedFieldReviewValue(traced),
    confidence: tracedFieldConfidence(traced),
    sourceText,
    page: formatTracePages({ source_text: sourceText, page: pageNum, traces }),
    traces,
    valueOrigin,
  };
}

function readRecordTraces(record: Record<string, unknown>) {
  const sourceText = recordSourceText(record);
  const pageNum = record.page != null ? Number(record.page) : null;
  const rawTraces = Array.isArray(record.traces) ? record.traces : [];
  return normalizeFieldTraces({ traces: rawTraces }, { source_text: sourceText, page: pageNum });
}

function recordConfidence(record: Record<string, unknown>): number {
  const confidence = Number(record.confidence);
  return Number.isFinite(confidence) ? Math.round(confidence * 100) : 0;
}

function recordSourceText(record: Record<string, unknown>): string {
  return typeof record.source_text === "string" ? record.source_text : "";
}

function pushTracedFieldRows(
  rows: FieldRow[],
  section: keyof typeof TRACED_SECTION_FIELDS,
  fields: Record<string, unknown> | undefined,
) {
  for (const field of TRACED_SECTION_FIELDS[section]) {
    rows.push({
      section,
      field,
      ...readTracedField(fields?.[field]),
    });
  }
}

function parseFieldTraceList(raw: unknown): FieldTrace[] {
  if (Array.isArray(raw)) {
    const traces: FieldTrace[] = [];
    for (const entry of raw) {
      const normalized = normalizeFieldTraces({ traces: [entry] }, { source_text: "", page: null });
      if (normalized[0]) traces.push(normalized[0]);
    }
    return traces;
  }
  if (raw && typeof raw === "object") {
    const traced = raw as FieldTrace;
    const sourceText = traced.source_text?.trim() ?? "";
    const pageNum = traced.page ?? null;
    return normalizeFieldTraces({ traces: [traced] }, { source_text: sourceText, page: pageNum });
  }
  return [];
}

function tracesMatchingFieldValue(traces: FieldTrace[], fieldValue: string): FieldTrace[] {
  if (fieldValue === "not_found" || !fieldValue.trim()) return traces;
  const valueNorm = normalizeTraceText(fieldValue);
  const valueDigits = fieldValue.replace(/\D/g, "");
  const matched = traces.filter((trace) => {
    const sourceNorm = normalizeTraceText(trace.source_text);
    if (sourceNorm.includes(valueNorm) || valueNorm.includes(sourceNorm)) return true;
    if (valueDigits.length >= 2) {
      const sourceDigits = trace.source_text.replace(/\D/g, "");
      return sourceDigits.includes(valueDigits) || valueDigits.includes(sourceDigits);
    }
    return false;
  });
  return matched.length > 0 ? matched : traces;
}

function readArrayFieldTrace(
  record: Record<string, unknown>,
  fieldKey: string,
  fieldValue: string,
): Pick<FieldRow, "sourceText" | "page" | "traces"> {
  const fromFieldTraces = parseFieldTraceList(
    (record.field_traces as Record<string, unknown> | undefined)?.[fieldKey],
  );
  if (fromFieldTraces.length > 0) {
    const primary = fromFieldTraces[0]!;
    return {
      sourceText: primary.source_text,
      page: formatTracePages({ source_text: primary.source_text, page: primary.page, traces: fromFieldTraces }),
      traces: fromFieldTraces,
    };
  }

  const itemSource = recordSourceText(record);
  const useFieldValue =
    fieldValue !== "not_found" &&
    fieldValue.trim().length >= 2 &&
    !normalizeTraceText(itemSource).includes(normalizeTraceText(fieldValue));
  const itemTraces = readRecordTraces(record);
  const relevantTraces = useFieldValue
    ? tracesMatchingFieldValue(itemTraces, fieldValue)
    : itemTraces;

  if (relevantTraces.length > 0) {
    const primary = relevantTraces[0]!;
    const sourceText = useFieldValue ? primary.source_text || fieldValue : itemSource || primary.source_text;
    return {
      sourceText,
      page: formatTracePages({
        source_text: sourceText,
        page: primary.page ?? (record.page != null ? Number(record.page) : null),
        traces: relevantTraces,
      }),
      traces: relevantTraces,
    };
  }

  const sourceText = useFieldValue ? fieldValue : itemSource;
  const pageNum = record.page != null ? Number(record.page) : null;
  const fallbackTrace: FieldTrace = { source_text: sourceText, page: pageNum };
  const traces = sourceText.trim() ? [fallbackTrace] : [];
  return {
    sourceText,
    page: formatTracePages({ source_text: sourceText, page: pageNum, traces }),
    traces,
  };
}

function normalizeTraceText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function pushLineItemRows(rows: FieldRow[], items: ExtractionLineItem[] | undefined) {
  if (!Array.isArray(items)) return;

  items.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const record = item as Record<string, unknown>;
    const itemNo = index + 1;

    for (const field of LINE_ITEM_FIELDS) {
      const fieldValue = scalarFieldValue(record[field]);
      const traceMeta = readArrayFieldTrace(record, field, fieldValue);
      rows.push({
        section: "Line Items",
        field: `${itemNo}-${field}`,
        value: fieldValue,
        confidence: recordConfidence(record),
        sourceText: traceMeta.sourceText,
        page: traceMeta.page,
        traces: traceMeta.traces,
        valueOrigin: !isExtractedValueMissing(fieldValue) ? "ocr" : undefined,
      });
    }
  });
}

function pushLaboratoryRows(rows: FieldRow[], tests: ExtractionTestResult[] | undefined) {
  if (!Array.isArray(tests)) return;

  tests.forEach((test, index) => {
    if (!test || typeof test !== "object") return;
    const record = test as Record<string, unknown>;
    const testNo = index + 1;

    for (const field of LABORATORY_FIELDS) {
      const fieldValue = scalarFieldValue(record[field]);
      const traceMeta = readArrayFieldTrace(record, field, fieldValue);
      rows.push({
        section: "Laboratory",
        field: `${testNo}-${field}`,
        value: fieldValue,
        confidence: recordConfidence(record),
        sourceText: traceMeta.sourceText,
        page: traceMeta.page,
        traces: traceMeta.traces,
        valueOrigin: !isExtractedValueMissing(fieldValue) ? "ocr" : undefined,
      });
    }
  });
}

export function buildFieldRows(claim: ExtractionClaim): FieldRow[] {
  const rows: FieldRow[] = [];
  pushTracedFieldRows(rows, "Provider", claim.provider);
  pushTracedFieldRows(rows, "Patient", claim.patient);
  pushTracedFieldRows(rows, "Encounter", claim.encounter);
  pushTracedFieldRows(rows, "Billing", claim.billing);
  pushTracedFieldRows(rows, "Diagnosis", claim.diagnosis);
  pushLineItemRows(rows, claim.items);
  pushLaboratoryRows(rows, claim.tests);

  rows.push({
    section: "Medical",
    field: "summary",
    ...readTracedField(claim.medical_summary),
  });

  return rows;
}
