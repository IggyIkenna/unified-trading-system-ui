"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DeploymentDetailsHeader } from "./deployment-details-header";
import { DeploymentDetailsInlineSummary } from "./deployment-details-inline-summary";
import { DeploymentDetailsTabs } from "./deployment-details-tabs";
import { DeploymentDetailsShardLogsDialog } from "./deployment-details-shard-logs-dialog";

export function DeploymentDetailsLoaded() {
  return (
    <Card className="border-2 border-[var(--color-border-emphasis)]">
      <DeploymentDetailsHeader />
      <CardContent className="space-y-4">
        <DeploymentDetailsInlineSummary />
        <DeploymentDetailsTabs />
      </CardContent>
      <DeploymentDetailsShardLogsDialog />
    </Card>
  );
}
