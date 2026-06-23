import Link from "next/link";
import { cn } from "@/lib/utils";

export function AuthShell({
  title,
  description,
  children,
  footer,
  variant = "default",
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "default" | "login";
}) {
  const isLogin = variant === "login";

  return (
    <div className="grid min-h-screen bg-slate-50 dark:bg-slate-950 lg:grid-cols-[1fr_1.05fr]">
      <aside className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/85 to-slate-900/95" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl" />

        <div className="relative z-10 flex flex-1 flex-col justify-center p-10 xl:p-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white">Sequis</h1>
            <p className="mt-3 max-w-md text-base leading-relaxed text-teal-100/90">
              AI-Powered Insurance Claim Intelligence — process claims faster with
              structured extraction and audit-ready review workflows.
            </p>
          </div>
        </div>
      </aside>

      <main
        className={cn(
          "relative flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-16",
          isLogin && "bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] dark:bg-[linear-gradient(180deg,#0f172a_0%,#020617_100%)]",
        )}
      >
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />

        <div className="relative mx-auto w-full max-w-[420px]">
          <Link href="/login" className="mb-8 inline-flex items-center gap-2 lg:hidden">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
              S
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Sequis</span>
          </Link>

          <div className={cn("mb-8", isLogin && "mb-6")}>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-[1.65rem]">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>
          </div>

          <div
            className={cn(
              "rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-8 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30",
              isLogin && "ring-1 ring-slate-900/[0.03] dark:ring-white/[0.04]",
            )}
          >
            {children}
          </div>

          {footer && (
            <div className="mt-6 text-center text-sm leading-relaxed text-slate-600 dark:text-slate-400">{footer}</div>
          )}
        </div>
      </main>
    </div>
  );
}
