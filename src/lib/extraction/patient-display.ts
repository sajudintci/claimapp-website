import { tracedFieldReviewValue } from "@/lib/extraction/claim-extraction";

/** Patient label from extraction only (`patient.name`), including explicit `not_found`. */
export function resolveExtractedPatientName(extractedName?: unknown): string {
  return tracedFieldReviewValue(extractedName);
}
