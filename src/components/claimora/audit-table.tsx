"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { apiAuthedFetch } from "@/lib/api/client";

type AuditLog = {
  id: string;
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  createdAt?: string;
};

export function AuditTable() {
  const { data, isLoading } = useApiQuery(() => apiAuthedFetch<AuditLog[]>("/audit-logs"), []);

  return (
    <section className="overflow-x-auto rounded-2xl border bg-white">
      <table className="min-w-[720px] text-sm">
        <thead className="bg-slate-50 text-left"><tr><th className="px-4 py-3">ID</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Timestamp</th><th className="px-4 py-3">Result</th></tr></thead>
        <tbody>
          {isLoading ? (
            <tr><td className="px-4 py-3 text-slate-500" colSpan={6}>Loading audit logs...</td></tr>
          ) : (
            (data ?? []).map((log) => (
              <tr key={log.id} className="border-t"><td className="px-4 py-3">{String(log.id).slice(0, 8)}</td><td className="px-4 py-3">{String(log.userId).slice(0, 8)}</td><td className="px-4 py-3">{log.action}</td><td className="px-4 py-3">{log.entityType}:{log.entityId}</td><td className="px-4 py-3">{log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}</td><td className="px-4 py-3">-</td></tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
