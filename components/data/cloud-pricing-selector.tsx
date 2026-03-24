"use client";

// CloudPricingSelector — Two-part component:
// 1. Cloud toggle (GCP / AWS / Both) with linked account status
// 2. Access mode selector (In-System cheaper vs Download/egress more expensive)
// Used on /services/data/overview (Cloud & API tab) and as a pre-query modal step

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Download, Zap, ArrowRight, Check, Info } from "lucide-react";
import type {
  CloudProvider,
  AccessMode,
  DataOrg,
} from "@/lib/data-service-types";
import { PRICING_MODELS } from "@/lib/data-service-types";

interface CloudPricingSelectorProps {
  org: DataOrg;
  selectedCloud: CloudProvider;
  selectedMode: AccessMode;
  onCloudChange: (cloud: CloudProvider) => void;
  onModeChange: (mode: AccessMode) => void;
  estimatedGb?: number; // for live cost preview
  className?: string;
}

export function CloudPricingSelector({
  org,
  selectedCloud,
  selectedMode,
  onCloudChange,
  onModeChange,
  estimatedGb,
  className,
}: CloudPricingSelectorProps) {
  const inSystemPricing = PRICING_MODELS.in_system;
  const downloadPricing = PRICING_MODELS.download;

  // Cross-cloud surcharge: if client prefers AWS but we store primarily on GCP (or vice versa)
  const hasCrossCloudSurcharge =
    selectedMode === "download" &&
    org.linkedCloudAccount !== undefined &&
    selectedCloud !== org.cloudPreference;

  const estimatedCostIn = estimatedGb
    ? estimatedGb * inSystemPricing.pricePerGb
    : null;
  const estimatedCostDown = estimatedGb
    ? estimatedGb * downloadPricing.pricePerGb +
      (hasCrossCloudSurcharge ? estimatedGb * 0.08 : 0)
    : null;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Cloud provider toggle */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Cloud Provider</div>
        <div className="flex gap-2">
          {(["gcp", "aws", "both"] as CloudProvider[]).map((cloud) => (
            <button
              key={cloud}
              onClick={() => onCloudChange(cloud)}
              className={cn(
                "flex-1 rounded-md border px-3 py-2.5 text-sm transition-colors",
                selectedCloud === cloud
                  ? cloud === "gcp"
                    ? "border-blue-500/60 bg-blue-500/10 text-blue-400"
                    : cloud === "aws"
                      ? "border-orange-500/60 bg-orange-500/10 text-orange-400"
                      : "border-sky-500/60 bg-sky-500/10 text-sky-400"
                  : "border-border hover:bg-accent",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cloud
                    className={cn(
                      "size-4",
                      cloud === "gcp"
                        ? "text-blue-400"
                        : cloud === "aws"
                          ? "text-orange-400"
                          : "text-sky-400",
                    )}
                  />
                  <span className="font-medium uppercase">{cloud}</span>
                </div>
                {selectedCloud === cloud && <Check className="size-4" />}
              </div>
              {cloud === org.cloudPreference && (
                <div className="mt-1 text-[10px] text-muted-foreground text-left">
                  Your preference
                </div>
              )}
              {cloud !== "both" &&
                org.linkedCloudAccount?.startsWith(cloud) && (
                  <Badge variant="secondary" className="mt-1 text-[10px]">
                    Linked
                  </Badge>
                )}
            </button>
          ))}
        </div>
        {hasCrossCloudSurcharge && (
          <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 rounded-md px-2 py-1.5">
            <Info className="size-3.5 shrink-0" />
            Cross-cloud transfer adds +$0.08/GB egress surcharge
          </div>
        )}
      </div>

      {/* Access mode selector */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Access Mode</div>
        <div className="grid grid-cols-2 gap-3">
          {/* In-System */}
          <button
            onClick={() => onModeChange("in_system")}
            className={cn(
              "rounded-md border p-4 text-left transition-colors",
              selectedMode === "in_system"
                ? "border-emerald-500/60 bg-emerald-500/10"
                : "border-border hover:bg-accent",
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-emerald-400" />
                <span className="font-medium text-sm">In-System</span>
              </div>
              {selectedMode === "in_system" && (
                <Badge
                  variant="outline"
                  className="text-emerald-500 border-emerald-500/30 text-[10px]"
                >
                  Selected
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              Query via our API. Data stays in Odum cloud.
            </div>
            <div className="text-lg font-bold font-mono text-emerald-400">
              ${inSystemPricing.pricePerGb.toFixed(2)}
              <span className="text-xs font-normal text-muted-foreground">
                /GB
              </span>
            </div>
            {estimatedCostIn !== null && (
              <div className="mt-1 text-xs text-emerald-400">
                ≈ ${estimatedCostIn.toFixed(2)} estimated
              </div>
            )}
            <Badge
              variant="outline"
              className="mt-2 text-[10px] text-emerald-500 border-emerald-500/20"
            >
              Recommended
            </Badge>
          </button>

          {/* Download */}
          <button
            onClick={() => onModeChange("download")}
            className={cn(
              "rounded-md border p-4 text-left transition-colors",
              selectedMode === "download"
                ? "border-amber-500/60 bg-amber-500/10"
                : "border-border hover:bg-accent",
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Download className="size-4 text-amber-400" />
                <span className="font-medium text-sm">Download</span>
              </div>
              {selectedMode === "download" && (
                <Badge
                  variant="outline"
                  className="text-amber-500 border-amber-500/30 text-[10px]"
                >
                  Selected
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              Export to your {selectedCloud === "aws" ? "S3" : "GCS"} bucket.
              You own the copy.
            </div>
            <div className="text-lg font-bold font-mono text-amber-400">
              ${downloadPricing.pricePerGb.toFixed(2)}
              <span className="text-xs font-normal text-muted-foreground">
                /GB
              </span>
            </div>
            {hasCrossCloudSurcharge && (
              <div className="text-xs text-amber-400">
                + $0.08/GB cross-cloud
              </div>
            )}
            {estimatedCostDown !== null && (
              <div className="mt-1 text-xs text-amber-400">
                ≈ ${estimatedCostDown.toFixed(2)} estimated
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Linked account note */}
      {selectedMode === "download" && !org.linkedCloudAccount && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-accent/30 px-3 py-2 text-xs text-muted-foreground">
          <Info className="size-3.5 shrink-0" />
          Link your {selectedCloud === "aws" ? "AWS account" : "GCP project"} to
          enable direct egress.
          <Button
            variant="link"
            className="h-auto p-0 text-xs text-sky-400 ml-auto"
          >
            Connect <ArrowRight className="ml-1 size-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
