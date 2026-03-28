"use client";

import { Play, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useDeployFormContext } from "@/components/ops/deployment/form/deploy-form-context";
import { DeployFormChecklistSection } from "@/components/ops/deployment/form/deploy-form-checklist-section";
import { DeployFormModeCloudLive } from "@/components/ops/deployment/form/deploy-form-mode-cloud-live";
import { DeployFormComputeRegion } from "@/components/ops/deployment/form/deploy-form-compute-region";
import { DeployFormDimensionFields } from "@/components/ops/deployment/form/deploy-form-dimension-fields";
import { DeployFormAdvancedSection } from "@/components/ops/deployment/form/deploy-form-advanced-section";
import { DeployFormPreviewSubmit } from "@/components/ops/deployment/form/deploy-form-preview-submit";

export function DeployFormContent() {
  const { serviceName, loadingDims, estimatedShards } = useDeployFormContext();

  if (loadingDims) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent-cyan)]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-[var(--color-accent-cyan)]" />
              Deploy {serviceName}
            </CardTitle>
            <CardDescription className="mt-1">Configure sharding dimensions and run parameters</CardDescription>
          </div>
          {estimatedShards > 0 && (
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-[var(--color-text-primary)]">~{estimatedShards}</div>
              <div className="text-xs text-[var(--color-text-muted)]">estimated shards</div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <DeployFormChecklistSection />
        <DeployFormModeCloudLive />
        <DeployFormComputeRegion />
        <DeployFormDimensionFields />
        <DeployFormAdvancedSection />
        <DeployFormPreviewSubmit />
      </CardContent>
    </Card>
  );
}
