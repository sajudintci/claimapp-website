"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { apiAuthedFetch } from "@/lib/api/client";

export function UploadDropzone() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFile(acceptedFiles[0] ?? null);
    setMessage(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "image/*": [".png", ".jpg", ".jpeg"] }
  });

  const onConfirmUpload = useCallback(async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setMessage(null);

    const form = new FormData();
    form.append("document", selectedFile);
    form.append("claimNumber", `CLM-${Date.now()}`);

    try {
      await apiAuthedFetch("/claims/upload", { method: "POST", body: form });
      setMessage("Upload berhasil dan extraction job sudah dibuat.");
      setSelectedFile(null);
    } catch {
      setMessage("Upload gagal. Periksa token/login atau koneksi backend.");
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile]);

  const estimatedPages =
    !selectedFile ? "-" : selectedFile.type === "application/pdf" ? "PDF (akan dihitung saat processing)" : "1";
  const selectedExt = selectedFile?.name.split(".").pop()?.toUpperCase() ?? "FILE";

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div {...getRootProps()} className="cursor-pointer rounded-2xl border border-dashed p-5 text-center outline-none sm:p-8" aria-label="Upload claim documents">
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto mb-3 size-8 text-primary" />
        <p className="font-semibold">{isDragActive ? "Drop files here" : "Drag and drop claim files"}</p>
        <p className="text-sm text-slate-500">PDF, PNG, JPG - secure claim documents only</p>
      </div>

      {selectedFile ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Dokumen siap diupload</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Pastikan file sudah benar sebelum kirim ke pipeline OCR.
              </p>
            </div>
            <span className="rounded-md border border-primary/30 bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-dark">
              {selectedExt}
            </span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Nama File</p>
              <p className="mt-0.5 truncate text-sm font-medium text-slate-800">{selectedFile.name}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tipe</p>
              <p className="mt-0.5 text-sm font-medium text-slate-800">{selectedFile.type}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Ukuran</p>
              <p className="mt-0.5 text-sm font-medium text-slate-800">{Math.round(selectedFile.size / 1024)} KB</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Estimasi Halaman</p>
              <p className="mt-0.5 text-sm font-medium text-slate-800">{estimatedPages}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onConfirmUpload}
              disabled={!selectedFile || isUploading}
              className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : "Konfirmasi Upload"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setMessage(null);
              }}
              className="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Batal
            </button>
          </div>
        </div>
      ) : null}

      {message ? (
        <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {message}
        </p>
      ) : null}
    </section>
  );
}
