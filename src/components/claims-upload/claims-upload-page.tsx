"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { useDropzone, type FileRejection } from "react-dropzone";
import {
  AlertCircle,
  Bookmark,
  Check,
  ChevronRight,
  FileText,
  Flag,
  FolderOpen,
  Info,
  Loader2,
  StickyNote,
  Upload,
  User,
  Users,
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
    <div className="space-y-6 pb-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Upload Claim Documents
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Add claim documents, confirm metadata, and queue them for OCR and AI extraction.
        </p>
      </header>

      <UploadStepper current={step} />

      {step === "select" ? (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <div className="mb-5">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Claim Documents</h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  PDF, JPG, and PNG up to 10 MB per file
                </p>
              </div>

              <div
                {...getRootProps()}
                className={cn(
                  "rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
                  isDragActive && !isDragReject && "border-slate-400 bg-slate-50 dark:border-slate-500 dark:bg-slate-800/50",
                  isDragReject && "border-red-300 bg-red-50/40 dark:border-red-800 dark:bg-red-950/30",
                  !isDragActive && !isDragReject && "border-slate-200 bg-slate-50/40 dark:border-slate-700 dark:bg-slate-900/40",
                )}
              >
                <input {...getInputProps()} />
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
                  <Upload className="size-5" />
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Drag and drop claim documents
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Invoices, lab reports, discharge summaries, prescriptions, and scans
                </p>
                <button
                  type="button"
                  onClick={open}
                  className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  Browse files
                </button>
              </div>

              {uploadError ? <Alert message={uploadError} className="mt-4" /> : null}

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-800/40">
                {selectedFile ? (
                  <div className="flex items-center gap-3 p-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700">
                      <FileText className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {selectedFile.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {formatFileType(selectedFile)} · {formatBytes(selectedFile.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center px-6 py-8 text-center">
                    <FileText className="mb-2 size-8 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No files selected</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Add one or more files to continue
                    </p>
                  </div>
                )}
              </div>
            </section>

            <GuidelinesCard />
          </div>

          <aside className="lg:col-span-2">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <div className="mb-5">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Document Metadata</h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  Used to route the claim correctly
                </p>
              </div>

              <div className="space-y-4">
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
                    placeholder="Select document type"
                    unstyled
                    classNames={{
                      control: ({ isFocused }) =>
                        cn(
                          inputClassName,
                          "flex min-h-11 h-auto items-center gap-1 py-1",
                          isFocused && "border-blue-500 ring-2 ring-blue-500/15",
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

                <Field label="Assign Reviewer" required>
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

                <Field label="Notes" hint="Optional">
                  <textarea
                    value={metadata.notes}
                    onChange={(e) => updateMetadata("notes", e.target.value)}
                    rows={4}
                    placeholder="Optional notes for reviewers"
                    className={cn(inputClassName, "min-h-24 resize-y")}
                  />
                </Field>
              </div>

              {metadataErrors.length > 0 && selectedFile ? (
                <Alert message={metadataErrors[0]} className="mt-4" />
              ) : null}

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
                className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                Next
              </button>
            </section>
          </aside>
        </div>
      ) : null}

      {step === "review" ? (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Selected Documents</h2>
            {selectedFile ? (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700">
                  <FileText className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedFile.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {formatFileType(selectedFile)} · {formatBytes(selectedFile.size)}
                  </p>
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Claim Information</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ReviewInfoItem
                icon={Bookmark}
                label="Claim Reference"
                value={metadata.claimReference.trim()}
              />
              <ReviewInfoItem
                icon={FolderOpen}
                label="Document Type"
                value={metadata.documentType.join(", ")}
              />
              <ReviewInfoItem icon={Flag} label="Priority" value={metadata.priority} />
              <ReviewInfoItem icon={Users} label="Assignment" value={assignReviewerLabel} />
              <ReviewInfoItem
                icon={User}
                label="Patient Name"
                value={metadata.patientName.trim()}
              />
              <ReviewInfoItem
                icon={StickyNote}
                label="Notes"
                value={metadata.notes.trim() || "—"}
                className="sm:col-span-2"
              />
            </div>
          </section>

          <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
            <div className="flex gap-2">
              <Info className="mt-0.5 size-4 shrink-0" />
              <p>
                Need to edit information? Go back to the previous step to update your document or metadata.
              </p>
            </div>
          </div>

          {uploadError ? <Alert message={uploadError} /> : null}

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setStep("select")}
              disabled={isUploading}
              className="inline-flex h-11 items-center rounded-xl bg-slate-200 px-5 text-sm font-semibold text-slate-800 hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onConfirmUpload}
              disabled={isUploading || !selectedFile}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
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
        </div>
      ) : null}

      {step === "submitted" && lastUploaded ? (
        <SubmittedStep
          claimId={lastUploaded.claimId}
          claimNumber={lastUploaded.claimNumber}
          onUploadAnother={resetFlow}
          onOpenClaim={() => router.push(`/claims/${lastUploaded.claimId}`)}
        />
      ) : null}
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
    <ol className="flex flex-wrap items-center gap-2">
      {steps.map((step, index) => {
        const isActive = step.id === current;
        const isComplete = index < currentIndex;

        return (
          <li key={step.id} className="flex items-center gap-2">
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium",
                isActive && "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900",
                !isActive && isComplete && "text-slate-700 dark:text-slate-300",
                !isActive && !isComplete && "text-slate-400 dark:text-slate-500",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                  isActive && "bg-white text-slate-900 dark:bg-slate-900 dark:text-white",
                  !isActive && isComplete && "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900",
                  !isActive && !isComplete && "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                )}
              >
                {isComplete ? <Check className="size-3.5" /> : step.number}
              </span>
              {step.label}
            </div>
            {index < steps.length - 1 ? (
              <ChevronRight className="size-4 text-slate-300 dark:text-slate-600" aria-hidden />
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
    <section className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-8">
      <div className="flex size-12 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
        <Check className="size-5" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-slate-900 dark:text-slate-100">Document uploaded</h2>
      <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
        <span className="font-semibold text-slate-900 dark:text-slate-100">{claimNumber}</span> is now in the
        extraction queue. OCR credits will be applied when processing completes successfully (1 credit per page).
      </p>
      <p className="mt-2 font-mono text-xs text-slate-500 dark:text-slate-400">ID: {claimId}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onOpenClaim}
          className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          View claim workspace
        </button>
        <Link
          href="/claims"
          className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          View all claims
        </Link>
        <button
          type="button"
          onClick={onUploadAnother}
          className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          Upload another claim
        </button>
      </div>
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
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Document Guidelines</h2>
      <ul className="mt-4 space-y-3">
        {items.map((text) => (
          <li key={text} className="flex gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Check className="mt-0.5 size-4 shrink-0 text-slate-500 dark:text-slate-400" />
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ReviewInfoItem({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/40", className)}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  required = false,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
        {hint ? (
          <span className="ml-1 text-xs font-normal text-slate-400 dark:text-slate-500">
            ({hint})
          </span>
        ) : null}
      </span>
      <div className="mt-1.5">{children}</div>
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
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

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
