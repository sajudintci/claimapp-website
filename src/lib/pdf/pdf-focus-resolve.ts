import type { PDFDocumentProxy } from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import type { PageViewport } from "pdfjs-dist/types/src/display/display_utils";
import { DocumentFocusTarget, FieldTraceFocus } from "@/components/claim-detail/types";
import { listFocusTraces } from "@/lib/extraction/document-focus";
import { findOcrLineHighlight, findOcrRegionHighlight, rectFromBox } from "@/lib/pdf/pdf-ocr-highlight";
import { getOcrPageData, getOcrPageLines, type OcrPageLines } from "@/lib/pdf/pdf-ocr-pages";
import {
  buildPageSearchOrder,
  findHighlightRects,
} from "@/lib/pdf/pdf-text-match";
import type { HighlightRect, PdfFocusMatchStatus } from "@/lib/pdf/types";

export type FocusResolveResult = {
  page: number;
  pages: number[];
  rects: HighlightRect[];
  matchStatus: PdfFocusMatchStatus;
  textItemCount: number;
  highlightVia: "pdf" | "ocr" | "ocr_coords" | "none";
};

type MiniFocus = Pick<DocumentFocusTarget, "sourceText" | "value"> & {
  region?: { l: number; t: number; r: number; b: number };
};

function resolveSingleTraceHighlights(
  items: TextItem[],
  ocrLines: string[],
  viewport: PageViewport,
  focus: MiniFocus,
  ocrPage?: OcrPageLines,
): { rects: HighlightRect[]; via: "pdf" | "ocr" | "ocr_coords" | "none" } {
  if (focus.region && ocrPage?.width && ocrPage.height) {
    const direct = rectFromBox(focus.region, ocrPage, viewport);
    if (direct.length > 0) return { rects: direct, via: "ocr_coords" };
  }

  const hasAbbyyCoords =
    ocrPage?.width != null &&
    ocrPage.height != null &&
    ocrPage.regions?.some(Boolean);

  if (hasAbbyyCoords && ocrPage) {
    const abbyyRects = findOcrRegionHighlight(
      ocrPage,
      viewport,
      focus.sourceText,
      focus.value,
    );
    if (abbyyRects.length > 0) return { rects: abbyyRects, via: "ocr_coords" };
  }

  const pdfRects = findHighlightRects(items, viewport, focus.sourceText, focus.value);
  if (pdfRects.length > 0) return { rects: pdfRects, via: "pdf" };

  const ocrRects = findOcrLineHighlight(ocrLines, viewport, focus.sourceText, focus.value, ocrPage);
  if (ocrRects.length > 0) return { rects: ocrRects, via: "ocr" };

  return { rects: [], via: "none" };
}

export function resolvePageHighlights(
  items: TextItem[],
  ocrLines: string[],
  viewport: PageViewport,
  focus: DocumentFocusTarget,
  ocrPage?: OcrPageLines,
): { rects: HighlightRect[]; via: "pdf" | "ocr" | "ocr_coords" | "none" } {
  return resolveTracesOnPage(
    items,
    ocrLines,
    viewport,
    listFocusTraces(focus),
    focus.value,
    ocrPage,
  );
}

export function resolveTracesOnPage(
  items: TextItem[],
  ocrLines: string[],
  viewport: PageViewport,
  traces: FieldTraceFocus[],
  value: string | undefined,
  ocrPage?: OcrPageLines,
  pageNumber?: number,
): { rects: HighlightRect[]; via: "pdf" | "ocr" | "ocr_coords" | "none" } {
  const applicable = traces.filter(
    (trace) => pageNumber == null || trace.page == null || trace.page === pageNumber,
  );

  let rects: HighlightRect[] = [];
  let via: "pdf" | "ocr" | "ocr_coords" | "none" = "none";

  for (const trace of applicable) {
    const found = resolveSingleTraceHighlights(
      items,
      ocrLines,
      viewport,
      { sourceText: trace.sourceText, value, region: trace.region },
      ocrPage,
    );
    if (found.rects.length > 0) {
      rects = [...rects, ...found.rects];
      if (via === "none") via = found.via;
    }
  }

  return { rects, via };
}

function toMatchStatus(
  via: "pdf" | "ocr" | "ocr_coords" | "none",
  hasPage: boolean,
): PdfFocusMatchStatus {
  if (via === "pdf") return "matched";
  if (via === "ocr" || via === "ocr_coords") return "matched_ocr";
  if (hasPage) return "page_only";
  return "none";
}

export async function resolveDocumentFocusHighlight(
  pdf: PDFDocumentProxy,
  focus: DocumentFocusTarget,
  scale: number,
  totalPages: number,
  ocrPages: OcrPageLines[],
): Promise<FocusResolveResult> {
  const traces = listFocusTraces(focus);
  const targetPage =
    focus.page != null && focus.page > 0
      ? focus.page
      : (traces.find((trace) => trace.page != null && trace.page > 0)?.page ?? null);
  const hintedPage = targetPage ?? 1;
  const searchPages =
    targetPage != null
      ? [
          targetPage,
          ...buildPageSearchOrder(targetPage, totalPages).filter((page) => page !== targetPage),
        ]
      : buildPageSearchOrder(hintedPage, totalPages);
  const matchedPages: number[] = [];
  let primaryPage = targetPage ?? searchPages[0] ?? 1;
  let rects: HighlightRect[] = [];
  let highlightVia: "pdf" | "ocr" | "ocr_coords" | "none" = "none";
  let textItemCount = 0;

  for (const pageNum of searchPages) {
    const pdfPage = await pdf.getPage(pageNum);
    const vp = pdfPage.getViewport({ scale });
    const content = await pdfPage.getTextContent();
    const items = content.items.filter((x): x is TextItem => "str" in x);
    textItemCount = Math.max(textItemCount, items.length);

    const ocrLines = getOcrPageLines(ocrPages, pageNum);
    const ocrPage = getOcrPageData(ocrPages, pageNum);
    const found = resolveTracesOnPage(items, ocrLines, vp, traces, focus.value, ocrPage, pageNum);
    if (found.rects.length > 0) {
      if (matchedPages.length === 0 || pageNum === targetPage) {
        primaryPage = pageNum;
        rects = found.rects;
        highlightVia = found.via;
      }
      if (!matchedPages.includes(pageNum)) matchedPages.push(pageNum);
      if (targetPage != null && pageNum === targetPage) break;
    }
  }

  const explicitPages = traces
    .map((trace) => trace.page)
    .filter((page): page is number => page != null && page > 0);
  const pages = Array.from(new Set([...matchedPages, ...explicitPages])).sort((a, b) => a - b);

  return {
    page: targetPage ?? pages[0] ?? primaryPage,
    pages,
    rects,
    highlightVia,
    matchStatus: toMatchStatus(
      highlightVia,
      (targetPage != null && targetPage > 0) || pages.length > 0,
    ),
    textItemCount,
  };
}
