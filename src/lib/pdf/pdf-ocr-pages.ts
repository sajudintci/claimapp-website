export type OcrLineBox = {
  l: number;
  t: number;
  r: number;
  b: number;
};

export type OcrPairEntry = {
  key: string;
  label: string;
  value: string;
  text: string;
  confidence: number;
  region?: OcrLineBox;
};

export type OcrTableCellEntry = {
  col: number;
  row: number;
  text: string;
  confidence: number;
  region?: OcrLineBox;
};

export type OcrTableEntry = {
  region?: OcrLineBox;
  rows: Array<{ row: number; cells: OcrTableCellEntry[] }>;
};

export type OcrPageLines = {
  page: number;
  lines: string[];
  width?: number;
  height?: number;
  regions?: Array<OcrLineBox | null | undefined>;
  pairs?: OcrPairEntry[];
  tables?: OcrTableEntry[];
};

function parseOcrLineBox(raw: unknown): OcrLineBox | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const l = Number((raw as OcrLineBox).l);
  const t = Number((raw as OcrLineBox).t);
  const r = Number((raw as OcrLineBox).r);
  const b = Number((raw as OcrLineBox).b);
  if (![l, t, r, b].every(Number.isFinite)) return undefined;
  if (r <= l || b <= t) return undefined;
  return { l, t, r, b };
}

function parsePairs(raw: unknown): OcrPairEntry[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const pairs: OcrPairEntry[] = [];
  for (const p of raw) {
    if (!p || typeof p !== "object") continue;
    const label = String((p as { label?: unknown }).label ?? "").trim();
    const value = String((p as { value?: unknown }).value ?? "").trim();
    const text = String((p as { text?: unknown }).text ?? `${label} : ${value}`).trim();
    if (!label && !value && !text) continue;
    pairs.push({
      key: String((p as { key?: unknown }).key ?? label).trim(),
      label,
      value,
      text,
      confidence: Number((p as { confidence?: unknown }).confidence) || 0,
      region: parseOcrLineBox((p as { region?: unknown }).region),
    });
  }
  return pairs.length > 0 ? pairs : undefined;
}

function parseTables(raw: unknown): OcrTableEntry[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const tables: OcrTableEntry[] = [];
  for (const t of raw) {
    if (!t || typeof t !== "object") continue;
    const rowsRaw = (t as { rows?: unknown }).rows;
    if (!Array.isArray(rowsRaw)) continue;
    const rows: OcrTableEntry["rows"] = [];
    for (const tr of rowsRaw) {
      if (!tr || typeof tr !== "object") continue;
      const cellsRaw = (tr as { cells?: unknown }).cells;
      if (!Array.isArray(cellsRaw)) continue;
      const cells: OcrTableCellEntry[] = [];
      for (const c of cellsRaw) {
        if (!c || typeof c !== "object") continue;
        const text = String((c as { text?: unknown }).text ?? "").trim();
        if (text.length < 1) continue;
        cells.push({
          col: Number((c as { col?: unknown }).col) || 0,
          row: Number((c as { row?: unknown }).row) || 0,
          text,
          confidence: Number((c as { confidence?: unknown }).confidence) || 0,
          region: parseOcrLineBox((c as { region?: unknown }).region),
        });
      }
      if (cells.length > 0) {
        rows.push({
          row: Number((tr as { row?: unknown }).row) || 0,
          cells,
        });
      }
    }
    if (rows.length > 0) {
      tables.push({
        region: parseOcrLineBox((t as { region?: unknown }).region),
        rows,
      });
    }
  }
  return tables.length > 0 ? tables : undefined;
}

function parseLineStrings(linesRaw: unknown): string[] {
  if (!Array.isArray(linesRaw)) return [];
  return linesRaw
    .map((l) => {
      if (typeof l === "string") return l.replace(/\s+/g, " ").trim();
      if (l && typeof l === "object" && "text" in l) {
        return String((l as { text?: unknown }).text).replace(/\s+/g, " ").trim();
      }
      return "";
    })
    .filter((l) => l.length >= 2);
}

function parseStructuredPage(entry: Record<string, unknown>): OcrPageLines | null {
  const page = Number(entry.page);
  if (!Number.isFinite(page) || page < 1) return null;

  const width = Number(entry.width);
  const height = Number(entry.height);

  const linesFlatRaw = entry.linesFlat;
  const linesRaw = entry.lines;
  const regionsRaw = entry.regions;

  let lines: string[] = [];
  let regions: OcrPageLines["regions"];

  if (Array.isArray(linesFlatRaw) && linesFlatRaw.length > 0) {
    lines = linesFlatRaw
      .map((l) => String(l).replace(/\s+/g, " ").trim())
      .filter((l) => l.length >= 2);
  } else {
    lines = parseLineStrings(linesRaw);
  }

  if (Array.isArray(regionsRaw)) {
    regions = regionsRaw.map((r) => parseOcrLineBox(r) ?? null);
  } else if (Array.isArray(linesRaw) && linesRaw.length > 0 && typeof linesRaw[0] === "object") {
    regions = linesRaw.map((l) =>
      l && typeof l === "object" ? parseOcrLineBox((l as { region?: unknown }).region) ?? null : null,
    );
  }

  if (lines.length === 0) return null;

  return {
    page,
    lines,
    width: Number.isFinite(width) && width > 0 ? width : undefined,
    height: Number.isFinite(height) && height > 0 ? height : undefined,
    regions,
    pairs: parsePairs(entry.pairs),
    tables: parseTables(entry.tables),
  };
}

/** Parse structured `ocrPageLines` from extraction payload (schema v2/v3). */
export function parseOcrPagesFromPayload(payload: Record<string, unknown>): OcrPageLines[] {
  const structured = payload.ocrPageLines;
  if (Array.isArray(structured) && structured.length > 0) {
    const pages: OcrPageLines[] = [];
    for (const entry of structured) {
      if (!entry || typeof entry !== "object") continue;
      const parsed = parseStructuredPage(entry as Record<string, unknown>);
      if (parsed) pages.push(parsed);
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

export function getOcrPageLines(ocrPages: OcrPageLines[], page: number): string[] {
  return ocrPages.find((p) => p.page === page)?.lines ?? [];
}

export function getOcrPageData(
  ocrPages: OcrPageLines[],
  page: number,
): OcrPageLines | undefined {
  return ocrPages.find((p) => p.page === page);
}
