import { ClaimRecord } from "@/types/claim";
import { resolveExtractedPatientNameFromResult } from "@/lib/extraction/patient-display";

type TracedField = {
  value?: string | number;
};

type BackendClaim = {
  id: string;
  claimNumber?: string;
  status?: string;
  createdAt?: string;
  primaryDocument?: {
    originalName?: string;
  } | null;
  reviewer?: {
    id?: string;
    name?: string;
  } | null;
  metadata?: {
    patientName?: string | null;
    documentType?: string[] | string | null;
    priority?: string | null;
    notes?: string | null;
  } | null;
  extractionResult?: {
    summary?: {
      insuredName?: string;
      provider?: string;
      amount?: number;
    };
    confidence?: number;
    ocrCreditsCharged?: number;
    ocrPageCount?: number;
    llmStatus?: string;
    llmEnhanced?: boolean;
    source?: string;
    claims?: Array<{
      patient?: {
        name?: TracedField;
      };
      encounter?: {
        admission_date?: TracedField;
      };
    }>;
  } | null;
};

function readClaimDate(extractionResult: BackendClaim["extractionResult"]): string | null {
  const admission = extractionResult?.claims?.[0]?.encounter?.admission_date?.value;
  if (typeof admission === "string" && admission.trim() && admission !== "not_found") {
    return admission.trim();
  }
  return null;
}

export function mapClaimFromApi(item: unknown): ClaimRecord {
  const claim = item as BackendClaim;
  const confidenceRaw = claim.extractionResult?.confidence;
  const createdAt = claim.createdAt
    ? new Date(claim.createdAt).toISOString()
    : new Date().toISOString();

  const summary = claim.extractionResult?.summary;

  return {
    id: claim.id,
    claimNumber: claim.claimNumber ?? claim.id.slice(0, 8),
    patientName: resolveExtractedPatientNameFromResult(
      claim.extractionResult as Record<string, unknown> | null | undefined,
    ),
    provider: summary?.provider ?? "—",
    amount: summary?.amount ?? 0,
    submittedAt: createdAt,
    claimDate: readClaimDate(claim.extractionResult),
    documentFileName: claim.primaryDocument?.originalName ?? null,
    pageCount:
      typeof claim.extractionResult?.ocrPageCount === "number"
        ? claim.extractionResult.ocrPageCount
        : null,
    reviewerName: claim.reviewer?.name ?? null,
    status: (claim.status as ClaimRecord["status"]) ?? "Processing",
    confidence:
      typeof confidenceRaw === "number"
        ? Math.max(0, Math.min(100, Math.round(confidenceRaw * 100)))
        : 0,
    department: "Claims",
    ocrCreditsCharged:
      typeof claim.extractionResult?.ocrCreditsCharged === "number"
        ? claim.extractionResult.ocrCreditsCharged
        : null,
    llmStatus: claim.extractionResult?.llmStatus
      ? String(claim.extractionResult.llmStatus)
      : undefined,
    llmEnhanced: claim.extractionResult?.llmEnhanced === true,
    extractionSource: claim.extractionResult?.source
      ? String(claim.extractionResult.source)
      : undefined,
  };
}
