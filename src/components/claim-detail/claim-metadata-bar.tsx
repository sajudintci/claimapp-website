"use client";

import { ClaimMetadata } from "@/components/claim-detail/types";
import { cn } from "@/lib/utils";

type ClaimMetadataBarProps = {
  claimNumber?: string;
  metadata?: ClaimMetadata | null;
  reviewerName?: string | null;
};

function normalizeDocumentTypes(raw: ClaimMetadata["documentType"]): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return [raw];
}

export function ClaimMetadataBar({
  claimNumber,
  metadata,
  reviewerName,
}: ClaimMetadataBarProps) {
  const documentTypes = normalizeDocumentTypes(metadata?.documentType);
  const uploadPatientName = metadata?.patientName?.trim() || "—";

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetadataRow label="Claim Reference" value={claimNumber ?? "—"} />
        <MetadataRow label="Patient Name" value={uploadPatientName} />
        <MetadataRow label="Priority" value={metadata?.priority?.trim() || "—"} />
        <MetadataRow label="Assignee" value={reviewerName?.trim() || "Auto-assign"} />
        <MetadataRow label="Document Type">
          {documentTypes.length > 0 ? (
            <div className="mt-0.5 flex flex-wrap gap-1">
              {documentTypes.map((type) => (
                <span
                  key={type}
                  className="inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {type}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">—</span>
          )}
        </MetadataRow>
        <MetadataRow
          label="Notes"
          value={metadata?.notes?.trim() || "—"}
          className="sm:col-span-2 lg:col-span-3 xl:col-span-1"
        />
      </div>
    </section>
  );
}

function MetadataRow({
  label,
  value,
  children,
  className,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{label}</p>
      {children ?? (
        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{value}</p>
      )}
    </div>
  );
}
