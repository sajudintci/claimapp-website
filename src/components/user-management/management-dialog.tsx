"use client";

import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ManagementDialogProps = {
  open: boolean;
  title: string;
  description: string;
  tone?: "default" | "danger" | "warning";
  onClose: () => void;
  children?: React.ReactNode;
  footer: React.ReactNode;
};

export function ManagementDialog({
  open,
  title,
  description,
  tone = "default",
  onClose,
  children,
  footer,
}: ManagementDialogProps) {
  if (!open) return null;

  const iconStyles =
    tone === "danger"
      ? "bg-red-50 text-red-700 ring-red-100 dark:bg-red-950 dark:text-red-300 dark:ring-red-900"
      : tone === "warning"
        ? "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900"
        : "bg-primary/10 text-primary-hover ring-primary/10 dark:bg-primary/15 dark:text-primary dark:ring-primary/30";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-slate-900/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="management-dialog-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1",
              iconStyles,
            )}
          >
            <AlertTriangle className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="management-dialog-title"
              className="text-base font-bold text-slate-900 dark:text-slate-100"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="size-5" />
          </button>
        </div>

        {children ? <div className="px-5 py-4">{children}</div> : null}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end dark:border-slate-800">
          {footer}
        </div>
      </div>
    </div>
  );
}

export function ManagementDialogButton({
  children,
  onClick,
  variant = "secondary",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-primary text-white hover:bg-primary-hover",
        variant === "secondary" &&
          "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900",
        variant === "danger" &&
          "bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600",
      )}
    >
      {children}
    </button>
  );
}
