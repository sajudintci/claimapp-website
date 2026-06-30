"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import { PdfHighlightLayer } from "@/components/claim-detail/pdf/pdf-highlight-layer";
import { DocumentFocusTarget } from "@/components/claim-detail/types";
import { focusAppliesToPage, listFocusTraces } from "@/lib/extraction/document-focus";
import { isPdfRenderCancelled, swallowRenderCancel } from "@/lib/pdf/pdfjs-client";
import { resolveTracesOnPage } from "@/lib/pdf/pdf-focus-resolve";
import { getOcrPageData, getOcrPageLines, type OcrPageLines } from "@/lib/pdf/pdf-ocr-pages";
import type { HighlightRect, PdfPageMeta } from "@/lib/pdf/types";
import { cn } from "@/lib/utils";

type PdfPageCanvasProps = {
  pageNumber: number;
  meta: PdfPageMeta;
  scale: number;
  rotation?: number;
  pdfRef: RefObject<PDFDocumentProxy | null>;
  documentFocus: DocumentFocusTarget | null;
  shouldHighlight: boolean;
  ocrPages: OcrPageLines[];
};

export function PdfPageCanvas({
  pageNumber,
  meta,
  scale,
  rotation = 0,
  pdfRef,
  documentFocus,
  shouldHighlight,
  ocrPages,
}: PdfPageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [highlights, setHighlights] = useState<HighlightRect[]>([]);
  const [highlightVia, setHighlightVia] = useState<"pdf" | "ocr" | "ocr_coords" | "none">("none");

  useLayoutEffect(() => {
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !canvas) return;

    let dead = false;
    let task: Awaited<ReturnType<PDFPageProxy["render"]>> | null = null;

    (async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        if (dead) return;
        const vp = page.getViewport({ scale, rotation });
        const ctx = canvas.getContext("2d");
        if (!ctx || dead) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(vp.width * dpr);
        canvas.height = Math.floor(vp.height * dpr);
        canvas.style.width = `${vp.width}px`;
        canvas.style.height = `${vp.height}px`;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        task = page.render({
          canvasContext: ctx,
          viewport: vp,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
        });
        await task.promise;

        if (dead) return;

        if (shouldHighlight && documentFocus) {
          const content = await page.getTextContent();
          const items = content.items.filter((x): x is TextItem => "str" in x);
          const ocrLines = getOcrPageLines(ocrPages, pageNumber);
          const ocrPage = getOcrPageData(ocrPages, pageNumber);
          const resolved = resolveTracesOnPage(
            items,
            ocrLines,
            vp,
            listFocusTraces(documentFocus),
            documentFocus.value,
            ocrPage,
            pageNumber,
          );
          if (!dead) {
            setHighlights(resolved.rects);
            setHighlightVia(resolved.via);
          }
        } else if (!dead) {
          setHighlights([]);
          setHighlightVia("none");
        }
      } catch (error) {
        if (!dead && !isPdfRenderCancelled(error)) throw error;
      }
    })();

    return () => {
      dead = true;
      if (task) {
        task.cancel();
        swallowRenderCancel(task.promise);
      }
    };
  }, [pageNumber, scale, rotation, pdfRef, shouldHighlight, documentFocus?.id, documentFocus?.page, ocrPages]);

  const showHighlight = shouldHighlight && highlights.length > 0;

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden bg-white shadow-lg ring-1 ring-black/10",
        showHighlight && "ring-2 ring-sky-400/80",
      )}
      style={{ width: meta.width, height: meta.height }}
    >
      <canvas ref={canvasRef} className="block" />
      <PdfHighlightLayer
        rects={highlights}
        variant={highlightVia === "ocr" ? "ocr" : "pdf"}
      />
    </div>
  );
}
