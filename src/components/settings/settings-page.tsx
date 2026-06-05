"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Clock,
  Mail,
  RefreshCw,
  Shield,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiAuthedFetch } from "@/lib/api/client";
import { SettingsResponse } from "@/types/api";
import { ErrorState } from "@/components/claimora/states";
import { cn } from "@/lib/utils";

type FormState = {
  organizationName: string;
  timezone: string;
  currency: string;
  sessionTimeoutMinutes: string;
  suspiciousLoginAlert: boolean;
};

function toForm(data: SettingsResponse): FormState {
  return {
    organizationName: data.organizationName ?? "",
    timezone: data.timezone ?? "Asia/Jakarta",
    currency: data.currency ?? "IDR",
    sessionTimeoutMinutes: String(data.sessionTimeoutMinutes ?? 30),
    suspiciousLoginAlert: data.suspiciousLoginAlert ?? true,
  };
}

export function SettingsPageContent() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);

  const { data, isLoading, error, refetch } = useApiQuery(
    () => apiAuthedFetch<SettingsResponse>("/settings"),
    [refreshKey],
  );

  useEffect(() => {
    if (data) setForm(toForm(data));
  }, [data]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;

    const sessionTimeoutMinutes = Number(form.sessionTimeoutMinutes);
    if (!Number.isFinite(sessionTimeoutMinutes) || sessionTimeoutMinutes < 5) {
      toast.error("Session timeout must be at least 5 minutes");
      return;
    }

    setSaving(true);
    try {
      await apiAuthedFetch<SettingsResponse>("/settings", {
        method: "PATCH",
        body: JSON.stringify({
          organizationName: form.organizationName.trim(),
          timezone: form.timezone.trim(),
          currency: form.currency.trim().toUpperCase(),
          sessionTimeoutMinutes,
          suspiciousLoginAlert: form.suspiciousLoginAlert,
        }),
      });
      toast.success("Settings saved");
      setRefreshKey((k) => k + 1);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  const creditsUsed = data?.ocrCreditsUsedThisMonth ?? 0;
  const creditsQuota = data?.ocrMonthlyQuota ?? 0;
  const creditsRemaining = data?.ocrCreditsRemaining ?? 0;

  return (
    <div className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <nav className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">Administration</span>
            <span className="mx-1 text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-600 dark:text-slate-400">Settings</span>
          </nav>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Settings</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Manage your account profile, organization preferences, and security options.
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

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <User className="size-4 text-violet-600 dark:text-violet-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">My account</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Signed-in profile. Contact an administrator to change your role or department.
            </p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoRow label="Name" value={user?.name ?? "—"} />
              <InfoRow label="Email" value={user?.email ?? "—"} icon={Mail} />
              <InfoRow label="Role" value={user?.role ?? "—"} />
              <InfoRow label="Department" value={user?.department ?? "—"} />
            </dl>
          </section>

          {isLoading || !form ? (
            <SettingsSkeleton />
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-primary dark:text-primary" />
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Organization</h2>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Organization name">
                    <input
                      value={form.organizationName}
                      onChange={(e) =>
                        setForm((f) => f && { ...f, organizationName: e.target.value })
                      }
                      className={inputClass}
                      required
                    />
                  </Field>
                  <Field label="Organization code">
                    <input
                      value={data?.organizationCode ?? ""}
                      readOnly
                      className={cn(inputClass, "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400")}
                    />
                  </Field>
                  <Field label="Timezone">
                    <input
                      value={form.timezone}
                      onChange={(e) => setForm((f) => f && { ...f, timezone: e.target.value })}
                      className={inputClass}
                      placeholder="Asia/Jakarta"
                      required
                    />
                  </Field>
                  <Field label="Currency">
                    <input
                      value={form.currency}
                      onChange={(e) => setForm((f) => f && { ...f, currency: e.target.value })}
                      className={inputClass}
                      placeholder="IDR"
                      required
                    />
                  </Field>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <Shield className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Security</h2>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Session timeout (minutes)" hint="Idle session length before re-login">
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="number"
                        min={5}
                        max={480}
                        value={form.sessionTimeoutMinutes}
                        onChange={(e) =>
                          setForm((f) => f && { ...f, sessionTimeoutMinutes: e.target.value })
                        }
                        className={cn(inputClass, "pl-10")}
                        required
                      />
                    </div>
                  </Field>
                  <div className="flex items-end">
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={form.suspiciousLoginAlert}
                        onChange={(e) =>
                          setForm(
                            (f) => f && { ...f, suspiciousLoginAlert: e.target.checked },
                          )
                        }
                        className="size-4 rounded border-slate-300"
                      />
                      Alert on suspicious login attempts
                    </label>
                  </div>
                </div>
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
          )}
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">OCR credits</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Organization-wide extraction quota</p>
            {isLoading ? (
              <div className="mt-4 h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
            ) : (
              <dl className="mt-4 space-y-2">
                <CreditRow label="Remaining" value={creditsRemaining.toLocaleString()} />
                <CreditRow label="Used this month" value={creditsUsed.toLocaleString()} />
                <CreditRow label="Monthly quota" value={creditsQuota.toLocaleString()} />
              </dl>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notes</h2>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              <li>Organization code is assigned at provisioning and cannot be changed here.</li>
              <li>Password changes are managed by your administrator or reset flow.</li>
              <li>Security changes apply to your organization workspace.</li>
            </ul>
          </section>
        </aside>
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

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/50">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-slate-100">
        {Icon ? <Icon className="size-3.5 shrink-0 text-slate-400" /> : null}
        {value}
      </dd>
    </div>
  );
}

function CreditRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <dt className="text-slate-600 dark:text-slate-400">{label}</dt>
      <dd className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-48 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      <div className="h-36 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}
