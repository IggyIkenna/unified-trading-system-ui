"use client";

import { Play, Calendar, Server, AlertTriangle } from "lucide-react";
import { BuildSelector } from "@/components/ops/deployment/BuildSelector";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeployFormContext } from "@/components/ops/deployment/form/deploy-form-context";

export function DeployFormModeCloudLive() {
  const {
    serviceName,
    mode,
    setMode,
    cloudProvider,
    setCloudProvider,
    imageTag,
    setImageTag,
    trafficSplitPct,
    setTrafficSplitPct,
    healthGateTimeoutS,
    setHealthGateTimeoutS,
    rollbackOnFail,
    setRollbackOnFail,
  } = useDeployFormContext();

  return (
    <>
      <div className="space-y-2">
        <Label>Mode</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "batch" ? "default" : "outline"}
            onClick={() => setMode("batch")}
            className="flex-1"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Batch
          </Button>
          <Button
            type="button"
            variant={mode === "live" ? "default" : "outline"}
            onClick={() => setMode("live")}
            className="flex-1"
          >
            <Play className="h-4 w-4 mr-2" />
            Live
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Cloud Provider</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={cloudProvider === "gcp" ? "default" : "outline"}
            onClick={() => setCloudProvider("gcp")}
            className="flex-1"
          >
            <Server className="h-4 w-4 mr-2" />
            GCP
          </Button>
          <Button
            type="button"
            variant={cloudProvider === "aws" ? "default" : "outline"}
            onClick={() => setCloudProvider("aws")}
            className="flex-1"
          >
            <Server className="h-4 w-4 mr-2" />
            AWS
          </Button>
        </div>
        {cloudProvider === "aws" && (
          <div className="flex items-start gap-2 p-3 rounded-md status-warning mt-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-300">
              <span className="font-semibold">AWS configured but unauthenticated</span> — dry-run validation available;
              live deployment requires AWS credentials (IRSA / service account) in the environment.
            </p>
          </div>
        )}
      </div>

      {mode === "live" && (
        <div className="space-y-4 p-4 rounded-lg status-running">
          <p className="text-xs font-medium text-[var(--color-accent-cyan)] uppercase tracking-wider">
            Live Deployment Settings
          </p>

          <BuildSelector service={serviceName} onSelect={(tag) => setImageTag(tag)} />

          <div className="space-y-2">
            <Label htmlFor="imageTag">Image Tag</Label>
            <Input id="imageTag" value={imageTag} onChange={(e) => setImageTag(e.target.value)} placeholder="latest" />
            <p className="text-xs text-[var(--color-text-muted)]">
              Docker image tag to deploy (e.g. 1.0.0, 0.3.168-feat-my-feature). Select a build above to pre-fill, or
              type a tag manually.
            </p>
          </div>

          <div className="space-y-2">
            <Label>
              Traffic Split: <span className="text-[var(--color-accent-cyan)]">{trafficSplitPct}%</span>
            </Label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={trafficSplitPct}
              onChange={(e) => setTrafficSplitPct(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-[var(--color-text-muted)]">
              Canary traffic sent to new revision before full cutover
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="healthGateTimeout">Health Gate Timeout (seconds)</Label>
            <Input
              id="healthGateTimeout"
              type="number"
              min={30}
              max={3600}
              value={healthGateTimeoutS}
              onChange={(e) => setHealthGateTimeoutS(Number(e.target.value) || 300)}
            />
          </div>

          <div className="flex items-center gap-3">
            <Checkbox id="rollbackOnFail" checked={rollbackOnFail} onCheckedChange={(v) => setRollbackOnFail(!!v)} />
            <Label htmlFor="rollbackOnFail">Auto-rollback if health gate fails</Label>
          </div>
        </div>
      )}
    </>
  );
}
