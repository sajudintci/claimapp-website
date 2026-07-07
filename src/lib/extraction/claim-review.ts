import {
  buildFieldRows,
  ExtractionClaim,
  FieldRow,
  resolveClaimsFromPayload,
  type TracedField,
} from "@/lib/extraction/claim-extraction";

export const REVIEW_META_KEY = "_review";
export const FIELD_FLAGS_META_KEY = "_fieldFlags";

/** 0 = neutral, 1 = question, 2 = verified, 3 = rejected — UI-only flags, no workflow impact. */
export type FieldFlagStatus = 0 | 1 | 2 | 3;

export const DEFAULT_FIELD_FLAG_STATUS: FieldFlagStatus = 0;

/** @deprecated Use FieldFlagStatus */
export type FieldCheckStatus = FieldFlagStatus;

/** @deprecated Use DEFAULT_FIELD_FLAG_STATUS */
export const DEFAULT_FIELD_CHECK_STATUS = DEFAULT_FIELD_FLAG_STATUS;

export type ClaimReviewMeta = {
  updatedAt?: string;
};

export type ClaimFieldFlagsMeta = {
  flags: Record<string, FieldFlagStatus>;
  updatedAt?: string;
};

export function isFieldFlagged(status: FieldFlagStatus): boolean {
  return status !== DEFAULT_FIELD_FLAG_STATUS;
}

function isValidFieldFlagStatus(value: unknown): value is FieldFlagStatus {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

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
  if (!payload) return {};
  const raw = payload[REVIEW_META_KEY];
  if (!raw || typeof raw !== "object") return {};
  const meta = raw as ClaimReviewMeta;
  return {
    updatedAt: typeof meta.updatedAt === "string" ? meta.updatedAt : undefined,
  };
}

export function parseFieldFlagsMeta(
  payload: Record<string, unknown> | null | undefined,
): ClaimFieldFlagsMeta {
  if (!payload) return { flags: {} };

  const raw = payload[FIELD_FLAGS_META_KEY];
  if (raw && typeof raw === "object") {
    const meta = raw as ClaimFieldFlagsMeta;
    const flags: Record<string, FieldFlagStatus> = {};
    if (meta.flags && typeof meta.flags === "object") {
      for (const [key, status] of Object.entries(meta.flags)) {
        if (isValidFieldFlagStatus(status)) {
          flags[key] = status;
        }
      }
    }
    return {
      flags,
      updatedAt: typeof meta.updatedAt === "string" ? meta.updatedAt : undefined,
    };
  }

  return migrateLegacyFieldFlags(payload);
}

function migrateLegacyFieldFlags(payload: Record<string, unknown>): ClaimFieldFlagsMeta {
  const review = payload[REVIEW_META_KEY];
  if (!review || typeof review !== "object") return { flags: {} };

  const meta = review as {
    fieldCheckStatus?: Record<string, unknown>;
    reviewedFieldKeys?: unknown;
  };

  const flags: Record<string, FieldFlagStatus> = {};
  if (meta.fieldCheckStatus && typeof meta.fieldCheckStatus === "object") {
    for (const [key, status] of Object.entries(meta.fieldCheckStatus)) {
      if (isValidFieldFlagStatus(status)) {
        flags[key] = status;
      }
    }
  }

  if (Array.isArray(meta.reviewedFieldKeys)) {
    for (const key of meta.reviewedFieldKeys) {
      if (typeof key === "string" && flags[key] === undefined) {
        flags[key] = 2;
      }
    }
  }

  return { flags };
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
}): Record<string, unknown> {
  const result = structuredClone(params.basePayload) as Record<string, unknown>;
  const claims = resolveClaimsFromPayload(result);
  if (claims.length === 0) {
    result[REVIEW_META_KEY] = {
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

  result[REVIEW_META_KEY] = {
    updatedAt: new Date().toISOString(),
  };

  return result;
}

export function attachFieldFlagsToPayload(
  payload: Record<string, unknown>,
  fieldFlagsByClaim: Record<number, Record<string, FieldFlagStatus>>,
): Record<string, unknown> {
  const flags = flattenFieldFlags(fieldFlagsByClaim);
  if (Object.keys(flags).length === 0) {
    const { [FIELD_FLAGS_META_KEY]: _removed, ...rest } = payload;
    return rest;
  }

  return {
    ...payload,
    [FIELD_FLAGS_META_KEY]: {
      flags,
      updatedAt: new Date().toISOString(),
    },
  };
}

function flattenFieldFlags(
  fieldFlagsByClaim: Record<number, Record<string, FieldFlagStatus>>,
): Record<string, FieldFlagStatus> {
  const out: Record<string, FieldFlagStatus> = {};
  for (const [index, statuses] of Object.entries(fieldFlagsByClaim)) {
    const claimIndex = Number(index);
    for (const [key, status] of Object.entries(statuses)) {
      if (status === DEFAULT_FIELD_FLAG_STATUS) continue;
      const flatKey = claimIndex === 0 ? key : `${claimIndex}:${key}`;
      out[flatKey] = status;
    }
  }
  return out;
}

function expandFieldFlags(flat: Record<string, FieldFlagStatus>): Record<number, Record<string, FieldFlagStatus>> {
  const out: Record<number, Record<string, FieldFlagStatus>> = {};
  for (const [key, status] of Object.entries(flat)) {
    const match = /^(\d+):(.+)$/.exec(key);
    if (match) {
      const idx = Number(match[1]);
      out[idx] = { ...(out[idx] ?? {}), [match[2]]: status };
      continue;
    }
    out[0] = { ...(out[0] ?? {}), [key]: status };
  }
  return out;
}

export function initReviewStateFromPayload(payload: Record<string, unknown>): {
  fieldValuesByClaim: Record<number, Record<string, string>>;
  fieldFlagsByClaim: Record<number, Record<string, FieldFlagStatus>>;
} {
  const claims = resolveClaimsFromPayload(payload);
  const fieldValuesByClaim: Record<number, Record<string, string>> = {};
  const fieldFlagsByClaim = expandFieldFlags(parseFieldFlagsMeta(payload).flags);

  claims.forEach((claim, index) => {
    fieldValuesByClaim[index] = fieldValuesFromRows(buildFieldRows(claim));
    if (!fieldFlagsByClaim[index]) fieldFlagsByClaim[index] = {};
  });

  return { fieldValuesByClaim, fieldFlagsByClaim };
}

export function buildReviewPayloadWithFlags(params: {
  basePayload: Record<string, unknown>;
  fieldValuesByClaim: Record<number, Record<string, string>>;
  fieldFlagsByClaim: Record<number, Record<string, FieldFlagStatus>>;
}): Record<string, unknown> {
  const reviewed = buildReviewedPayload({
    basePayload: params.basePayload,
    fieldValuesByClaim: params.fieldValuesByClaim,
  });
  return attachFieldFlagsToPayload(reviewed, params.fieldFlagsByClaim);
}
