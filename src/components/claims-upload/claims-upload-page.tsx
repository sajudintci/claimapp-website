"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileImage,
  FileText,
  Loader2,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiAuthedFetch } from "@/lib/api/client";
import { ReportSummaryResponse } from "@/types/api";
import { cn } from "@/lib/utils";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPT = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
};

type UploadStep = "select" | "review" | "done";
type UploadResponse = {
  claim?: { id?: string; claimNumber?: string; status?: string };
  extractionJob?: { id?: string; status?: string };
};

const PIPELINE_STEPS = [
  { title: "Secure upload", desc: "Document stored in your organization workspace." },
  { title: "ABBYY OCR", desc: "Text extracted and pre-processed for quality." },
  { title: "AI structuring", desc: "Fields and line items mapped to claim schema." },
  { title: "Reviewer queue", desc: "Open the claim to validate and approve." },
];

export function ClaimsUploadPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [claimNumber, setClaimNumber] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastUploaded, setLastUploaded] = useState<{
    claimId: string;
    claimNumber: string;
  } | null>(null);

  const { data: summary, isLoading: creditsLoading } = useApiQuery(
    () => apiAuthedFetch<ReportSummaryResponse>("/reports/summary"),
    [],
  );

  const credit = summary?.creditUsage ?? {
    remainingCredits: 0,
    usedThisMonth: 0,
    monthlyQuota: 0,
  };
  const remaining = Number(credit.remainingCredits ?? 0);

  const step: UploadStep = lastUploaded ? "done" : selectedFile ? "review" : "select";

  const onDrop = useCallback((accepted: File[], rejected: FileRejection[]) => {
    setUploadError(null);
    setLastUploaded(null);
    if (rejected.length > 0) {
      const tooLarge = rejected.some((r) =>
        r.errors.some((e) => e.code === "file-too-large"),
      );
      setUploadError(
        tooLarge
          ? "File exceeds the 10 MB limit. Please compress or split the document."
          : "Unsupported file type. Use PDF, PNG, or JPEG.",
      );
      return;
    }
    const file = accepted[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setUploadError("File exceeds the 10 MB limit.");
      return;
    }
    setSelectedFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxFiles: 1,
    maxSize: MAX_FILE_BYTES,
    disabled: isUploading || step === "done",
  });

  const fileMeta = useMemo(() => {
    if (!selectedFile) return null;
    const ext = selectedFile.name.split(".").pop()?.toUpperCase() ?? "FILE";
    const isPdf = selectedFile.type === "application/pdf";
    return {
      ext,
      isPdf,
      sizeLabel: formatBytes(selectedFile.size),
      pageHint: isPdf
        ? "Page count detected during OCR (1 page = 1 credit)"
        : "Single image counts as 1 page / 1 credit",
      Icon: isPdf ? FileText : FileImage,
    };
  }, [selectedFile]);

  const onConfirmUpload = useCallback(async () => {
    if (!selectedFile) return;
    if (remaining < 1) {
      setUploadError(
        "Insufficient OCR credits. Contact your administrator or wait for quota reset.",
      );
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const form = new FormData();
    form.append("document", selectedFile);
    form.append(
      "claimNumber",
      claimNumber.trim() || `CLM-${Date.now()}`,
    );

    try {
      const data = await apiAuthedFetch<UploadResponse>("/claims/upload", {
        method: "POST",
        body: form,
      });
      const claimId = data?.claim?.id;
      const number = data?.claim?.claimNumber ?? claimNumber.trim() ?? "Claim";

      if (!claimId) {
        throw new Error("Upload succeeded but no claim ID was returned.");
      }

      setLastUploaded({ claimId, claimNumber: number });
      setSelectedFile(null);
      toast.success("Claim uploaded", {
        description: "Extraction has been queued. You can track progress on the claim page.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      const friendly =
        msg.includes("INSUFFICIENT") || msg.toLowerCase().includes("ocr credit")
          ? "Insufficient OCR credits. Each successful extraction uses 1 credit per page."
          : msg.includes("401") || msg.toLowerCase().includes("session")
            ? "Your session expired. Please sign in again."
            : msg;
      setUploadError(friendly);
      toast.error("Upload failed", { description: friendly });
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, claimNumber, remaining]);

  function resetFlow() {
    setSelectedFile(null);
    setUploadError(null);
    setLastUploaded(null);
    setClaimNumber("");
  }

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <nav className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Link href="/claims" className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100">
              <ArrowLeft className="size-3.5" />
              Claims
            </Link>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">Upload</span>
          </nav>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Upload claim document
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Add a hospital invoice or supporting document. We will run OCR and AI extraction
            automatically—review structured fields when processing completes.
          </p>
        </div>
        <Link
          href="/claims"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          View all claims
          <ArrowRight className="size-4" />
        </Link>
      </header>

      <UploadSteps current={step} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {step === "done" && lastUploaded ? (
            <SuccessPanel
              claimId={lastUploaded.claimId}
              claimNumber={lastUploaded.claimNumber}
              onUploadAnother={resetFlow}
              onOpenClaim={() => router.push(`/claims/${lastUploaded.claimId}`)}
            />
          ) : (
            <>
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Claim reference (optional)
                  </span>
                  <input
                    type="text"
                    value={claimNumber}
                    onChange={(e) => setClaimNumber(e.target.value)}
                    placeholder="e.g. CLM-2026-0042 or hospital invoice number"
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                    disabled={isUploading}
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Leave blank to auto-generate a reference number.
                  </p>
                </label>

                <div
                  {...getRootProps()}
                  className={cn(
                    "mt-5 cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all outline-none sm:py-12",
                    isDragActive && !isDragReject && "border-blue-400 bg-blue-50/80 dark:border-blue-600 dark:bg-blue-950/40",
                    isDragReject && "border-red-300 bg-red-50/50 dark:border-red-700 dark:bg-red-950/40",
                    !isDragActive &&
                      !isDragReject &&
                      "border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/30 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-blue-600 dark:hover:bg-blue-950/30",
                    isUploading && "pointer-events-none opacity-60",
                  )}
                >
                  <input {...getInputProps()} />
                  <div
                    className={cn(
                      "mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl",
                      isDragActive ? "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" : "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-blue-400 dark:ring-slate-700",
                    )}
                  >
                    <UploadCloud className="size-7" />
                  </div>
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {isDragActive
                      ? "Release to attach your document"
                      : "Drag & drop your claim document"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    or <span className="font-semibold text-blue-600 dark:text-blue-400">browse files</span> on
                    your computer
                  </p>
                  <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                    PDF, PNG, JPEG · max 10 MB · 1 OCR credit per page after successful
                    extraction
                  </p>
                </div>

                {uploadError ? (
                  <Alert variant="error" message={uploadError} className="mt-4" />
                ) : null}

                {selectedFile && fileMeta ? (
                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                    <div className="flex items-start gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-blue-400 dark:ring-slate-700">
                        <fileMeta.Icon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {selectedFile.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {fileMeta.ext} · {fileMeta.sizeLabel} · {fileMeta.pageHint}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setUploadError(null);
                        }}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                        disabled={isUploading}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={onConfirmUpload}
                        disabled={isUploading || remaining < 1}
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Uploading…
                          </>
                        ) : (
                          <>
                            <Sparkles className="size-4" />
                            Start extraction
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        disabled={isUploading}
                        className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Choose another file
                      </button>
                    </div>
                    {remaining < 1 ? (
                      <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                        No OCR credits remaining. Upload is disabled until credits are
                        replenished.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </section>

              <section className="rounded-2xl border border-slate-200/80 bg-slate-50/50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="flex gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-slate-500 dark:text-slate-400" />
                  <p>
                    Documents are processed within your organization tenant. Only authorized
                    reviewers can access uploaded files and extraction results.
                  </p>
                </div>
              </section>
            </>
          )}
        </div>

        <aside className="space-y-4">
          <CreditsCard
            remaining={remaining}
            usedThisMonth={Number(credit.usedThisMonth ?? 0)}
            monthlyQuota={Number(credit.monthlyQuota ?? 0)}
            isLoading={creditsLoading}
          />
          <GuidelinesCard />
          <PipelineCard />
        </aside>
      </div>
    </div>
  );
}

function UploadSteps({ current }: { current: UploadStep }) {
  const steps: { id: UploadStep; label: string }[] = [
    { id: "select", label: "Select file" },
    { id: "review", label: "Review & confirm" },
    { id: "done", label: "Queued" },
  ];
  const index = steps.findIndex((s) => s.id === current);

  return (
    <ol className="flex flex-wrap items-center gap-2 sm:gap-0">
      {steps.map((step, i) => {
        const done = i < index;
        const active = i === index;
        return (
          <li key={step.id} className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
                done && "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
                active && "bg-blue-50 text-blue-800 ring-1 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-800",
                !done && !active && "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[10px]",
                  done && "bg-emerald-600 text-white",
                  active && "bg-blue-600 text-white",
                  !done && !active && "bg-slate-300 text-white dark:bg-slate-600",
                )}
              >
                {done ? <CheckCircle2 className="size-3" /> : i + 1}
              </span>
              {step.label}
            </div>
            {i < steps.length - 1 ? (
              <ChevronDivider className="mx-1 hidden text-slate-300 dark:text-slate-600 sm:mx-2 sm:block" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function ChevronDivider({ className }: { className?: string }) {
  return (
    <svg className={cn("size-4", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SuccessPanel({
  claimId,
  claimNumber,
  onUploadAnother,
  onOpenClaim,
}: {
  claimId: string;
  claimNumber: string;
  onUploadAnother: () => void;
  onOpenClaim: () => void;
}) {
  return (
    <section className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-6 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/40 sm:p-8">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-400">
        <CheckCircle2 className="size-6" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-emerald-950 dark:text-emerald-300">Document uploaded successfully</h2>
      <p className="mt-2 text-sm text-emerald-900/85 dark:text-emerald-300/85">
        <span className="font-semibold">{claimNumber}</span> is now in the extraction queue.
        OCR credits will be applied when processing completes successfully (1 credit per page).
      </p>
      <p className="mt-1 font-mono text-xs text-emerald-800/70 dark:text-emerald-400/70">ID: {claimId}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onOpenClaim}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Open claim workspace
          <ArrowRight className="size-4" />
        </button>
        <button
          type="button"
          onClick={onUploadAnother}
          className="inline-flex h-10 items-center rounded-xl border border-emerald-300 bg-white px-4 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
        >
          Upload another
        </button>
        <Link
          href="/claims"
          className="inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold text-emerald-800 hover:underline dark:text-emerald-400"
        >
          Back to claims list
        </Link>
      </div>
    </section>
  );
}

function CreditsCard({
  remaining,
  usedThisMonth,
  monthlyQuota,
  isLoading,
}: {
  remaining: number;
  usedThisMonth: number;
  monthlyQuota: number;
  isLoading: boolean;
}) {
  const low = remaining < Math.max(10, monthlyQuota * 0.05);

  if (isLoading) {
    return <div className="h-36 animate-pulse rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30" />;
  }

  return (
    <section
      className={cn(
        "rounded-2xl border p-4 shadow-sm",
        low ? "border-amber-200/80 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/40" : "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-emerald-950/40",
      )}
    >
      <div className="flex items-center gap-2">
        <Wallet className={cn("size-4", low ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400")} />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-800 dark:text-slate-200">
          OCR credits
        </h2>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
        {remaining.toLocaleString()}
        <span className="ml-1 text-sm font-medium text-slate-500 dark:text-slate-400">remaining</span>
      </p>
      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
        {usedThisMonth.toLocaleString()} used of {monthlyQuota.toLocaleString()} this month
      </p>
      {low ? (
        <p className="mt-2 flex items-start gap-1.5 text-xs font-medium text-amber-900 dark:text-amber-300">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          Low balance — uploads may fail if credits run out during extraction.
        </p>
      ) : null}
    </section>
  );
}

function GuidelinesCard() {
  const items = [
    "Use clear scans or native PDFs (not password-protected).",
    "One claim per upload; bundle multi-page invoices in a single PDF.",
    "Ensure patient name and totals are readable for best extraction quality.",
  ];

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Document guidelines</h2>
      <ul className="mt-3 space-y-2">
        {items.map((text) => (
          <li key={text} className="flex gap-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}

function PipelineCard() {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">What happens next</h2>
      <ol className="mt-3 space-y-3">
        {PIPELINE_STEPS.map((item, i) => (
          <li key={item.title} className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {i + 1}
            </span>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{item.title}</p>
              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{item.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Alert({
  variant,
  message,
  className,
}: {
  variant: "error";
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-2 rounded-xl border px-3 py-2.5 text-sm",
        variant === "error" && "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300",
        className,
      )}
      role="alert"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
