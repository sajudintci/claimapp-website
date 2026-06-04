"use client";

import { useAuth } from "@/contexts/auth-context";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function PlatformAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb]">
        <p className="text-sm text-slate-500">Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}

const AUTH_PUBLIC_PATHS = ["/unauthorized", "/session-expired"];

export function GuestAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const allowWhenAuthenticated = AUTH_PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !allowWhenAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, allowWhenAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb]">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  if (isAuthenticated && !allowWhenAuthenticated) {
    return null;
  }

  return children;
}
