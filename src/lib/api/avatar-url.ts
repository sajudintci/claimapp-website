import { API_BASE_URL } from "@/lib/api/client";

export function resolveAvatarUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) return avatarUrl;
  const origin = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${origin}${avatarUrl.startsWith("/") ? avatarUrl : `/${avatarUrl}`}`;
}
