import { API_BASE_URL, getSessionToken } from "@/lib/api/client";
import { ClaimStatus } from "@/types/claim";

type ExportClaimsParams = {
  status?: ClaimStatus | "";
  q?: string;
  reviewer?: "" | "unassigned" | string;
};

export async function exportClaimsCsv(params: ExportClaimsParams): Promise<void> {
  const token = getSessionToken();
  if (!token) throw new Error("Unauthorized");

  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.q) searchParams.set("q", params.q);
  if (params.reviewer === "unassigned") searchParams.set("reviewer", "unassigned");
  else if (params.reviewer) searchParams.set("reviewer", params.reviewer);

  const response = await fetch(`${API_BASE_URL}/claims/export?${searchParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Export failed: ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "claims-export.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
