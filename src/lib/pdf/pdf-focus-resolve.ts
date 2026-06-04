import type { PDFDocumentProxy } from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import type { PageViewport } from "pdfjs-dist/types/src/display/display_utils";
import { DocumentFocusTarget } from "@/components/claim-detail/types";
import { findOcrLineHighlight } from "@/lib/pdf/pdf-ocr-highlight";
import type { OcrPageLines } from "@/lib/pdf/pdf-ocr-pages";
import { getOcrPageLines } from "@/lib/pdf/pdf-ocr-pages";
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
  highlightVia: "pdf" | "ocr" | "none";
};

export function resolvePageHighlights(
  items: TextItem[],
  ocrLines: string[],
  viewport: PageViewport,
  focus: DocumentFocusTarget,
): { rects: HighlightRect[]; via: "pdf" | "ocr" | "none" } {
  const pdfRects = findHighlightRects(items, viewport, focus.sourceText, focus.value);
  if (pdfRects.length > 0) return { rects: pdfRects, via: "pdf" };

  const ocrRects = findOcrLineHighlight(ocrLines, viewport, focus.sourceText, focus.value);
  if (ocrRects.length > 0) return { rects: ocrRects, via: "ocr" };

  return { rects: [], via: "none" };
}

function toMatchStatus(
  via: "pdf" | "ocr" | "none",
  hasPage: boolean,
): PdfFocusMatchStatus {
  if (via === "pdf") return "matched";
  if (via === "ocr") return "matched_ocr";
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
  let highlightVia: "pdf" | "ocr" | "none" = "none";
  let textItemCount = 0;

  for (const pageNum of searchPages) {
    const pdfPage = await pdf.getPage(pageNum);
    const vp = pdfPage.getViewport({ scale });
    const content = await pdfPage.getTextContent();
    const items = content.items.filter((x): x is TextItem => "str" in x);
    textItemCount = Math.max(textItemCount, items.length);

    const ocrLines = getOcrPageLines(ocrPages, pageNum);
    const found = resolvePageHighlights(items, ocrLines, vp, focus);
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
