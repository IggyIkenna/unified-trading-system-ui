"use client";

import { finderText } from "@/components/shared/finder/finder-text-sizes";
import type {
  FinderColumnDef,
  FinderContextStats,
  FinderItem,
  FinderSelections,
} from "@/components/shared/finder/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, Lock } from "lucide-react";
import { getAllWidgets, type WidgetDefinition } from "./widget-registry";

type CheckAccessFn = (def: Pick<WidgetDefinition, "requiredEntitlements" | "requiredEntitlementsAll">) => boolean;

interface CatalogGroupData {
  catalogGroup: string;
  widgets: WidgetDefinition[];
}

function buildCatalogGroups(): FinderItem<CatalogGroupData>[] {
  const allWidgets = getAllWidgets();
  const grouped: Record<string, WidgetDefinition[]> = {};
  for (const w of allWidgets) {
    (grouped[w.catalogGroup] ??= []).push(w);
  }
  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([catalogGroup, widgets]) => ({
      id: catalogGroup,
      label: catalogGroup,
      count: widgets.length,
      data: { catalogGroup, widgets },
    }));
}

function buildWidgetItems(
  selections: FinderSelections,
  placedIds: Set<string>,
  checkAccess: CheckAccessFn,
): FinderItem<WidgetDefinition & { isPlaced: boolean; hasAccess: boolean; showCatalogGroup: boolean }>[] {
  const catalogGroupSelection = selections["catalogGroup"];
  // No group selected → show all widgets (global search mode)
  const widgets = catalogGroupSelection
    ? (catalogGroupSelection.data as CatalogGroupData).widgets
    : getAllWidgets()
        .slice()
        .sort((a, b) => a.label.localeCompare(b.label));

  const showCatalogGroup = !catalogGroupSelection;

  return widgets.map((w) => ({
    id: w.id,
    label: w.label,
    status: w.singleton && placedIds.has(w.id) ? "added" : undefined,
    data: {
      ...w,
      isPlaced: placedIds.has(w.id),
      hasAccess: checkAccess(w),
      showCatalogGroup,
    },
  }));
}

export function buildCatalogColumns(placedIds: Set<string>, checkAccess: CheckAccessFn): FinderColumnDef[] {
  return [
    {
      id: "catalogGroup",
      label: "Group",
      width: "w-[220px]",
      defaultWidthPx: 220,
      minWidthPx: 160,
      maxWidthPx: 320,
      getItems: () => buildCatalogGroups(),
      // Custom label renders placed/total count with colour coding:
      // none placed → muted, some placed → primary, all placed → emerald
      renderLabel: (item: FinderItem) => {
        const data = item.data as CatalogGroupData;
        const total = data.widgets.length;
        const placed = data.widgets.filter((w) => placedIds.has(w.id)).length;
        const allPlaced = placed > 0 && placed === total;
        const somePlaced = placed > 0 && !allPlaced;
        return (
          <span className={cn("flex-1 min-w-0 flex items-center justify-between gap-2", finderText.body)}>
            <span className="font-medium truncate text-left">{item.label}</span>
            <span
              className={cn(
                "text-[10px] tabular-nums font-mono shrink-0",
                allPlaced ? "text-emerald-400" : somePlaced ? "text-[var(--chart-1)]" : "text-muted-foreground",
              )}
            >
              {placed}/{total}
            </span>
          </span>
        );
      },
      getCount: () => null,
    },
    {
      id: "widget",
      label: "Widget",
      width: "flex-1",
      showSearch: true,
      searchPlaceholder: "Search all widgets…",
      // Always visible — shows all widgets when no group is selected (global search mode)
      visibleWhen: () => true,
      getItems: (selections) => buildWidgetItems(selections, placedIds, checkAccess),
      renderLabel: (item: FinderItem) => {
        const data = item.data as WidgetDefinition & {
          isPlaced: boolean;
          hasAccess: boolean;
          showCatalogGroup: boolean;
        };
        return (
          <span className={cn("flex-1 min-w-0 flex items-center gap-1.5", finderText.body)}>
            <data.icon className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="font-medium break-words text-left leading-snug block">{item.label}</span>
              {data.showCatalogGroup && (
                <span className="text-[9px] text-muted-foreground/60 leading-none">{data.catalogGroup}</span>
              )}
            </span>
            {data.singleton && data.isPlaced && (
              <Badge variant="secondary" className="text-[9px] h-3.5 px-1 shrink-0">
                <Check className="size-2 mr-0.5" />
                Added
              </Badge>
            )}
            {!data.hasAccess && <Lock className="size-3 shrink-0 text-amber-500" />}
          </span>
        );
      },
      getCount: () => null,
    },
  ];
}

export function getCatalogContextStats(
  _selections: FinderSelections,
  totalWidgets: number,
  totalCatalogGroups: number,
  lockedCount: number,
): FinderContextStats {
  return {
    badges:
      lockedCount > 0 ? [{ label: `${lockedCount} locked`, variant: "border-amber-400/30 text-amber-400" }] : undefined,
    metrics: [
      { label: "widgets", value: totalWidgets, format: "number" },
      { label: "groups", value: totalCatalogGroups, format: "number" },
    ],
  };
}
