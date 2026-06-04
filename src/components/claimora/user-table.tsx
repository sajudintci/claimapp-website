"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { apiAuthedFetch } from "@/lib/api/client";

type ApiUser = {
  id: string;
  name?: string;
  email?: string;
  departmentId?: string;
  isActive?: boolean;
};

export function UserTable() {
  const { data, isLoading } = useApiQuery(() => apiAuthedFetch<ApiUser[]>("/users"), []);

  return (
    <section className="overflow-x-auto rounded-2xl border bg-white">
      <table className="min-w-[680px] text-sm">
        <thead className="bg-slate-50 text-left"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Department</th><th className="px-4 py-3">Status</th></tr></thead>
        <tbody>
          {isLoading ? (
            <tr><td className="px-4 py-3 text-slate-500" colSpan={5}>Loading users...</td></tr>
          ) : (
            (data ?? []).map((user) => (
              <tr key={user.id} className="border-t"><td className="px-4 py-3">{user.name}</td><td className="px-4 py-3">{user.email}</td><td className="px-4 py-3">-</td><td className="px-4 py-3">{user.departmentId ?? "-"}</td><td className="px-4 py-3">{user.isActive ? "Active" : "Inactive"}</td></tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
