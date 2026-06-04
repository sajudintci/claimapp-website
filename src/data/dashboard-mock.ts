export const dashboardKpis = [
  {
    label: "Total Claims",
    value: "4,128",
    trend: "+8.2%",
    trendUp: true,
    tone: "primary" as const,
    subtext: "All time in organization",
  },
  {
    label: "Needs Review",
    value: "136",
    trend: "-2.1%",
    trendUp: false,
    tone: "warning" as const,
    subtext: "Awaiting human validation",
  },
  {
    label: "Reviewed Today",
    value: "89",
    trend: "+14.0%",
    trendUp: true,
    tone: "success" as const,
    subtext: "Completed by officers",
  },
  {
    label: "Failed Extraction",
    value: "12",
    trend: "-18.0%",
    trendUp: false,
    tone: "danger" as const,
    subtext: "Requires re-upload or fix",
  },
];

export const workflowStages = [
  { label: "Uploaded", count: 524, percentage: 100 },
  { label: "AI Processing", count: 89, percentage: 17 },
  { label: "Extraction Complete", count: 412, percentage: 79 },
  { label: "Human Review", count: 136, percentage: 26 },
  { label: "Reviewed", count: 2987, percentage: 57 },
  { label: "Export", count: 2410, percentage: 46 },
];

export const claimsByStatus = [
  { status: "Processing", count: 89, color: "bg-slate-500" },
  { status: "Extracted", count: 312, color: "bg-blue-500" },
  { status: "Reviewed", count: 2987, color: "bg-emerald-500" },
  { status: "Needs Attention", count: 136, color: "bg-amber-500" },
  { status: "Failed", count: 12, color: "bg-red-500" },
  { status: "Archived", count: 592, color: "bg-zinc-400" },
];

export const recentActivity = [
  {
    id: "1",
    actor: "Dina Putri",
    action: "Marked claim as reviewed",
    target: "CLM-1003",
    time: "12 min ago",
    type: "success" as const,
  },
  {
    id: "2",
    actor: "System",
    action: "AI extraction completed",
    target: "CLM-1001",
    time: "34 min ago",
    type: "info" as const,
  },
  {
    id: "3",
    actor: "Alya Rahma",
    action: "Updated low-confidence field",
    target: "CLM-1002",
    time: "1 hr ago",
    type: "warning" as const,
  },
  {
    id: "4",
    actor: "System",
    action: "OCR extraction failed",
    target: "CLM-1005",
    time: "2 hr ago",
    type: "error" as const,
  },
  {
    id: "5",
    actor: "Fikri Ilham",
    action: "Uploaded 3 claim documents",
    target: "Batch #42",
    time: "3 hr ago",
    type: "info" as const,
  },
];

export const creditUsage = {
  remainingCredits: 12450,
  usedThisMonth: 3550,
  monthlyQuota: 16000,
  expiryDate: "2026-06-30",
};

export const extractionHealth = {
  avgConfidence: 87.4,
  documentsToday: 156,
  autoPassRate: 72,
};
