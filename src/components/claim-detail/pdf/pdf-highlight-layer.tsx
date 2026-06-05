import type { HighlightRect } from "@/lib/pdf/types";

const HIGHLIGHT_PDF_CLASS =
  "absolute rounded-[2px] bg-[#008F88]/45 ring-1 ring-[#008F88]/80";

const HIGHLIGHT_OCR_CLASS =
  "absolute rounded-[2px] bg-[#fbbf24]/50 ring-2 ring-amber-500/90 ring-dashed";

type PdfHighlightLayerProps = {
  rects: HighlightRect[];
  variant?: "pdf" | "ocr";
};

export function PdfHighlightLayer({ rects, variant = "pdf" }: PdfHighlightLayerProps) {
  if (rects.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-hidden>
      {rects.map((r, i) => (
        <span
          key={i}
            className={variant === "ocr" ? HIGHLIGHT_OCR_CLASS : HIGHLIGHT_PDF_CLASS}
          style={{
            left: r.left,
            top: r.top,
            width: Math.max(r.width, 4),
            height: Math.max(r.height, 4),
          }}
        />
      ))}
    </div>
  );
}
