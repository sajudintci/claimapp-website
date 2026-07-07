import { cn } from "@/lib/utils";

const tableCellBorder =
  "border-r border-slate-200/90 dark:border-slate-700/80 last:border-r-0";

export function DataTableScroll({
  children,
  showHint = true,
  className,
}: {
  children: React.ReactNode;
  showHint?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      {showHint ? (
        <p className="px-4 py-2 text-xs text-slate-500 lg:hidden dark:text-slate-400 sm:px-5">
          Scroll horizontally to see all columns
        </p>
      ) : null}
      <div className="overflow-x-auto overscroll-x-contain">{children}</div>
    </div>
  );
}

export function DataTable({
  children,
  className,
  minWidth = "min-w-[640px]",
}: {
  children: React.ReactNode;
  className?: string;
  minWidth?: string;
}) {
  return (
    <table className={cn("w-full border-collapse text-sm", minWidth, className)}>
      {children}
    </table>
  );
}

export function DataTableHeadRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={cn(
        "border-b border-slate-200 bg-slate-50/90 dark:border-slate-700 dark:bg-slate-800/50",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function DataTableBodyRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={cn(
        "border-b border-slate-100 transition-colors hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/40",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400",
        tableCellBorder,
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  title,
  className,
  align = "left",
  colSpan,
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
  align?: "left" | "right";
  colSpan?: number;
}) {
  return (
    <td
      title={title}
      colSpan={colSpan}
      className={cn(
        "px-4 py-3.5 align-middle",
        tableCellBorder,
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </td>
  );
}
