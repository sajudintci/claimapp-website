import { ClaimStatus } from "@/types/claim";
import {
  ClaimDetailData,
  ExtractionContext,
  PreExtractedFieldKey,
  TracedFieldDisplay,
} from "@/components/claim-detail/types";

export const PRE_EXTRACTED_FIELD_KEYS: PreExtractedFieldKey[] = [
  "policyNumber",
  "claimNumber",
  "patientName",
  "dob",
  "admissionDate",
  "dischargeDate",
  "totalAmount",
];

export const PRE_EXTRACTED_LABELS: Record<PreExtractedFieldKey, string> = {
  policyNumber: "Policy Number",
  claimNumber: "Claim Number",
  patientName: "Patient Name",
  dob: "Date of Birth",
  admissionDate: "Admission Date",
  dischargeDate: "Discharge Date",
  totalAmount: "Total Amount",
};

export function buildExtractionContext(
  data: ClaimDetailData | undefined,
  documentsCount: number,
): ExtractionContext {
  const extraction = (data?.latestResult?.payload ?? data?.claim?.extractionResult ?? {}) as Record<
    string,
    unknown
  >;
  const jobStatus = data?.latestJob?.status ?? "N/A";
  const isJobActive = jobStatus === "QUEUED" || jobStatus === "PROCESSING";
  const llmStatus = String(extraction.llmStatus ?? "");
  const ocrSufficient = extraction.ocrSufficient !== false;

  return {
    payload: extraction,
    confidence: Math.round(((extraction.confidence as number | undefined) ?? 0) * 100),
    jobStatus,
    currentStatus: (data?.claim?.status ?? "Processing") as ClaimStatus,
    llmStatus,
    llmError: extraction.llmError as string | null | undefined,
    ocrSufficient,
    ocrCharCount: Number(extraction.ocrCharCount ?? 0),
    ocrFiltered: extraction.ocrFiltered === true,
    ocrPageCount:
      extraction.ocrPageCount != null ? Number(extraction.ocrPageCount) : null,
    ocrCreditsCharged:
      typeof extraction.ocrCreditsCharged === "number"
        ? extraction.ocrCreditsCharged
        : null,
    preExtracted: parsePreExtracted(extraction.preExtractedFields),
    validation: extraction.validation as ExtractionContext["validation"],
    isJobActive,
    canRetryExtraction:
      documentsCount > 0 &&
      !isJobActive &&
      (jobStatus === "FAILED" || llmStatus === "failed" || !ocrSufficient),
  };
}

function parsePreExtracted(raw: unknown): Partial<Record<PreExtractedFieldKey, TracedFieldDisplay>> {
  if (!raw || typeof raw !== "object") return {};
  const out: Partial<Record<PreExtractedFieldKey, TracedFieldDisplay>> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== "object") continue;
    const field = value as Record<string, unknown>;
    out[key as PreExtractedFieldKey] = {
      value: (field.value as string | number) ?? "not_found",
      source_text: String(field.source_text ?? ""),
      page: typeof field.page === "number" ? field.page : null,
      confidence: Number(field.confidence ?? 0),
    };
  }
  return out;
}

export function collectBillingMismatchMessages(
  validation: ExtractionContext["validation"],
): string[] {
  return (validation?.claims ?? [])
    .filter((c) => (c.messages ?? []).length > 0)
    .flatMap((c) => (c.messages ?? []).map((msg) => `Claim ${c.claimIndex + 1}: ${msg}`));
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
