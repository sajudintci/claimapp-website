"use client";

import { Crosshair } from "lucide-react";
import {
  ExtractionClaim,
  tracedFieldReviewValue,
  tracedFieldValue,
} from "@/lib/extraction/claim-extraction";
import { createFocusFromPreExtracted, createFocusFromTracedField } from "@/lib/extraction/document-focus";
import { DocumentFocusTarget, ExtractionContext } from "@/components/claim-detail/types";
import { PRE_EXTRACTED_FIELD_KEYS, PRE_EXTRACTED_LABELS } from "@/components/claim-detail/utils";
import { cn } from "@/lib/utils";

type ClaimOverviewTabProps = {
  claims: ExtractionClaim[];
  activeClaim: ExtractionClaim | undefined;
  summary: Record<string, unknown>;
  ctx: ExtractionContext;
  isPdfDocument?: boolean;
  activeFocusLabel?: string | null;
  onFocusField?: (focus: DocumentFocusTarget) => void;
};

export function ClaimOverviewTab({
  claims,
  activeClaim,
  summary,
  ctx,
  isPdfDocument = false,
  activeFocusLabel,
  onFocusField,
}: ClaimOverviewTabProps) {
  const hasPreExtracted = Object.keys(ctx.preExtracted).length > 0;
  const canFocusPdf = isPdfDocument && Boolean(onFocusField);

  function focus(label: string, field: unknown) {
    if (!onFocusField) return;
    const target = createFocusFromTracedField(label, field);
    if (target) onFocusField(target);
  }

  return (
    <div className="space-y-5">
      {canFocusPdf ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Click a value with PDF trace to locate it in the source document.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <FocusableKpiCard
          label="Patient"
          traceLabel="Patient · name"
          value={tracedFieldReviewValue(activeClaim?.patient?.name)}
          field={activeClaim?.patient?.name}
          canFocus={canFocusPdf}
          isActive={activeFocusLabel === "Patient · name"}
          onFocus={() => focus("Patient · name", activeClaim?.patient?.name)}
        />
        <FocusableKpiCard
          label="Provider"
          traceLabel="Provider · hospital_name"
          value={
            tracedFieldValue(activeClaim?.provider?.hospital_name) ||
            String(summary.provider ?? "-")
          }
          field={activeClaim?.provider?.hospital_name}
          canFocus={canFocusPdf}
          isActive={activeFocusLabel === "Provider · hospital_name"}
          onFocus={() => focus("Provider · hospital_name", activeClaim?.provider?.hospital_name)}
        />
        <FocusableKpiCard
          label="Diagnosis"
          traceLabel="Diagnosis · icd10"
          value={
            tracedFieldValue(activeClaim?.diagnosis?.icd10_description) ||
            tracedFieldValue(activeClaim?.diagnosis?.icd10_code) ||
            String(summary.diagnosis ?? "-")
          }
          field={
            activeClaim?.diagnosis?.icd10_description ?? activeClaim?.diagnosis?.icd10_code
          }
          canFocus={canFocusPdf}
          isActive={activeFocusLabel === "Diagnosis · icd10"}
          onFocus={() =>
            focus(
              "Diagnosis · icd10",
              activeClaim?.diagnosis?.icd10_description ?? activeClaim?.diagnosis?.icd10_code,
            )
          }
        />
        <FocusableKpiCard
          label="Total (read)"
          traceLabel="Billing · total_amount_read"
          value={tracedFieldValue(activeClaim?.billing?.total_amount_read)}
          field={activeClaim?.billing?.total_amount_read}
          canFocus={canFocusPdf}
          isActive={activeFocusLabel === "Billing · total_amount_read"}
          onFocus={() =>
            focus("Billing · total_amount_read", activeClaim?.billing?.total_amount_read)
          }
        />
      </div>

      {hasPreExtracted ? (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            OCR pre-extracted hints
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {PRE_EXTRACTED_FIELD_KEYS.map((key) => {
              const field = ctx.preExtracted[key];
              if (!field) return null;
              const missing =
                field.value === "not_found" || String(field.value).trim() === "";
              const label = PRE_EXTRACTED_LABELS[key];
              const focusTarget = canFocusPdf ? createFocusFromPreExtracted(label, field) : null;

              return (
                <button
                  key={key}
                  type="button"
                  disabled={!focusTarget}
                  onClick={() => focusTarget && onFocusField?.(focusTarget)}
                  className={cn(
                    "rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-left transition-colors dark:border-slate-700 dark:bg-slate-800/50",
                    focusTarget &&
<<<<<<< HEAD
                      "cursor-pointer hover:border-primary/40 hover:bg-primary-50/50 dark:hover:border-primary-dark dark:hover:bg-primary/10",
=======
                      "cursor-pointer hover:border-primary/30 hover:bg-primary/10 dark:hover:border-primary/30 dark:hover:bg-primary/15",
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
                    activeFocusLabel === label && "border-amber-400 bg-amber-50/80 dark:border-amber-700 dark:bg-amber-950/30",
                    !focusTarget && "cursor-default",
                  )}
                >
                  <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {label}
                    {focusTarget ? <Crosshair className="size-3 text-primary/70" /> : null}
                  </p>
                  <p
                    className={`mt-1 text-sm font-medium ${missing ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-slate-100"}`}
                  >
                    {missing ? "Not found" : String(field.value)}
                  </p>
                  {!missing && field.source_text ? (
                    <p
                      className="mt-1 line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400"
                      title={field.source_text}
                    >
                      p.{field.page ?? "?"} · {field.source_text}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
        <p>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{claims.length}</span> structured
          claim(s) · OCR {ctx.ocrFiltered ? "filtered" : "raw"} ·{" "}
          {ctx.ocrCharCount.toLocaleString()} characters
          {ctx.ocrPageCount != null ? ` · ${ctx.ocrPageCount} page(s)` : ""}
          {typeof ctx.ocrCreditsCharged === "number"
            ? ` · ${ctx.ocrCreditsCharged} OCR credit(s) charged`
            : ""}
        </p>
      </section>
    </div>
  );
}

function FocusableKpiCard({
  label,
  traceLabel,
  value,
  field,
  canFocus,
  isActive,
  onFocus,
}: {
  label: string;
  traceLabel: string;
  value: string;
  field: unknown;
  canFocus: boolean;
  isActive: boolean;
  onFocus: () => void;
}) {
  const focusable = canFocus && createFocusFromTracedField(traceLabel, field) != null;

  const inner = (
    <>
      <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
        {focusable ? <Crosshair className="size-3 text-primary/70 dark:text-primary" /> : null}
      </p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </>
  );

  if (!focusable) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onFocus}
      className={cn(
<<<<<<< HEAD
        "rounded-xl border border-slate-200 bg-white px-3 py-3 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-primary-50/40 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-primary-dark dark:hover:bg-primary/10",
=======
        "rounded-xl border border-slate-200 bg-white px-3 py-3 text-left shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/10 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-primary/30 dark:hover:bg-primary/15",
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
        isActive && "border-amber-400 bg-amber-50/80 ring-1 ring-amber-300/60 dark:border-amber-700 dark:bg-amber-950/30",
      )}
    >
      {inner}
    </button>
  );
}
