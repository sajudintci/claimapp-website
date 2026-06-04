"use client";

import { apiFetch } from "@/lib/api/client";
import { clearStoredSession, getStoredSession, setStoredSession } from "@/lib/auth/session";
import { AuthSession, AuthUser } from "@/types/auth";
import { UserListItem } from "@/types/api";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  logout: () => Promise<void>;
  refreshProfile: (profile: UserListItem) => void;
};

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    organizationId: string;
  };
};

const AuthContext = createContext<AuthContextValue | null>(null);

function guessInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

function authUserFromProfile(profile: UserListItem, organizationId?: string): AuthUser {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    organizationId,
    role: profile.roles[0] ?? "No role assigned",
    department: profile.departmentName ?? "—",
    initials: guessInitials(profile.name),
    avatarUrl: profile.avatarUrl,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredSession();
    setSession(stored);
    setIsLoading(false);

    if (!stored?.accessToken) return;

    apiFetch<UserListItem>("/users/me", { token: stored.accessToken })
      .then((profile) => {
        setSession((current) => {
          if (!current) return current;
          const next: AuthSession = {
            ...current,
            user: authUserFromProfile(profile, current.user.organizationId),
          };
          setStoredSession(next);
          return next;
        });
      })
      .catch(() => {
        // keep session with basic login fields if profile fetch fails
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      const user: AuthUser = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        organizationId: result.user.organizationId,
        role: "Authenticated User",
        department: "—",
        initials: guessInitials(result.user.name),
      };

      const nextSession: AuthSession = {
        user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };

      setStoredSession(nextSession);
      setSession(nextSession);

      try {
        const profile = await apiFetch<UserListItem>("/users/me", {
          token: result.accessToken,
        });
        const enriched: AuthSession = {
          ...nextSession,
          user: authUserFromProfile(profile, result.user.organizationId),
        };
        setStoredSession(enriched);
        setSession(enriched);
      } catch {
        // basic user fields already set
      }

      return { ok: true as const };
    } catch {
      return { ok: false as const, message: "Invalid email or password." };
    }
  }, []);

  const refreshProfile = useCallback((profile: UserListItem) => {
    setSession((current) => {
      if (!current) return current;
      const next: AuthSession = {
        ...current,
        user: authUserFromProfile(profile, current.user.organizationId),
      };
      setStoredSession(next);
      return next;
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      if (session?.refreshToken) {
        await apiFetch("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken: session.refreshToken })
        });
      }
    } catch {
      // ignore logout network errors in client session cleanup
    }

    clearStoredSession();
    setSession(null);
    router.push("/login");
  }, [router, session]);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      isLoading,
      isAuthenticated: Boolean(session?.accessToken),
      login,
      logout,
      refreshProfile,
    }),
    [session, isLoading, login, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
