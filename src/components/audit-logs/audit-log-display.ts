const FIELD_LABELS: Record<string, string> = {
  email: "Email",
  name: "Name",
  status: "Status",
  claimNumber: "Claim number",
  fileName: "File name",
  mimeType: "MIME type",
  extractionJobId: "Extraction job ID",
  ocrCreditsCharged: "OCR credits charged",
  llmStatus: "LLM status",
  avatarUrl: "Profile photo URL",
  avatarFileName: "Profile photo file",
  avatarUpdated: "Profile photo updated",
  avatarRemoved: "Profile photo removed",
  selfService: "Self-service update",
  isActive: "Active",
  roleIds: "Roles",
  departmentId: "Department ID",
};

export function stripAuditResult(
  data: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!data) return null;
  const { result: _result, ...rest } = data;
  return Object.keys(rest).length > 0 ? rest : null;
}

export function formatAuditFieldLabel(key: string): string {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    return value.length === 0 ? "—" : value.map(String).join(", ");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function collectAuditFieldKeys(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): string[] {
  const keys = new Set<string>();
  for (const key of Object.keys(before ?? {})) keys.add(key);
  for (const key of Object.keys(after ?? {})) keys.add(key);
  return Array.from(keys).sort();
}

export function auditValuesEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function isAuditUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//.test(value);
}
