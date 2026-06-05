"use client";

import { AlertTriangle, ChevronDown, ChevronUp, Info, XCircle } from "lucide-react";
import { useState } from "react";
import { ExtractionContext } from "@/components/claim-detail/types";
import { collectBillingMismatchMessages } from "@/components/claim-detail/utils";
import { cn } from "@/lib/utils";

type Issue = {
  id: string;
  severity: "error" | "warning" | "info";
  title: string;
  body: string;
  details?: string[];
};

function buildIssues(
  ctx: ExtractionContext,
  jobError: string | null | undefined,
): Issue[] {
  const issues: Issue[] = [];

  if (ctx.isJobActive) {
    issues.push({
      id: "processing",
      severity: "info",
      title: "Extraction in progress",
      body: `Job status: ${ctx.jobStatus}. Results will update automatically.`,
    });
  }

  if (!ctx.ocrSufficient) {
    issues.push({
      id: "ocr",
      severity: "error",
      title: "OCR text insufficient",
      body: `Only ${ctx.ocrCharCount} characters were extracted. Retry extraction or upload a clearer scan.`,
    });
  }

  if (ctx.llmStatus === "failed") {
    issues.push({
      id: "llm",
      severity: "error",
      title: "AI extraction failed",
      body: ctx.llmError ?? "Structured extraction could not be completed.",
    });
  }

  const billingMessages = collectBillingMismatchMessages(ctx.validation);
  if (ctx.validation?.hasBillingMismatch && billingMessages.length > 0) {
    issues.push({
      id: "billing",
      severity: "warning",
      title: "Billing total mismatch",
      body: "Read total does not match calculated or line-item sum.",
      details: billingMessages,
    });
  }

  if (jobError) {
    issues.push({
      id: "job",
      severity: "error",
      title: "Last extraction job error",
      body: jobError,
    });
  }

  return issues;
}

const severityStyles = {
  error: "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300",
  warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  info: "border-primary/30 bg-primary-50 text-neutral-900 dark:border-primary/40 dark:bg-primary/10 dark:text-primary",
};

const severityIcon = {
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export function ClaimIssuesPanel({
  ctx,
  jobError,
}: {
  ctx: ExtractionContext;
  jobError?: string | null;
}) {
  const issues = buildIssues(ctx, jobError);
  const [collapsed, setCollapsed] = useState(false);

  if (issues.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-slate-600 dark:text-slate-400"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Issues & alerts ({issues.length})
          </span>
        </div>
        {collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
      </button>

      {!collapsed ? (
        <div className="space-y-2 border-t border-slate-100 px-4 pb-4 pt-2 dark:border-slate-800">
          {issues.map((issue) => {
            const Icon = severityIcon[issue.severity];
            return (
              <div
                key={issue.id}
                className={cn("rounded-xl border px-3 py-2.5 text-sm", severityStyles[issue.severity])}
              >
                <div className="flex items-start gap-2">
                  <Icon className="mt-0.5 size-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold">{issue.title}</p>
                    <p className="mt-0.5 text-xs opacity-90">{issue.body}</p>
                    {issue.details?.length ? (
                      <ul className="mt-1.5 list-inside list-disc text-xs opacity-90">
                        {issue.details.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
