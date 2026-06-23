import {
  resolveClaimsFromPayload,
  tracedFieldReviewValue,
} from "@/lib/extraction/claim-extraction";

/** Patient label from a traced `patient.name` field, including explicit `not_found`. */
export function resolveExtractedPatientName(extractedName?: unknown): string {
  return tracedFieldReviewValue(extractedName);
}

/** Reads `patient.name` from the first claim in an extraction payload. */
export function resolveExtractedPatientNameFromResult(
  extractionResult?: Record<string, unknown> | null,
): string {
  if (!extractionResult) return "not_found";
  const claims = resolveClaimsFromPayload(extractionResult);
  return resolveExtractedPatientName(claims[0]?.patient?.name);
}
