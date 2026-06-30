import { describe, expect, it } from "vitest";
import { createFocusFromFieldRowAtPage } from "@/lib/extraction/document-focus";
import type { FieldRow } from "@/lib/extraction/claim-extraction";

function makeRow(traces: FieldRow["traces"]): FieldRow {
  return {
    section: "Provider",
    field: "hospital_name",
    value: "Martha Friska Hospital",
    sourceText: "Martha Friska Hospital",
    page: "2",
    confidence: 90,
    valueOrigin: "llm",
    traces,
  };
}

describe("createFocusFromFieldRowAtPage", () => {
  it("highlights all traces on the selected page", () => {
    const row = makeRow([
      { source_text: "Header Martha Friska Hospital", page: 2 },
      { source_text: "Footer Martha Friska Hospital", page: 2 },
      { source_text: "Martha Friska Hospital", page: 5 },
    ]);

    const focus = createFocusFromFieldRowAtPage(row, 2);
    expect(focus?.traces).toHaveLength(2);
    expect(focus?.traces?.every((trace) => trace.page === 2)).toBe(true);
  });
});
