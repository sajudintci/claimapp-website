"use client";

import { ArrowRight, Brain, FileText, ScanText, UserCheck } from "lucide-react";
import { ExtractionContext } from "@/components/claim-detail/types";
import { cn } from "@/lib/utils";

type StepState = "done" | "active" | "error" | "pending";

type Step = {
  id: string;
  label: string;
  detail: string;
  icon: React.ReactNode;
  state: StepState;
};

function resolveSteps(ctx: ExtractionContext, hasDocuments: boolean): Step[] {
  const uploadState: StepState = hasDocuments ? "done" : "pending";

  let ocrState: StepState = "pending";
  if (ctx.isJobActive && ctx.jobStatus === "PROCESSING") ocrState = "active";
  else if (!ctx.ocrSufficient && !ctx.isJobActive) ocrState = "error";
  else if (ctx.ocrCharCount > 0) ocrState = "done";

  let llmState: StepState = "pending";
  if (ctx.isJobActive) llmState = "active";
  else if (ctx.llmStatus === "ok") llmState = "done";
  else if (ctx.llmStatus === "failed") llmState = "error";
  else if (ctx.llmStatus === "skipped") llmState = "pending";

  let reviewState: StepState = "pending";
  if (ctx.currentStatus === "Reviewed") reviewState = "done";
  else if (ctx.currentStatus === "Needs Attention") reviewState = "error";
  else if (ctx.currentStatus === "Extracted") reviewState = "active";

  return [
    {
      id: "upload",
      label: "Uploaded",
      detail: hasDocuments ? "Document stored" : "No document",
      icon: <FileText className="size-4" />,
      state: uploadState,
    },
    {
      id: "ocr",
      label: "OCR",
      detail: ctx.ocrFiltered
        ? `${ctx.ocrCharCount.toLocaleString()} chars · filtered`
        : `${ctx.ocrCharCount.toLocaleString()} chars`,
      icon: <ScanText className="size-4" />,
      state: ocrState,
    },
    {
      id: "llm",
      label: "AI Extract",
      detail:
        ctx.llmStatus === "ok"
          ? "Structured output ready"
          : ctx.llmStatus === "failed"
            ? "Extraction failed"
            : ctx.isJobActive
              ? "Processing…"
              : "Pending / skipped",
      icon: <Brain className="size-4" />,
      state: llmState,
    },
    {
      id: "review",
      label: "Human Review",
      detail: ctx.currentStatus,
      icon: <UserCheck className="size-4" />,
      state: reviewState,
    },
  ];
}

const stateStyles: Record<StepState, string> = {
  done: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
<<<<<<< HEAD
  active: "border-primary/40 bg-primary-50 text-primary-dark ring-2 ring-primary/30 dark:border-primary-dark dark:bg-primary/10 dark:text-primary dark:ring-primary/30",
=======
  active: "border-primary/30 bg-primary/10 text-primary-hover ring-2 ring-primary/20 dark:border-primary/30 dark:bg-primary/15 dark:text-primary dark:ring-primary/30",
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
  error: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300",
  pending: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400",
};

export function ClaimProcessingTimeline({
  ctx,
  hasDocuments,
}: {
  ctx: ExtractionContext;
  hasDocuments: boolean;
}) {
  const steps = resolveSteps(ctx, hasDocuments);

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Processing pipeline</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Job: <span className="font-medium">{ctx.jobStatus}</span>
            {ctx.isJobActive ? " · use Refresh to update status" : ""}
          </p>
        </div>
        {ctx.ocrPageCount != null ? (
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {ctx.ocrPageCount} OCR pages
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={cn(
                "flex flex-1 flex-col rounded-xl border p-3 transition-colors",
                stateStyles[step.state],
              )}
            >
              <div className="flex items-center gap-2">
                {step.icon}
                <p className="text-xs font-semibold">{step.label}</p>
              </div>
              <p className="mt-1 text-[11px] opacity-90">{step.detail}</p>
            </div>
            {index < steps.length - 1 ? (
              <ArrowRight className="hidden size-4 shrink-0 text-slate-300 dark:text-slate-600 xl:block" aria-hidden />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
