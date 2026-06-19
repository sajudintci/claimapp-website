import {
  buildFieldRows,
  ExtractionClaim,
  FieldRow,
  resolveClaimsFromPayload,
  type TracedField,
} from "@/lib/extraction/claim-extraction";

export const REVIEW_META_KEY = "_review";

export type ClaimReviewMeta = {
  reviewedFieldKeys: string[];
  updatedAt?: string;
};

const SECTION_TO_CLAIM_KEY: Record<string, keyof ExtractionClaim | "medical_summary"> = {
  Provider: "provider",
  Billing: "billing",
  Patient: "patient",
  Encounter: "encounter",
  Diagnosis: "diagnosis",
  Medical: "medical_summary",
};

const ARRAY_ITEM_SECTIONS: Record<string, "items" | "tests"> = {
  "Line Items": "items",
  Laboratory: "tests",
};

function applyArrayRecordValue(
  claim: ExtractionClaim,
  arrayKey: "items" | "tests",
  field: string,
  value: string,
): ExtractionClaim {
  const match = /^(\d+)-(.+)$/.exec(field);
  if (!match) return claim;

  const index = Number(match[1]) - 1;
  const property = match[2];
  if (!Number.isFinite(index) || index < 0 || !property) return claim;

  const cloned = structuredClone(claim) as ExtractionClaim;
  const records = [...(cloned[arrayKey] ?? [])];
  const current = { ...(records[index] ?? {}) } as Record<string, unknown>;
  current[property] = value.trim() === "" ? "not_found" : value.trim();
  records[index] = current;
  cloned[arrayKey] = records;
  return cloned;
}

export function fieldRowKey(section: string, field: string): string {
  return `${section}-${field}`;
}

export function parseReviewMeta(payload: Record<string, unknown> | null | undefined): ClaimReviewMeta {
  if (!payload) return { reviewedFieldKeys: [] };
  const raw = payload[REVIEW_META_KEY];
  if (!raw || typeof raw !== "object") return { reviewedFieldKeys: [] };
  const meta = raw as ClaimReviewMeta;
  return {
    reviewedFieldKeys: Array.isArray(meta.reviewedFieldKeys)
      ? meta.reviewedFieldKeys.filter((key): key is string => typeof key === "string")
      : [],
    updatedAt: typeof meta.updatedAt === "string" ? meta.updatedAt : undefined,
  };
}

export function fieldValuesFromRows(rows: FieldRow[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const row of rows) {
    out[fieldRowKey(row.section, row.field)] = row.value;
  }
  return out;
}

export function rowsWithFieldValues(
  rows: FieldRow[],
  fieldValues: Record<string, string>,
): FieldRow[] {
  return rows.map((row) => {
    const key = fieldRowKey(row.section, row.field);
    const edited = fieldValues[key];
    if (edited === undefined) return row;
    return {
      ...row,
      value: edited.trim() === "" ? "not_found" : edited,
    };
  });
}

export function applyFieldValueToClaim(
  claim: ExtractionClaim,
  section: string,
  field: string,
  value: string,
): ExtractionClaim {
  const cloned = structuredClone(claim) as ExtractionClaim;
  const normalized = value.trim() === "" ? "not_found" : value.trim();

  if (section === "Medical" && field === "summary") {
    const current = cloned.medical_summary ?? { value: "not_found", source_text: "", confidence: 0 };
    cloned.medical_summary = {
      ...current,
      value: normalized,
      value_origin: "ocr",
      derived_from: undefined,
    };
    return cloned;
  }

  const arrayKey = ARRAY_ITEM_SECTIONS[section];
  if (arrayKey) {
    return applyArrayRecordValue(cloned, arrayKey, field, value);
  }

  const sectionKey = SECTION_TO_CLAIM_KEY[section];
  if (!sectionKey || sectionKey === "medical_summary") return cloned;

  const sectionObj =
    (cloned[sectionKey] as Record<string, TracedField> | undefined) ?? ({} as Record<string, TracedField>);
  const existing = sectionObj[field];
  sectionObj[field] = existing
    ? { ...existing, value: normalized, value_origin: "ocr", derived_from: undefined }
    : { value: normalized, source_text: "", page: null, confidence: 0, value_origin: "ocr" };
  (cloned as Record<string, unknown>)[sectionKey] = sectionObj;
  return cloned;
}

export function buildReviewedPayload(params: {
  basePayload: Record<string, unknown>;
  fieldValuesByClaim: Record<number, Record<string, string>>;
  reviewedKeysByClaim: Record<number, string[]>;
}): Record<string, unknown> {
  const result = structuredClone(params.basePayload) as Record<string, unknown>;
  const claims = resolveClaimsFromPayload(result);
  if (claims.length === 0) {
    result[REVIEW_META_KEY] = {
      reviewedFieldKeys: [],
      updatedAt: new Date().toISOString(),
    };
    return result;
  }

  const nextClaims = claims.map((claim, index) => {
    let nextClaim = claim;
    const edits = params.fieldValuesByClaim[index] ?? {};
    for (const [key, value] of Object.entries(edits)) {
      const dash = key.indexOf("-");
      if (dash <= 0) continue;
      const section = key.slice(0, dash);
      const field = key.slice(dash + 1);
      nextClaim = applyFieldValueToClaim(nextClaim, section, field, value);
    }
    return nextClaim;
  });

  if (Array.isArray(result.claims)) {
    result.claims = nextClaims;
  } else {
    const structured = (result.structuredData as Record<string, unknown> | undefined) ?? {};
    result.structuredData = { ...structured, claims: nextClaims };
  }

  const allReviewedKeys = flattenReviewedKeys(params.reviewedKeysByClaim);
  result[REVIEW_META_KEY] = {
    reviewedFieldKeys: allReviewedKeys,
    updatedAt: new Date().toISOString(),
  };

  return result;
}

function flattenReviewedKeys(reviewedKeysByClaim: Record<number, string[]>): string[] {
  return Object.entries(reviewedKeysByClaim).flatMap(([index, keys]) => {
    const claimIndex = Number(index);
    return keys.map((key) => (claimIndex === 0 ? key : `${claimIndex}:${key}`));
  });
}

function expandReviewedKeys(keys: string[]): Record<number, string[]> {
  const out: Record<number, string[]> = {};
  for (const key of keys) {
    const match = /^(\d+):(.+)$/.exec(key);
    if (match) {
      const idx = Number(match[1]);
      out[idx] = [...(out[idx] ?? []), match[2]];
      continue;
    }
    out[0] = [...(out[0] ?? []), key];
  }
  return out;
}

export function initReviewStateFromPayload(payload: Record<string, unknown>): {
  fieldValuesByClaim: Record<number, Record<string, string>>;
  reviewedKeysByClaim: Record<number, string[]>;
} {
  const claims = resolveClaimsFromPayload(payload);
  const meta = parseReviewMeta(payload);
  const fieldValuesByClaim: Record<number, Record<string, string>> = {};
  const reviewedKeysByClaim = expandReviewedKeys(meta.reviewedFieldKeys);

  claims.forEach((claim, index) => {
    fieldValuesByClaim[index] = fieldValuesFromRows(buildFieldRows(claim));
    if (!reviewedKeysByClaim[index]) reviewedKeysByClaim[index] = [];
  });

  return { fieldValuesByClaim, reviewedKeysByClaim };
}
