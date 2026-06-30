import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function AuthField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      {children}
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export const authInputClass = cn(
  "h-11 w-full rounded-lg border border-slate-200 bg-white text-sm text-slate-900",
  "placeholder:text-slate-400 transition-all duration-150",
  "hover:border-slate-300 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15",
  "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500",
  "dark:hover:border-slate-600 dark:focus:border-primary",
);

export function AuthInputWrap({
  icon,
  children,
  className,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
        {icon}
      </span>
      {children}
    </div>
  );
}

export function AuthSubmitButton({
  children,
  loading,
}: {
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
<<<<<<< HEAD
      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-all duration-150 hover:bg-primary-dark hover:shadow-md hover:shadow-primary/25 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
=======
      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-all duration-150 hover:bg-primary-hover hover:shadow-md hover:shadow-primary/25 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {loading ? "Signing in..." : children}
    </button>
  );
}
