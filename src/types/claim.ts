export type ClaimStatus =
  | "Processing"
  | "Extracted"
  | "Draft"
  | "Reviewed"
  | "Needs Attention"
  | "Failed"
  | "Archived";

export type ConfidenceLevel = "High" | "Medium" | "Low";

export type ClaimRecord = {
  id: string;
  claimNumber: string;
  patientName: string;
  provider: string;
  amount: number;
  submittedAt: string;
  claimDate: string | null;
  documentFileName: string | null;
  pageCount: number | null;
  reviewerName: string | null;
  status: ClaimStatus;
  confidence: number;
  department: string;
  /** OCR credits charged for this claim (1 per page on successful extraction). */
  ocrCreditsCharged?: number | null;
  llmStatus?: string;
  llmEnhanced?: boolean;
  extractionSource?: string;
};

export type AuditLog = {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  result: "Success" | "Warning" | "Failed";
};

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: "Super Admin" | "Insurance Admin" | "Claims Adjuster" | "Reviewer" | "Auditor" | "Viewer";
  department: string;
  status: "Active" | "Invited" | "Suspended";
};
