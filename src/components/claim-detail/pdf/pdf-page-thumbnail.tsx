"use client";

import { useEffect, useRef } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { isPdfRenderCancelled, swallowRenderCancel } from "@/lib/pdf/pdfjs-client";
import { cn } from "@/lib/utils";

const THUMBNAIL_WIDTH = 96;

type PdfPageThumbnailProps = {
  pageNumber: number;
  pdf: PDFDocumentProxy | null;
  rotation: number;
  isActive: boolean;
  onSelect: (page: number) => void;
};

export function PdfPageThumbnail({
  pageNumber,
  pdf,
  rotation,
  isActive,
  onSelect,
}: PdfPageThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!pdf || !canvas) return;

    let dead = false;
    let task: { cancel: () => void; promise: Promise<void> } | null = null;

    (async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        if (dead) return;

        const unscaled = page.getViewport({ scale: 1, rotation });
        const scale = THUMBNAIL_WIDTH / unscaled.width;
        const viewport = page.getViewport({ scale, rotation });
        const ctx = canvas.getContext("2d");
        if (!ctx || dead) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        task = page.render({
          canvasContext: ctx,
          viewport,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
        });
        await task.promise;
      } catch (error) {
        if (!dead && !isPdfRenderCancelled(error)) {
          /* thumbnail render failure is non-fatal */
        }
      }
    })();

    return () => {
      dead = true;
      if (task) {
        task.cancel();
        swallowRenderCancel(task.promise);
      }
    };
  }, [pageNumber, pdf, rotation]);

  return (
    <button
      type="button"
      onClick={() => onSelect(pageNumber)}
      className={cn(
        "group flex w-full flex-col items-center gap-1 rounded-lg p-1.5 transition-colors",
        isActive
          ? "bg-slate-200/80 ring-2 ring-slate-900 dark:bg-slate-700 dark:ring-slate-100"
          : "hover:bg-slate-200/50 dark:hover:bg-slate-800",
      )}
      aria-label={`Page ${pageNumber}`}
      aria-current={isActive ? "page" : undefined}
    >
      <span
        className={cn(
          "overflow-hidden rounded border bg-white shadow-sm",
          isActive
            ? "border-slate-900 dark:border-slate-100"
            : "border-slate-300 group-hover:border-slate-400 dark:border-slate-600",
        )}
      >
        <canvas ref={canvasRef} className="block max-w-full" />
      </span>
      <span
        className={cn(
          "text-[10px] font-semibold tabular-nums",
          isActive ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400",
        )}
      >
        {pageNumber}
      </span>
    </button>
  );
}
