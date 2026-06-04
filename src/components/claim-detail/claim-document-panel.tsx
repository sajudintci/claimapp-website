"use client";

import { useEffect, useRef, useState } from "react";
import {
  Download,
  ExternalLink,
  Loader2,
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { ClaimDocument, DocumentFocusTarget } from "@/components/claim-detail/types";
import { EmbeddedPdfViewer } from "@/components/claim-detail/embedded-pdf-viewer";
import type { OcrPageLines } from "@/lib/pdf/pdf-ocr-pages";
import { cn } from "@/lib/utils";

type ClaimDocumentPanelProps = {
  selectedDocument: ClaimDocument | undefined;
  previewUrl: string | null;
  isPreviewLoading: boolean;
  previewError: string | null;
  documentFocus: DocumentFocusTarget | null;
  ocrPages: OcrPageLines[];
};

export function ClaimDocumentPanel({
  selectedDocument,
  previewUrl,
  isPreviewLoading,
  previewError,
  documentFocus,
  ocrPages,
}: ClaimDocumentPanelProps) {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === panelRef.current);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  async function toggleFullscreen() {
    if (!panelRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await panelRef.current.requestFullscreen();
  }

  function openInNewTab() {
    if (!previewUrl) return;
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  }

  function downloadPreview() {
    if (!previewUrl || !selectedDocument) return;
    const anchor = document.createElement("a");
    anchor.href = previewUrl;
    anchor.download = selectedDocument.originalName;
    anchor.click();
  }

  const isPdf = selectedDocument?.mimeType === "application/pdf";

  return (
    <section
      ref={panelRef}
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",
        isFullscreen ? "min-h-screen rounded-none border-0" : "max-h-[min(78vh,820px)]",
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Source document</h2>
        <div className="flex items-center gap-1">
          <ToolbarButton label="Zoom out" onClick={() => setZoom((z) => Math.max(50, z - 10))}>
            <ZoomOut className="size-4" />
          </ToolbarButton>
          <span className="min-w-[3.25rem] text-center text-xs font-medium text-slate-600 dark:text-slate-400">
            {zoom}%
          </span>
          <ToolbarButton label="Zoom in" onClick={() => setZoom((z) => Math.min(200, z + 10))}>
            <ZoomIn className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Reset zoom" onClick={() => setZoom(100)}>
            <RotateCcw className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Open in new tab" onClick={openInNewTab} disabled={!previewUrl}>
            <ExternalLink className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Download" onClick={downloadPreview} disabled={!previewUrl}>
            <Download className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Fullscreen" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </ToolbarButton>
        </div>
      </div>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col p-3 pt-0",
          !isFullscreen && "h-[min(68vh,640px)] min-h-[360px]",
        )}
      >
        {isPreviewLoading ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="size-5 animate-spin" />
            Loading preview…
          </div>
        ) : previewError ? (
          <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-red-600 dark:text-red-400">
            {previewError}
          </div>
        ) : !previewUrl ? (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            No document attached.
          </div>
        ) : isPdf ? (
          <EmbeddedPdfViewer
            url={previewUrl}
            zoom={zoom}
            documentFocus={documentFocus}
            ocrPages={ocrPages}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center overflow-auto rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <img
              src={previewUrl}
              alt={selectedDocument?.originalName ?? "Document preview"}
              className="max-h-full w-auto rounded"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center" }}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function ToolbarButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex size-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
    >
      {children}
    </button>
  );
}
