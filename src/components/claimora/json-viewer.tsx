"use client";

import { useMemo, useState } from "react";

export function JsonViewer({ value }: { value: Record<string, unknown> }) {
  const [collapsed, setCollapsed] = useState(false);
  const pretty = useMemo(() => JSON.stringify(value, null, 2), [value]);

  return (
    <div className="overflow-hidden rounded-lg bg-slate-950 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-2.5 py-1.5">
        <p className="text-xs font-semibold text-slate-300">Extracted JSON</p>
        <div className="flex flex-wrap gap-1">
          <JsonActionButton onClick={() => setCollapsed((v) => !v)}>
            {collapsed ? "Expand" : "Collapse"}
          </JsonActionButton>
          <JsonActionButton onClick={() => navigator.clipboard.writeText(pretty)}>
            Copy
          </JsonActionButton>
          <JsonActionButton
            onClick={() => {
              const blob = new Blob([pretty], { type: "application/json" });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = "claim-extraction.json";
              link.click();
            }}
          >
            Download
          </JsonActionButton>
        </div>
      </div>
      {!collapsed ? (
        <pre className="max-h-[min(52vh,480px)] overflow-auto p-2.5 text-[11px] leading-5 text-slate-100">
          <code>{pretty}</code>
        </pre>
      ) : null}
    </div>
  );
}

function JsonActionButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="rounded-md border border-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-300 hover:bg-slate-800"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
