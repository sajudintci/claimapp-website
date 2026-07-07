"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ChevronDown,
  ClipboardList,
  FolderOpen,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  ScanText,
  Settings,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { UserAvatar } from "@/components/claimora/user-avatar";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

type NavGroup = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  children: NavItem[];
};

type NavEntry = NavItem | NavGroup;

function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

type NavSection = {
  title: string;
  items: NavEntry[];
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
      {
        label: "Settings",
        href: "/settings/organization",
        icon: Settings,
        children: [
          { label: "Organization", href: "/settings/organization", icon: Building2 },
          { label: "OCR Credits", href: "/settings/ocr-credits", icon: ScanText },
        ],
      },
    ],
  },
];

function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.href === "/claims") {
    return (
      pathname === "/claims" ||
      (pathname.startsWith("/claims/") && !pathname.startsWith("/claims/upload"))
    );
  }
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function isNavGroupActive(pathname: string, group: NavGroup): boolean {
  return group.children.some((child) => isNavItemActive(pathname, child));
}

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <Link
        href="/dashboard"
        className="mx-auto flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-hover text-sm font-bold text-white shadow-sm shadow-primary/25 transition-transform hover:scale-[1.02]"
        title="Sequis — Dashboard"
      >
        S
      </Link>
    );
  }

  return (
    <Link href="/dashboard" className="group flex items-center gap-3 rounded-xl px-1 py-0.5 transition-colors">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-hover text-sm font-bold text-white shadow-sm shadow-primary/25">
        S
      </span>
      <span className="min-w-0">
        <span className="block text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">Sequis</span>
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
  nested,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  nested?: boolean;
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
        collapsed ? "justify-center px-2 py-2.5" : nested ? "px-3 py-2 pl-9" : "px-3 py-2",
        active
          ? collapsed
            ? "bg-primary text-white shadow-sm shadow-primary/20"
            : "bg-primary/10 text-primary-hover dark:bg-primary/15 dark:text-primary"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100",
      )}
    >
      {!collapsed && active && !nested ? (
        <span
          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary dark:bg-primary"
          aria-hidden
        />
      ) : null}
      <Icon
        className={cn(
          nested ? "size-4" : "size-[18px]",
          "shrink-0 transition-colors",
          active
            ? collapsed
              ? "text-white"
              : "text-primary dark:text-primary"
            : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300",
        )}
      />
      {!collapsed ? <span className="truncate">{item.label}</span> : <span className="sr-only">{item.label}</span>}
    </Link>
  );
}

function NavGroupMenu({
  group,
  pathname,
  collapsed,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const groupActive = isNavGroupActive(pathname, group);
  const [open, setOpen] = useState(groupActive);
  const Icon = group.icon;

  useEffect(() => {
    if (groupActive) setOpen(true);
  }, [groupActive]);

  if (collapsed) {
    return (
      <NavLink
        item={{ label: group.label, href: group.href, icon: group.icon }}
        active={groupActive}
        collapsed
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-all duration-150",
          groupActive
            ? "bg-primary/10 text-primary-hover dark:bg-primary/15 dark:text-primary"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100",
        )}
        aria-expanded={open}
      >
        {groupActive ? (
          <span
            className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary dark:bg-primary"
            aria-hidden
          />
        ) : null}
        <Icon
          className={cn(
            "size-[18px] shrink-0 transition-colors",
            groupActive
              ? "text-primary dark:text-primary"
              : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300",
          )}
        />
        <span className="min-w-0 flex-1 truncate">{group.label}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-slate-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <ul className="mt-0.5 space-y-0.5">
          {group.children.map((child) => (
            <li key={child.href}>
              <NavLink
                item={child}
                active={isNavItemActive(pathname, child)}
                collapsed={false}
                nested
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
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
                  {section.items.map((entry) => (
                    <li key={isNavGroup(entry) ? entry.label : entry.href}>
                      {isNavGroup(entry) ? (
                        <NavGroupMenu
                          group={entry}
                          pathname={pathname}
                          collapsed={collapsed}
                          onNavigate={onCloseMobile}
                        />
                      ) : (
                        <NavLink
                          item={entry}
                          active={isNavItemActive(pathname, entry)}
                          collapsed={collapsed}
                          onNavigate={onCloseMobile}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

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
