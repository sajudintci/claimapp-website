import { describe, expect, it } from "vitest";
import {
  applyFieldValueToClaim,
  attachFieldFlagsToPayload,
  buildReviewedPayload,
  buildReviewPayloadWithFlags,
  FIELD_FLAGS_META_KEY,
  fieldRowKey,
  fieldValuesFromRows,
  initReviewStateFromPayload,
  parseFieldFlagsMeta,
  REVIEW_META_KEY,
} from "@/lib/extraction/claim-review";
import { buildFieldRows } from "@/lib/extraction/claim-extraction";

describe("claim-review", () => {
  const baseClaim = {
    patient: { name: { value: "Dewi", source_text: "Dewi", page: 1, confidence: 0.98 } },
    billing: { total_amount_read: { value: "1000", source_text: "1000", page: 1, confidence: 0.9 } },
  };

  it("builds reviewed payload with edited values only (flags stored separately)", () => {
    const payload = buildReviewPayloadWithFlags({
      basePayload: { claims: [baseClaim] },
      fieldValuesByClaim: {
        0: {
          [fieldRowKey("Patient", "name")]: "Dewi Susanti",
          [fieldRowKey("Billing", "total_amount_read")]: "1200",
        },
      },
      fieldFlagsByClaim: {
        0: {
          [fieldRowKey("Patient", "name")]: 2,
          [fieldRowKey("Billing", "total_amount_read")]: 3,
        },
      },
    });

    const claim = (payload.claims as typeof baseClaim[])[0];
    expect(claim.patient.name.value).toBe("Dewi Susanti");
    expect(claim.billing.total_amount_read.value).toBe("1200");
    expect(parseFieldFlagsMeta(payload).flags).toEqual({
      [fieldRowKey("Patient", "name")]: 2,
      [fieldRowKey("Billing", "total_amount_read")]: 3,
    });
    expect(payload[REVIEW_META_KEY]).toMatchObject({ updatedAt: expect.any(String) });
    expect((payload[REVIEW_META_KEY] as Record<string, unknown>).reviewedFieldKeys).toBeUndefined();
  });

  it("hydrates review state from saved reviewed result", () => {
    const saved = buildReviewPayloadWithFlags({
      basePayload: { claims: [baseClaim] },
      fieldValuesByClaim: {
        0: { [fieldRowKey("Patient", "name")]: "Edited Name" },
      },
      fieldFlagsByClaim: {
        0: { [fieldRowKey("Patient", "name")]: 1 },
      },
    });

    const state = initReviewStateFromPayload(saved);
    expect(state.fieldValuesByClaim[0][fieldRowKey("Patient", "name")]).toBe("Edited Name");
    expect(state.fieldFlagsByClaim[0][fieldRowKey("Patient", "name")]).toBe(1);
  });

  it("migrates legacy _review.fieldCheckStatus into field flags", () => {
    const legacyPayload = {
      claims: [baseClaim],
      _review: {
        fieldCheckStatus: { [fieldRowKey("Patient", "name")]: 2 },
      },
    };

    const state = initReviewStateFromPayload(legacyPayload);
    expect(state.fieldFlagsByClaim[0][fieldRowKey("Patient", "name")]).toBe(2);
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

  it("stores field flags under _fieldFlags key", () => {
    const payload = attachFieldFlagsToPayload(
      buildReviewedPayload({
        basePayload: { claims: [baseClaim] },
        fieldValuesByClaim: { 0: {} },
      }),
      { 0: { [fieldRowKey("Patient", "name")]: 1 } },
    );
    expect(payload[FIELD_FLAGS_META_KEY]).toMatchObject({
      flags: { [fieldRowKey("Patient", "name")]: 1 },
    });
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
    });

    const claim = (payload.claims as typeof claimWithArrays[])[0];
    expect(claim.items?.[0]?.description).toBe("Lab Panel A");
    expect(claim.tests?.[0]?.result).toBe("96");
  });
});
