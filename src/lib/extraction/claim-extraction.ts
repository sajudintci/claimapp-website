export type TracedField = {
  value?: string | number;
  source_text?: string;
  page?: number | null;
  confidence?: number;
};

export type ExtractionClaim = Record<string, unknown> & {
  provider?: Record<string, TracedField>;
  billing?: Record<string, TracedField>;
  patient?: Record<string, TracedField>;
  encounter?: Record<string, TracedField>;
  medical_summary?: TracedField;
  diagnosis?: Record<string, TracedField>;
  items?: Array<Record<string, unknown>>;
  tests?: Array<Record<string, unknown>>;
};

export function tracedFieldValue(field: unknown): string {
  if (!field || typeof field !== "object") return "-";
  const raw = (field as TracedField).value;
  if (raw == null) return "-";
  const text = String(raw).trim();
  if (!text || text === "not_found") return "-";
  return text;
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

export type FieldRow = {
  section: string;
  field: string;
  value: string;
  confidence: number;
  sourceText: string;
  page: string;
};

function pushTracedFieldRows(
  rows: FieldRow[],
  section: string,
  fields: Record<string, unknown> | undefined,
) {
  if (!fields) return;
  Object.entries(fields).forEach(([field, traced]) => {
    rows.push({
      section,
      field,
      value: tracedFieldValue(traced),
      confidence: tracedFieldConfidence(traced),
      sourceText:
        traced && typeof traced === "object" && typeof (traced as TracedField).source_text === "string"
          ? (traced as TracedField).source_text!
          : "",
      page:
        traced && typeof traced === "object" && (traced as TracedField).page != null
          ? String((traced as TracedField).page)
          : "-",
    });
  });
}

export function buildFieldRows(claim: ExtractionClaim): FieldRow[] {
  const rows: FieldRow[] = [];
  pushTracedFieldRows(rows, "Provider", claim.provider);
  pushTracedFieldRows(rows, "Billing", claim.billing);
  pushTracedFieldRows(rows, "Patient", claim.patient);
  pushTracedFieldRows(rows, "Encounter", claim.encounter);
  pushTracedFieldRows(rows, "Diagnosis", claim.diagnosis);

  if (claim.medical_summary) {
    rows.push({
      section: "Medical",
      field: "summary",
      value: tracedFieldValue(claim.medical_summary),
      confidence: tracedFieldConfidence(claim.medical_summary),
      sourceText:
        typeof claim.medical_summary.source_text === "string"
          ? claim.medical_summary.source_text
          : "",
      page:
        claim.medical_summary.page != null ? String(claim.medical_summary.page) : "-",
    });
  }

  return rows;
}
