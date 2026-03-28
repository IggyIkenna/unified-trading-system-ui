"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FeatureCatalogueEntry } from "@/lib/build-mock-data";
import { FEAT_STATUS_CFG } from "./feature-helpers";

export function CatStatusBadge({ status }: { status: FeatureCatalogueEntry["status"] }) {
  const cfg = FEAT_STATUS_CFG[status];
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn("text-xs gap-1", cfg.badge)}>
      <Icon className="size-3" />
      {status === "not_computed" ? "Not Computed" : status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
