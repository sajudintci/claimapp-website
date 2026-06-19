"use client";

import { PdfDocumentViewer } from "@/components/claim-detail/pdf/pdf-document-viewer";
import { DocumentFocusTarget } from "@/components/claim-detail/types";
import type { OcrPageLines } from "@/lib/pdf/pdf-ocr-pages";

type EmbeddedPdfViewerProps = {
  url: string;
  documentFocus: DocumentFocusTarget | null;
  ocrPages: OcrPageLines[];
  onDownload?: () => void;
  onOpenInNewTab?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
};

/** PDF.js viewer with standard toolbar, thumbnails, and OCR/text highlights. */
export function EmbeddedPdfViewer(props: EmbeddedPdfViewerProps) {
  return <PdfDocumentViewer {...props} />;
}
