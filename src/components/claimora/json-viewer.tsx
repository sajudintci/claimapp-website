"use client";

import { useMemo, useState } from "react";

export function JsonViewer({ value }: { value: Record<string, unknown> }) {
  const [collapsed, setCollapsed] = useState(false);
  const pretty = useMemo(() => JSON.stringify(value, null, 2), [value]);

  return (
    <section className="rounded-2xl border bg-slate-950 p-4 text-slate-100">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Extracted JSON</p>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-lg border border-slate-700 px-2 py-1 text-xs"
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
          <button
            className="rounded-lg border border-slate-700 px-2 py-1 text-xs"
            onClick={() => navigator.clipboard.writeText(pretty)}
          >
            Copy JSON
          </button>
          <button
            className="rounded-lg border border-slate-700 px-2 py-1 text-xs"
            onClick={() => {
              const blob = new Blob([pretty], { type: "application/json" });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = "claim-extraction.json";
              link.click();
            }}
          >
            Download
          </button>
        </div>
      </div>
      {!collapsed && (
        <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs leading-5 text-slate-100">
          <code>{pretty}</code>
        </pre>
      )}
    </section>
  );
}
