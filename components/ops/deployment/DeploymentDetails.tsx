"use client";

import { Loader2, RefreshCw, X, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDeploymentDetailsModel } from "./details/use-deployment-details-model";
import { DeploymentDetailsProvider } from "./details/deployment-details-context";
import { DeploymentDetailsLoaded } from "./details/deployment-details-loaded";

export interface DeploymentDetailsProps {
  deploymentId: string;
  onClose: () => void;
}

export function DeploymentDetails({ deploymentId, onClose }: DeploymentDetailsProps) {
  const model = useDeploymentDetailsModel({ deploymentId, onClose });

  if (model.loading && !model.status) {
    return (
      <Card className="border-2 border-[var(--color-border-emphasis)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-mono text-lg">{deploymentId}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent-cyan)]" />
            <div className="text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">Loading deployment status...</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Checking shard states and VM instances</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (model.error || !model.status) {
    return (
      <Card className="border-2 border-[var(--color-accent-red)]/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Deployment Details</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 rounded-lg status-error">
            <AlertCircle className="h-5 w-5 text-[var(--color-accent-red)]" />
            <div>
              <p className="text-sm font-medium text-[var(--color-accent-red)]">
                {model.error || "Deployment not found"}
              </p>
              <Button variant="ghost" size="sm" onClick={model.fetchStatus} className="mt-2">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DeploymentDetailsProvider value={model}>
      <DeploymentDetailsLoaded />
    </DeploymentDetailsProvider>
  );
}
