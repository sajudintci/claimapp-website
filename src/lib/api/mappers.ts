import { ClaimRecord } from "@/types/claim";
import { tracedFieldReviewValue } from "@/lib/extraction/claim-extraction";
import { resolveExtractedPatientNameFromResult } from "@/lib/extraction/patient-display";

type TracedField = {
  value?: string | number;
};

type ClaimMetadata = {
  patientName?: string | null;
  documentType?: string[] | string | null;
  priority?: string | null;
  notes?: string | null;
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
  metadata?: ClaimMetadata | null;
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
      provider?: {
        hospital_name?: TracedField;
      };
      encounter?: {
        admission_date?: TracedField;
      };
    }>;
  } | null;
};

function normalizeDocumentTypes(raw: ClaimMetadata["documentType"]): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return [raw];
}

function readMetadataPatientName(metadata: ClaimMetadata | null | undefined): string {
  const name = metadata?.patientName?.trim();
  return name || "";
}

function readHospitalName(extractionResult: BackendClaim["extractionResult"]): string {
  const summaryProvider = extractionResult?.summary?.provider?.trim();
  if (summaryProvider && summaryProvider !== "not_found") {
    return summaryProvider;
  }

  const hospitalField = extractionResult?.claims?.[0]?.provider?.hospital_name;
  const hospital = tracedFieldReviewValue(hospitalField);
  if (hospital !== "not_found") return hospital;

  return "—";
}

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
  const metadataPatient = readMetadataPatientName(claim.metadata);
  const extractedPatient = resolveExtractedPatientNameFromResult(
    claim.extractionResult as Record<string, unknown> | null | undefined,
  );
  const patientName =
    metadataPatient ||
    (extractedPatient !== "not_found" ? extractedPatient : "—");
  const hospitalName = readHospitalName(claim.extractionResult);

  return {
    id: claim.id,
    claimNumber: claim.claimNumber ?? claim.id.slice(0, 8),
    patientName,
    hospitalName,
    provider: hospitalName,
    amount: summary?.amount ?? 0,
    submittedAt: createdAt,
    claimDate: readClaimDate(claim.extractionResult),
    documentFileName: claim.primaryDocument?.originalName ?? null,
    pageCount:
      typeof claim.extractionResult?.ocrPageCount === "number"
        ? claim.extractionResult.ocrPageCount
        : null,
    documentTypes: normalizeDocumentTypes(claim.metadata?.documentType),
    priority: claim.metadata?.priority?.trim() || null,
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
