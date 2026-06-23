import Link from "next/link";
import { ArrowUpRight, FileSearch, ShieldCheck, Upload, Users } from "lucide-react";

const actions = [
  {
    href: "/claims/upload",
    label: "Upload documents",
    description: "Add new claim files for AI extraction",
    icon: Upload,
    color: "text-primary bg-primary/10 ring-primary/10 dark:text-primary dark:bg-primary/15 dark:ring-primary/30",
  },
  {
    href: "/ai-extraction/confidence-review",
    label: "Confidence review",
    description: "Validate low-confidence fields",
    icon: FileSearch,
    color: "text-amber-600 bg-amber-50 ring-amber-100 dark:text-amber-300 dark:bg-amber-950 dark:ring-amber-900",
  },
  {
    href: "/claims?status=Needs%20Attention",
    label: "Review queue",
    description: "Claims flagged for attention",
    icon: ShieldCheck,
    color: "text-orange-600 bg-orange-50 ring-orange-100 dark:text-orange-300 dark:bg-orange-950 dark:ring-orange-900",
  },
  {
    href: "/user-management/users",
    label: "Manage users",
    description: "Roles, departments, invitations",
    icon: Users,
    color: "text-violet-600 bg-violet-50 ring-violet-100 dark:text-violet-300 dark:bg-violet-950 dark:ring-violet-900",
  },
];

export function QuickActions() {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Quick actions
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:border-primary/20 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary/30"
          >
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ${action.color}`}
            >
              <action.icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-sm font-semibold text-slate-900 group-hover:text-primary-hover dark:text-slate-100 dark:group-hover:text-primary">
                {action.label}
                <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
