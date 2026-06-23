import { describe, expect, it } from "vitest";
import {
  buildFieldRows,
  TRACED_SECTION_FIELDS,
  tracedFieldReviewValue,
} from "@/lib/extraction/claim-extraction";
import { fieldRowKey } from "@/lib/extraction/claim-review";

describe("buildFieldRows", () => {
  it("includes line items and laboratory tests from LLM output", () => {
    const rows = buildFieldRows({
      patient: { name: { value: "Budi", source_text: "Budi", page: 1, confidence: 0.95 } },
      items: [
        {
          description: "Konsultasi",
          quantity: "1",
          amount: "150000",
          related_doctor: "dr. Ali",
          source_text: "Konsultasi 150000",
          page: 2,
          confidence: 0.9,
        },
      ],
      tests: [
        {
          test_category: "Hematology",
          test_name: "Hemoglobin",
          result: "14.2",
          unit: "g/dL",
          reference_range: "12-16",
          source_text: "Hemoglobin 14.2 g/dL",
          page: 3,
          confidence: 0.88,
        },
      ],
    });

    expect(rows.some((row) => row.section === "Line Items" && row.field === "1-description")).toBe(
      true,
    );
    expect(rows.some((row) => row.section === "Line Items" && row.field === "1-amount")).toBe(true);
    expect(rows.some((row) => row.section === "Laboratory" && row.field === "1-test_name")).toBe(
      true,
    );
    expect(rows.some((row) => row.section === "Laboratory" && row.field === "1-result")).toBe(true);

    const hemoglobin = rows.find(
      (row) => row.section === "Laboratory" && row.field === "1-result",
    );
    expect(hemoglobin?.value).toBe("14.2");
    expect(hemoglobin?.page).toBe("3");
  });

  it("uses stable row keys for review state", () => {
    const rows = buildFieldRows({
      tests: [{ test_name: "WBC", result: "7.5", source_text: "WBC 7.5", page: 1, confidence: 0.8 }],
    });
    const key = fieldRowKey("Laboratory", "1-test_name");
    expect(rows.find((row) => fieldRowKey(row.section, row.field) === key)?.value).toBe("WBC");
    expect(key).toBe(fieldRowKey("Laboratory", "1-test_name"));
  });

  it("always renders every traced schema field with not_found when absent", () => {
    const rows = buildFieldRows({
      patient: { name: { value: "Budi", source_text: "Budi", page: 1, confidence: 0.95 } },
    });

    for (const [section, fields] of Object.entries(TRACED_SECTION_FIELDS)) {
      for (const field of fields) {
        expect(rows.some((row) => row.section === section && row.field === field)).toBe(true);
      }
    }

    expect(rows.find((row) => row.section === "Medical" && row.field === "summary")?.value).toBe(
      "not_found",
    );
    expect(rows.find((row) => row.section === "Provider" && row.field === "email")?.value).toBe(
      "not_found",
    );
  });

  it("preserves explicit not_found from LLM output", () => {
    expect(
      tracedFieldReviewValue({
        value: "not_found",
        source_text: "",
        page: null,
        confidence: 0,
      }),
    ).toBe("not_found");
  });

  it("renders multiple OCR pages for a traced field", () => {
    const rows = buildFieldRows({
      patient: {
        name: {
          value: "Budi",
          source_text: "Nama Pasien: Budi",
          page: 1,
          confidence: 0.95,
          traces: [
            { source_text: "Nama Pasien: Budi", page: 1 },
            { source_text: "Patient Name Budi", page: 4 },
          ],
        },
      },
    });

    const nameRow = rows.find((row) => row.section === "Patient" && row.field === "name");
    expect(nameRow?.page).toBe("1, 4");
    expect(nameRow?.traces).toHaveLength(2);
  });
});
