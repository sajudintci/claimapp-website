"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { apiAuthedFetch } from "@/lib/api/client";
import {
  UserFormOptionsResponse,
  UserListItem,
} from "@/types/api";
import { cn } from "@/lib/utils";

export type UserFormMode = "create" | "edit";

type FormState = {
  name: string;
  email: string;
  password: string;
  departmentId: string;
  roleIds: string[];
  isActive: boolean;
};

const emptyForm = (): FormState => ({
  name: "",
  email: "",
  password: "",
  departmentId: "",
  roleIds: [],
  isActive: true,
});

function formFromUser(user: UserListItem): FormState {
  return {
    name: user.name,
    email: user.email,
    password: "",
    departmentId: user.departmentId ?? "",
    roleIds: user.roleIds ?? [],
    isActive: user.isActive,
  };
}

export function UserFormDialog({
  open,
  mode,
  user,
  onClose,
  onSaved,
}: {
  open: boolean;
  mode: UserFormMode;
  user?: UserListItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [options, setOptions] = useState<UserFormOptionsResponse | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(mode === "edit" && user ? formFromUser(user) : emptyForm());

    let cancelled = false;
    setLoadingOptions(true);
    apiAuthedFetch<UserFormOptionsResponse>("/users/form-options")
      .then((data) => {
        if (!cancelled) setOptions(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load form options");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingOptions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, mode, user]);

  if (!open) return null;

  function toggleRole(roleId: string) {
    setForm((prev) => {
      const has = prev.roleIds.includes(roleId);
      return {
        ...prev,
        roleIds: has
          ? prev.roleIds.filter((id) => id !== roleId)
          : [...prev.roleIds, roleId],
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required");
      return;
    }
    if (mode === "create" && form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (form.roleIds.length === 0) {
      setError("Select at least one role");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        email: form.email.trim(),
        departmentId: form.departmentId || null,
        roleIds: form.roleIds,
      };

      if (mode === "create") {
        body.password = form.password;
        await apiAuthedFetch("/users", {
          method: "POST",
          body: JSON.stringify(body),
        });
      } else if (user) {
        body.isActive = form.isActive;
        if (form.password.trim()) body.password = form.password;
        await apiAuthedFetch(`/users/${user.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-slate-900/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {mode === "create" ? "Add user" : "Edit user"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[min(70vh,640px)] overflow-y-auto px-5 py-4">
          {error ? (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800">
              {error}
            </p>
          ) : null}

          <div className="space-y-4">
            <Field label="Full name">
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inputClass}
                placeholder="Jane Doe"
              />
            </Field>

            <Field label="Email">
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={inputClass}
                placeholder="jane@company.com"
              />
            </Field>

            <Field
              label={mode === "create" ? "Password" : "New password (optional)"}
              hint={mode === "edit" ? "Leave blank to keep current password" : "Minimum 8 characters"}
            >
              <input
                type="password"
                required={mode === "create"}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className={inputClass}
                autoComplete={mode === "create" ? "new-password" : "off"}
              />
            </Field>

            <Field label="Department">
              <select
                value={form.departmentId}
                onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
                className={inputClass}
                disabled={loadingOptions}
              >
                <option value="">No department</option>
                {(options?.departments ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Roles">
              {loadingOptions ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Loading roles…</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(options?.roles ?? []).map((role) => {
                    const checked = form.roleIds.includes(role.id);
                    return (
                      <label
                        key={role.id}
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                          checked
                            ? "border-violet-300 bg-violet-50 text-violet-900 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-300"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="size-4 rounded border-slate-300"
                          checked={checked}
                          onChange={() => toggleRole(role.id)}
                        />
                        {role.name}
                      </label>
                    );
                  })}
                </div>
              )}
            </Field>

            {mode === "edit" ? (
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="size-4 rounded border-slate-300"
                />
                Account active (can sign in)
              </label>
            ) : null}
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || loadingOptions}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {saving ? "Saving…" : mode === "create" ? "Create user" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</label>
      {hint ? <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
