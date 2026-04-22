"use client";

import { useExecutionDataStatusContext } from "@/components/ops/deployment/data-status/execution-data-status-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/shared/spinner";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { AlertTriangle, Rocket, X } from "lucide-react";

const DEPLOY_REGIONS = [
  { value: "asia-northeast1", label: "asia-northeast1 (Tokyo)" },
  { value: "asia-northeast2", label: "asia-northeast2 (Osaka)" },
  { value: "asia-southeast1", label: "asia-southeast1 (Singapore)" },
  { value: "us-central1", label: "us-central1 (Iowa)" },
  { value: "us-east1", label: "us-east1 (South Carolina)" },
  { value: "us-west1", label: "us-west1 (Oregon)" },
  { value: "europe-west1", label: "europe-west1 (Belgium)" },
  { value: "europe-west2", label: "europe-west2 (London)" },
];

export function ExecutionDataStatusDeployModal() {
  const {
    showDeployModal,
    missingShardsData,
    closeDeployModal,
    deployRegion,
    setDeployRegion,
    backendRegion,
    showDeployRegionWarning,
    handleDeployMissing,
    deployingMissing,
  } = useExecutionDataStatusContext();

  if (!showDeployModal || !missingShardsData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-[var(--color-accent-cyan)]" />
                Deploy Missing Shards
              </CardTitle>
              <CardDescription className="mt-1">
                {missingShardsData.total_missing} missing config×date combinations
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={closeDeployModal}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <WidgetScroll className="flex-1" viewportClassName="space-y-4 px-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[var(--color-bg-secondary)] p-3 rounded-lg">
              <p className="text-xs text-[var(--color-text-muted)]">Total Configs</p>
              <p className="text-lg font-mono font-bold">{missingShardsData.total_configs}</p>
            </div>
            <div className="bg-[var(--color-bg-secondary)] p-3 rounded-lg">
              <p className="text-xs text-[var(--color-text-muted)]">Total Dates</p>
              <p className="text-lg font-mono font-bold">{missingShardsData.total_dates}</p>
            </div>
            <div className="bg-[var(--color-status-error-bg)] p-3 rounded-lg border border-[var(--color-status-error-border)]">
              <p className="text-xs text-[var(--color-accent-red)]">Missing Shards</p>
              <p className="text-lg font-mono font-bold text-[var(--color-accent-red)]">
                {missingShardsData.total_missing}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Breakdown</p>

            {Object.keys(missingShardsData.breakdown?.by_strategy ?? {}).length > 0 && (
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-1">By Strategy:</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(missingShardsData.breakdown?.by_strategy ?? {}).map(([name, count]) => (
                    <Badge key={name} variant="outline" className="text-xs">
                      {name}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(missingShardsData.breakdown?.by_mode ?? {}).length > 0 && (
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-1">By Mode:</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(missingShardsData.breakdown?.by_mode ?? {}).map(([name, count]) => (
                    <Badge key={name} variant="outline" className="text-xs">
                      {name}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(missingShardsData.breakdown?.by_timeframe ?? {}).length > 0 && (
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-1">By Timeframe:</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(missingShardsData.breakdown?.by_timeframe ?? {}).map(([name, count]) => (
                    <Badge key={name} variant="outline" className="text-xs">
                      {name}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(missingShardsData.breakdown?.by_algo ?? {}).length > 0 && (
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-1">By Algorithm:</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(missingShardsData.breakdown?.by_algo ?? {}).map(([name, count]) => (
                    <Badge key={name} variant="outline" className="text-xs">
                      {name}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(missingShardsData.breakdown?.by_date ?? {}).length > 0 && (
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-1">
                  By Date ({Object.keys(missingShardsData.breakdown?.by_date ?? {}).length} dates):
                </p>
                <WidgetScroll className="max-h-20" viewportClassName="flex flex-wrap gap-1">
                  {Object.entries(missingShardsData.breakdown?.by_date ?? {})
                    .slice(0, 10)
                    .map(([date, count]) => (
                      <Badge key={date} variant="outline" className="text-xs font-mono">
                        {date}: {count}
                      </Badge>
                    ))}
                  {Object.keys(missingShardsData.breakdown?.by_date ?? {}).length > 10 && (
                    <Badge variant="outline" className="text-xs">
                      +{Object.keys(missingShardsData.breakdown?.by_date ?? {}).length - 10} more dates
                    </Badge>
                  )}
                </WidgetScroll>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)] space-y-2">
            <Label className="flex items-center gap-2">Region</Label>
            <Select value={deployRegion} onValueChange={setDeployRegion}>
              <SelectTrigger>
                <SelectValue placeholder="Select region..." />
              </SelectTrigger>
              <SelectContent>
                {DEPLOY_REGIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {showDeployRegionWarning && (
              <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-semibold">Cross-Region Egress Warning</p>
                    <p className="mt-1">
                      Selected region ({deployRegion}) differs from configured storage region ({backendRegion}). This
                      may incur significant egress costs.
                    </p>
                    <p className="mt-1 font-medium">
                      Recommendation: Use {backendRegion} to avoid egress charges. Zone failover (1a → 1b → 1c) provides
                      high availability within the region.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </WidgetScroll>

        <div className="flex-shrink-0 p-4 border-t border-[var(--color-border-subtle)] flex items-center justify-end gap-3">
          <Button variant="outline" onClick={closeDeployModal}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleDeployMissing()}
            disabled={deployingMissing || missingShardsData.total_missing === 0}
            className="bg-[var(--color-accent-cyan)] hover:bg-[var(--color-accent-cyan)]/90"
          >
            {deployingMissing ? <Spinner className="h-4 w-4 mr-2" /> : <Rocket className="h-4 w-4 mr-2" />}
            Deploy {missingShardsData.total_missing} Shards
          </Button>
        </div>
      </Card>
    </div>
  );
}
