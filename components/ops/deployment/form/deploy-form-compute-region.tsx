"use client";

import { Zap, Server, MapPin, AlertTriangle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REGIONS, getZonesForRegion } from "@/components/ops/deployment/form/deploy-form-constants";
import { useDeployFormContext } from "@/components/ops/deployment/form/deploy-form-context";

export function DeployFormComputeRegion() {
  const {
    compute,
    setCompute,
    region,
    setRegion,
    vmZone,
    setVmZone,
    backendRegion,
    showRegionWarning,
    hasDate,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    dateGranularity,
    dateValidation,
  } = useDeployFormContext();

  return (
    <>
      <div className="space-y-2">
        <Label>Compute Target</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={compute === "cloud_run" ? "default" : "outline"}
            onClick={() => setCompute("cloud_run")}
            className="flex-1"
          >
            <Zap className="h-4 w-4 mr-2" />
            Serverless (Cloud Run)
          </Button>
          <Button
            type="button"
            variant={compute === "vm" ? "default" : "outline"}
            onClick={() => setCompute("vm")}
            className="flex-1"
          >
            <Server className="h-4 w-4 mr-2" />
            VM Instance
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[var(--color-text-muted)]" />
          Region
        </Label>
        <Select
          value={region}
          onValueChange={(v) => {
            setRegion(v);
            setVmZone(`${v}-b`);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select region..." />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showRegionWarning && (
          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold">Cross-Region Egress Warning</p>
                <p className="mt-1">
                  Selected region ({region}) differs from configured storage region ({backendRegion}). This will incur
                  significant egress costs as data must cross regions.
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

      {compute === "vm" && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">Zone</Label>
          <Select value={vmZone} onValueChange={setVmZone}>
            <SelectTrigger>
              <SelectValue placeholder="Select zone..." />
            </SelectTrigger>
            <SelectContent>
              {getZonesForRegion(region).map((zone) => (
                <SelectItem key={zone.value} value={zone.value}>
                  {zone.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-[var(--color-text-muted)]">
            Starting zone for VMs. System auto-rotates through zones (1a→1b→1c) within the region.
          </p>
        </div>
      )}

      {hasDate && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date{dateGranularity === "none" ? " (optional)" : ""}</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10"
                placeholder={dateGranularity === "none" ? "From config" : undefined}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date{dateGranularity === "none" ? " (optional)" : ""}</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10"
                placeholder={dateGranularity === "none" ? "Yesterday" : undefined}
              />
            </div>
          </div>
        </div>
      )}

      {!dateValidation.valid && (
        <div className="flex items-start gap-3 p-3 rounded-lg status-error">
          <AlertTriangle className="h-5 w-5 text-[var(--color-accent-red)] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[var(--color-accent-red)]">Invalid Date Range</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">{dateValidation.message}</p>
            {dateValidation.earliestDate && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 text-[var(--color-accent-cyan)]"
                onClick={() => setStartDate(dateValidation.earliestDate!)}
              >
                Set to {dateValidation.earliestDate}
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
