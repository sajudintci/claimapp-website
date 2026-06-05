"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Menu,
  MoonStar,
  Settings,
  Sun,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { HeaderNotifications } from "@/components/claimora/header-notifications";
import { UserAvatar } from "@/components/claimora/user-avatar";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";

export { AppSidebar } from "@/components/claimora/app-sidebar";

const headerIconBtn =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white";

function HeaderIconButton({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button type="button" className={cn(headerIconBtn, className)} aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

const profileMenuItemClass =
  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800";

function ProfileMenuLink({
  href,
  onNavigate,
  children,
}: {
  href: string;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} onClick={onNavigate} className={profileMenuItemClass}>
      {children}
    </Link>
  );
}

export function TopNavbar({
  onSidebarToggle,
}: {
  onSidebarToggle: () => void;
}) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuOpen]);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors duration-200 dark:border-slate-800 dark:bg-slate-950 dark:shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
      <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
        <HeaderIconButton label="Toggle sidebar" onClick={onSidebarToggle}>
          <Menu className="size-[18px]" />
        </HeaderIconButton>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
          <div className="flex items-center gap-0.5 rounded-lg border border-slate-200/80 bg-slate-50/50 p-0.5 dark:border-slate-700 dark:bg-slate-900/50">
            <HeaderNotifications />

            <button
              type="button"
              className={cn(
                headerIconBtn,
                "h-8 w-8 bg-white shadow-sm dark:bg-slate-900",
                isDark && "text-amber-400 hover:text-amber-300",
              )}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-pressed={isDark}
              onClick={toggleTheme}
            >
              {isDark ? <Sun className="size-[17px]" /> : <MoonStar className="size-[17px]" />}
            </button>
          </div>

          <div className="mx-1.5 hidden h-6 w-px bg-slate-200 dark:bg-slate-700 sm:block" aria-hidden="true" />

          <div ref={profileRef} className="relative">
            <button
              type="button"
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200/80 bg-white pl-1 pr-2.5 text-left shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800",
                profileMenuOpen && "border-primary/30 bg-primary-50/40 dark:border-primary/40 dark:bg-primary/10",
              )}
              aria-label="Profile menu"
              aria-expanded={profileMenuOpen}
              onClick={() => setProfileMenuOpen((v) => !v)}
            >
              <UserAvatar
                name={user?.name ?? "User"}
                avatarUrl={user?.avatarUrl}
                className="size-7 rounded-md text-[11px]"
                textClassName="text-[11px]"
              />
              <div className="hidden leading-tight md:block">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{user?.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{user?.role}</p>
              </div>
              <ChevronDown
                className={cn("size-4 text-slate-400 transition-transform", profileMenuOpen && "rotate-180")}
              />
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
                <div className="border-b border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/80">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">{user?.department}</p>
                </div>
                <div className="p-1">
                  <ProfileMenuLink href="/profile" onNavigate={() => setProfileMenuOpen(false)}>
                    <User className="size-4 shrink-0 text-slate-400" />
                    My Profile
                  </ProfileMenuLink>
                  <ProfileMenuLink href="/settings" onNavigate={() => setProfileMenuOpen(false)}>
                    <Settings className="size-4 shrink-0 text-slate-400" />
                    Account Settings
                  </ProfileMenuLink>
                  <button
                    type="button"
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      logout();
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          <HeaderIconButton label="Help" className="hidden lg:inline-flex">
            <CircleHelp className="size-[17px]" />
          </HeaderIconButton>
        </div>
      </div>
    </header>
  );
}

export function PageHeader({ title, description }: { title: string; description: string }) {
  const pathname = usePathname();
  const crumbs = useMemo(() => pathname.split("/").filter(Boolean), [pathname]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <span>Sequis</span>
        {crumbs.map((crumb) => (
          <span key={crumb} className="inline-flex items-center gap-1">
            <ChevronRight className="size-3" />
            {crumb.replace("-", " ")}
          </span>
        ))}
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  );
}
