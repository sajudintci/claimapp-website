export type ReportSummaryResponse = {
  kpis?: {
    totalClaims?: number;
    failedClaims?: number;
    reviewedClaims?: number;
    needsAttention?: number;
  };
  processing?: {
    queuedJobs?: number;
    processingJobs?: number;
  };
  creditUsage?: {
    remainingCredits?: number;
    usedThisMonth?: number;
    monthlyQuota?: number;
    expiryDate?: string;
  };
  trends?: {
    totalClaims?: string;
    reviewedClaims?: string;
    failedClaims?: string;
    needsAttention?: string;
  };
};

export type DashboardMetricsResponse = {
  kpis: {
    totalUploaded: number;
    pendingReview: number;
    pendingApproval: number;
    approved: number;
    highPriorityCount: number;
    dueTodayCount: number;
    approvalRate: number;
    uploadTrend: string;
  };
  workQueue: Array<{
    id: string;
    claimNumber: string;
    patientName: string;
    provider: string;
    status: string;
    displayStatus: string;
    submittedAt: string;
  }>;
  recentActivity: Array<{
    id: string;
    title: string;
    actorName: string | null;
    createdAt: string;
  }>;
  extractionQuality: Array<{
    label: string;
    pct: number;
    count: number;
  }>;
  throughput: Array<{
    label: string;
    uploaded: number;
    processed: number;
  }>;
};

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type NotificationsResponse = {
  unread: number;
  items: NotificationItem[];
};

export type SettingsResponse = {
  organizationName?: string;
  organizationCode?: string;
  timezone?: string;
  currency?: string;
  sessionTimeoutMinutes?: number;
  suspiciousLoginAlert?: boolean;
  ocrCreditsRemaining?: number;
  ocrMonthlyQuota?: number;
  ocrCreditsUsedThisMonth?: number;
};

export type UserListItem = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  departmentId: string | null;
  departmentName: string | null;
  roles: string[];
  roleIds?: string[];
  avatarUrl: string | null;
  createdAt: string;
};

export type UserFormOption = { id: string; name: string };

export type UserFormOptionsResponse = {
  departments: UserFormOption[];
  roles: UserFormOption[];
};

export type UsersListResponse = {
  items: UserListItem[];
  summary?: {
    total: number;
    active: number;
    inactive: number;
  };
};

export type DepartmentListItem = {
  id: string;
  name: string;
  userCount: number;
  createdAt: string;
};

export type DepartmentsListResponse = {
  items: DepartmentListItem[];
  summary?: {
    total: number;
    withUsers: number;
    empty: number;
  };
};

export type AuditLogRecord = {
  id: string;
  organizationId: string;
  userId: string;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  ipAddress: string;
  result: "Success" | "Failed" | "Warning";
  beforeChanges: Record<string, unknown> | null;
  afterChanges: Record<string, unknown> | null;
};
