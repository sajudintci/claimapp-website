import { ClaimStatus } from "@/types/claim";

export type ClaimDocument = {
  id: string;
  originalName: string;
  mimeType: string;
  storagePath: string;
  createdAt?: string;
};

export type ClaimDetailData = {
  claim?: {
    id?: string;
    claimNumber?: string;
    status?: string;
    createdAt?: string;
    extractionResult?: Record<string, unknown>;
  };
  documents?: ClaimDocument[];
  latestJob?: { status?: string; attempts?: number; errorMessage?: string | null };
  latestResult?: { payload?: Record<string, unknown>; source?: string; createdAt?: string };
};

export type PreExtractedFieldKey =
  | "policyNumber"
  | "claimNumber"
  | "patientName"
  | "dob"
  | "admissionDate"
  | "dischargeDate"
  | "totalAmount";

export type TracedFieldDisplay = {
  value: string | number;
  source_text: string;
  page: number | null;
  confidence: number;
};

export type ExtractionContext = {
  payload: Record<string, unknown>;
  confidence: number;
  jobStatus: string;
  currentStatus: ClaimStatus;
  llmStatus: string;
  llmError: string | null | undefined;
  ocrSufficient: boolean;
  ocrCharCount: number;
  ocrFiltered: boolean;
  ocrPageCount: number | null;
  ocrCreditsCharged: number | null;
  preExtracted: Partial<Record<PreExtractedFieldKey, TracedFieldDisplay>>;
  validation?: {
    hasBillingMismatch?: boolean;
    claims?: Array<{ claimIndex: number; messages?: string[] }>;
  };
  isJobActive: boolean;
  canRetryExtraction: boolean;
};

export type ExtractionTab = "overview" | "fields" | "lineitems" | "json" | "debug";

export type MobileWorkspaceTab = "document" | "extraction";

export type DocumentFocusTarget = {
  id: string;
  page: number | null;
  sourceText: string;
  value?: string;
  label?: string;
};

export function createDocumentFocus(
  params: Omit<DocumentFocusTarget, "id"> & { id?: string },
): DocumentFocusTarget {
  const slug = (params.label ?? "field")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return {
    id: params.id ?? `${slug}-${params.page ?? "na"}-${Date.now()}`,
    page: params.page,
    sourceText: params.sourceText,
    value: params.value,
    label: params.label,
  };
}
