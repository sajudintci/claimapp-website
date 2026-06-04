export type OcrPageLines = {
  page: number;
  lines: string[];
};

/** Parse `--- Page N ---` blocks from stored OCR plain text. */
export function parseOcrPagesFromPayload(payload: Record<string, unknown>): OcrPageLines[] {
  const structured = payload.ocrPageLines;
  if (Array.isArray(structured) && structured.length > 0) {
    const pages: OcrPageLines[] = [];
    for (const entry of structured) {
      if (!entry || typeof entry !== "object") continue;
      const page = Number((entry as { page?: unknown }).page);
      const linesRaw = (entry as { lines?: unknown }).lines;
      if (!Number.isFinite(page) || page < 1 || !Array.isArray(linesRaw)) continue;
      const lines = linesRaw
        .map((l) => String(l).replace(/\s+/g, " ").trim())
        .filter((l) => l.length >= 2);
      if (lines.length > 0) pages.push({ page, lines });
    }
    if (pages.length > 0) return pages;
  }

  const raw = String(payload.ocrRawText ?? payload.rawText ?? "").trim();
  if (!raw) return [];

  const pages: OcrPageLines[] = [];
  const blocks = raw.split(/---\s*Page\s+(\d+)\s*---/i);

  if (blocks.length > 1) {
    for (let i = 1; i < blocks.length; i += 2) {
      const page = Number.parseInt(blocks[i] ?? "", 10);
      const body = (blocks[i + 1] ?? "").trim();
      if (!Number.isFinite(page) || page < 1 || !body) continue;
      const lines = body
        .split("\n")
        .map((l) => l.replace(/\s+/g, " ").trim())
        .filter((l) => l.length >= 2);
      if (lines.length > 0) pages.push({ page, lines });
    }
    return pages;
  }

  const lines = raw
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l.length >= 2);
  if (lines.length > 0) pages.push({ page: 1, lines });
  return pages;
}

export function getOcrPageLines(
  ocrPages: OcrPageLines[],
  page: number,
): string[] {
  return ocrPages.find((p) => p.page === page)?.lines ?? [];
}
