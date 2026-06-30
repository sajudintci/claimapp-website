import { cn } from "@/lib/utils";

export function StatsCard({
  label,
  value,
  trend,
  tone,
}: {
  label: string;
  value: string;
  trend: string;
  tone: "primary" | "success" | "warning" | "danger";
}) {
  const toneClasses = {
<<<<<<< HEAD
    primary: "text-primary-dark",
=======
    primary: "text-primary-hover",
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
    success: "text-emerald-700",
    warning: "text-amber-700",
    danger: "text-red-700",
  };

  return (
    <article className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className={cn("mt-1 text-xs font-medium", toneClasses[tone])}>{trend} vs last week</p>
    </article>
  );
}

export function ClaimSummaryCard({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <article className="rounded-2xl border bg-white p-4">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
      <p className="text-xs text-slate-500">{note}</p>
    </article>
  );
}
