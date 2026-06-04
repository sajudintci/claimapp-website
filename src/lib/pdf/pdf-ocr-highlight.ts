import type { PageViewport } from "pdfjs-dist/types/src/display/display_utils";
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

export function findBestOcrLineIndex(
  lines: string[],
  sourceText: string,
  value?: string,
): number {
  let bestIdx = -1;
  let bestScore = 0;

  for (const query of buildQueries(sourceText, value)) {
    lines.forEach((line, i) => {
      const score = lineScore(line, query);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    });
    if (bestScore >= 70) break;
  }

  return bestScore >= 35 ? bestIdx : -1;
}

/** Approximate highlight band from OCR line index (when PDF has no text layer). */
export function findOcrLineHighlight(
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
