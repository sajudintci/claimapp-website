export type FieldTrace = {
  source_text: string;
  page: number | null;
};

export const MAX_FIELD_TRACES = 8;
export const MAX_TRACE_SOURCE_CHARS = 400;

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeTraceEntry(input: unknown): FieldTrace | null {
  if (!isObject(input)) return null;
  const source_text =
    typeof input.source_text === "string"
      ? input.source_text.trim().slice(0, MAX_TRACE_SOURCE_CHARS)
      : "";
  const page = typeof input.page === "number" && input.page > 0 ? input.page : null;
  if (!source_text) return null;
  return { source_text, page };
}

export function normalizeFieldTraces(
  input: unknown,
  primary: { source_text: string; page: number | null },
): FieldTrace[] {
  const seen = new Set<string>();
  const traces: FieldTrace[] = [];

  const push = (trace: FieldTrace | null) => {
    if (!trace) return;
    const key = `${trace.page ?? "na"}::${trace.source_text}`;
    if (seen.has(key)) return;
    seen.add(key);
    traces.push(trace);
  };

  if (isObject(input) && Array.isArray(input.traces)) {
    for (const entry of input.traces) {
      push(normalizeTraceEntry(entry));
      if (traces.length >= MAX_FIELD_TRACES) break;
    }
  }

  push(
    primary.source_text.trim()
      ? {
          source_text: primary.source_text.trim().slice(0, MAX_TRACE_SOURCE_CHARS),
          page: primary.page,
        }
      : null,
  );

  return traces.slice(0, MAX_FIELD_TRACES);
}

export function tracesFromField(field: {
  source_text?: string;
  page?: number | null;
  traces?: FieldTrace[];
}): FieldTrace[] {
  if (field.traces && field.traces.length > 0) return field.traces;
  const source_text = String(field.source_text ?? "").trim();
  if (source_text) {
    return [{ source_text, page: field.page ?? null }];
  }
  return [];
}

export function primaryTracePages(field: {
  source_text?: string;
  page?: number | null;
  traces?: FieldTrace[];
}): number[] {
  const pages = new Set<number>();
  for (const trace of tracesFromField(field)) {
    if (trace.page != null && trace.page > 0) pages.add(trace.page);
  }
  if (pages.size === 0 && field.page != null && field.page > 0) pages.add(field.page);
  return Array.from(pages).sort((a, b) => a - b);
}

export function formatTracePages(field: {
  source_text?: string;
  page?: number | null;
  traces?: FieldTrace[];
}): string {
  const pages = primaryTracePages(field);
  if (pages.length === 0) return "-";
  if (pages.length === 1) return String(pages[0]);
  return pages.join(", ");
}
