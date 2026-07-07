"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ErrorState } from "@/components/claimora/states";
import {
  SettingsField,
  SettingsPageShell,
  SettingsSectionSkeleton,
  settingsInputClass,
  toOrganizationForm,
  useSettingsData,
  useSettingsRefresh,
  type OrganizationFormState,
} from "@/components/settings/settings-shared";
import { apiAuthedFetch, apiAuthedUpload } from "@/lib/api/client";
import { resolveAvatarUrl } from "@/lib/api/avatar-url";
import { SettingsResponse } from "@/types/api";
import { cn } from "@/lib/utils";

export function OrganizationSettingsPage() {
  const { refreshKey, bumpRefresh } = useSettingsRefresh();
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [form, setForm] = useState<OrganizationFormState | null>(null);

  const { data, isLoading, error, refetch } = useSettingsData(refreshKey);

  useEffect(() => {
    if (data) setForm(toOrganizationForm(data));
  }, [data]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;

    setSaving(true);
    try {
      await apiAuthedFetch<SettingsResponse>("/settings", {
        method: "PATCH",
        body: JSON.stringify({
          organizationName: form.organizationName.trim(),
          timezone: form.timezone.trim(),
        }),
      });
      toast.success("Organization settings saved");
      bumpRefresh();
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Use JPEG, PNG, or WebP image");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be 2 MB or smaller");
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      await apiAuthedUpload<SettingsResponse>("/settings/logo", formData);
      toast.success("Organization logo updated");
      bumpRefresh();
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleLogoRemove() {
    if (!data?.organizationLogoUrl) return;
    setUploadingLogo(true);
    try {
      await apiAuthedFetch<SettingsResponse>("/settings/logo", { method: "DELETE" });
      toast.success("Organization logo removed");
      bumpRefresh();
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  return (
    <SettingsPageShell
      title="Organization"
      description="Workspace name, logo, and timezone used across claims and reports."
      onRefresh={() => {
        bumpRefresh();
        refetch();
      }}
    >
      {error ? <ErrorState message={error} /> : null}

      {isLoading || !form ? (
        <SettingsSectionSkeleton />
      ) : (
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-primary dark:text-primary" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Organization logo</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Shown in workspace branding. Recommended square image with transparent or white background.
            </p>
            <div className="mt-4">
              <OrganizationLogoEditor
                organizationName={form.organizationName}
                logoUrl={data?.organizationLogoUrl ?? null}
                uploading={uploadingLogo}
                onUpload={handleLogoUpload}
                onRemove={handleLogoRemove}
              />
            </div>
          </section>

          <form onSubmit={handleSave}>
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Workspace details</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <SettingsField label="Organization name">
                  <input
                    value={form.organizationName}
                    onChange={(e) => setForm((f) => f && { ...f, organizationName: e.target.value })}
                    className={settingsInputClass}
                    required
                  />
                </SettingsField>
                <SettingsField label="Organization code">
                  <input
                    value={data?.organizationCode ?? ""}
                    readOnly
                    className={cn(settingsInputClass, "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400")}
                  />
                </SettingsField>
                <SettingsField label="Timezone">
                  <input
                    value={form.timezone}
                    onChange={(e) => setForm((f) => f && { ...f, timezone: e.target.value })}
                    className={settingsInputClass}
                    placeholder="Asia/Jakarta"
                    required
                  />
                </SettingsField>
              </div>
              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                Organization code is assigned at provisioning and cannot be changed here.
              </p>
              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </section>
          </form>
        </div>
      )}
    </SettingsPageShell>
  );
}

function OrganizationLogoEditor({
  organizationName,
  logoUrl,
  uploading,
  onUpload,
  onRemove,
}: {
  organizationName: string;
  logoUrl: string | null;
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const resolvedLogoUrl = resolveAvatarUrl(logoUrl);
  const fallbackLabel = organizationName.trim().slice(0, 2).toUpperCase() || "OR";

  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
      <div className="relative">
        {resolvedLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolvedLogoUrl}
            alt={`${organizationName} logo`}
            className="size-20 rounded-2xl border border-slate-200 bg-white object-contain p-2 shadow-sm dark:border-slate-700 dark:bg-slate-950"
          />
        ) : (
          <span className="inline-flex size-20 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-lg font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            {fallbackLabel}
          </span>
        )}
        {uploading ? (
          <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/40">
            <Loader2 className="size-6 animate-spin text-white" />
          </span>
        ) : null}
      </div>

      <div>
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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Camera className="size-3.5" />
            Upload logo
          </button>
          {logoUrl ? (
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
    </div>
  );
}
