"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Flag,
  Loader2,
  Maximize2,
  Minimize2,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { PdfPageCanvas } from "@/components/claim-detail/pdf/pdf-page-canvas";
import { PdfPageThumbnail } from "@/components/claim-detail/pdf/pdf-page-thumbnail";
import { DocumentFocusTarget } from "@/components/claim-detail/types";
import { focusAppliesToPage } from "@/lib/extraction/document-focus";
import { loadPdfDocument } from "@/lib/pdf/pdfjs-client";
import { resolveDocumentFocusHighlight } from "@/lib/pdf/pdf-focus-resolve";
import type { OcrPageLines } from "@/lib/pdf/pdf-ocr-pages";
import type { PdfFocusMatchStatus, PdfPageMeta } from "@/lib/pdf/types";
import { cn } from "@/lib/utils";

type PdfDocumentViewerProps = {
  url: string;
  documentFocus: DocumentFocusTarget | null;
  ocrPages: OcrPageLines[];
  onDownload?: () => void;
  onOpenInNewTab?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
};

const PADDING = 32;
const FALLBACK_WIDTH = 720;
const MIN_ZOOM = 50;
const MAX_ZOOM = 200;
const ZOOM_STEP = 10;

const MATCH_LABEL: Record<PdfFocusMatchStatus, string> = {
  matched: "Text highlighted in document",
  matched_ocr: "Highlighted from ABBYY OCR coordinates",
  page_only: "Page located — text could not be matched",
  none: "No location in document",
};

export function PdfDocumentViewer({
  url,
  documentFocus,
  ocrPages,
  onDownload,
  onOpenInNewTab,
  onToggleFullscreen,
  isFullscreen = false,
}: PdfDocumentViewerProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const scrolling = useRef<number | null>(null);

  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [pagesMeta, setPagesMeta] = useState<Record<number, PdfPageMeta>>({});
  const [visiblePages, setVisiblePages] = useState<Set<number>>(() => new Set([1]));
  const [highlightPages, setHighlightPages] = useState<number[]>([]);
  const [focusLabel, setFocusLabel] = useState<string | null>(null);
  const [matchStatus, setMatchStatus] = useState<PdfFocusMatchStatus>("none");
  const [pdfHasTextLayer, setPdfHasTextLayer] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [baseWidth, setBaseWidth] = useState(0);

  const width = viewportWidth > 0 ? viewportWidth : FALLBACK_WIDTH;
  const fitScale =
    baseWidth > 0 ? Math.max(0.35, (width - PADDING) / baseWidth) : 1;
  const scale = fitScale * (zoom / 100);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const update = () => setViewportWidth(node.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let dead = false;
    pdfRef.current = null;
    setPdfDoc(null);
    setTotalPages(0);
    setCurrentPage(1);
    setPageInput("1");
    setPagesMeta({});
    setVisiblePages(new Set([1]));
    setHighlightPages([]);
    setFocusLabel(null);
    setMatchStatus("none");
    setPdfHasTextLayer(true);
    setBaseWidth(0);
    setLoading(true);
    setError(null);
    setZoom(100);
    setRotation(0);
    slotRefs.current = {};

    (async () => {
      try {
        const pdf = await loadPdfDocument(url);
        if (dead) return;
        pdfRef.current = pdf;
        setPdfDoc(pdf);
        const p1 = await pdf.getPage(1);
        setBaseWidth(p1.getViewport({ scale: 1, rotation: 0 }).width);
        setTotalPages(pdf.numPages);
      } catch (e) {
        if (!dead) setError(e instanceof Error ? e.message : "Failed to load PDF");
      } finally {
        if (!dead) setLoading(false);
      }
    })();

    return () => {
      dead = true;
      pdfRef.current = null;
      setPdfDoc(null);
    };
  }, [url]);

  useEffect(() => {
    const pdf = pdfRef.current;
    if (!pdf || loading) return;

    let dead = false;
    (async () => {
      const p1 = await pdf.getPage(1);
      if (!dead) setBaseWidth(p1.getViewport({ scale: 1, rotation }).width);
    })();

    return () => {
      dead = true;
    };
  }, [rotation, loading]);

  useEffect(() => {
    const pdf = pdfRef.current;
    if (!pdf || loading || baseWidth <= 0) return;

    let dead = false;
    (async () => {
      const next: Record<number, PdfPageMeta> = {};
      for (const n of visiblePages) {
        if (dead) return;
        const page = await pdf.getPage(n);
        const vp = page.getViewport({ scale, rotation });
        next[n] = { pageNumber: n, width: vp.width, height: vp.height };
      }
      if (!dead) setPagesMeta((p) => ({ ...p, ...next }));
    })();

    return () => {
      dead = true;
    };
  }, [visiblePages, scale, rotation, loading, baseWidth]);

  useLayoutEffect(() => {
    const root = scrollRef.current;
    if (!root || loading || totalPages === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (scrolling.current != null) return;

        let best = 1;
        let ratio = 0;
        const vis = new Set<number>();

        for (const e of entries) {
          const n = Number((e.target as HTMLElement).dataset.page);
          if (!n || !e.isIntersecting) continue;
          vis.add(n);
          if (e.intersectionRatio > ratio) {
            ratio = e.intersectionRatio;
            best = n;
          }
        }

        if (vis.size) {
          setVisiblePages((prev) => {
            const m = new Set(prev);
            vis.forEach((p) => {
              m.add(p);
              if (p > 1) m.add(p - 1);
              if (p < totalPages) m.add(p + 1);
            });
            return m;
          });
        }

        if (ratio >= 0.35) {
          setCurrentPage(best);
          setPageInput(String(best));
        }
      },
      { root, threshold: [0.35, 0.55] },
    );

    for (let i = 1; i <= totalPages; i++) {
      const el = slotRefs.current[i];
      if (el) io.observe(el);
    }

    return () => io.disconnect();
  }, [loading, totalPages]);

  const goToPage = useCallback(
    (page: number, behavior: ScrollBehavior = "smooth") => {
      const n = Math.min(Math.max(page, 1), totalPages);
      scrolling.current = n;
      setCurrentPage(n);
      setPageInput(String(n));
      setVisiblePages((prev) => {
        const m = new Set(prev);
        m.add(n);
        if (n > 1) m.add(n - 1);
        if (n < totalPages) m.add(n + 1);
        return m;
      });
      requestAnimationFrame(() => {
        slotRefs.current[n]?.scrollIntoView({ behavior, block: "start" });
        setTimeout(() => {
          scrolling.current = null;
        }, behavior === "smooth" ? 450 : 0);
      });
    },
    [totalPages],
  );

  useEffect(() => {
    const pdf = pdfRef.current;
    if (!pdf || loading || totalPages === 0) return;

    if (!documentFocus) {
      setHighlightPages([]);
      setFocusLabel(null);
      setMatchStatus("none");
      return;
    }

    let dead = false;
    (async () => {
      const result = await resolveDocumentFocusHighlight(
        pdf,
        documentFocus,
        scale,
        totalPages,
        ocrPages,
      );
      if (dead) return;

      setHighlightPages(result.pages);
      setFocusLabel(documentFocus.label ?? "Selected field");
      setMatchStatus(result.matchStatus);
      setPdfHasTextLayer(result.textItemCount > 0);
      goToPage(result.page);
    })();

    return () => {
      dead = true;
    };
  }, [documentFocus?.id, scale, loading, totalPages, goToPage, ocrPages]);

  function rotateClockwise() {
    setRotation((r) => (r + 90) % 360);
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Claim Document</h2>

        <div className="flex flex-wrap items-center gap-1">
          {!loading && totalPages > 0 ? (
            <>
              <ToolbarGroup>
                <ToolbarButton
                  label="Previous page"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="size-4" />
                </ToolbarButton>
                <div className="flex items-center gap-1 px-1 text-xs text-slate-600 dark:text-slate-400">
                  <input
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value.replace(/\D/g, ""))}
                    onBlur={() => {
                      const n = Number.parseInt(pageInput, 10);
                      goToPage(Number.isFinite(n) ? n : currentPage, "auto");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                    className="h-7 w-9 rounded-md border border-slate-200 bg-white text-center text-xs font-semibold text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    aria-label="Page number"
                  />
                  <span className="tabular-nums">/ {totalPages}</span>
                </div>
                <ToolbarButton
                  label="Next page"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="size-4" />
                </ToolbarButton>
              </ToolbarGroup>

              <ToolbarDivider />
            </>
          ) : null}

          <ToolbarGroup>
            <ToolbarButton
              label="Zoom out"
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
              disabled={loading}
            >
              <ZoomOut className="size-4" />
            </ToolbarButton>
            <span className="min-w-[3rem] select-none text-center text-xs font-medium tabular-nums text-slate-600 dark:text-slate-400">
              {zoom}%
            </span>
            <ToolbarButton
              label="Zoom in"
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
              disabled={loading}
            >
              <ZoomIn className="size-4" />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarDivider />

          <ToolbarGroup>
            <ToolbarButton label="Rotate clockwise" onClick={rotateClockwise} disabled={loading}>
              <RotateCw className="size-4" />
            </ToolbarButton>
            {onOpenInNewTab ? (
              <ToolbarButton label="Open in new tab" onClick={onOpenInNewTab}>
                <ExternalLink className="size-4" />
              </ToolbarButton>
            ) : null}
            {onDownload ? (
              <ToolbarButton label="Download" onClick={onDownload}>
                <Download className="size-4" />
              </ToolbarButton>
            ) : null}
            {onToggleFullscreen ? (
              <ToolbarButton
                label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                onClick={onToggleFullscreen}
              >
                {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </ToolbarButton>
            ) : null}
          </ToolbarGroup>
        </div>
      </div>

      {focusLabel ? (
        <div
          className={cn(
            "shrink-0 flex items-center gap-2 border-b px-4 py-2 text-xs",
            matchStatus === "matched"
              ? "border-sky-100 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200"
              : "border-amber-100 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
          )}
        >
          <Flag className="size-3.5 shrink-0" />
          <span>
            <span className="font-semibold">{focusLabel}</span>
            {highlightPages.length > 0
              ? ` · page${highlightPages.length > 1 ? "s" : ""} ${highlightPages.join(", ")}`
              : documentFocus?.page
                ? ` · page ${documentFocus.page}`
                : ""}
            {" · "}
            {MATCH_LABEL[matchStatus]}
          </span>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        {!loading && totalPages > 0 ? (
          <aside className="hidden w-[7.5rem] shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-slate-100/90 p-2 dark:border-slate-800 dark:bg-slate-900/80 sm:flex">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
              <PdfPageThumbnail
                key={pageNumber}
                pageNumber={pageNumber}
                pdf={pdfDoc}
                rotation={rotation}
                isActive={currentPage === pageNumber}
                onSelect={(page) => goToPage(page)}
              />
            ))}
          </aside>
        ) : null}

        <div ref={viewportRef} className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto overflow-x-auto scroll-smooth bg-[#525659]"
          >
            {loading ? (
              <div className="flex min-h-[420px] items-center justify-center gap-2 text-slate-200">
                <Loader2 className="size-5 animate-spin" aria-hidden />
                Loading PDF…
              </div>
            ) : error ? (
              <div className="flex min-h-[420px] items-center justify-center px-4 text-center text-red-300">
                {error}
              </div>
            ) : (
              Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
                const meta = pagesMeta[pageNumber];
                const isHighlightPage =
                  documentFocus != null && focusAppliesToPage(documentFocus, pageNumber);

                return (
                  <div
                    key={pageNumber}
                    ref={(el) => {
                      slotRefs.current[pageNumber] = el;
                    }}
                    data-page={pageNumber}
                    className="flex items-center justify-center px-4 py-6"
                  >
                    {visiblePages.has(pageNumber) && meta ? (
                      <PdfPageCanvas
                        pageNumber={pageNumber}
                        meta={meta}
                        scale={scale}
                        rotation={rotation}
                        pdfRef={pdfRef}
                        documentFocus={documentFocus}
                        shouldHighlight={isHighlightPage}
                        ocrPages={ocrPages}
                      />
                    ) : (
                      <div
                        className="flex items-center justify-center rounded bg-white/10 text-xs text-slate-300"
                        style={{ width: meta?.width ?? 280, height: meta?.height ?? 360 }}
                      >
                        Page {pageNumber}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 dark:border-slate-700 dark:bg-slate-800/60">
      {children}
    </div>
  );
}

function ToolbarDivider() {
  return <span className="mx-0.5 hidden h-6 w-px bg-slate-200 sm:block dark:bg-slate-700" />;
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
      className="inline-flex size-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-white disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700"
    >
      {children}
    </button>
  );
}
