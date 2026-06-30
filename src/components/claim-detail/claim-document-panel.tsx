"use client";

import { useEffect, useRef, useState } from "react";
import {
  Download,
  ExternalLink,
  Loader2,
  Maximize2,
  Minimize2,
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
  const [imageZoom, setImageZoom] = useState(100);
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
        "flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",
        isFullscreen ? "min-h-screen rounded-none border-0" : "max-h-[min(78vh,820px)]",
      )}
    >
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          !isFullscreen && "h-[min(68vh,640px)] min-h-[300px]",
        )}
      >
        {isPreviewLoading ? (
          <div className="flex flex-1 flex-col">
            <PanelHeader title="Claim Document" />
            <div className="flex flex-1 items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="size-5 animate-spin" />
              Loading preview…
            </div>
          </div>
        ) : previewError ? (
          <div className="flex flex-1 flex-col">
            <PanelHeader title="Claim Document" />
            <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-red-600 dark:text-red-400">
              {previewError}
            </div>
          </div>
        ) : !previewUrl ? (
          <div className="flex flex-1 flex-col">
            <PanelHeader title="Claim Document" />
            <div className="flex flex-1 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
              No document attached.
            </div>
          </div>
        ) : isPdf ? (
          <EmbeddedPdfViewer
            url={previewUrl}
            documentFocus={documentFocus}
            ocrPages={ocrPages}
            onDownload={downloadPreview}
            onOpenInNewTab={openInNewTab}
            onToggleFullscreen={toggleFullscreen}
            isFullscreen={isFullscreen}
          />
        ) : (
          <ImageDocumentViewer
            previewUrl={previewUrl}
            fileName={selectedDocument?.originalName ?? "Document preview"}
            zoom={imageZoom}
            onZoomOut={() => setImageZoom((z) => Math.max(50, z - 10))}
            onZoomIn={() => setImageZoom((z) => Math.min(200, z + 10))}
            onDownload={downloadPreview}
            onOpenInNewTab={openInNewTab}
            onToggleFullscreen={toggleFullscreen}
            isFullscreen={isFullscreen}
          />
        )}
      </div>
    </section>
  );
}

function PanelHeader({ title }: { title: string }) {
  return (
    <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
    </div>
  );
}

function ImageDocumentViewer({
  previewUrl,
  fileName,
  zoom,
  onZoomOut,
  onZoomIn,
  onDownload,
  onOpenInNewTab,
  onToggleFullscreen,
  isFullscreen,
}: {
  previewUrl: string;
  fileName: string;
  zoom: number;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onDownload: () => void;
  onOpenInNewTab: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Claim Document</h2>
        <div className="flex items-center gap-1">
          <ImageToolbarButton label="Zoom out" onClick={onZoomOut}>
            <ZoomOut className="size-4" />
          </ImageToolbarButton>
          <span className="min-w-[3rem] text-center text-xs font-medium tabular-nums text-slate-600 dark:text-slate-400">
            {zoom}%
          </span>
          <ImageToolbarButton label="Zoom in" onClick={onZoomIn}>
            <ZoomIn className="size-4" />
          </ImageToolbarButton>
          <ImageToolbarButton label="Open in new tab" onClick={onOpenInNewTab}>
            <ExternalLink className="size-4" />
          </ImageToolbarButton>
          <ImageToolbarButton label="Download" onClick={onDownload}>
            <Download className="size-4" />
          </ImageToolbarButton>
          <ImageToolbarButton
            label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            onClick={onToggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </ImageToolbarButton>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[#525659] p-4">
        <img
          src={previewUrl}
          alt={fileName}
          className="max-h-full w-auto rounded shadow-lg ring-1 ring-black/10"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center" }}
        />
      </div>
    </div>
  );
}

function ImageToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex size-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
    >
      {children}
    </button>
  );
}
