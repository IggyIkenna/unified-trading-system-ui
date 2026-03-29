"use client";

import { useExecutionDataStatusContext } from "@/components/ops/deployment/data-status/execution-data-status-context";
import { inferCloudProvider } from "@/components/ops/deployment/data-status/execution-data-status-utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, FolderOpen } from "lucide-react";

export function ExecutionDataStatusLoadingCard() {
  const { loading, cloudConfigPath } = useExecutionDataStatusContext();

  if (!loading) return null;

  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" className="h-8 w-8 text-[var(--color-accent-cyan)]" />
          <p className="text-sm text-[var(--color-text-muted)]">Checking execution results against configs...</p>
          <div className="flex items-center gap-2">
            {cloudConfigPath && inferCloudProvider(cloudConfigPath) && (
              <Badge variant="outline" className="text-[10px]">
                {inferCloudProvider(cloudConfigPath) === "gcp" ? "GCP" : "AWS"}
              </Badge>
            )}
            <p className="text-xs text-[var(--color-text-muted)] font-mono">{cloudConfigPath}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExecutionDataStatusErrorCard() {
  const { error, loading } = useExecutionDataStatusContext();

  if (!error || loading) return null;

  return (
    <Card>
      <CardContent className="py-8">
        <div className="flex items-center justify-center gap-3 text-[var(--color-accent-red)]">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExecutionDataStatusEmptyPathCard() {
  const { cloudConfigPath, loading } = useExecutionDataStatusContext();

  if (cloudConfigPath || loading) return null;

  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center justify-center gap-3 text-[var(--color-text-muted)]">
          <FolderOpen className="h-8 w-8" />
          <p className="text-sm">Select a config path above to check execution results</p>
        </div>
      </CardContent>
    </Card>
  );
}
