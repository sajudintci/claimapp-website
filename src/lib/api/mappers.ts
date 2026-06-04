import { ClaimRecord } from "@/types/claim";

type BackendClaim = {
  id: string;
  claimNumber?: string;
  status?: string;
  createdAt?: string;
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
  } | null;
};

export function mapClaimFromApi(item: unknown): ClaimRecord {
  const claim = item as BackendClaim;
  const summary = claim.extractionResult?.summary;
  const confidenceRaw = claim.extractionResult?.confidence;
  const createdAt = claim.createdAt
    ? new Date(claim.createdAt).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  return {
    id: claim.id,
    claimNumber: claim.claimNumber ?? claim.id.slice(0, 8),
    patientName: summary?.insuredName ?? "—",
    provider: summary?.provider ?? "—",
    amount: summary?.amount ?? 0,
    submittedAt: createdAt,
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
