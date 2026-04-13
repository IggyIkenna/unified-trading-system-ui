"use client";

import { useExecutionDataStatusContext } from "@/components/ops/deployment/data-status/execution-data-status-context";
import { ExecutionDataStatusConfigFilters } from "@/components/ops/deployment/data-status/execution-data-status-config-filters";
import {
  ExecutionDataStatusLoadingCard,
  ExecutionDataStatusErrorCard,
  ExecutionDataStatusEmptyPathCard,
} from "@/components/ops/deployment/data-status/execution-data-status-feedback";
import { ExecutionDataStatusSummary } from "@/components/ops/deployment/data-status/execution-data-status-summary";
import { ExecutionDataStatusViews } from "@/components/ops/deployment/data-status/execution-data-status-views";
import { ExecutionDataStatusHierarchy } from "@/components/ops/deployment/data-status/execution-data-status-hierarchy";
import { ExecutionDataStatusDeployModal } from "@/components/ops/deployment/data-status/execution-data-status-deploy-modal";

export function ExecutionDataStatusLayout() {
  const { data, loading } = useExecutionDataStatusContext();

  return (
    <div className="space-y-4">
      <ExecutionDataStatusConfigFilters />
      <ExecutionDataStatusLoadingCard />
      <ExecutionDataStatusErrorCard />
      {data && !loading && (
        <>
          <ExecutionDataStatusSummary />
          <ExecutionDataStatusViews />
          <ExecutionDataStatusHierarchy />
        </>
      )}
      <ExecutionDataStatusEmptyPathCard />
      <ExecutionDataStatusDeployModal />
    </div>
  );
}
