"use client";

import { useState } from "react";
import { DashboardClaimsTable } from "@/components/claimora/dashboard/dashboard-claims-table";
import { DashboardHeader } from "@/components/claimora/dashboard/dashboard-header";
import { DashboardKpiCards } from "@/components/claimora/dashboard/kpi-cards";
import { ClaimsStatusChart } from "@/components/claimora/dashboard/claims-status-chart";
import { QuickActions } from "@/components/claimora/dashboard/quick-actions";
import { RecentActivity } from "@/components/claimora/dashboard/recent-activity";
import { WorkflowPipeline } from "@/components/claimora/dashboard/workflow-pipeline";

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6 pb-10">
      <DashboardHeader
        onRefresh={() => setRefreshKey((k) => k + 1)}
        isRefreshing={false}
      />

      <DashboardKpiCards key={`kpi-${refreshKey}`} />

      <QuickActions />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <WorkflowPipeline key={`wf-${refreshKey}`} />
        </div>
        <div className="space-y-6">
          <ClaimsStatusChart key={`chart-${refreshKey}`} />
          <RecentActivity key={`act-${refreshKey}`} />
        </div>
      </div>

      <DashboardClaimsTable refreshKey={refreshKey} />
    </div>
  );
}
