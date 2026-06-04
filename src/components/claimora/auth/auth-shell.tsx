import Link from "next/link";
import { FileSearch, Lock, ShieldCheck, Sparkles } from "lucide-react";
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
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700/90 via-blue-600/85 to-slate-900/95" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative z-10 flex flex-1 flex-col justify-between p-10 xl:p-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-blue-50 backdrop-blur-sm">
              <Sparkles className="size-3.5" />
              Enterprise Insurance AI
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white">Claimora</h1>
            <p className="mt-3 max-w-md text-base leading-relaxed text-blue-100/90">
              AI-Powered Insurance Claim Intelligence — process claims faster with
              structured extraction and audit-ready review workflows.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: FileSearch,
                title: "Document intelligence",
                text: "Upload claims, run OCR & AI extraction into structured JSON.",
              },
              {
                icon: ShieldCheck,
                title: "Human review & audit",
                text: "Confidence scoring, corrections, and full activity tracking.",
              },
              {
                icon: Lock,
                title: "Secure by design",
                text: "Role-based access for insurance teams in regulated environments.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <item.icon className="size-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-blue-100/80">{item.text}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-blue-200/70">
            © 2026 Claimora · Insurance-grade secure environment
          </p>
        </div>
      </aside>

      <main
        className={cn(
          "relative flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-16",
          isLogin && "bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] dark:bg-[linear-gradient(180deg,#0f172a_0%,#020617_100%)]",
        )}
      >
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-100/40 blur-3xl dark:bg-blue-900/20" />

        <div className="relative mx-auto w-full max-w-[420px]">
          <Link href="/login" className="mb-8 inline-flex items-center gap-2 lg:hidden">
            <span className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
              C
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Claimora</span>
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
