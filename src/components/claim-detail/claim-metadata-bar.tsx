"use client";

import {
  Bookmark,
  Flag,
  FolderOpen,
  StickyNote,
  User,
  Users,
} from "lucide-react";
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
    <section className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Document Metadata</h2>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Used to route the claim correctly
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetadataItem icon={Bookmark} label="Claim Reference" value={claimNumber ?? "—"} />
        <MetadataItem icon={Flag} label="Priority" value={metadata?.priority?.trim() || "—"} />
        <MetadataItem icon={User} label="Patient Name" value={uploadPatientName} />
        <MetadataItem icon={FolderOpen} label="Document Type">
          {documentTypes.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {documentTypes.map((type) => (
                <span
                  key={type}
                  className="inline-flex rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700"
                >
                  {type}
                </span>
              ))}
            </div>
          ) : (
            <span className="mt-1 block text-sm font-semibold text-slate-900 dark:text-slate-100">—</span>
          )}
        </MetadataItem>
        <MetadataItem
          icon={Users}
          label="Assignee"
          value={reviewerName?.trim() || "Auto-assign"}
        />
        <MetadataItem
          icon={StickyNote}
          label="Notes"
          value={metadata?.notes?.trim() || "—"}
          className="sm:col-span-2 lg:col-span-3 xl:col-span-1"
        />
      </div>
    </section>
  );
}

function MetadataItem({
  icon: Icon,
  label,
  value,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-start gap-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          {children ?? (
            <p className="mt-1 line-clamp-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {value}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
