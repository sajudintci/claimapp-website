import { describe, expect, it } from "vitest";
import {
  applyFieldValueToClaim,
  buildReviewedPayload,
  fieldRowKey,
  fieldValuesFromRows,
  initReviewStateFromPayload,
  parseReviewMeta,
  REVIEW_META_KEY,
} from "@/lib/extraction/claim-review";
import { buildFieldRows } from "@/lib/extraction/claim-extraction";

describe("claim-review", () => {
  const baseClaim = {
    patient: { name: { value: "Dewi", source_text: "Dewi", page: 1, confidence: 0.98 } },
    billing: { total_amount_read: { value: "1000", source_text: "1000", page: 1, confidence: 0.9 } },
  };

  it("builds reviewed payload with edited values and review meta", () => {
    const payload = buildReviewedPayload({
      basePayload: { claims: [baseClaim] },
      fieldValuesByClaim: {
        0: {
          [fieldRowKey("Patient", "name")]: "Dewi Susanti",
          [fieldRowKey("Billing", "total_amount_read")]: "1200",
        },
      },
      reviewedKeysByClaim: {
        0: [fieldRowKey("Patient", "name")],
      },
    });

    const claim = (payload.claims as typeof baseClaim[])[0];
    expect(claim.patient.name.value).toBe("Dewi Susanti");
    expect(claim.billing.total_amount_read.value).toBe("1200");
    expect(parseReviewMeta(payload).reviewedFieldKeys).toEqual([fieldRowKey("Patient", "name")]);
  });

  it("hydrates review state from saved reviewed result", () => {
    const saved = buildReviewedPayload({
      basePayload: { claims: [baseClaim] },
      fieldValuesByClaim: {
        0: { [fieldRowKey("Patient", "name")]: "Edited Name" },
      },
      reviewedKeysByClaim: { 0: [fieldRowKey("Patient", "name")] },
    });

    const state = initReviewStateFromPayload(saved);
    expect(state.fieldValuesByClaim[0][fieldRowKey("Patient", "name")]).toBe("Edited Name");
    expect(state.reviewedKeysByClaim[0]).toEqual([fieldRowKey("Patient", "name")]);
  });

  it("applies empty value as not_found", () => {
    const updated = applyFieldValueToClaim(baseClaim, "Patient", "name", "");
    expect(updated.patient?.name.value).toBe("not_found");
  });

  it("derives field values from rows including not_found placeholders", () => {
    const rows = buildFieldRows(baseClaim);
    const values = fieldValuesFromRows(rows);

    expect(values[fieldRowKey("Patient", "name")]).toBe("Dewi");
    expect(values[fieldRowKey("Billing", "total_amount_read")]).toBe("1000");
    expect(values[fieldRowKey("Provider", "email")]).toBe("not_found");
    expect(values[fieldRowKey("Medical", "summary")]).toBe("not_found");
  });

  it("stores review meta under _review key", () => {
    const payload = buildReviewedPayload({
      basePayload: { claims: [baseClaim] },
      fieldValuesByClaim: { 0: {} },
      reviewedKeysByClaim: { 0: [] },
    });
    expect(payload[REVIEW_META_KEY]).toMatchObject({ reviewedFieldKeys: [] });
  });

  it("persists edits to line items and laboratory tests", () => {
    const claimWithArrays = {
      ...baseClaim,
      items: [{ description: "Lab A", quantity: "1", amount: "50000", related_doctor: "dr. X" }],
      tests: [{ test_name: "Glucose", result: "95", unit: "mg/dL" }],
    };

    const payload = buildReviewedPayload({
      basePayload: { claims: [claimWithArrays] },
      fieldValuesByClaim: {
        0: {
          [fieldRowKey("Line Items", "1-description")]: "Lab Panel A",
          [fieldRowKey("Laboratory", "1-result")]: "96",
        },
      },
      reviewedKeysByClaim: { 0: [] },
    });

    const claim = (payload.claims as typeof claimWithArrays[])[0];
    expect(claim.items?.[0]?.description).toBe("Lab Panel A");
    expect(claim.tests?.[0]?.result).toBe("96");
  });
});
