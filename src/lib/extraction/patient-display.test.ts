import { describe, expect, it } from "vitest";
import {
  resolveExtractedPatientName,
  resolveExtractedPatientNameFromResult,
} from "./patient-display";

describe("resolveExtractedPatientName", () => {
  it("returns extracted patient name", () => {
    expect(resolveExtractedPatientName({ value: "Dewi Susanti" })).toBe("Dewi Susanti");
  });

  it("preserves not_found from extraction", () => {
    expect(resolveExtractedPatientName({ value: "not_found" })).toBe("not_found");
  });

  it("returns not_found when field is absent", () => {
    expect(resolveExtractedPatientName(undefined)).toBe("not_found");
  });
});

describe("resolveExtractedPatientNameFromResult", () => {
  it("reads patient.name from root claims", () => {
    expect(
      resolveExtractedPatientNameFromResult({
        claims: [{ patient: { name: { value: "Budi" } } }],
      }),
    ).toBe("Budi");
  });

  it("reads patient.name from structuredData.claims", () => {
    expect(
      resolveExtractedPatientNameFromResult({
        structuredData: {
          claims: [{ patient: { name: { value: "Ani" } } }],
        },
      }),
    ).toBe("Ani");
  });
});
