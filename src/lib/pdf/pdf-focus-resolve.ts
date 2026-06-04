import type { PDFDocumentProxy } from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import type { PageViewport } from "pdfjs-dist/types/src/display/display_utils";
import { DocumentFocusTarget } from "@/components/claim-detail/types";
import { findOcrLineHighlight, findOcrRegionHighlight } from "@/lib/pdf/pdf-ocr-highlight";
import { getOcrPageData, getOcrPageLines, type OcrPageLines } from "@/lib/pdf/pdf-ocr-pages";
import {
  buildPageSearchOrder,
  findHighlightRects,
  resolveFocusMatchStatus,
} from "@/lib/pdf/pdf-text-match";
import type { HighlightRect, PdfFocusMatchStatus } from "@/lib/pdf/types";

export type FocusResolveResult = {
  page: number;
  rects: HighlightRect[];
  matchStatus: PdfFocusMatchStatus;
  textItemCount: number;
  highlightVia: "pdf" | "ocr" | "ocr_coords" | "none";
};

export function resolvePageHighlights(
  items: TextItem[],
  ocrLines: string[],
  viewport: PageViewport,
  focus: DocumentFocusTarget,
  ocrPage?: OcrPageLines,
): { rects: HighlightRect[]; via: "pdf" | "ocr" | "ocr_coords" | "none" } {
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
  const searchPages = buildPageSearchOrder(focus.page, totalPages);
  let matchedPage = searchPages[0] ?? 1;
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
    const found = resolvePageHighlights(items, ocrLines, vp, focus, ocrPage);
    if (found.rects.length > 0) {
      matchedPage = pageNum;
      rects = found.rects;
      highlightVia = found.via;
      break;
    }
  }

  return {
    page: matchedPage,
    rects,
    highlightVia,
    matchStatus: toMatchStatus(
      highlightVia,
      focus.page != null && focus.page > 0,
    ),
    textItemCount,
  };
}
