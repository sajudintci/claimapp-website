import type { PageViewport } from "pdfjs-dist/types/src/display/display_utils";
import type { OcrLineBox, OcrPageLines } from "@/lib/pdf/pdf-ocr-pages";
import type { HighlightRect } from "@/lib/pdf/types";

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function loose(text: string): string {
  return normalize(text).replace(/[^\p{L}\p{N}\s]/gu, " ");
}

function compact(text: string): string {
  return loose(text).replace(/\s+/g, "");
}

function buildQueries(sourceText: string, value?: string): string[] {
  const out: string[] = [];
  const src = normalize(sourceText);
  if (src.length >= 2) {
    out.push(src, loose(sourceText), compact(sourceText));
    const words = src.split(" ");
    if (words.length >= 4) out.push(words.slice(0, 6).join(" "));
    if (words.length >= 2) out.push(words.slice(0, 3).join(" "));
  }
  const val = value ? normalize(String(value)) : "";
  if (val.length >= 2 && val !== src) out.push(val, loose(val));
  return [...new Set(out)].filter((q) => q.length >= 2);
}

function lineScore(line: string, query: string): number {
  const l = normalize(line);
  const q = normalize(query);
  if (!l || !q) return 0;
  if (l === q) return 100;
  if (l.includes(q)) return 80 + Math.min(q.length, 40);
  if (q.includes(l) && l.length >= 4) return 60;
  const lCompact = compact(line);
  const qCompact = compact(query);
  if (lCompact.includes(qCompact)) return 70;
  const qWords = q.split(" ").filter((w) => w.length >= 3);
  if (qWords.length === 0) return 0;
  const hit = qWords.filter((w) => l.includes(w)).length;
  return (hit / qWords.length) * 50;
}

function bestScoreForQueries(
  texts: string[],
  sourceText: string,
  value?: string,
): { index: number; score: number } {
  let bestIdx = -1;
  let bestScore = 0;

  for (const query of buildQueries(sourceText, value)) {
    texts.forEach((line, i) => {
      const score = lineScore(line, query);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    });
    if (bestScore >= 70) break;
  }

  return { index: bestScore >= 35 ? bestIdx : -1, score: bestScore };
}

export function findBestOcrLineIndex(
  lines: string[],
  sourceText: string,
  value?: string,
): number {
  return bestScoreForQueries(lines, sourceText, value).index;
}

/** Map ABBYY layout box (page pixel space) to PDF.js viewport CSS pixels. */
export function abbyyBoxToViewportRect(
  box: OcrLineBox,
  pageWidth: number,
  pageHeight: number,
  viewport: PageViewport,
): HighlightRect {
  const sx = viewport.width / pageWidth;
  const sy = viewport.height / pageHeight;
  return {
    left: box.l * sx,
    top: box.t * sy,
    width: Math.max((box.r - box.l) * sx, 4),
    height: Math.max((box.b - box.t) * sy, 6),
  };
}

function rectFromBox(
  box: OcrLineBox | undefined,
  ocrPage: OcrPageLines,
  viewport: PageViewport,
): HighlightRect[] {
  const pageWidth = ocrPage.width;
  const pageHeight = ocrPage.height;
  if (!box || !pageWidth || !pageHeight) return [];
  return [abbyyBoxToViewportRect(box, pageWidth, pageHeight, viewport)];
}

function findPairHighlight(
  ocrPage: OcrPageLines,
  viewport: PageViewport,
  sourceText: string,
  value?: string,
): HighlightRect[] {
  const pairs = ocrPage.pairs;
  if (!pairs?.length) return [];

  const candidates = pairs.map((p) => ({
    texts: [p.text, `${p.label} : ${p.value}`, p.value, p.label],
    region: p.region,
  }));

  let bestIdx = -1;
  let bestScore = 0;
  for (let i = 0; i < candidates.length; i++) {
    for (const t of candidates[i]!.texts) {
      for (const query of buildQueries(sourceText, value)) {
        const score = lineScore(t, query);
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }
    }
  }

  if (bestIdx < 0 || bestScore < 35) return [];
  return rectFromBox(candidates[bestIdx]!.region, ocrPage, viewport);
}

function findTableCellHighlight(
  ocrPage: OcrPageLines,
  viewport: PageViewport,
  sourceText: string,
  value?: string,
): HighlightRect[] {
  const tables = ocrPage.tables;
  if (!tables?.length) return [];

  const cells: Array<{ text: string; region?: OcrLineBox }> = [];
  for (const table of tables) {
    for (const tr of table.rows) {
      for (const cell of tr.cells) {
        if (cell.text.length >= 1) cells.push({ text: cell.text, region: cell.region });
      }
    }
  }
  if (cells.length === 0) return [];

  const { index } = bestScoreForQueries(
    cells.map((c) => c.text),
    sourceText,
    value,
  );
  if (index < 0) return [];
  return rectFromBox(cells[index]!.region, ocrPage, viewport);
}

/** Highlight using ABBYY regions (pairs → table cells → row/line index). */
export function findOcrRegionHighlight(
  ocrPage: OcrPageLines,
  viewport: PageViewport,
  sourceText: string,
  value?: string,
): HighlightRect[] {
  const fromPair = findPairHighlight(ocrPage, viewport, sourceText, value);
  if (fromPair.length > 0) return fromPair;

  const fromTable = findTableCellHighlight(ocrPage, viewport, sourceText, value);
  if (fromTable.length > 0) return fromTable;

  const idx = findBestOcrLineIndex(ocrPage.lines, sourceText, value);
  if (idx < 0) return [];

  const box = ocrPage.regions?.[idx];
  return rectFromBox(box ?? undefined, ocrPage, viewport);
}

/** Fallback band when PDF has no text layer and ABBYY regions are unavailable. */
export function findOcrLineHighlightApprox(
  lines: string[],
  viewport: PageViewport,
  sourceText: string,
  value?: string,
): HighlightRect[] {
  const idx = findBestOcrLineIndex(lines, sourceText, value);
  if (idx < 0 || lines.length === 0) return [];

  const w = viewport.width;
  const h = viewport.height;
  const lineCount = Math.max(lines.length, 1);
  const bandH = Math.max((h / lineCount) * 1.15, 18);
  const top = Math.min(h - bandH - 8, (idx / lineCount) * (h - bandH) + h * 0.05);

  return [
    {
      left: w * 0.04,
      top,
      width: w * 0.92,
      height: bandH,
    },
  ];
}

export function findOcrLineHighlight(
  lines: string[],
  viewport: PageViewport,
  sourceText: string,
  value?: string,
  ocrPage?: OcrPageLines,
): HighlightRect[] {
  if (ocrPage) {
    const precise = findOcrRegionHighlight(ocrPage, viewport, sourceText, value);
    if (precise.length > 0) return precise;
  }
  return findOcrLineHighlightApprox(lines, viewport, sourceText, value);
}
