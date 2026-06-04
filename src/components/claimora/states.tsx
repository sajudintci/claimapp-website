import { AlertTriangle, FileSearch, Loader2 } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-white p-8 text-center">
      <FileSearch className="mx-auto mb-3 size-8 text-slate-400" />
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
      <div className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="size-4" />
        Error
      </div>
      <p className="mt-1 text-sm">{message}</p>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-10 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      <div className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      <p className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Loader2 className="size-4 animate-spin" /> Loading data
      </p>
    </div>
  );
}
