"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Calendar,
  Camera,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiAuthedFetch, apiAuthedUpload } from "@/lib/api/client";
import { UserListItem } from "@/types/api";
import { ErrorState } from "@/components/claimora/states";
import { UserAvatar } from "@/components/claimora/user-avatar";
import { cn } from "@/lib/utils";
import { useRef } from "react";

type ProfileForm = {
  name: string;
  email: string;
  password: string;
};

function toForm(profile: UserListItem): ProfileForm {
  return {
    name: profile.name,
    email: profile.email,
    password: "",
  };
}

const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100";

export function ProfilePageContent() {
  const { refreshProfile } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [form, setForm] = useState<ProfileForm | null>(null);

  const { data: profile, isLoading, error, refetch } = useApiQuery(
    () => apiAuthedFetch<UserListItem>("/users/me"),
    [refreshKey],
  );

  useEffect(() => {
    if (profile) setForm(toForm(profile));
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;

    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string> = {
        name: form.name.trim(),
        email: form.email.trim(),
      };
      if (form.password.trim()) body.password = form.password;

      const updated = await apiAuthedFetch<UserListItem>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(body),
      });

      refreshProfile(updated);
      setForm({ ...toForm(updated), password: "" });
      toast.success("Profile updated");
      setRefreshKey((k) => k + 1);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Use JPEG, PNG, or WebP image");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be 2 MB or smaller");
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const updated = await apiAuthedUpload<UserListItem>("/users/me/avatar", formData);
      refreshProfile(updated);
      toast.success("Profile photo updated");
      setRefreshKey((k) => k + 1);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleAvatarRemove() {
    if (!profile?.avatarUrl) return;
    setUploadingAvatar(true);
    try {
      const updated = await apiAuthedFetch<UserListItem>("/users/me/avatar", { method: "DELETE" });
      refreshProfile(updated);
      toast.success("Profile photo removed");
      setRefreshKey((k) => k + 1);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove photo");
    } finally {
      setUploadingAvatar(false);
    }
  }

  const primaryRole = profile?.roles[0] ?? "—";

  return (
    <div className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <nav className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">Account</span>
            <span className="mx-1 text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-600 dark:text-slate-400">My profile</span>
          </nav>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            My profile
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            View and update your personal account details. Role and department are managed by your
            administrator.
          </p>
        </div>
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
      </header>

      {error ? <ErrorState message={error} /> : null}

      {isLoading || !profile || !form ? (
        <ProfileSkeleton />
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <aside className="space-y-4 lg:col-span-1">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <ProfileAvatarEditor
                name={profile.name}
                avatarUrl={profile.avatarUrl}
                uploading={uploadingAvatar}
                onUpload={handleAvatarUpload}
                onRemove={handleAvatarRemove}
              />
              <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">{profile.name}</h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{profile.email}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {profile.roles.length > 0 ? (
                  profile.roles.map((role) => (
                    <span
                      key={role}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
                    >
                      {role}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No role assigned</span>
                )}
              </div>
              <dl className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-left dark:border-slate-800">
                <MetaRow icon={Building2} label="Department" value={profile.departmentName ?? "—"} />
                <MetaRow
                  icon={Calendar}
                  label="Member since"
                  value={new Date(profile.createdAt).toLocaleDateString()}
                />
                <MetaRow
                  icon={Shield}
                  label="Status"
                  value={profile.isActive ? "Active" : "Inactive"}
                  valueClassName={profile.isActive ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500"}
                />
              </dl>
            </section>
          </aside>

          <div className="lg:col-span-2">
            <form onSubmit={handleSave} className="space-y-5">
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-violet-600 dark:text-violet-400" />
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Personal information
                  </h2>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Full name">
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm((f) => f && { ...f, name: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Work email" icon={Mail}>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => f && { ...f, email: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <Lock className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Security</h2>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Leave blank to keep your current password.
                </p>
                <div className="mt-4">
                  <Field label="New password">
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm((f) => f && { ...f, password: e.target.value })}
                      className={inputClass}
                      autoComplete="new-password"
                      placeholder="Minimum 8 characters"
                    />
                  </Field>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Primary role:</span>{" "}
                  {primaryRole}. Contact an administrator to change roles or department assignment.
                </p>
              </section>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileAvatarEditor({
  name,
  avatarUrl,
  uploading,
  onUpload,
  onRemove,
}: {
  name: string;
  avatarUrl: string | null;
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <UserAvatar
          name={name}
          avatarUrl={avatarUrl}
          className="size-20 rounded-2xl text-2xl shadow-md shadow-primary/25"
          textClassName="text-2xl"
        />
        {uploading ? (
          <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/40">
            <Loader2 className="size-6 animate-spin text-white" />
          </span>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Camera className="size-3.5" />
          Upload photo
        </button>
        {avatarUrl ? (
          <button
            type="button"
            disabled={uploading}
            onClick={onRemove}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50 dark:border-red-900 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900/60"
          >
            <Trash2 className="size-3.5" />
            Remove
          </button>
        ) : null}
      </div>
      <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">JPEG, PNG, or WebP · max 2 MB</p>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
        {Icon ? <Icon className="size-3.5 text-slate-400" /> : null}
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="size-3.5 shrink-0 text-slate-400" />
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className={cn("ml-auto font-medium text-slate-800 dark:text-slate-200", valueClassName)}>
        {value}
      </dd>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="h-72 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      <div className="h-96 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800 lg:col-span-2" />
    </div>
  );
}
