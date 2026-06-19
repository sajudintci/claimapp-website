"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ClipboardList,
  FolderOpen,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { UserAvatar } from "@/components/claimora/user-avatar";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const menuSections: NavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    title: "Claims",
    items: [
      { label: "Upload Claim", href: "/claims/upload", icon: Upload },
      { label: "All Claims", href: "/claims", icon: FolderOpen },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Audit Logs", href: "/audit-logs", icon: ClipboardList },
      { label: "Users", href: "/user-management/users", icon: Users },
      { label: "Departments", href: "/user-management/departments", icon: Building2 },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.href === "/claims") {
    return (
      pathname === "/claims" ||
      (pathname.startsWith("/claims/") && !pathname.startsWith("/claims/upload"))
    );
  }
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <Link
        href="/dashboard"
        className="mx-auto flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-sm font-bold text-white shadow-sm shadow-blue-600/25 transition-transform hover:scale-[1.02]"
        title="Claimora — Dashboard"
      >
        C
      </Link>
    );
  }

  return (
    <Link href="/dashboard" className="group flex items-center gap-3 rounded-xl px-1 py-0.5 transition-colors">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-sm font-bold text-white shadow-sm shadow-blue-600/25">
        C
      </span>
      <span className="min-w-0">
        <span className="block text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">Claimora</span>
        <span className="block truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
          Insurance Claim Intelligence
        </span>
      </span>
    </Link>
  );
}

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150",
        collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
        active
          ? collapsed
            ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
            : "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100",
      )}
    >
      {!collapsed && active ? (
        <span
          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-blue-600 dark:bg-blue-400"
          aria-hidden
        />
      ) : null}
      <Icon
        className={cn(
          "size-[18px] shrink-0 transition-colors",
          active
            ? collapsed
              ? "text-white"
              : "text-blue-600 dark:text-blue-400"
            : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300",
        )}
      />
      {!collapsed ? <span className="truncate">{item.label}</span> : <span className="sr-only">{item.label}</span>}
    </Link>
  );
}

export function AppSidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapse,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-[1px] transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onCloseMobile}
        aria-hidden={!mobileOpen}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-screen flex-col border-r border-slate-200/90 bg-white transition-[width,transform] duration-200 ease-out dark:border-slate-800 dark:bg-slate-950",
          "shadow-xl lg:sticky lg:top-0 lg:shadow-none",
          collapsed ? "w-[4.5rem]" : "w-64 xl:w-72",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex shrink-0 items-center border-b border-slate-100 px-3 py-4 dark:border-slate-800",
            collapsed ? "justify-center px-2" : "justify-between gap-2",
          )}
        >
          <SidebarBrand collapsed={collapsed} />
          <button
            type="button"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:hidden dark:hover:bg-slate-800 dark:hover:text-slate-200"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4" aria-label="Main navigation">
          <div className="space-y-6">
            {menuSections.map((section, sectionIndex) => (
              <div key={section.title}>
                {!collapsed ? (
                  <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
                    {section.title}
                  </p>
                ) : sectionIndex > 0 ? (
                  <div className="mx-auto mb-2 h-px w-6 bg-slate-200 dark:bg-slate-800" aria-hidden />
                ) : null}
                <ul className="space-y-0.5">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <NavLink
                        item={item}
                        active={isNavActive(pathname, item)}
                        collapsed={collapsed}
                        onNavigate={onCloseMobile}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-100 p-2 dark:border-slate-800">
          {!collapsed && user ? (
            <div className="mb-2 flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-900/60">
              <UserAvatar
                name={user.name}
                avatarUrl={user.avatarUrl}
                className="size-9 rounded-lg text-xs"
                textClassName="text-xs"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{user.role}</p>
                {user.department ? (
                  <p className="mt-0.5 truncate text-[10px] text-slate-400 dark:text-slate-500">{user.department}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          {onToggleCollapse ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cn(
                "hidden w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:flex dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
                collapsed && "justify-center px-2",
              )}
            >
              {collapsed ? (
                <PanelLeftOpen className="size-4 shrink-0" />
              ) : (
                <>
                  <PanelLeftClose className="size-4 shrink-0" />
                  <span>Collapse menu</span>
                </>
              )}
            </button>
          ) : null}
        </div>
      </aside>
    </>
  );
}
