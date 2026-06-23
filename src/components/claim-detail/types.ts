import { ClaimStatus } from "@/types/claim";
import { ExtractionProgress } from "@/lib/extraction/extraction-progress";

export type ClaimDocument = {
  id: string;
  originalName: string;
  mimeType: string;
  storagePath: string;
  createdAt?: string;
};

export type ClaimMetadata = {
  patientName?: string | null;
  documentType?: string[] | string | null;
  priority?: string | null;
  notes?: string | null;
};

export type ClaimDetailData = {
  claim?: {
    id?: string;
    claimNumber?: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
    reviewerId?: string | null;
    metadata?: ClaimMetadata | null;
    extractionResult?: Record<string, unknown>;
    reviewedResult?: Record<string, unknown> | null;
    reviewer?: { id?: string; name?: string; email?: string } | null;
  };
  documents?: ClaimDocument[];
  latestJob?: {
    status?: string;
    attempts?: number;
    errorMessage?: string | null;
    progressStage?: string | null;
    progress?: ExtractionProgress;
  };
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
  traces?: Array<{ source_text: string; page: number | null }>;
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
  extractionProgress: ExtractionProgress | null;
};

export type ExtractionTab = "data" | "json" | "audit" | "comment";

export type MobileWorkspaceTab = "document" | "extraction";

export type FieldTraceFocus = {
  page: number | null;
  sourceText: string;
};

export type DocumentFocusTarget = {
  id: string;
  page: number | null;
  sourceText: string;
  traces?: FieldTraceFocus[];
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
