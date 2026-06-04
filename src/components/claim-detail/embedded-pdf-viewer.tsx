"use client";

import { PdfDocumentViewer } from "@/components/claim-detail/pdf/pdf-document-viewer";
import { DocumentFocusTarget } from "@/components/claim-detail/types";
import type { OcrPageLines } from "@/lib/pdf/pdf-ocr-pages";

type EmbeddedPdfViewerProps = {
  url: string;
  zoom: number;
  documentFocus: DocumentFocusTarget | null;
  ocrPages: OcrPageLines[];
};

/** Enterprise PDF viewer: PDF.js canvas + PDF/OCR text highlights. */
export function EmbeddedPdfViewer(props: EmbeddedPdfViewerProps) {
  return <PdfDocumentViewer {...props} />;
}
