import { AuditLog, ClaimRecord, UserRecord } from "@/types/claim";

export const orgs = ["Abby Insurance Group", "Nusantara Assurance", "Sentra Insurance Network"];

export const claimStats = [
  { label: "Total Claims", value: "4,128", trend: "+8.2%", tone: "primary" },
  { label: "Needs Review", value: "136", trend: "-2.1%", tone: "warning" },
  { label: "Reviewed Today", value: "89", trend: "+14.0%", tone: "success" },
  { label: "Failed Extraction", value: "12", trend: "-18.0%", tone: "danger" },
];

export const claims: ClaimRecord[] = [
  { id: "CLM-1001", claimNumber: "CLM-1001", patientName: "Andi Pratama", provider: "Abby Insurance Group", amount: 2450000, submittedAt: "2026-05-24", claimDate: "2026-05-20", documentFileName: "Andi_Pratama_Claim.pdf", pageCount: 4, reviewerName: null, status: "Extracted", confidence: 92, department: "Claims" },
  { id: "CLM-1002", claimNumber: "CLM-1002", patientName: "Rani Salsabila", provider: "Nusantara Assurance", amount: 3280000, submittedAt: "2026-05-24", claimDate: "2026-05-19", documentFileName: "Rani_Salsabila_Claim.pdf", pageCount: 6, reviewerName: "Sarah Rahman", status: "Needs Attention", confidence: 61, department: "Finance" },
  { id: "CLM-1003", claimNumber: "CLM-1003", patientName: "Budi Santoso", provider: "Abby Insurance Group", amount: 1875000, submittedAt: "2026-05-23", claimDate: "2026-05-18", documentFileName: "Budi_Santoso_Claim.pdf", pageCount: 3, reviewerName: "Sarah Rahman", status: "Reviewed", confidence: 97, department: "Claims" },
  { id: "CLM-1004", claimNumber: "CLM-1004", patientName: "Siti Nurlaila", provider: "Sentra Insurance Network", amount: 4120000, submittedAt: "2026-05-23", claimDate: null, documentFileName: "Siti_Nurlaila_Claim.pdf", pageCount: null, reviewerName: null, status: "Processing", confidence: 0, department: "Policy Ops" },
  { id: "CLM-1005", claimNumber: "CLM-1005", patientName: "Rizky Mahendra", provider: "Nusantara Assurance", amount: 1200000, submittedAt: "2026-05-22", claimDate: "2026-05-17", documentFileName: "Rizky_Mahendra_Claim.pdf", pageCount: 2, reviewerName: null, status: "Failed", confidence: 23, department: "Claims" },
];

export const users: UserRecord[] = [
  { id: "USR-01", name: "Alya Rahma", email: "alya@claimora.id", role: "Super Admin", department: "IT", status: "Active" },
  { id: "USR-02", name: "Fikri Ilham", email: "fikri@abbymed.id", role: "Insurance Admin", department: "Operations", status: "Active" },
  { id: "USR-03", name: "Dina Putri", email: "dina@abbymed.id", role: "Claims Adjuster", department: "Claims", status: "Invited" },
  { id: "USR-04", name: "Tono Wijaya", email: "tono@audit.id", role: "Auditor", department: "Audit", status: "Suspended" },
];

export const audits: AuditLog[] = [
  { id: "AUD-01", actor: "Alya Rahma", action: "Updated extracted field", target: "CLM-1002", timestamp: "2026-05-24 13:20", result: "Warning" },
  { id: "AUD-02", actor: "Dina Putri", action: "Marked claim reviewed", target: "CLM-1003", timestamp: "2026-05-24 12:10", result: "Success" },
  { id: "AUD-03", actor: "System", action: "OCR extraction failed", target: "CLM-1005", timestamp: "2026-05-24 11:44", result: "Failed" },
];

export const extractionJson = {
  claimId: "CLM-1002",
  patient: {
    name: "Rani Salsabila",
    policyNumber: "BPJS-8832812",
    diagnosis: "Acute bronchitis",
  },
  invoice: {
    number: "INV-99231",
    date: "2026-05-21",
    amount: 3280000,
    currency: "IDR",
  },
  procedures: [
    { code: "PROC-11", description: "Chest X-Ray", amount: 480000, confidence: 0.88 },
    { code: "PROC-17", description: "Nebulizer Therapy", amount: 360000, confidence: 0.56 },
  ],
};
