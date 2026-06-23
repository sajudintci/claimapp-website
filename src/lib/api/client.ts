import { generateId } from "@/lib/utils";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:4000/api";

type ApiOptions = RequestInit & {
  token?: string;
};

type StandardApiResponse<T> = {
  success: boolean;
  code: string;
  message: string;
  data: T;
  error: unknown;
  meta: unknown;
};

function redirectToLoginOnUnauthorized(path: string) {
  if (typeof window === "undefined") return;
  if (path.startsWith("/auth/login")) return;

  try {
    localStorage.removeItem("claimora_session");
  } catch {
    // ignore storage errors
  }

  const redirect = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
  window.location.replace(`/login?redirect=${redirect}&reason=session-expired`);
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, body, ...rest } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const requestHeaders = new Headers(headers);
  const requestId = generateId();

  requestHeaders.set("x-request-id", requestId);
  if (!isFormData && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    body,
    headers: requestHeaders
  });

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 401) {
      redirectToLoginOnUnauthorized(path);
    }
    try {
      const parsed = JSON.parse(text) as Partial<StandardApiResponse<unknown>>;
      throw new Error(parsed.message || `Request failed: ${response.status}`);
    } catch {
      throw new Error(text || `Request failed: ${response.status}`);
    }
  }

  if (response.status === 204) return undefined as T;
  const payload = (await response.json()) as StandardApiResponse<T> | T;
  if (
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    "data" in payload
  ) {
    return (payload as StandardApiResponse<T>).data;
  }
  return payload as T;
}

export function getSessionToken() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("claimora_session");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { accessToken?: string };
    return parsed.accessToken ?? null;
  } catch {
    return null;
  }
}

export async function apiAuthedFetch<T>(path: string, options: ApiOptions = {}) {
  const token = options.token ?? getSessionToken();
  if (!token) {
    redirectToLoginOnUnauthorized(path);
    throw new Error("Unauthorized");
  }
  return apiFetch<T>(path, { ...options, token });
}

export async function apiAuthedUpload<T>(path: string, formData: FormData, options: ApiOptions = {}) {
  const token = options.token ?? getSessionToken();
  if (!token) {
    redirectToLoginOnUnauthorized(path);
    throw new Error("Unauthorized");
  }
  return apiFetch<T>(path, {
    ...options,
    method: options.method ?? "POST",
    body: formData,
    token,
  });
}
