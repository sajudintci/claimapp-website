export type TracedField = {
  value?: string | number;
  source_text?: string;
  page?: number | null;
  confidence?: number;
  value_origin?: "ocr" | "llm_synthesis";
  derived_from?: string[];
};

export type ExtractionLineItem = {
  description?: string;
  quantity?: string;
  amount?: string;
  related_doctor?: string;
  source_text?: string;
  page?: number | null;
  confidence?: number;
  field_origins?: Partial<
    Record<"description" | "quantity" | "amount" | "related_doctor", FieldValueOrigin>
  >;
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
  field_origins?: Partial<
    Record<
      "test_category" | "test_name" | "result" | "unit" | "reference_range",
      FieldValueOrigin
    >
  >;
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

export type FieldValueOrigin = "ocr" | "llm_synthesis";

export type FieldRow = {
  section: string;
  field: string;
  value: string;
  confidence: number;
  sourceText: string;
  page: string;
  valueOrigin?: FieldValueOrigin;
  derivedFrom?: string[];
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
): Pick<FieldRow, "value" | "confidence" | "sourceText" | "page" | "valueOrigin" | "derivedFrom"> {
  if (!field || typeof field !== "object") {
    return { value: "not_found", confidence: 0, sourceText: "", page: "-" };
  }

  const traced = field as TracedField;
  const reviewValue = tracedFieldReviewValue(traced);
  const valueOrigin =
    traced.value_origin === "llm_synthesis" || traced.value_origin === "ocr"
      ? traced.value_origin
      : !isExtractedValueMissing(reviewValue)
        ? "ocr"
        : undefined;

  return {
    value: tracedFieldReviewValue(traced),
    confidence: tracedFieldConfidence(traced),
    sourceText: typeof traced.source_text === "string" ? traced.source_text : "",
    page: traced.page != null ? String(traced.page) : "-",
    valueOrigin,
    derivedFrom: Array.isArray(traced.derived_from)
      ? traced.derived_from.filter((entry): entry is string => typeof entry === "string")
      : undefined,
  };
}

function recordConfidence(record: Record<string, unknown>): number {
  const confidence = Number(record.confidence);
  return Number.isFinite(confidence) ? Math.round(confidence * 100) : 0;
}

function recordPage(record: Record<string, unknown>): string {
  return record.page != null ? String(record.page) : "-";
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

function pushLineItemRows(rows: FieldRow[], items: ExtractionLineItem[] | undefined) {
  if (!Array.isArray(items)) return;

  items.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const record = item as Record<string, unknown>;
    const itemNo = index + 1;

    for (const field of LINE_ITEM_FIELDS) {
      const fieldOrigins = record.field_origins as ExtractionLineItem["field_origins"];
      rows.push({
        section: "Line Items",
        field: `${itemNo}-${field}`,
        value: scalarFieldValue(record[field]),
        confidence: recordConfidence(record),
        sourceText: recordSourceText(record),
        page: recordPage(record),
        valueOrigin:
          fieldOrigins?.[field] ??
          (!isExtractedValueMissing(scalarFieldValue(record[field])) ? "ocr" : undefined),
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
      const fieldOrigins = record.field_origins as ExtractionTestResult["field_origins"];
      rows.push({
        section: "Laboratory",
        field: `${testNo}-${field}`,
        value: scalarFieldValue(record[field]),
        confidence: recordConfidence(record),
        sourceText: recordSourceText(record),
        page: recordPage(record),
        valueOrigin:
          fieldOrigins?.[field as keyof NonNullable<ExtractionTestResult["field_origins"]>] ??
          (!isExtractedValueMissing(scalarFieldValue(record[field])) ? "ocr" : undefined),
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
