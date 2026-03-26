"use client";

/**
 * FinderBrowser column configuration for the Feature Catalogue page.
 *
 * Hierarchy: Service → Category → Group → Feature (paginated, searchable)
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";
import type {
  IndividualFeature,
  FeatureGroupEntry,
  FeatureServiceNode,
} from "@/lib/build-mock-data";
import {
  FEATURE_SERVICES,
  SAMPLE_FEATURES_BY_GROUP,
} from "@/lib/build-mock-data";
import type {
  FinderColumnDef,
  FinderContextStats,
  FinderItem,
  FinderSelections,
} from "@/components/shared/finder/types";
import {
  FEAT_STATUS_CFG,
  GROUP_STATUS_CFG,
  SERVICE_COLORS,
  SERVICE_BAR,
} from "./feature-helpers";

// ─── Feature list builder ──────────────────────────────────────────────────────

export function buildFeatureList(
  group: FeatureGroupEntry,
  userAdded: IndividualFeature[] = [],
): IndividualFeature[] {
  const forGroup = userAdded.filter((f) => f.group_id === group.id);
  const samples = SAMPLE_FEATURES_BY_GROUP[group.id] ?? [];
  const remainingSlots = Math.max(0, group.feature_count - forGroup.length);

  if (samples.length >= remainingSlots) {
    return [...forGroup, ...samples.slice(0, remainingSlots)];
  }

  const placeholders: IndividualFeature[] = Array.from(
    { length: remainingSlots - samples.length },
    (_, i) =>
      ({
        id: `${group.id}_placeholder_${i}`,
        name: `${group.name}_${String(i + samples.length + 1).padStart(3, "0")}`,
        display_name: `${group.display_name} Feature ${i + samples.length + 1}`,
        service_id: "",
        category_id: "",
        group_id: group.id,
        current_version: "v1.0",
        status:
          i % 7 === 0 ? "not_computed" : i % 11 === 0 ? "stale" : "active",
        last_computed:
          i % 7 === 0
            ? null
            : new Date(Date.now() - (i + 1) * 3600000).toISOString(),
        description: `Auto-generated placeholder for ${group.display_name}`,
        parameters: {},
        symbols: [],
        dependencies: [],
        consumed_by_models: [],
        tags: [],
      }) satisfies IndividualFeature,
  );
  return [...forGroup, ...samples, ...placeholders];
}

// ─── Column definitions ────────────────────────────────────────────────────────

export function buildFeaturesColumns(
  userAddedFeatures: IndividualFeature[],
): FinderColumnDef[] {
  return [
    {
      id: "service",
      label: "Services",
      width: "w-[168px]",
      getItems: (): FinderItem[] =>
        FEATURE_SERVICES.map((svc) => ({
          id: svc.id,
          label: svc.display_name,
          count: svc.total_features,
          data: svc,
        })),
      renderIcon: (item, active) => {
        const svc = item.data as FeatureServiceNode;
        return (
          <span
            className={cn(
              "inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold shrink-0",
              active
                ? "bg-primary-foreground/20 text-primary-foreground"
                : SERVICE_COLORS[svc.color],
            )}
          >
            {svc.display_name[0]}
          </span>
        );
      },
    },
    {
      id: "category",
      label: "Category",
      width: "w-[148px]",
      visibleWhen: (sel) => sel["service"] !== null,
      getItems: (sel): FinderItem[] => {
        const svc = sel["service"]?.data as FeatureServiceNode | undefined;
        if (!svc) return [];
        return svc.categories.map((cat) => ({
          id: cat.id,
          label: cat.display_name,
          count: cat.total_features,
          data: cat,
        }));
      },
    },
    {
      id: "group",
      label: "Groups",
      width: "w-[210px]",
      visibleWhen: (sel) => sel["category"] !== null,
      getItems: (sel): FinderItem[] => {
        const cat = sel["category"]?.data as
          | (typeof FEATURE_SERVICES)[0]["categories"][0]
          | undefined;
        if (!cat) return [];
        return cat.groups.map((grp) => ({
          id: grp.id,
          label: grp.display_name,
          count: grp.feature_count,
          status: grp.status,
          data: grp,
        }));
      },
      renderLabel: (item) => {
        const grp = item.data as FeatureGroupEntry;
        const cfg = GROUP_STATUS_CFG[grp.status];
        const Icon = cfg.icon;
        return (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <Icon className={cn("size-3 shrink-0", cfg.color)} />
            <span className="flex-1 font-medium truncate text-xs">
              {grp.display_name}
            </span>
          </div>
        );
      },
    },
    {
      id: "feature",
      label: "Features",
      width: "flex-1",
      visibleWhen: (sel) => sel["group"] !== null,
      paginate: true,
      showSearch: true,
      searchPlaceholder: "Filter features…",
      getItems: (sel): FinderItem[] => {
        const grp = sel["group"]?.data as FeatureGroupEntry | undefined;
        const svc = sel["service"]?.data as FeatureServiceNode | undefined;
        if (!grp || !svc) return [];
        return buildFeatureList(grp, userAddedFeatures).map((feat) => ({
          id: feat.id,
          label: feat.name,
          status: feat.status,
          data: { feat, service: svc },
        }));
      },
      renderLabel: (item) => {
        const { feat } = item.data as {
          feat: IndividualFeature;
          service: FeatureServiceNode;
        };
        const sc = FEAT_STATUS_CFG[feat.status];
        const SI = sc.icon;
        return (
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <SI className={cn("size-3 shrink-0", sc.color)} />
            <code className="font-mono truncate text-left text-xs">
              {feat.name}
            </code>
          </div>
        );
      },
      renderIcon: () => null,
      getCount: () => null,
    },
  ];
}

// ─── Context stats ─────────────────────────────────────────────────────────────

export function getFeaturesContextStats(
  selections: FinderSelections,
): FinderContextStats {
  const svc = selections["service"]?.data as FeatureServiceNode | undefined;
  const cat = selections["category"]?.data as
    | (typeof FEATURE_SERVICES)[0]["categories"][0]
    | undefined;
  const grp = selections["group"]?.data as FeatureGroupEntry | undefined;

  if (!svc) {
    const allTotal = FEATURE_SERVICES.reduce(
      (s, sv) => s + sv.total_features,
      0,
    );
    const allAvgPct = Math.round(
      FEATURE_SERVICES.reduce((s, sv) => s + sv.computed_pct, 0) /
        FEATURE_SERVICES.length,
    );
    const allJobs = FEATURE_SERVICES.reduce((s, sv) => s + sv.active_jobs, 0);
    const allGroups = FEATURE_SERVICES.reduce(
      (s, sv) => s + sv.categories.reduce((cs, c) => cs + c.groups.length, 0),
      0,
    );
    return {
      name: "All Services",
      badges:
        allJobs > 0
          ? [
              {
                label: `${allJobs} active`,
                variant: "border-blue-400/30 text-blue-400 gap-1",
                icon: <Activity className="size-2.5 animate-pulse mr-0.5" />,
              },
            ]
          : [],
      metrics: [
        { label: "features", value: allTotal },
        { label: "groups", value: allGroups },
        { label: "computed", value: allAvgPct, format: "percent" },
      ],
      progressBar: {
        value: allAvgPct,
        color: SERVICE_BAR["blue"] ?? "bg-primary",
      },
    };
  }

  if (!cat) {
    return {
      name: svc.display_name,
      badges:
        svc.active_jobs > 0
          ? [
              {
                label: `${svc.active_jobs} active`,
                variant: "border-blue-400/30 text-blue-400 gap-1",
                icon: <Activity className="size-2.5 animate-pulse mr-0.5" />,
              },
            ]
          : [],
      metrics: [
        { label: "features", value: svc.total_features },
        {
          label: "groups",
          value: svc.categories.reduce((s, c) => s + c.groups.length, 0),
        },
        { label: "computed", value: svc.computed_pct, format: "percent" },
      ],
      progressBar: {
        value: svc.computed_pct,
        color: SERVICE_BAR[svc.color] ?? "bg-primary",
      },
    };
  }

  if (!grp) {
    return {
      name: `${svc.display_name} / ${cat.display_name}`,
      metrics: [
        { label: "features", value: cat.total_features },
        { label: "groups", value: cat.groups.length },
        { label: "computed", value: cat.computed_pct, format: "percent" },
      ],
      progressBar: {
        value: cat.computed_pct,
        color: SERVICE_BAR[svc.color] ?? "bg-primary",
      },
    };
  }

  const grpCfg = GROUP_STATUS_CFG[grp.status];
  const badgeColor =
    grp.status === "healthy"
      ? "border-emerald-400/30 text-emerald-400"
      : grp.status === "stale"
        ? "border-amber-400/30 text-amber-400"
        : "border-border/50 text-muted-foreground";

  return {
    name: grp.display_name,
    badges: [{ label: grpCfg.label, variant: badgeColor }],
    metrics: [
      { label: "features", value: grp.feature_count },
      { label: "computed", value: grp.computed_pct, format: "percent" },
    ],
    progressBar: {
      value: grp.computed_pct,
      color: SERVICE_BAR[svc.color] ?? "bg-primary",
    },
  };
}
