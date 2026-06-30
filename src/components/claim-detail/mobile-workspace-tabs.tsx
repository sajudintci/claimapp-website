"use client";

import { MobileWorkspaceTab } from "@/components/claim-detail/types";
import { cn } from "@/lib/utils";

export function MobileWorkspaceTabs({
  active,
  onChange,
}: {
  active: MobileWorkspaceTab;
  onChange: (tab: MobileWorkspaceTab) => void;
}) {
  return (
    <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-900/50 lg:hidden">
      {(
        [
          { id: "document" as const, label: "Document" },
          { id: "extraction" as const, label: "Extraction" },
        ] as const
      ).map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors",
            active === tab.id ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100" : "text-slate-600 dark:text-slate-400",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
