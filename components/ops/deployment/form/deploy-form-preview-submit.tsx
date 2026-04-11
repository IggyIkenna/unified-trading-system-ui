"use client";

import { CLIPreview } from "@/components/ops/deployment/CLIPreview";
import { useDeployFormContext } from "@/components/ops/deployment/form/deploy-form-context";
import { DeployFormQuotaDialog } from "@/components/ops/deployment/form/deploy-form-quota-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/spinner";
import { HelpCircle, Play } from "lucide-react";

export function DeployFormPreviewSubmit() {
  const {
    serviceName,
    dimensions,
    compute,
    startDate,
    endDate,
    selectedCategories,
    selectedVenues,
    force,
    dryRun,
    logLevel,
    skipVenueSharding,
    skipFeatureGroupSharding,
    dateGranularity,
    containerMaxWorkers,
    extraArgs,
    quotaLoading,
    openQuotaModal,
    canCheckQuota,
    canSubmit,
    handleSubmit,
    isDeploying,
  } = useDeployFormContext();

  return (
    <>
      <CLIPreview
        serviceName={serviceName}
        dimensions={dimensions}
        formValues={{
          service: serviceName,
          compute,
          start_date: startDate,
          end_date: endDate,
          category: selectedCategories.length > 0 ? selectedCategories : undefined,
          venue: selectedVenues.length > 0 ? selectedVenues : undefined,
          force,
          dry_run: dryRun,
          log_level: logLevel,
          skip_venue_sharding: skipVenueSharding,
          skip_feature_group_sharding: skipFeatureGroupSharding,
          date_granularity: dateGranularity !== "default" ? dateGranularity : undefined,
          max_workers:
            containerMaxWorkers && !Number.isNaN(parseInt(containerMaxWorkers, 10))
              ? parseInt(containerMaxWorkers, 10)
              : undefined,
          extra_args: extraArgs.trim() || undefined,
        }}
      />

      <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-default)]">
        <div className="flex items-center gap-2">
          {dryRun ? <Badge variant="warning">Dry Run Mode</Badge> : <Badge variant="success">Live Mode</Badge>}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => void openQuotaModal()}
            disabled={!canCheckQuota || quotaLoading}
            title="Quota info"
            aria-label="Quota info"
          >
            {quotaLoading ? <Spinner className="h-4 w-4" /> : <HelpCircle className="h-4 w-4" />}
          </Button>

          <Button onClick={handleSubmit} disabled={!canSubmit} className="min-w-[140px]">
            {isDeploying ? (
              <>
                <Spinner className="h-4 w-4" />
                Deploying...
              </>
            ) : dryRun ? (
              <>
                <Play className="h-4 w-4" />
                Preview Shards
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Deploy
              </>
            )}
          </Button>
        </div>
      </div>

      <DeployFormQuotaDialog />
    </>
  );
}
