import { API_BASE_URL, getSessionToken } from "@/lib/api/client";

export type PaginationMeta = {
  page: number;
  limit: number;
  totalRows: number;
  totalPages: number;
};

type StandardApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  meta?: { pagination?: PaginationMeta };
};

export async function apiAuthedFetchPaginated<TData>(
  path: string,
  init?: RequestInit,
): Promise<{ data: TData; pagination?: PaginationMeta }> {
  const token = getSessionToken();
  if (!token) throw new Error("Unauthorized");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    try {
      const parsed = JSON.parse(text) as { message?: string };
      throw new Error(parsed.message || `Request failed: ${response.status}`);
    } catch {
      throw new Error(text || `Request failed: ${response.status}`);
    }
  }

  const payload = (await response.json()) as StandardApiResponse<TData>;
  return {
    data: payload.data,
    pagination: payload.meta?.pagination,
  };
}
