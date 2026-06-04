import { Util } from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import type { PageViewport } from "pdfjs-dist/types/src/display/display_utils";
import type { HighlightRect, PdfFocusMatchStatus } from "@/lib/pdf/types";

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function loose(text: string): string {
  return normalize(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(text: string): string {
  return loose(text).replace(/\s+/g, "");
}

function buildCandidates(sourceText: string, value?: string): string[] {
  const out: string[] = [];
  const src = normalize(sourceText);
  const srcLoose = loose(sourceText);

  if (src.length >= 2) {
    out.push(src, srcLoose, compact(sourceText));
    if (src.length > 80) out.push(src.slice(0, 80), srcLoose.slice(0, 80));
    if (src.length > 40) out.push(src.slice(0, 40));
    const words = src.split(" ");
    if (words.length >= 4) out.push(words.slice(0, 6).join(" "));
    if (words.length >= 2) out.push(words.slice(0, 3).join(" "));
  }

  const val = value ? normalize(String(value)) : "";
  if (val.length >= 2 && val !== src) {
    out.push(val, loose(val), compact(val));
  }

  return [...new Set(out)].filter((s) => s.length >= 2);
}

type PageTextIndex = {
  spaced: string;
  compact: string;
  loose: string;
  spacedToItem: number[];
  compactToItem: number[];
  looseToItem: number[];
};

function appendChunk(
  parts: string[],
  map: number[],
  chunk: string,
  itemIndex: number,
  separator: string | null,
) {
  if (!chunk) return;
  if (separator && parts.length > 0) {
    for (const ch of separator) {
      parts.push(ch);
      map.push(itemIndex);
    }
  }
  for (const ch of chunk) {
    parts.push(ch);
    map.push(itemIndex);
  }
}

function buildPageTextIndex(items: TextItem[]): PageTextIndex {
  const spacedParts: string[] = [];
  const spacedToItem: number[] = [];
  const compactParts: string[] = [];
  const compactToItem: number[] = [];
  const looseParts: string[] = [];
  const looseToItem: number[] = [];

  for (let i = 0; i < items.length; i++) {
    const raw = items[i]?.str ?? "";
    const chunk = normalize(raw);
    const chunkLoose = loose(raw);
    if (!chunk && !chunkLoose) continue;

    appendChunk(spacedParts, spacedToItem, chunk.toLowerCase(), i, spacedParts.length > 0 ? " " : null);
    appendChunk(compactParts, compactToItem, compact(raw), i, null);
    appendChunk(looseParts, looseToItem, chunkLoose, i, looseParts.length > 0 ? " " : null);
  }

  return {
    spaced: spacedParts.join(""),
    compact: compactParts.join(""),
    loose: looseParts.join(""),
    spacedToItem,
    compactToItem,
    looseToItem,
  };
}

function itemRect(item: TextItem, viewport: PageViewport): HighlightRect {
  const tx = Util.transform(viewport.transform, item.transform);
  const fontHeight = Math.hypot(tx[2], tx[3]) || (item.height ?? 12) * viewport.scale;
  const width =
    typeof item.width === "number" && item.width > 0
      ? item.width * viewport.scale
      : Math.hypot(tx[0], tx[1]) || 8;
  return {
    left: tx[4],
    top: tx[5] - fontHeight,
    width: Math.max(width, 4),
    height: Math.max(fontHeight, 6),
  };
}

function indexesFromRange(map: number[], start: number, end: number): number[] {
  const hits = new Set<number>();
  for (let i = start; i < Math.min(end, map.length); i++) {
    const n = map[i];
    if (n != null) hits.add(n);
  }
  return [...hits];
}

function matchInIndex(index: PageTextIndex, query: string): number[] {
  const qNorm = normalize(query).toLowerCase();
  const qLoose = loose(query);
  const qCompact = compact(query);

  const attempts: Array<{ haystack: string; map: number[]; needle: string }> = [
    { haystack: index.spaced, map: index.spacedToItem, needle: qNorm },
    { haystack: index.loose, map: index.looseToItem, needle: qLoose },
    { haystack: index.compact, map: index.compactToItem, needle: qCompact },
  ];

  for (const { haystack, map, needle } of attempts) {
    if (!needle || needle.length < 2) continue;
    const start = haystack.indexOf(needle);
    if (start !== -1) return indexesFromRange(map, start, start + needle.length);
  }

  const word = qLoose.split(" ").find((w) => w.length >= 4);
  if (word) {
    const start = index.loose.indexOf(word);
    if (start !== -1) return indexesFromRange(index.looseToItem, start, start + word.length);
    const wCompact = compact(word);
    const cStart = index.compact.indexOf(wCompact);
    if (cStart !== -1) return indexesFromRange(index.compactToItem, cStart, cStart + wCompact.length);
  }

  return [];
}

function matchIndexes(items: TextItem[], query: string): number[] {
  const index = buildPageTextIndex(items);
  const hits = matchInIndex(index, query);
  if (hits.length > 0) return hits;

  const probe = compact(query).slice(0, 16);
  if (probe.length < 3) return [];

  const fallback = new Set<number>();
  items.forEach((item, i) => {
    const t = compact(item.str ?? "");
    if (!t) return;
    if (t.includes(probe) || (t.length >= 4 && probe.includes(t))) fallback.add(i);
  });
  return [...fallback];
}

function boundingBoxFromRects(rects: HighlightRect[]): HighlightRect[] {
  if (rects.length === 0) return [];
  let minL = Infinity;
  let minT = Infinity;
  let maxR = -Infinity;
  let maxB = -Infinity;
  for (const r of rects) {
    minL = Math.min(minL, r.left);
    minT = Math.min(minT, r.top);
    maxR = Math.max(maxR, r.left + r.width);
    maxB = Math.max(maxB, r.top + r.height);
  }
  return [
    {
      left: minL,
      top: minT,
      width: Math.max(maxR - minL, 8),
      height: Math.max(maxB - minT, 8),
    },
  ];
}

export function findHighlightRects(
  items: TextItem[],
  viewport: PageViewport,
  sourceText: string,
  value?: string,
): HighlightRect[] {
  if (items.length === 0) return [];

  for (const query of buildCandidates(sourceText, value)) {
    const indexes = matchIndexes(items, query);
    if (indexes.length === 0) continue;
    const rects = indexes.map((i) => itemRect(items[i]!, viewport));
    return boundingBoxFromRects(rects);
  }
  return [];
}

export function resolveFocusMatchStatus(
  rects: HighlightRect[],
  hasPage: boolean,
): PdfFocusMatchStatus {
  if (rects.length > 0) return "matched";
  if (hasPage) return "page_only";
  return "none";
}

export function buildPageSearchOrder(hint: number | null, totalPages: number): number[] {
  const center = hint != null && hint > 0 ? Math.min(hint, totalPages) : 1;
  const order: number[] = [center];
  for (let delta = 1; delta <= 8; delta++) {
    if (center - delta >= 1) order.push(center - delta);
    if (center + delta <= totalPages) order.push(center + delta);
  }
  for (let p = 1; p <= totalPages; p++) {
    if (!order.includes(p)) order.push(p);
  }
  return order;
}
