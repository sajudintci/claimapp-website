"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Building2,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiAuthedFetch } from "@/lib/api/client";
import { UsersListResponse, UserListItem } from "@/types/api";
import { ErrorState } from "@/components/claimora/states";
import { UserFormDialog, type UserFormMode } from "@/components/user-management/user-form-dialog";
import { cn } from "@/lib/utils";

type StatusFilter = "" | "active" | "inactive";

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "", label: "All users" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const PAGE_SIZE = 20;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function primaryRole(roles: string[]): string {
  return roles[0] ?? "No role assigned";
}

export function UsersManagementPage() {
  const { user: sessionUser } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<UserFormMode>("create");
  const [editingUser, setEditingUser] = useState<UserListItem | undefined>();

  const { data, isLoading, error, refetch } = useApiQuery(
    () => apiAuthedFetch<UsersListResponse>("/users"),
    [refreshKey],
  );

  const items = data?.items ?? [];
  const summary = data?.summary ?? {
    total: items.length,
    active: items.filter((u) => u.isActive).length,
    inactive: items.filter((u) => !u.isActive).length,
  };

  const departments = useMemo(() => {
    const names = new Set<string>();
    items.forEach((u) => {
      if (u.departmentName) names.add(u.departmentName);
    });
    return Array.from(names).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((row) => {
      if (statusFilter === "active" && !row.isActive) return false;
      if (statusFilter === "inactive" && row.isActive) return false;
      if (departmentFilter && row.departmentName !== departmentFilter) return false;
      if (!needle) return true;
      return [row.name, row.email, row.departmentName, ...row.roles]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [items, search, statusFilter, departmentFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openCreate() {
    setFormMode("create");
    setEditingUser(undefined);
    setFormOpen(true);
  }

  function openEdit(target: UserListItem) {
    setFormMode("edit");
    setEditingUser(target);
    setFormOpen(true);
  }

  function handleSaved() {
    toast.success(formMode === "create" ? "User created" : "User updated");
    setRefreshKey((k) => k + 1);
    refetch();
  }

  async function handleDelete(target: UserListItem) {
    if (target.id === sessionUser?.id) {
      toast.error("You cannot delete your own account");
      return;
    }
    if (
      !window.confirm(
        `Remove ${target.name}? They will be deactivated and cannot sign in until re-enabled.`,
      )
    ) {
      return;
    }

    setDeletingId(target.id);
    try {
      await apiAuthedFetch(`/users/${target.id}`, { method: "DELETE" });
      toast.success(`${target.name} removed`);
      setRefreshKey((k) => k + 1);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove user");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <nav className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">Administration</span>
            <span className="mx-1 text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-600 dark:text-slate-400">Users</span>
          </nav>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            User management
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Manage team access for your organization. Review roles, departments, and account
            status in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setRefreshKey((k) => k + 1);
              refetch();
            }}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className="size-4" />
            Refresh
          </button>
          <Link
            href="/audit-logs"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Shield className="size-4" />
            Audit logs
          </Link>
          <Link
            href="/user-management/departments"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Building2 className="size-4" />
            Departments
          </Link>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <Plus className="size-4" />
            Add user
          </button>
        </div>
      </header>

      <UserFormDialog
        open={formOpen}
        mode={formMode}
        user={editingUser}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="grid gap-3 sm:grid-cols-3">
            <KpiCard label="Total users" value={summary.total} icon={Users} tone="blue" />
            <KpiCard label="Active" value={summary.active} icon={UserCheck} tone="emerald" />
            <KpiCard label="Inactive" value={summary.inactive} icon={UserMinus} tone="slate" />
          </div>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name, email, role, department…"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((f) => (
                <FilterPill
                  key={f.value}
                  active={statusFilter === f.value}
                  onClick={() => {
                    setStatusFilter(f.value);
                    setPage(1);
                  }}
                >
                  {f.label}
                </FilterPill>
              ))}
            </div>
            {departments.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <FilterPill
                  active={departmentFilter === ""}
                  onClick={() => {
                    setDepartmentFilter("");
                    setPage(1);
                  }}
                  subtle
                >
                  All departments
                </FilterPill>
                {departments.map((dept) => (
                  <FilterPill
                    key={dept}
                    active={departmentFilter === dept}
                    onClick={() => {
                      setDepartmentFilter(dept);
                      setPage(1);
                    }}
                    subtle
                  >
                    {dept}
                  </FilterPill>
                ))}
              </div>
            ) : null}
          </section>

          {error ? (
            <ErrorState message={error} />
          ) : isLoading ? (
            <TableSkeleton />
          ) : pageRows.length === 0 ? (
            <EmptyState hasUsers={items.length > 0} />
          ) : (
            <UsersTable
              rows={pageRows}
              currentUserId={sessionUser?.id}
              deletingId={deletingId}
              onEdit={openEdit}
              onDelete={handleDelete}
              page={page}
              totalPages={totalPages}
              totalFiltered={filtered.length}
              onPageChange={setPage}
            />
          )}
        </div>

        <aside className="space-y-4">
          <AdminGuideCard onAddUser={openCreate} />
        </aside>
      </div>
    </div>
  );
}

function UsersTable({
  rows,
  currentUserId,
  deletingId,
  onEdit,
  onDelete,
  page,
  totalPages,
  totalFiltered,
  onPageChange,
}: {
  rows: UserListItem[];
  currentUserId?: string;
  deletingId: string | null;
  onEdit: (user: UserListItem) => void;
  onDelete: (user: UserListItem) => void;
  page: number;
  totalPages: number;
  totalFiltered: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-[880px] w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-800/50">
              <Th>User</Th>
              <Th>Role</Th>
              <Th>Department</Th>
              <Th>Status</Th>
              <Th>Joined</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((user) => {
              const isSelf = user.id === currentUserId;
              return (
                <tr
                  key={user.id}
                  className="border-b border-slate-50 transition-colors hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-800 dark:bg-violet-950 dark:text-violet-300">
                        {initials(user.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {user.name}
                          {isSelf ? (
                            <span className="ml-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">(you)</span>
                          ) : null}
                        </p>
                        <p className="flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
                          <Mail className="size-3 shrink-0" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <span
                            key={role}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
                          >
                            {role}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">{primaryRole(user.roles)}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                    {user.departmentName ?? "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge active={user.isActive} />
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(user)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Pencil className="size-3" />
                        Edit
                      </button>
                      {!isSelf ? (
                        <button
                          type="button"
                          disabled={deletingId === user.id}
                          onClick={() => onDelete(user)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50 dark:border-red-900 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900/60"
                        >
                          <Trash2 className="size-3" />
                          {deletingId === user.id ? "Removing…" : "Delete"}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Page {page} of {totalPages} · {totalFiltered} user{totalFiltered === 1 ? "" : "s"}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1",
        active
          ? "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800"
          : "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700",
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "blue" | "emerald" | "slate";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900",
    slate: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  };

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className={cn("inline-flex size-9 items-center justify-center rounded-xl ring-1", tones[tone])}>
        <Icon className="size-4" />
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
    </article>
  );
}

function FilterPill({
  children,
  active,
  onClick,
  subtle,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  subtle?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
        active && !subtle && "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900",
        active && subtle && "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-300",
        !active && !subtle && "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
        !active && subtle && "bg-slate-50 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-400 dark:ring-slate-700 dark:hover:bg-slate-800",
      )}
    >
      {children}
    </button>
  );
}

function AdminGuideCard({ onAddUser }: { onAddUser: () => void }) {
  const tips = [
    "Add users with email, password, department, and at least one role.",
    "Delete deactivates the account; use Edit to re-enable inactive users.",
    "Create, update, and delete actions are recorded in Audit logs.",
  ];

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Admin notes</h2>
      <ul className="mt-3 space-y-2">
        {tips.map((text) => (
          <li key={text} className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            {text}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onAddUser}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
      >
        <Plus className="size-4" />
        Add user
      </button>
    </section>
  );
}

function EmptyState({ hasUsers }: { hasUsers: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/50">
      <Users className="mb-3 size-10 text-slate-400 dark:text-slate-500" />
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {hasUsers ? "No users match your filters" : "No users in this organization"}
      </p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {hasUsers
          ? "Clear search or filters to see the full team list."
          : "Users appear here once provisioned for your tenant."}
      </p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
      ))}
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400",
        className,
      )}
    >
      {children}
    </th>
  );
}
