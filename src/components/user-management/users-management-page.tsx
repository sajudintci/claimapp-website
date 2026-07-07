"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Filter,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiAuthedFetch } from "@/lib/api/client";
import { UsersListResponse, UserListItem } from "@/types/api";
import { ErrorState } from "@/components/claimora/states";
import { UserFormDialog, type UserFormMode } from "@/components/user-management/user-form-dialog";
import {
  ManagementDialog,
  ManagementDialogButton,
} from "@/components/user-management/management-dialog";
import { mapUserDeleteErrorMessage } from "@/lib/user-management/user-delete-messages";
import {
  DataTable,
  DataTableBodyRow,
  DataTableHeadRow,
  DataTableScroll,
  Td,
  Th,
} from "@/components/ui/data-table";
import { cn } from "@/lib/utils";

type StatusFilter = "" | "active" | "inactive";

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "", label: "All users" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const PAGE_SIZE = 20;

const selectClassName =
  "h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200";

const dateInputClassName =
  "mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200";

const fieldLabelClassName =
  "block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";

function toLocalDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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
  const searchParams = useSearchParams();
  const { user: sessionUser } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<UserFormMode>("create");
  const [editingUser, setEditingUser] = useState<UserListItem | undefined>();
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<UserListItem | null>(null);
  const [selfDeleteBlocked, setSelfDeleteBlocked] = useState(false);

  useEffect(() => {
    const department = searchParams.get("department")?.trim();
    if (!department) return;
    setDepartmentFilter(department);
    setShowAdvancedFilters(true);
    setPage(1);
  }, [searchParams]);

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

  const roles = useMemo(() => {
    const names = new Set<string>();
    items.forEach((u) => {
      u.roles.forEach((role) => {
        if (role.trim()) names.add(role);
      });
    });
    return Array.from(names).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((row) => {
      if (statusFilter === "active" && !row.isActive) return false;
      if (statusFilter === "inactive" && row.isActive) return false;
      if (departmentFilter && row.departmentName !== departmentFilter) return false;
      if (roleFilter && !row.roles.includes(roleFilter)) return false;
      const joined = toLocalDateKey(row.createdAt);
      if (dateFrom && joined < dateFrom) return false;
      if (dateTo && joined > dateTo) return false;
      if (!needle) return true;
      return [row.name, row.email, row.departmentName, ...row.roles]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [items, search, statusFilter, departmentFilter, roleFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const advancedFilterCount = [departmentFilter, roleFilter, dateFrom, dateTo].filter(Boolean).length;
  const activeFilterCount = [
    search.trim(),
    statusFilter,
    departmentFilter,
    roleFilter,
    dateFrom,
    dateTo,
  ].filter(Boolean).length;

  function resetPage() {
    setPage(1);
  }

  function clearAllFilters() {
    setSearch("");
    setStatusFilter("");
    setDepartmentFilter("");
    setRoleFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

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

  function handleSaved(reactivated?: boolean) {
    if (reactivated) {
      toast.success("Inactive user reactivated with the new details");
    } else {
      toast.success(formMode === "create" ? "User created" : "User updated");
    }
    setRefreshKey((k) => k + 1);
    refetch();
  }

  function requestDelete(target: UserListItem) {
    if (target.id === sessionUser?.id) {
      setSelfDeleteBlocked(true);
      return;
    }
    setConfirmDeleteTarget(target);
  }

  async function confirmDelete() {
    const target = confirmDeleteTarget;
    if (!target) return;

    setDeletingId(target.id);
    try {
      await apiAuthedFetch(`/users/${target.id}`, { method: "DELETE" });
      toast.success(`${target.name} deactivated`);
      setConfirmDeleteTarget(null);
      setRefreshKey((k) => k + 1);
      refetch();
    } catch (err) {
      toast.error(
        mapUserDeleteErrorMessage(
          err instanceof Error ? err.message : "Failed to deactivate user",
        ),
      );
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

      <ManagementDialog
        open={selfDeleteBlocked}
        tone="warning"
        title="Can't deactivate your own account"
        description="For security, you cannot deactivate the account you are currently signed in with."
        onClose={() => setSelfDeleteBlocked(false)}
        footer={
          <ManagementDialogButton onClick={() => setSelfDeleteBlocked(false)}>
            Got it
          </ManagementDialogButton>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Ask another administrator to update or deactivate your account if needed.
        </p>
      </ManagementDialog>

      <ManagementDialog
        open={Boolean(confirmDeleteTarget)}
        tone="danger"
        title={`Deactivate ${confirmDeleteTarget?.name ?? "this user"}?`}
        description="The account will be disabled and cannot sign in. User data is kept for audit and can be re-enabled from Edit user."
        onClose={() => setConfirmDeleteTarget(null)}
        footer={
          <>
            <ManagementDialogButton onClick={() => setConfirmDeleteTarget(null)}>
              Cancel
            </ManagementDialogButton>
            <ManagementDialogButton
              variant="danger"
              disabled={Boolean(deletingId)}
              onClick={() => void confirmDelete()}
            >
              {deletingId ? "Deactivating…" : "Deactivate"}
            </ManagementDialogButton>
          </>
        }
      >
        {confirmDeleteTarget ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            <p className="font-medium">{confirmDeleteTarget.email}</p>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              {confirmDeleteTarget.departmentName
                ? `Department: ${confirmDeleteTarget.departmentName}`
                : "No department assigned"}
            </p>
          </div>
        ) : null}
      </ManagementDialog>

      <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <KpiCard label="Total users" value={summary.total} icon={Users} tone="blue" />
            <KpiCard label="Active" value={summary.active} icon={UserCheck} tone="emerald" />
            <KpiCard label="Inactive" value={summary.inactive} icon={UserMinus} tone="slate" />
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    resetPage();
                  }}
                  placeholder="Search name, email, role, department…"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                  aria-label="Search users"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="relative min-w-[9.5rem]">
                  <span className="sr-only">Filter by status</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as StatusFilter);
                      resetPage();
                    }}
                    className={selectClassName}
                  >
                    {STATUS_FILTERS.map((f) => (
                      <option key={f.value || "all"} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                </label>

                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters((open) => !open)}
                  aria-expanded={showAdvancedFilters}
                  className={cn(
                    "inline-flex h-11 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors",
                    showAdvancedFilters || advancedFilterCount > 0
                      ? "border-primary/20 bg-primary/10 text-primary-hover dark:border-primary/30 dark:bg-primary/15 dark:text-primary"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900",
                  )}
                >
                  <Filter className="size-4 text-slate-500" />
                  Advanced
                  {advancedFilterCount > 0 ? (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {advancedFilterCount}
                    </span>
                  ) : null}
                </button>

                {activeFilterCount > 0 ? (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                  >
                    <X className="size-4" />
                    Reset filters
                  </button>
                ) : null}
              </div>
            </div>

            {showAdvancedFilters ? (
              <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/40 sm:px-5">
                <p className="mb-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Filter by department, role, or account join date (createdAt).
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <label className={fieldLabelClassName}>
                    Department
                    <div className="relative mt-1.5">
                      <select
                        value={departmentFilter}
                        onChange={(e) => {
                          setDepartmentFilter(e.target.value);
                          resetPage();
                        }}
                        className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                      >
                        <option value="">All departments</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </label>
                  <label className={fieldLabelClassName}>
                    Role
                    <div className="relative mt-1.5">
                      <select
                        value={roleFilter}
                        onChange={(e) => {
                          setRoleFilter(e.target.value);
                          resetPage();
                        }}
                        className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                      >
                        <option value="">All roles</option>
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </label>
                  <label className={fieldLabelClassName}>
                    Joined from
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => {
                        setDateFrom(e.target.value);
                        resetPage();
                      }}
                      max={dateTo || undefined}
                      className={dateInputClassName}
                    />
                  </label>
                  <label className={fieldLabelClassName}>
                    Joined to
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => {
                        setDateTo(e.target.value);
                        resetPage();
                      }}
                      min={dateFrom || undefined}
                      className={dateInputClassName}
                    />
                  </label>
                </div>
                {activeFilterCount > 0 ? (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                    >
                      <X className="size-3.5" />
                      Reset filters
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeFilterCount > 0 ? (
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active:</span>
                {search.trim() ? (
                  <FilterChip
                    label={`Search: ${search.trim()}`}
                    onRemove={() => {
                      setSearch("");
                      resetPage();
                    }}
                  />
                ) : null}
                {statusFilter ? (
                  <FilterChip
                    label={STATUS_FILTERS.find((f) => f.value === statusFilter)?.label ?? statusFilter}
                    onRemove={() => {
                      setStatusFilter("");
                      resetPage();
                    }}
                  />
                ) : null}
                {departmentFilter ? (
                  <FilterChip
                    label={departmentFilter}
                    onRemove={() => {
                      setDepartmentFilter("");
                      resetPage();
                    }}
                  />
                ) : null}
                {roleFilter ? (
                  <FilterChip
                    label={roleFilter}
                    onRemove={() => {
                      setRoleFilter("");
                      resetPage();
                    }}
                  />
                ) : null}
                {dateFrom ? (
                  <FilterChip
                    label={`Joined from ${dateFrom}`}
                    onRemove={() => {
                      setDateFrom("");
                      resetPage();
                    }}
                  />
                ) : null}
                {dateTo ? (
                  <FilterChip
                    label={`Joined to ${dateTo}`}
                    onRemove={() => {
                      setDateTo("");
                      resetPage();
                    }}
                  />
                ) : null}
              </div>
            ) : null}

            {error ? (
              <div className="p-4 sm:p-5">
                <ErrorState message={error} />
              </div>
            ) : isLoading ? (
              <TableSkeleton embedded />
            ) : pageRows.length === 0 ? (
              <EmptyState
                hasUsers={items.length > 0}
                hasFilters={activeFilterCount > 0}
                onClearFilters={clearAllFilters}
              />
            ) : (
              <UsersTable
                rows={pageRows}
                currentUserId={sessionUser?.id}
                deletingId={deletingId}
                onEdit={openEdit}
                onDelete={requestDelete}
                page={page}
                totalPages={totalPages}
                totalFiltered={filtered.length}
                onPageChange={setPage}
                embedded
              />
            )}
          </section>
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
  embedded = false,
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
  embedded?: boolean;
}) {
  const content = (
    <>
      <DataTableScroll>
        <DataTable minWidth="min-w-[960px]">
          <thead>
            <DataTableHeadRow>
              <Th className="min-w-[220px]">User</Th>
              <Th className="min-w-[160px]">Role</Th>
              <Th className="min-w-[140px]">Department</Th>
              <Th className="min-w-[100px]">Status</Th>
              <Th className="min-w-[110px]">Joined</Th>
              <Th className="min-w-[160px] text-right">Actions</Th>
            </DataTableHeadRow>
          </thead>
          <tbody>
            {rows.map((user) => {
              const isSelf = user.id === currentUserId;
              const rolesLabel = user.roles.length > 0 ? user.roles.join(", ") : primaryRole(user.roles);
              return (
                <DataTableBodyRow key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                  <Td title={`${user.name} — ${user.email}`}>
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-800 dark:bg-violet-950 dark:text-violet-300">
                        {initials(user.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                          {user.name}
                          {isSelf ? (
                            <span className="ml-1.5 text-xs font-medium text-primary dark:text-primary">(you)</span>
                          ) : null}
                        </p>
                        <p className="flex min-w-0 items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
                          <Mail className="size-3 shrink-0" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td title={rolesLabel}>
                    <div className="flex max-w-[200px] flex-wrap gap-1">
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <span
                            key={role}
                            title={role}
                            className="inline-flex max-w-full truncate rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
                          >
                            {role}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">{primaryRole(user.roles)}</span>
                      )}
                    </div>
                  </Td>
                  <Td title={user.departmentName ?? undefined} className="text-slate-700 dark:text-slate-300">
                    <span className="block truncate">{user.departmentName ?? "—"}</span>
                  </Td>
                  <Td title={user.isActive ? "Active" : "Inactive"}>
                    <StatusBadge active={user.isActive} />
                  </Td>
                  <Td
                    title={new Date(user.createdAt).toLocaleDateString()}
                    className="whitespace-nowrap text-slate-600 dark:text-slate-400"
                  >
                    {new Date(user.createdAt).toLocaleDateString()}
                  </Td>
                  <Td align="right" className="last:border-r-0">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(user)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Pencil className="size-3" />
                        Edit
                      </button>
                      {!isSelf && user.isActive ? (
                        <button
                          type="button"
                          disabled={deletingId === user.id}
                          onClick={() => onDelete(user)}
                          title="Deactivate user account"
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50 dark:border-red-900 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900/60"
                        >
                          <Trash2 className="size-3" />
                          {deletingId === user.id ? "Deactivating…" : "Deactivate"}
                        </button>
                      ) : isSelf ? (
                        <button
                          type="button"
                          onClick={() => onDelete(user)}
                          title="You cannot deactivate your own account"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500"
                        >
                          <Trash2 className="size-3" />
                          Deactivate
                        </button>
                      ) : null}
                    </div>
                  </Td>
                </DataTableBodyRow>
              );
            })}
          </tbody>
        </DataTable>
      </DataTableScroll>
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
    </>
  );

  if (embedded) return content;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {content}
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
    blue: "bg-primary/10 text-primary-hover ring-primary/10 dark:bg-primary/15 dark:text-primary dark:ring-primary/30",
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

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1 rounded-lg bg-slate-100 py-1 pl-2.5 pr-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700"
    >
      {label}
      <X className="size-3 opacity-60" />
    </button>
  );
}

function EmptyState({
  hasUsers,
  hasFilters,
  onClearFilters,
}: {
  hasUsers: boolean;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <Users className="mb-3 size-10 text-slate-400 dark:text-slate-500" />
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {hasUsers ? "No users match your filters" : "No users in this organization"}
      </p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {hasUsers
          ? "Try adjusting search, status, or advanced filters."
          : "Users appear here once provisioned for your tenant."}
      </p>
      {hasFilters && onClearFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <X className="size-4" />
          Reset filters
        </button>
      ) : null}
    </div>
  );
}

function TableSkeleton({ embedded = false }: { embedded?: boolean }) {
  const rows = Array.from({ length: 5 }).map((_, i) => (
    <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
  ));

  if (embedded) {
    return <div className="space-y-2 p-4">{rows}</div>;
  }

  return (
    <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      {rows}
    </div>
  );
}
