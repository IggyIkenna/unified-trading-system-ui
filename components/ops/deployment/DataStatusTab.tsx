"use client";

import { ExecutionDataStatus } from "@/components/ops/deployment/ExecutionDataStatus";
import { DataStatusProvider } from "@/components/ops/deployment/data-status/data-status-provider";
import { DataStatusTabPanels } from "@/components/ops/deployment/data-status/data-status-tab-panels";
import type { DataStatusTabProps } from "@/components/ops/deployment/data-status/types";

export type { DataStatusTabProps } from "@/components/ops/deployment/data-status/types";

export function DataStatusTab({ serviceName, deploymentResult, isDeploying, onDeployMissing }: DataStatusTabProps) {
  if (serviceName === "execution-services") {
    return <ExecutionDataStatus serviceName={serviceName} />;
  }
  return (
    <DataStatusProvider
      serviceName={serviceName}
      deploymentResult={deploymentResult}
      isDeploying={isDeploying}
      onDeployMissing={onDeployMissing}
    >
      <DataStatusTabPanels />
    </DataStatusProvider>
  );
}
