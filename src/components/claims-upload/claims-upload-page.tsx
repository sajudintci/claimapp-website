"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { useDropzone, type FileRejection } from "react-dropzone";
import {
  AlertCircle,
  Check,
  ChevronRight,
  FileText,
  Info,
  Loader2,
<<<<<<< HEAD
  ShieldCheck,
  Sparkles,
  UploadCloud,
=======
  Upload,
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
} from "lucide-react";
import { toast } from "sonner";
import { apiAuthedFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPT = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
};

type UploadStep = "select" | "review" | "submitted";

type UploadMetadata = {
  claimReference: string;
  patientName: string;
  documentType: string[];
  priority: string;
  assignReviewer: string;
  notes: string;
};

type ReviewerOption = { id: string; name: string };

type UploadResponse = {
  claim?: { id?: string; claimNumber?: string; status?: string };
  extractionJob?: { id?: string; status?: string };
};

const DOCUMENT_TYPES = ["Inpatient Claim", "Outpatient Claim"] as const;
const PRIORITIES = ["Normal", "High", "Urgent"] as const;

type DocumentTypeOption = { value: (typeof DOCUMENT_TYPES)[number]; label: string };

const DOCUMENT_TYPE_OPTIONS: DocumentTypeOption[] = DOCUMENT_TYPES.map((type) => ({
  value: type,
  label: type,
}));

function createDefaultMetadata(): UploadMetadata {
  return {
    claimReference: "",
    patientName: "",
    documentType: [],
    priority: "",
    assignReviewer: "",
    notes: "",
  };
}

function getMetadataValidationErrors(metadata: UploadMetadata): string[] {
  const errors: string[] = [];
  if (!metadata.claimReference.trim()) errors.push("Claim reference is required.");
  if (!metadata.patientName.trim()) errors.push("Patient name is required.");
  if (metadata.documentType.length === 0) errors.push("Document type is required.");
  if (!metadata.priority) errors.push("Priority is required.");
  if (!metadata.assignReviewer) errors.push("Reviewer assignment is required.");
  return errors;
}

export function ClaimsUploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<UploadStep>("select");
  const [metadata, setMetadata] = useState<UploadMetadata>(createDefaultMetadata);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastUploaded, setLastUploaded] = useState<{
    claimId: string;
    claimNumber: string;
  } | null>(null);
  const [reviewers, setReviewers] = useState<ReviewerOption[]>([]);

<<<<<<< HEAD
  const { data: summary } = useApiQuery(
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
=======
  useEffect(() => {
    let active = true;
    apiAuthedFetch<{ items: ReviewerOption[] }>("/claims/reviewers")
      .then((payload) => {
        if (active) setReviewers(payload.items ?? []);
      })
      .catch(() => {
        if (active) setReviewers([]);
      });
    return () => {
      active = false;
    };
  }, []);
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5

  const onDrop = useCallback((accepted: File[], rejected: FileRejection[]) => {
    setUploadError(null);
    if (rejected.length > 0) {
      const tooLarge = rejected.some((r) =>
        r.errors.some((e) => e.code === "file-too-large"),
      );
      setUploadError(
        tooLarge
          ? "File exceeds the 10 MB limit."
          : "Unsupported file type. Use PDF, PNG, or JPEG.",
      );
      return;
    }
    const file = accepted[0];
    if (!file) return;
    setSelectedFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject, open } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxFiles: 1,
    maxSize: MAX_FILE_BYTES,
    disabled: isUploading || step !== "select",
    noClick: true,
  });

  const assignReviewerLabel = useMemo(() => {
    return reviewers.find((r) => r.id === metadata.assignReviewer)?.name ?? "—";
  }, [metadata.assignReviewer, reviewers]);

  const selectedDocumentTypes = useMemo(
    () => DOCUMENT_TYPE_OPTIONS.filter((option) => metadata.documentType.includes(option.value)),
    [metadata.documentType],
  );

  const metadataErrors = useMemo(() => getMetadataValidationErrors(metadata), [metadata]);

  const canProceed = Boolean(selectedFile) && metadataErrors.length === 0;

  const onConfirmUpload = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);

    const form = new FormData();
    form.append("document", selectedFile);
    form.append("claimNumber", metadata.claimReference.trim());
    form.append("patientName", metadata.patientName.trim());
    metadata.documentType.forEach((type) => form.append("documentType", type));
    form.append("priority", metadata.priority);
    if (metadata.notes.trim()) form.append("notes", metadata.notes.trim());
    form.append("reviewerId", metadata.assignReviewer);

    try {
      const data = await apiAuthedFetch<UploadResponse>("/claims/upload", {
        method: "POST",
        body: form,
      });
      const claimId = data?.claim?.id;
      const number = data?.claim?.claimNumber ?? metadata.claimReference.trim();

      if (!claimId) {
        throw new Error("Upload succeeded but no claim ID was returned.");
      }

      setLastUploaded({ claimId, claimNumber: number });
      setStep("submitted");
      toast.success("Document uploaded", {
        description: "The claim is now in the extraction queue.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      const friendly =
        msg.includes("INSUFFICIENT") || msg.toLowerCase().includes("ocr credit")
          ? "Insufficient OCR credits. Each successful extraction uses 1 credit per page."
          : msg;
      setUploadError(friendly);
      toast.error("Upload failed", { description: friendly });
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, metadata]);

  function resetFlow() {
    setStep("select");
    setMetadata(createDefaultMetadata());
    setSelectedFile(null);
    setUploadError(null);
    setLastUploaded(null);
  }

  function updateMetadata<K extends keyof UploadMetadata>(key: K, value: UploadMetadata[K]) {
    setMetadata((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="space-y-4 pb-6">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
          Upload Claim Documents
        </h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Add claim documents, confirm metadata, and queue them for OCR and AI extraction.
        </p>
      </header>

      <UploadStepper current={step} />

<<<<<<< HEAD
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
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500"
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
                    isDragActive && !isDragReject && "border-primary/50 bg-primary-50/80 dark:border-primary dark:bg-primary/10",
                    isDragReject && "border-red-300 bg-red-50/50 dark:border-red-700 dark:bg-red-950/40",
                    !isDragActive &&
                      !isDragReject &&
                      "border-slate-200 bg-slate-50/50 hover:border-primary/40 hover:bg-primary-50/30 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-primary dark:hover:bg-primary/10",
                    isUploading && "pointer-events-none opacity-60",
                  )}
                >
                  <input {...getInputProps()} />
                  <div
                    className={cn(
                      "mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl",
                      isDragActive ? "bg-primary-light text-primary dark:bg-primary/10 dark:text-primary" : "bg-white text-primary shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-primary dark:ring-slate-700",
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
                    or <span className="font-semibold text-primary dark:text-primary">browse files</span> on
                    your computer
                  </p>
                  <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                    PDF, PNG, JPEG · max 10 MB · 1 OCR credit per page after successful
                    extraction
                  </p>
=======
      {step === "select" ? (
        <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Upload Claim</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Add a document and fill in metadata to queue for extraction
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <div
                {...getRootProps()}
                className={cn(
                  "flex items-center gap-3 rounded-lg border-2 border-dashed px-3 py-3 transition-colors",
                  isDragActive && !isDragReject && "border-slate-400 bg-slate-50 dark:border-slate-500 dark:bg-slate-800/50",
                  isDragReject && "border-red-300 bg-red-50/40 dark:border-red-800 dark:bg-red-950/30",
                  !isDragActive && !isDragReject && "border-slate-200 bg-slate-50/40 dark:border-slate-700 dark:bg-slate-900/40",
                )}
              >
                <input {...getInputProps()} />
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
                  <Upload className="size-3.5" />
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Drag & drop or{" "}
                    <button
                      type="button"
                      onClick={open}
                      className="font-semibold text-slate-900 underline-offset-2 hover:underline dark:text-slate-100"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">PDF, PNG, JPG · max 10 MB</p>
                </div>
              </div>

<<<<<<< HEAD
                {uploadError ? (
                  <Alert variant="error" message={uploadError} className="mt-4" />
                ) : null}

                {selectedFile && fileMeta ? (
                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                    <div className="flex items-start gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-primary ring-1 ring-slate-200 dark:bg-slate-900 dark:text-primary dark:ring-slate-700">
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
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm shadow-primary/20 hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
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
=======
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-800/40">
                {selectedFile ? (
                  <div className="flex items-center gap-2.5 p-2.5">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700">
                      <FileText className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {selectedFile.name}
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatFileType(selectedFile)} · {formatBytes(selectedFile.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="shrink-0 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <FileText className="size-3.5 text-slate-300 dark:text-slate-600" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">No file selected</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Claim Reference" required>
                <input
                  type="text"
                  value={metadata.claimReference}
                  onChange={(e) => updateMetadata("claimReference", e.target.value)}
                  placeholder="e.g. CLM-2026-04128"
                  className={inputClassName}
                  required
                />
              </Field>

              <Field label="Patient Name" required>
                <input
                  type="text"
                  value={metadata.patientName}
                  onChange={(e) => updateMetadata("patientName", e.target.value)}
                  placeholder="Patient full name"
                  className={inputClassName}
                  required
                />
              </Field>

              <Field label="Document Type" required>
                <Select<DocumentTypeOption, true>
                  isMulti
                  instanceId="claim-document-type"
                  inputId="claim-document-type"
                  options={DOCUMENT_TYPE_OPTIONS}
                  value={selectedDocumentTypes}
                  onChange={(options) =>
                    updateMetadata(
                      "documentType",
                      (options ?? []).map((option) => option.value),
                    )
                  }
                  placeholder="Select type"
                  unstyled
                  classNames={{
                    control: ({ isFocused }) =>
                      cn(
                        inputClassName,
                        "flex min-h-9 h-auto items-center gap-1 py-0.5",
                        isFocused && "border-primary ring-2 ring-primary/15",
                      ),
                    placeholder: () => "text-slate-400 dark:text-slate-500",
                    input: () => "text-sm text-slate-900 dark:text-slate-100",
                    valueContainer: () => "gap-1",
                    multiValue: () =>
                      "rounded-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
                    multiValueLabel: () => "px-1.5 py-0.5 text-xs font-medium",
                    multiValueRemove: () =>
                      "rounded-r-md px-1 hover:bg-slate-200 dark:hover:bg-slate-700",
                    indicatorsContainer: () => "text-slate-400",
                    dropdownIndicator: () => "px-2",
                    clearIndicator: () => "px-1",
                    menu: () =>
                      "mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-950",
                    menuList: () => "py-1",
                    option: ({ isFocused, isSelected }) =>
                      cn(
                        "cursor-pointer px-3 py-2 text-sm",
                        isSelected &&
                          "bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-slate-100",
                        !isSelected &&
                          isFocused &&
                          "bg-slate-50 text-slate-900 dark:bg-slate-800/70 dark:text-slate-100",
                        !isSelected &&
                          !isFocused &&
                          "text-slate-900 dark:text-slate-100",
                      ),
                  }}
                />
              </Field>

              <Field label="Priority" required>
                <select
                  value={metadata.priority}
                  onChange={(e) => updateMetadata("priority", e.target.value)}
                  className={inputClassName}
                  required
                >
                  <option value="">Select priority</option>
                  {PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Assign Reviewer" required className="sm:col-span-2">
                <select
                  value={metadata.assignReviewer}
                  onChange={(e) => updateMetadata("assignReviewer", e.target.value)}
                  className={inputClassName}
                  required
                >
                  <option value="">Select reviewer</option>
                  {reviewers.map((reviewer) => (
                    <option key={reviewer.id} value={reviewer.id}>
                      {reviewer.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Notes" hint="Optional" className="sm:col-span-2">
                <textarea
                  value={metadata.notes}
                  onChange={(e) => updateMetadata("notes", e.target.value)}
                  rows={2}
                  placeholder="Optional notes for reviewers"
                  className={cn(inputClassName, "min-h-16 resize-y")}
                />
              </Field>
            </div>
          </div>

          {uploadError ? <Alert message={uploadError} className="mt-3" /> : null}
          {metadataErrors.length > 0 && selectedFile && !uploadError ? (
            <Alert message={metadataErrors[0]} className="mt-3" />
          ) : null}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              disabled={!canProceed}
              onClick={() => {
                const errors = getMetadataValidationErrors(metadata);
                if (errors.length > 0) {
                  setUploadError(errors[0]);
                  return;
                }
                setUploadError(null);
                setStep("review");
              }}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              Next
            </button>
          </div>
        </section>
      ) : null}

      {step === "review" ? (
        <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Review & Confirm</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verify the document and metadata before uploading
            </p>
          </div>

          <div className="space-y-3">
            {selectedFile ? (
              <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 dark:border-slate-700 dark:bg-slate-800/40">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700">
                  <FileText className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatFileType(selectedFile)} · {formatBytes(selectedFile.size)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 px-3 py-2.5 dark:border-slate-700">
                <FileText className="size-3.5 text-slate-300 dark:text-slate-600" />
                <p className="text-xs text-slate-500 dark:text-slate-400">No file selected</p>
              </div>
            )}

<<<<<<< HEAD
        <aside className="space-y-4">
          <GuidelinesCard />
          <PipelineCard />
        </aside>
      </div>
=======
            <div className="grid gap-x-4 gap-y-2 border-t border-slate-100 pt-3 sm:grid-cols-2 dark:border-slate-800">
              <ReviewRow label="Claim Reference" value={metadata.claimReference.trim()} />
              <ReviewRow label="Patient Name" value={metadata.patientName.trim()} />
              <ReviewRow label="Document Type" value={metadata.documentType.join(", ")} />
              <ReviewRow label="Priority" value={metadata.priority} />
              <ReviewRow label="Reviewer" value={assignReviewerLabel} className="sm:col-span-2" />
              {metadata.notes.trim() ? (
                <ReviewRow label="Notes" value={metadata.notes.trim()} className="sm:col-span-2" />
              ) : null}
            </div>
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Info className="size-3.5 shrink-0" />
            Go back to edit the document or metadata.
          </p>

          {uploadError ? <Alert message={uploadError} className="mt-3" /> : null}

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setStep("select")}
              disabled={isUploading}
              className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onConfirmUpload}
              disabled={isUploading || !selectedFile}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                "Upload Claim"
              )}
            </button>
          </div>
        </section>
      ) : null}

      {step === "submitted" && lastUploaded ? (
        <SubmittedStep
          claimId={lastUploaded.claimId}
          claimNumber={lastUploaded.claimNumber}
          onUploadAnother={resetFlow}
          onOpenClaim={() => router.push(`/claims/${lastUploaded.claimId}`)}
        />
      ) : null}
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
    </div>
  );
}

function UploadStepper({ current }: { current: UploadStep }) {
  const steps = [
    { id: "select" as const, number: 1, label: "Select File" },
    { id: "review" as const, number: 2, label: "Claim Review" },
    { id: "submitted" as const, number: 3, label: "Submitted" },
  ];
  const currentIndex = steps.findIndex((step) => step.id === current);

  return (
    <ol className="flex flex-wrap items-center gap-1.5">
      {steps.map((step, index) => {
        const isActive = step.id === current;
        const isComplete = index < currentIndex;

        return (
          <li key={step.id} className="flex items-center gap-1.5">
            <div
              className={cn(
<<<<<<< HEAD
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
                done && "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
                active && "bg-primary-50 text-primary-dark ring-1 ring-primary/30 dark:bg-primary/10 dark:text-primary dark:ring-primary/40",
                !done && !active && "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
=======
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                isActive && "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900",
                !isActive && isComplete && "text-slate-700 dark:text-slate-300",
                !isActive && !isComplete && "text-slate-400 dark:text-slate-500",
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
              )}
            >
              <span
                className={cn(
<<<<<<< HEAD
                  "flex size-5 items-center justify-center rounded-full text-[10px]",
                  done && "bg-emerald-600 text-white",
                  active && "bg-primary text-white",
                  !done && !active && "bg-slate-300 text-white dark:bg-slate-600",
=======
                  "inline-flex size-5 items-center justify-center rounded-full text-[10px] font-semibold",
                  isActive && "bg-white text-slate-900 dark:bg-slate-900 dark:text-white",
                  !isActive && isComplete && "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900",
                  !isActive && !isComplete && "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
                )}
              >
                {isComplete ? <Check className="size-3" /> : step.number}
              </span>
              {step.label}
            </div>
            {index < steps.length - 1 ? (
              <ChevronRight className="size-3.5 text-slate-300 dark:text-slate-600" aria-hidden />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function SubmittedStep({
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
    <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
          <Check className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Document uploaded</h2>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
            <span className="font-medium text-slate-900 dark:text-slate-100">{claimNumber}</span> is queued for
            extraction. OCR credits apply on successful processing (1 credit/page).
          </p>
          <p className="mt-1 font-mono text-[11px] text-slate-400 dark:text-slate-500">{claimId}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onUploadAnother}
          className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Upload another
        </button>
        <Link
          href="/claims"
          className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          View all claims
        </Link>
        <button
          type="button"
          onClick={onOpenClaim}
          className="inline-flex h-9 items-center rounded-lg bg-slate-900 px-3.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          View claim
        </button>
      </div>
    </section>
  );
}

<<<<<<< HEAD
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
=======
function ReviewRow({
  label,
  value,
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{label}</p>
      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{value || "—"}</p>
    </div>
  );
}

function Field({
  label,
  hint,
  required = false,
  className,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
        {hint ? (
          <span className="ml-1 text-[11px] font-normal text-slate-400 dark:text-slate-500">
            ({hint})
          </span>
        ) : null}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Alert({ message, className }: { message: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300",
        className,
      )}
      role="alert"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

const inputClassName =
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatFileType(file: File): string {
  if (file.type === "application/pdf") return "PDF";
  if (file.type === "image/png") return "PNG";
  if (file.type === "image/jpeg") return "JPG";
  return file.name.split(".").pop()?.toUpperCase() ?? "FILE";
}
