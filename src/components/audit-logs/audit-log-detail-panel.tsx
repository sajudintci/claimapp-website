"use client";

import { AuditLogRecord } from "@/types/api";
import { cn } from "@/lib/utils";
import {
  auditValuesEqual,
  collectAuditFieldKeys,
  formatAuditFieldLabel,
  formatAuditValue,
  isAuditUrl,
  stripAuditResult,
} from "@/components/audit-logs/audit-log-display";

export function AuditLogDetailPanel({ log }: { log: AuditLogRecord }) {
  const before = stripAuditResult(log.beforeChanges);
  const after = stripAuditResult(log.afterChanges);
  const hasBefore = before !== null;
  const hasAfter = after !== null;
  const fieldKeys = collectAuditFieldKeys(before, after);
  const showComparison = hasBefore && hasAfter && fieldKeys.length > 0;

  if (!hasBefore && !hasAfter) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No change payload recorded for this event.
      </p>
    );
  }

  if (showComparison) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Field-level comparison of recorded state before and after this action.
        </p>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-900/80">
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Field
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Before
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  After
                </th>
              </tr>
            </thead>
            <tbody>
              {fieldKeys.map((key) => {
                const beforeValue = before?.[key];
                const afterValue = after?.[key];
                const changed = !auditValuesEqual(beforeValue, afterValue);

                return (
                  <tr
                    key={key}
                    className={cn(
                      "border-b border-slate-50 last:border-0 dark:border-slate-800/80",
                      changed && "bg-amber-50/60 dark:bg-amber-950/20",
                    )}
                  >
                    <td className="px-3 py-2.5 align-top font-medium text-slate-700 dark:text-slate-300">
                      {formatAuditFieldLabel(key)}
                    </td>
                    <td className="px-3 py-2.5 align-top text-slate-600 dark:text-slate-400">
                      <AuditValue value={beforeValue} />
                    </td>
                    <td className="px-3 py-2.5 align-top text-slate-800 dark:text-slate-200">
                      <AuditValue value={afterValue} emphasized={changed} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <RawJsonSection before={log.beforeChanges} after={log.afterChanges} />
      </div>
    );
  }

  const details = after ?? before;

  return (
    <div className="space-y-3">
      {!hasBefore && hasAfter ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          No prior state for this event — details below reflect what was recorded when the action
          occurred.
        </p>
      ) : null}
      <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {hasBefore && !hasAfter ? "Previous state" : "Event details"}
        </p>
        <dl className="mt-3 space-y-2">
          {Object.entries(details ?? {}).map(([key, value]) => {
            if (key === "result") return null;
            return (
              <div key={key} className="grid gap-1 sm:grid-cols-[minmax(8rem,30%)_1fr]">
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {formatAuditFieldLabel(key)}
                </dt>
                <dd className="text-sm text-slate-800 dark:text-slate-200">
                  <AuditValue value={value} emphasized />
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
      <RawJsonSection before={log.beforeChanges} after={log.afterChanges} />
    </div>
  );
}

function AuditValue({
  value,
  emphasized,
}: {
  value: unknown;
  emphasized?: boolean;
}) {
  if (isAuditUrl(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "break-all text-blue-600 hover:underline dark:text-blue-400",
          emphasized && "font-medium",
        )}
      >
        {value}
      </a>
    );
  }

  return (
    <span
      className={cn(
        "break-all font-mono text-[12px] leading-relaxed",
        emphasized ? "text-slate-900 dark:text-slate-100" : "text-slate-600 dark:text-slate-400",
      )}
    >
      {formatAuditValue(value)}
    </span>
  );
}

function RawJsonSection({
  before,
  after,
}: {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}) {
  if (!before && !after) return null;

  return (
    <details className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
      <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200">
        Raw JSON payload
      </summary>
      <div className="grid gap-3 border-t border-slate-100 p-3 md:grid-cols-2 dark:border-slate-800">
        <JsonPreview title="Before" data={before} />
        <JsonPreview title="After" data={after} />
      </div>
    </details>
  );
}

function JsonPreview({
  title,
  data,
}: {
  title: string;
  data: Record<string, unknown> | null;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <pre className="mt-1 max-h-36 overflow-auto rounded-lg bg-slate-50 p-2 text-[10px] leading-relaxed text-slate-700 dark:bg-slate-900 dark:text-slate-300">
        {data ? JSON.stringify(data, null, 2) : "—"}
      </pre>
    </div>
  );
}
