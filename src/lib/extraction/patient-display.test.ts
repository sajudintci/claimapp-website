import { describe, expect, it } from "vitest";
import { resolveExtractedPatientName } from "./patient-display";

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
