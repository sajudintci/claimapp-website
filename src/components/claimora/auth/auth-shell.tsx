import Image from "next/image";
import Link from "next/link";
import { FileSearch, Lock, ShieldCheck } from "lucide-react";
import sequisLogo from "@/favicon.png";
import { cn } from "@/lib/utils";

function SequisLogo({ className }: { className?: string }) {
  return (
    <Image
      src={sequisLogo}
      alt="Sequis — Your Better Tomorrow"
      width={120}
      height={65}
      priority
      className={cn("h-auto w-[9rem] max-w-full object-contain object-left", className)}
    />
  );
}

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
    <div className="grid min-h-screen bg-neutral-50 dark:bg-neutral-950 lg:grid-cols-[1fr_1.05fr]">
      <aside className="relative hidden overflow-hidden bg-neutral-950 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-dark/95 via-primary/90 to-neutral-950/95" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-primary-dark/20 blur-3xl" />

        <div className="relative z-10 flex flex-1 flex-col justify-between p-10 xl:p-12">
          <div>
            <p className="max-w-md text-base leading-relaxed text-white/80">
              Asuransi yang relevan, efisien, dan dekat dengan kebutuhan gaya hidup Anda di era
              digital.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: FileSearch,
                title: "Klaim lebih mudah",
                text: "Unggah dokumen, ekstraksi otomatis, dan tinjau hasil dengan rapi.",
              },
              {
                icon: ShieldCheck,
                title: "Transparan & terpercaya",
                text: "Skor kepercayaan, audit trail, dan alur review yang jelas.",
              },
              {
                icon: Lock,
                title: "Aman & privat",
                text: "Akses berbasis peran untuk tim asuransi dan data nasabah.",
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
                  <p className="mt-0.5 text-xs leading-relaxed text-white/70">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main
        className={cn(
          "relative flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-16",
          isLogin &&
            "bg-[linear-gradient(180deg,#fafafa_0%,#f5f5f5_100%)] dark:bg-[linear-gradient(180deg,#0a0a0a_0%,#141414_100%)]",
        )}
      >
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-primary-light/60 blur-3xl dark:bg-primary/10" />

        <div className="relative mx-auto w-full max-w-[420px]">
          <Link href="/login" className="mb-8 inline-block">
            <SequisLogo />
          </Link>

          <div className={cn("mb-8", isLogin && "mb-6")}>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-[1.65rem]">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {description}
            </p>
          </div>

          <div
            className={cn(
              "rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xl shadow-neutral-200/40 sm:p-8 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-black/30",
              isLogin && "ring-1 ring-neutral-900/[0.03] dark:ring-white/[0.04]",
            )}
          >
            {children}
          </div>

          {footer && (
            <div className="mt-6 text-center text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {footer}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
