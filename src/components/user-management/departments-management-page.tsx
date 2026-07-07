"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Building2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiAuthedFetch } from "@/lib/api/client";
import { DepartmentListItem, DepartmentsListResponse } from "@/types/api";
import { ErrorState } from "@/components/claimora/states";
import {
  DepartmentFormDialog,
  type DepartmentFormMode,
} from "@/components/user-management/department-form-dialog";
import {
  ManagementDialog,
  ManagementDialogButton,
} from "@/components/user-management/management-dialog";
import { mapDepartmentDeleteErrorMessage } from "@/lib/user-management/user-delete-messages";
import {
  DataTable,
  DataTableBodyRow,
  DataTableHeadRow,
  DataTableScroll,
  Td,
  Th,
} from "@/components/ui/data-table";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

export function DepartmentsManagementPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<DepartmentFormMode>("create");
  const [editing, setEditing] = useState<DepartmentListItem | undefined>();
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<DepartmentListItem | null>(null);
  const [blockedDeleteTarget, setBlockedDeleteTarget] = useState<DepartmentListItem | null>(null);

  const { data, isLoading, error, refetch } = useApiQuery(
    () => apiAuthedFetch<DepartmentsListResponse>("/departments"),
    [refreshKey],
  );

  const items = data?.items ?? [];
  const summary = data?.summary ?? {
    total: items.length,
    withUsers: items.filter((d) => d.userCount > 0).length,
    empty: items.filter((d) => d.userCount === 0).length,
  };

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((row) => row.name.toLowerCase().includes(needle));
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openCreate() {
    setFormMode("create");
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(target: DepartmentListItem) {
    setFormMode("edit");
    setEditing(target);
    setFormOpen(true);
  }

  function handleSaved() {
    toast.success(formMode === "create" ? "Department created" : "Department updated");
    setRefreshKey((k) => k + 1);
    refetch();
  }

  function requestDelete(target: DepartmentListItem) {
    if (target.userCount > 0) {
      setBlockedDeleteTarget(target);
      return;
    }
    setConfirmDeleteTarget(target);
  }

  async function confirmDelete() {
    const target = confirmDeleteTarget;
    if (!target) return;

    setDeletingId(target.id);
    try {
      await apiAuthedFetch(`/departments/${target.id}`, { method: "DELETE" });
      toast.success(`"${target.name}" deleted`);
      setConfirmDeleteTarget(null);
      setRefreshKey((k) => k + 1);
      refetch();
    } catch (err) {
      toast.error(
        mapDepartmentDeleteErrorMessage(
          err instanceof Error ? err.message : "Failed to delete department",
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
            <span className="text-slate-600 dark:text-slate-400">Departments</span>
          </nav>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Department management
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Create and organize departments for your team. Departments appear when assigning users.
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
            Add department
          </button>
        </div>
      </header>

      <DepartmentFormDialog
        open={formOpen}
        mode={formMode}
        department={editing}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ManagementDialog
        open={Boolean(blockedDeleteTarget)}
        tone="warning"
        title={`Can't delete "${blockedDeleteTarget?.name ?? ""}"`}
        description="This department still has users assigned. Reassign them to another department before deleting."
        onClose={() => setBlockedDeleteTarget(null)}
        footer={
          <>
            <ManagementDialogButton onClick={() => setBlockedDeleteTarget(null)}>
              Cancel
            </ManagementDialogButton>
            <ManagementDialogButton
              variant="primary"
              onClick={() => {
                const name = blockedDeleteTarget?.name;
                setBlockedDeleteTarget(null);
                if (name) {
                  router.push(
                    `/user-management/users?department=${encodeURIComponent(name)}`,
                  );
                }
              }}
            >
              View assigned users
            </ManagementDialogButton>
          </>
        }
      >
        {blockedDeleteTarget ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <p className="font-semibold">
              {blockedDeleteTarget.userCount} user
              {blockedDeleteTarget.userCount === 1 ? "" : "s"} still in this department
            </p>
            <p className="mt-1 text-amber-800/90 dark:text-amber-300/90">
              Open the Users page, edit each user, and change their department. Then return here to
              delete <span className="font-medium">{blockedDeleteTarget.name}</span>.
            </p>
          </div>
        ) : null}
      </ManagementDialog>

      <ManagementDialog
        open={Boolean(confirmDeleteTarget)}
        tone="danger"
        title={`Delete "${confirmDeleteTarget?.name ?? ""}"?`}
        description="This permanently removes the department. This action cannot be undone."
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
              {deletingId ? "Deleting…" : "Delete department"}
            </ManagementDialogButton>
          </>
        }
      />

      <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <KpiCard label="Total departments" value={summary.total} icon={Building2} tone="blue" />
            <KpiCard label="With users" value={summary.withUsers} icon={Users} tone="emerald" />
            <KpiCard label="Empty" value={summary.empty} icon={Building2} tone="slate" />
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
                placeholder="Search departments…"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
          </section>

          {error ? (
            <ErrorState message={error} />
          ) : isLoading ? (
            <TableSkeleton />
          ) : pageRows.length === 0 ? (
            <EmptyState hasItems={items.length > 0} onAdd={openCreate} />
          ) : (
            <DepartmentsTable
              rows={pageRows}
              deletingId={deletingId}
              onEdit={openEdit}
              onDelete={requestDelete}
              page={page}
              totalPages={totalPages}
              totalFiltered={filtered.length}
              onPageChange={setPage}
            />
          )}
      </div>
    </div>
  );
}

function DepartmentsTable({
  rows,
  deletingId,
  onEdit,
  onDelete,
  page,
  totalPages,
  totalFiltered,
  onPageChange,
}: {
  rows: DepartmentListItem[];
  deletingId: string | null;
  onEdit: (dept: DepartmentListItem) => void;
  onDelete: (dept: DepartmentListItem) => void;
  page: number;
  totalPages: number;
  totalFiltered: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <DataTableScroll>
        <DataTable minWidth="min-w-[720px]">
          <thead>
            <DataTableHeadRow>
              <Th className="min-w-[200px]">Department</Th>
              <Th className="min-w-[100px]">Users</Th>
              <Th className="min-w-[120px]">Created</Th>
              <Th className="min-w-[160px] text-right">Actions</Th>
            </DataTableHeadRow>
          </thead>
          <tbody>
            {rows.map((dept) => {
              const createdLabel = new Date(dept.createdAt).toLocaleDateString();
              const usersLabel = `${dept.userCount} user${dept.userCount === 1 ? "" : "s"}`;
              return (
              <DataTableBodyRow key={dept.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                <Td title={dept.name}>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary-hover ring-1 ring-primary/10 dark:bg-primary/15 dark:text-primary dark:ring-primary/30">
                      <Building2 className="size-4" />
                    </div>
                    <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{dept.name}</p>
                  </div>
                </Td>
                <Td title={usersLabel}>
                  <span
                    className={cn(
                      "inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1",
                      dept.userCount > 0
                        ? "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800"
                        : "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700",
                    )}
                  >
                    {usersLabel}
                  </span>
                </Td>
                <Td title={createdLabel} className="whitespace-nowrap text-slate-600 dark:text-slate-400">
                  {createdLabel}
                </Td>
                <Td align="right" className="last:border-r-0">
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(dept)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Pencil className="size-3" />
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === dept.id}
                      onClick={() => onDelete(dept)}
                      title={
                        dept.userCount > 0
                          ? `${dept.userCount} user(s) assigned — reassign before deleting`
                          : "Delete department"
                      }
                      className={cn(
                        "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50",
                        dept.userCount > 0
                          ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900/60"
                          : "border-red-200 bg-red-50 text-red-800 hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900/60",
                      )}
                    >
                      <Trash2 className="size-3" />
                      {deletingId === dept.id ? "Deleting…" : "Delete"}
                    </button>
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
          Page {page} of {totalPages} · {totalFiltered} department
          {totalFiltered === 1 ? "" : "s"}
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

function EmptyState({ hasItems, onAdd }: { hasItems: boolean; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/50">
      <Building2 className="mb-3 size-10 text-slate-400 dark:text-slate-500" />
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {hasItems ? "No departments match your search" : "No departments yet"}
      </p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {hasItems
          ? "Clear search to see all departments."
          : "Create your first department to organize users."}
      </p>
      {!hasItems ? (
        <button
          type="button"
          onClick={onAdd}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <Plus className="size-4" />
          Add department
        </button>
      ) : null}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
      ))}
    </div>
  );
}
