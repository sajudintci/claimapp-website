export type HighlightRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type PdfPageMeta = {
  pageNumber: number;
  width: number;
  height: number;
};

export type PdfFocusMatchStatus = "matched" | "matched_ocr" | "page_only" | "none";
