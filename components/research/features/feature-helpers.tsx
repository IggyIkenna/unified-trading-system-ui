"use client";

import { Badge } from "@/components/ui/badge";
import type {
  FeatureCatalogueEntry,
  FeatureGroupEntry,
} from "@/lib/build-mock-data";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

export const PAGE_SIZE = 100;

export function categoryIdToShard(
  serviceId: string,
  categoryId: string,
): FeatureCatalogueEntry["shard"] {
  if (serviceId === "sports") return "Sports";
  if (serviceId === "calendar") return "Prediction";
  if (categoryId === "CEFI") return "CeFi";
  if (categoryId === "TRADFI") return "TradFi";
  if (categoryId === "DEFI") return "DeFi";
  return "CeFi";
}

export function serviceIdToFeatureType(
  serviceId: string,
): FeatureCatalogueEntry["feature_type"] {
  const m: Record<string, FeatureCatalogueEntry["feature_type"]> = {
    "delta-one": "Delta-One",
    volatility: "Volatility",
    onchain: "On-Chain",
    sports: "Sports",
    calendar: "Calendar",
  };
  return m[serviceId] ?? "Delta-One";
}

export function makeNewFeatureIds(nameClean: string) {
  const t = Date.now();
  return {
    individualId: `user_${nameClean}_${t}`,
    catalogueId: `feat-${nameClean}-${t}`,
    nowIso: new Date(t).toISOString(),
  };
}

// ─── Status / colour helpers ──────────────────────────────────────────────────

export const GROUP_STATUS_CFG = {
  healthy: { icon: CheckCircle2, color: "text-emerald-400", label: "Healthy" },
  stale: { icon: AlertTriangle, color: "text-amber-400", label: "Stale" },
  computing: { icon: Loader2, color: "text-blue-400", label: "Computing" },
  failed: { icon: XCircle, color: "text-red-400", label: "Failed" },
  not_started: {
    icon: Clock,
    color: "text-muted-foreground",
    label: "Not Started",
  },
} as const;

export const FEAT_STATUS_CFG = {
  active: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    badge: "border-emerald-400/30 text-emerald-400",
  },
  stale: {
    icon: AlertTriangle,
    color: "text-amber-400",
    badge: "border-amber-400/30 text-amber-400",
  },
  not_computed: {
    icon: Clock,
    color: "text-muted-foreground",
    badge: "border-border/50 text-muted-foreground",
  },
  deprecated: {
    icon: XCircle,
    color: "text-red-400",
    badge: "border-red-400/30 text-red-400",
  },
} as const;

export const SERVICE_COLORS: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  pink: "bg-pink-500/10 text-pink-400 border-pink-500/30",
};

export const SERVICE_BAR: Record<string, string> = {
  blue: "bg-blue-400",
  violet: "bg-violet-400",
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
  pink: "bg-pink-400",
};

export const SHARD_COLORS: Record<string, string> = {
  CeFi: "border-blue-400/30 text-blue-400",
  DeFi: "border-violet-400/30 text-violet-400",
  TradFi: "border-amber-400/30 text-amber-400",
  Sports: "border-emerald-400/30 text-emerald-400",
  Prediction: "border-pink-400/30 text-pink-400",
};

export function ComputedBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full h-1 rounded-full bg-muted/60 overflow-hidden">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          SERVICE_BAR[color] ?? "bg-primary",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function CatStatusBadge({
  status,
}: {
  status: FeatureCatalogueEntry["status"];
}) {
  const cfg = FEAT_STATUS_CFG[status];
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn("text-xs gap-1", cfg.badge)}>
      <Icon className="size-3" />
      {status === "not_computed"
        ? "Not Computed"
        : status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export type EditableFeature = {
  name: string;
  description: string;
  status: string;
  parameters: Record<string, unknown>;
  symbols: string[];
  tags: string[];
  dependencies: string[];
  compute_schedule?: string;
};

export type ParamRow = { key: string; value: string };

export const CATALOGUE_FEATURE_GROUP_OPTIONS: FeatureCatalogueEntry["feature_group"][] =
  [
    "Technical",
    "Fundamental",
    "Sentiment",
    "Microstructure",
    "Risk",
    "ML-Derived",
  ];
