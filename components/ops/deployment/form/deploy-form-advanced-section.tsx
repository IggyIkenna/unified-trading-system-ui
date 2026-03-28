"use client";

import { Info } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDeployFormContext } from "@/components/ops/deployment/form/deploy-form-context";

export function DeployFormAdvancedSection() {
  const {
    logLevel,
    setLogLevel,
    containerMaxWorkers,
    setContainerMaxWorkers,
    deploymentTag,
    setDeploymentTag,
    dryRun,
    setDryRun,
    force,
    setForce,
    maxConcurrent,
    setMaxConcurrent,
    maxConcurrentExceedsLimit,
    skipVenueSharding,
    setSkipVenueSharding,
    skipFeatureGroupSharding,
    setSkipFeatureGroupSharding,
    dateGranularity,
    setDateGranularity,
    hasVenue,
    hasFeatureGroup,
    hasDate,
    startDate,
    endDate,
    selectedCategories,
    extraArgs,
    setExtraArgs,
  } = useDeployFormContext();

  return (
    <div className="border-t border-[var(--color-border-default)] pt-4">
      <div className="flex items-center gap-2 mb-3">
        <Info className="h-4 w-4 text-[var(--color-text-muted)]" />
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">Advanced Options</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Log Level</Label>
          <Select value={logLevel} onValueChange={(v) => setLogLevel(v as typeof logLevel)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DEBUG">DEBUG</SelectItem>
              <SelectItem value="INFO">INFO</SelectItem>
              <SelectItem value="WARNING">WARNING</SelectItem>
              <SelectItem value="ERROR">ERROR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Max Workers (container)</Label>
          <Input
            type="number"
            placeholder="Default (4)"
            value={containerMaxWorkers}
            onChange={(e) => setContainerMaxWorkers(e.target.value)}
            min={1}
            max={32}
          />
          <p className="text-xs text-[var(--color-text-muted)]">
            Higher values auto-scale machine resources (8 workers = 2x CPU/RAM)
          </p>
        </div>
      </div>

      <div className="space-y-2 mt-4">
        <Label htmlFor="deploymentTag">
          Deployment Notes
          <span className="text-[var(--color-text-muted)] font-normal text-xs ml-2">(Optional but encouraged)</span>
        </Label>
        <Input
          id="deploymentTag"
          placeholder="e.g., Fixed Curve adapter, Added DEFI backfill, Testing new venues"
          value={deploymentTag}
          onChange={(e) => {
            const value = e.target.value;
            if (value.length <= 200) {
              setDeploymentTag(value);
            }
          }}
          maxLength={200}
          className="font-mono text-sm"
        />
        <p className="text-xs text-[var(--color-text-muted)]">
          Human-readable description • {deploymentTag.length}/200 characters
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="flex items-center gap-2">
          <Checkbox id="dryRun" checked={dryRun} onCheckedChange={(checked) => setDryRun(checked as boolean)} />
          <Label htmlFor="dryRun" className="cursor-pointer">
            Dry Run (preview only)
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="force" checked={force} onCheckedChange={(checked) => setForce(checked as boolean)} />
          <Label htmlFor="force" className="cursor-pointer">
            Force (skip existence checks)
          </Label>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)]">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Max concurrent jobs</Label>
          <Input
            type="number"
            min={1}
            max={2500}
            placeholder="2000"
            value={maxConcurrent}
            onChange={(e) => setMaxConcurrent(e.target.value)}
            className={maxConcurrentExceedsLimit ? "border-red-500" : ""}
          />
          <p className="text-xs text-[var(--color-text-muted)]">
            Controls rolling concurrency (how many VMs/jobs run at the same time). Default: 2,000. Maximum: 2,500.
          </p>
          {maxConcurrentExceedsLimit && (
            <p className="text-xs text-red-500">
              Max concurrent cannot exceed 2,500. Use date granularity (weekly/monthly) to reduce shard count.
            </p>
          )}
        </div>
      </div>

      {hasVenue && (
        <div className="mt-4 p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)]">
          <div className="flex items-center gap-2">
            <Checkbox
              id="skipVenueSharding"
              checked={skipVenueSharding}
              onCheckedChange={(checked) => setSkipVenueSharding(checked as boolean)}
            />
            <Label htmlFor="skipVenueSharding" className="cursor-pointer font-medium">
              Skip venue sharding (process all venues per job)
            </Label>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-2 ml-6">
            Reduces job count significantly by processing all venues in a single shard per date. Machine resources are
            auto-scaled based on max-workers to compensate.
            {skipVenueSharding && (
              <span className="block mt-1 text-[var(--color-accent-cyan)]">
                Estimated: ~
                {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} ×{" "}
                {selectedCategories.length || 3} = ~
                {(Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) +
                  1) *
                  (selectedCategories.length || 3)}{" "}
                shards (vs full venue sharding)
              </span>
            )}
          </p>
        </div>
      )}

      {hasFeatureGroup && (
        <div className="mt-4 p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)]">
          <div className="flex items-center gap-2">
            <Checkbox
              id="skipFeatureGroupSharding"
              checked={skipFeatureGroupSharding}
              onCheckedChange={(checked) => setSkipFeatureGroupSharding(checked as boolean)}
            />
            <Label htmlFor="skipFeatureGroupSharding" className="cursor-pointer font-medium">
              Skip feature group sharding (process all feature groups per job)
            </Label>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-2 ml-6">
            Reduces job count by processing all feature groups in a single shard.
            {skipFeatureGroupSharding && (
              <span className="block mt-1 text-[var(--color-accent-cyan)]">
                Feature groups will be processed together instead of in separate jobs.
              </span>
            )}
          </p>
        </div>
      )}

      {hasDate && (
        <div className="mt-4 p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)]">
          <div className="space-y-2">
            <Label className="font-medium">Date Granularity Override</Label>
            <Select
              value={dateGranularity}
              onValueChange={(value) =>
                setDateGranularity(value as "default" | "daily" | "weekly" | "monthly" | "none")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Use service default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Use service default</SelectItem>
                <SelectItem value="daily">Daily (1 shard per day)</SelectItem>
                <SelectItem value="weekly">Weekly (1 shard per 7 days)</SelectItem>
                <SelectItem value="monthly">Monthly (1 shard per 30 days)</SelectItem>
                <SelectItem value="none">None (single shard, no date args)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-[var(--color-text-muted)]">
              Override the date chunking to reduce job count. Weekly/monthly groups multiple days into one shard.
              {dateGranularity === "none" && (
                <span className="block mt-1 text-[var(--color-accent-cyan)]">
                  Single shard with no start/end date passed to service. Start/end date fields are optional (defaults to
                  service&apos;s expected_start_dates.yaml → yesterday).
                </span>
              )}
              {dateGranularity &&
                dateGranularity !== "default" &&
                dateGranularity !== "daily" &&
                dateGranularity !== "none" &&
                startDate &&
                endDate && (
                  <span className="block mt-1 text-[var(--color-accent-cyan)]">
                    {dateGranularity === "weekly"
                      ? `~${Math.ceil((Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1) / 7)} weekly chunks instead of ${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} daily`
                      : `~${Math.ceil((Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1) / 30)} monthly chunks instead of ${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} daily`}
                  </span>
                )}
            </p>
          </div>
        </div>
      )}

      {(containerMaxWorkers || skipVenueSharding || skipFeatureGroupSharding) && (
        <div className="mt-4 p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-accent-yellow)]/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[var(--color-accent-yellow)]">⚡</span>
            <Label className="font-medium text-[var(--color-accent-yellow)]">Auto-Scaled Compute Resources</Label>
          </div>
          <div className="text-xs text-[var(--color-text-muted)] space-y-1">
            {(() => {
              const baseWorkers = 4;
              const maxWorkers = containerMaxWorkers ? parseInt(containerMaxWorkers, 10) : baseWorkers;
              let scaleFactor = Math.max(1.0, maxWorkers / baseWorkers);

              if (skipVenueSharding) {
                scaleFactor *= 2.0;
              }

              const factors: string[] = [];
              if (containerMaxWorkers && parseInt(containerMaxWorkers, 10) > baseWorkers) {
                factors.push(`${maxWorkers}/${baseWorkers} workers = ${(maxWorkers / baseWorkers).toFixed(1)}x`);
              }
              if (skipVenueSharding) {
                factors.push("venue consolidation = 2x");
              }

              if (scaleFactor > 1.0) {
                return (
                  <>
                    <p>
                      Machine resources will be scaled up by{" "}
                      <span className="text-[var(--color-accent-yellow)] font-semibold">{scaleFactor.toFixed(1)}x</span>
                    </p>
                    {factors.length > 0 && (
                      <p className="text-[var(--color-text-muted)]">Factors: {factors.join(" × ")}</p>
                    )}
                    <p className="mt-1 text-[var(--color-accent-cyan)]">
                      Example: c2-standard-16 → c2-standard-
                      {Math.min(60, Math.round(16 * scaleFactor))}
                    </p>
                  </>
                );
              }
              return <p>Using base compute resources (no scaling needed)</p>;
            })()}
          </div>
        </div>
      )}

      <div className="space-y-2 mt-4">
        <Label>Extra CLI Arguments</Label>
        <Input
          placeholder="e.g., --data-types trades --symbols BTC-USDT"
          value={extraArgs}
          onChange={(e) => setExtraArgs(e.target.value)}
        />
        <p className="text-xs text-[var(--color-text-muted)]">
          Additional arguments passed directly to the service container
        </p>
      </div>
    </div>
  );
}
