"use client";

import { useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";

export function DocumentPreview() {
  const [zoom, setZoom] = useState(100);
  return (
    <section className="rounded-2xl border bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">Document Preview</p>
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg border p-2"
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            aria-label="Zoom out"
          >
            <ZoomOut className="size-4" />
          </button>
          <span className="text-sm">{zoom}%</span>
          <button
            className="rounded-lg border p-2"
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
            aria-label="Zoom in"
          >
            <ZoomIn className="size-4" />
          </button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[80px_1fr]">
        <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:block sm:space-y-2">
          {[1, 2, 3, 4].map((p) => (
            <button key={p} className="h-16 min-w-16 rounded-lg border bg-slate-50 px-2 text-xs sm:h-20 sm:w-full">
              Page {p}
            </button>
          ))}
        </div>
        <div
          className="order-1 min-h-[340px] overflow-auto rounded-xl border bg-[linear-gradient(#fff,#f8fafc)] p-4 text-sm text-slate-600 sm:order-2 sm:min-h-[480px] sm:p-6"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}
        >
          <p className="font-semibold">Invoice #INV-99231</p>
          <p>Patient: Rani Salsabila</p>
          <p>Diagnosis: Acute bronchitis</p>
          <p className="mt-2">Mock OCR layer for insurance claim documents.</p>
        </div>
      </div>
    </section>
  );
}
