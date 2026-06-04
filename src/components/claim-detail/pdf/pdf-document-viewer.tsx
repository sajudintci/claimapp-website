"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight, Flag, Loader2 } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { PdfPageCanvas } from "@/components/claim-detail/pdf/pdf-page-canvas";
import { DocumentFocusTarget } from "@/components/claim-detail/types";
import { loadPdfDocument } from "@/lib/pdf/pdfjs-client";
import { resolveDocumentFocusHighlight } from "@/lib/pdf/pdf-focus-resolve";
import type { OcrPageLines } from "@/lib/pdf/pdf-ocr-pages";
import type { PdfFocusMatchStatus, PdfPageMeta } from "@/lib/pdf/types";
import { cn } from "@/lib/utils";

type PdfDocumentViewerProps = {
  url: string;
  zoom: number;
  documentFocus: DocumentFocusTarget | null;
  ocrPages: OcrPageLines[];
};

const PADDING = 24;
const FALLBACK_WIDTH = 720;

const MATCH_LABEL: Record<PdfFocusMatchStatus, string> = {
  matched: "Text highlighted in document",
  matched_ocr: "Highlighted from ABBYY OCR coordinates",
  page_only: "Page located — text could not be matched",
  none: "No location in document",
};

export function PdfDocumentViewer({ url, zoom, documentFocus, ocrPages }: PdfDocumentViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const scrolling = useRef<number | null>(null);

  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [pagesMeta, setPagesMeta] = useState<Record<number, PdfPageMeta>>({});
  const [visiblePages, setVisiblePages] = useState<Set<number>>(() => new Set([1]));
  const [highlightPage, setHighlightPage] = useState<number | null>(null);
  const [focusLabel, setFocusLabel] = useState<string | null>(null);
  const [matchStatus, setMatchStatus] = useState<PdfFocusMatchStatus>("none");
  const [pdfHasTextLayer, setPdfHasTextLayer] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [baseWidth, setBaseWidth] = useState(0);

  const width = containerWidth > 0 ? containerWidth : FALLBACK_WIDTH;
  const fitScale = baseWidth > 0 ? Math.max(0.35, (width - PADDING) / baseWidth) : 1;
  const scale = fitScale * (zoom / 100);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const update = () => setContainerWidth(node.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let dead = false;
    pdfRef.current = null;
    setTotalPages(0);
    setCurrentPage(1);
    setPageInput("1");
    setPagesMeta({});
    setVisiblePages(new Set([1]));
    setHighlightPage(null);
    setFocusLabel(null);
    setMatchStatus("none");
    setPdfHasTextLayer(true);
    setBaseWidth(0);
    setLoading(true);
    setError(null);
    slotRefs.current = {};

    (async () => {
      try {
        const pdf = await loadPdfDocument(url);
        if (dead) return;
        pdfRef.current = pdf;
        const p1 = await pdf.getPage(1);
        setBaseWidth(p1.getViewport({ scale: 1 }).width);
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
    };
  }, [url]);

  useEffect(() => {
    const pdf = pdfRef.current;
    if (!pdf || loading || baseWidth <= 0) return;

    let dead = false;
    (async () => {
      const next: Record<number, PdfPageMeta> = {};
      for (const n of visiblePages) {
        if (dead) return;
        const page = await pdf.getPage(n);
        const vp = page.getViewport({ scale });
        next[n] = { pageNumber: n, width: vp.width, height: vp.height };
      }
      if (!dead) setPagesMeta((p) => ({ ...p, ...next }));
    })();

    return () => {
      dead = true;
    };
  }, [visiblePages, scale, loading, baseWidth]);

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
      setHighlightPage(null);
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

      setHighlightPage(result.page);
      setFocusLabel(documentFocus.label ?? "Selected field");
      setMatchStatus(result.matchStatus);
      setPdfHasTextLayer(result.textItemCount > 0);
      goToPage(result.page);
    })();

    return () => {
      dead = true;
    };
  }, [documentFocus?.id, scale, loading, totalPages, goToPage, ocrPages]);

  return (
    <div ref={containerRef} className="flex h-full min-h-0 min-w-0 flex-col">
      {!loading && totalPages > 0 ? (
        <div className="mb-2 flex shrink-0 items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800/80">
          <div className="flex gap-1">
            <NavBtn disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}>
              <ChevronLeft className="size-4" />
            </NavBtn>
            <NavBtn disabled={currentPage >= totalPages} onClick={() => goToPage(currentPage + 1)}>
              <ChevronRight className="size-4" />
            </NavBtn>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <input
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value.replace(/\D/g, ""))}
              onBlur={() => {
                const n = Number.parseInt(pageInput, 10);
                goToPage(Number.isFinite(n) ? n : currentPage);
              }}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              className="h-7 w-10 rounded-md border border-slate-200 bg-white text-center text-xs font-semibold dark:border-slate-600 dark:bg-slate-900"
              aria-label="Page number"
            />
            <span className="text-slate-500">/ {totalPages}</span>
          </div>
        </div>
      ) : null}

      {focusLabel ? (
        <div
          className={cn(
            "mb-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
            matchStatus === "matched"
              ? "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200"
              : matchStatus === "matched_ocr"
                ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
          )}
        >
          <Flag
            className={cn(
              "size-3.5 shrink-0",
              matchStatus === "matched"
                ? "fill-sky-500 text-sky-600"
                : matchStatus === "matched_ocr"
                  ? "fill-amber-500 text-amber-600"
                  : "fill-amber-500 text-amber-600",
            )}
          />
          <span>
            <span className="font-semibold">{focusLabel}</span>
            {documentFocus?.page ? ` · page ${documentFocus.page}` : ""}
            {" · "}
            {MATCH_LABEL[matchStatus]}
            {!pdfHasTextLayer ? " · PDF has no searchable text layer" : ""}
          </span>
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scroll-smooth rounded-xl border border-slate-200/80 bg-[#525659] dark:border-slate-700"
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
            const isHighlightPage = highlightPage === pageNumber && documentFocus != null;

            return (
              <div
                key={pageNumber}
                ref={(el) => {
                  slotRefs.current[pageNumber] = el;
                }}
                data-page={pageNumber}
                className="flex items-center justify-center px-3 py-4"
              >
                {visiblePages.has(pageNumber) && meta ? (
                  <PdfPageCanvas
                    pageNumber={pageNumber}
                    meta={meta}
                    scale={scale}
                    pdfRef={pdfRef}
                    documentFocus={isHighlightPage ? documentFocus : null}
                    isHighlightPage={isHighlightPage}
                    ocrPages={ocrPages}
                  />
                ) : (
                  <div className="flex min-h-[280px] w-full max-w-3xl items-center justify-center rounded bg-white/10 text-xs text-slate-300">
                    Page {pageNumber}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function NavBtn({
  disabled,
  onClick,
  children,
}: {
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-8 items-center justify-center rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700"
    >
      {children}
    </button>
  );
}
