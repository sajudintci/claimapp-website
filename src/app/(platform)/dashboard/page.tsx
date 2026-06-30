"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/claimora/dashboard/dashboard-header";
import { DashboardKpiCards } from "@/components/claimora/dashboard/kpi-cards";
<<<<<<< HEAD
import { ClaimsStatusChart } from "@/components/claimora/dashboard/claims-status-chart";
=======
import { ExtractionQuality } from "@/components/claimora/dashboard/extraction-quality";
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
import { RecentActivity } from "@/components/claimora/dashboard/recent-activity";
import { ThroughputChart } from "@/components/claimora/dashboard/throughput-chart";
import { WorkQueue } from "@/components/claimora/dashboard/work-queue";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiAuthedFetch } from "@/lib/api/client";
import { DashboardMetricsResponse } from "@/types/api";

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, isLoading } = useApiQuery(
    () => apiAuthedFetch<DashboardMetricsResponse>("/reports/dashboard-metrics"),
    [refreshKey],
  );

  return (
    <div className="space-y-6 pb-10">
      <DashboardHeader onRefresh={() => setRefreshKey((k) => k + 1)} />

      <DashboardKpiCards kpis={data?.kpis} isLoading={isLoading} />

<<<<<<< HEAD
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <WorkflowPipeline key={`wf-${refreshKey}`} />
        </div>
        <div className="space-y-6">
          <ClaimsStatusChart key={`chart-${refreshKey}`} />
          <RecentActivity key={`act-${refreshKey}`} />
=======
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WorkQueue items={data?.workQueue} isLoading={isLoading} />
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
        </div>
        <RecentActivity items={data?.recentActivity} isLoading={isLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <ExtractionQuality buckets={data?.extractionQuality} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-3">
          <ThroughputChart days={data?.throughput} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
