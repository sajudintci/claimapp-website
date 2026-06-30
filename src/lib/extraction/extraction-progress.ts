export type ExtractionProgress = {
  current: number;
  total: number;
  stage: string;
  label: string;
};

const STAGE_LABELS: Record<string, string> = {
  queued: "In queue",
  ocr: "OCR extraction",
  llm: "LLM structuring",
  validate: "Validation",
  persist: "Saving results",
  completed: "Complete",
  failed: "Failed",
};

/** Fallback when API progress is missing (legacy jobs). */
export function fallbackExtractionProgress(jobStatus: string): ExtractionProgress {
  const status = jobStatus.toUpperCase();
  const total = 5;

  if (status === "COMPLETED") {
    return { current: total, total, stage: "completed", label: STAGE_LABELS.completed };
  }
  if (status === "FAILED") {
    return { current: 1, total, stage: "failed", label: STAGE_LABELS.failed };
  }
  if (status === "QUEUED") {
    return { current: 1, total, stage: "queued", label: STAGE_LABELS.queued };
  }
  if (status === "PROCESSING") {
    return { current: 3, total, stage: "llm", label: STAGE_LABELS.llm };
  }
  return { current: 1, total, stage: "queued", label: STAGE_LABELS.queued };
}
