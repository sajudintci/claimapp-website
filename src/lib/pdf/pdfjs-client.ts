import type { PDFDocumentProxy } from "pdfjs-dist";

let workerReady = false;

async function ensureWorker() {
  if (workerReady) return;
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  workerReady = true;
}

export async function loadPdfDocument(url: string): Promise<PDFDocumentProxy> {
  await ensureWorker();
  const pdfjs = await import("pdfjs-dist");
  return pdfjs.getDocument(url).promise;
}

/** Expected when a page render is cancelled (scroll, zoom, unmount). */
export function isPdfRenderCancelled(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  return (error as { name?: string }).name === "RenderingCancelledException";
}

export function swallowRenderCancel(promise: Promise<unknown>): void {
  void promise.catch((error) => {
    if (!isPdfRenderCancelled(error)) {
      console.error(error);
    }
  });
}
