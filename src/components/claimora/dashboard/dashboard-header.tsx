"use client";

type DashboardHeaderProps = {
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

export function DashboardHeader(_props: DashboardHeaderProps) {
  return (
    <header>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
        Dashboard
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
        Monitor claim intake, review workload, and extraction performance at a glance.
      </p>
    </header>
  );
}
