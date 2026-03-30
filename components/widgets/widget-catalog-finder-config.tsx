"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Lock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { finderText } from "@/components/shared/finder/finder-text-sizes";
import type {
  FinderColumnDef,
  FinderContextStats,
  FinderItem,
  FinderSelections,
} from "@/components/shared/finder/types";
import { getAllWidgets, type WidgetDefinition } from "./widget-registry";

interface CategoryData {
  category: string;
  widgets: WidgetDefinition[];
}

function buildCategories(): FinderItem<CategoryData>[] {
  const allWidgets = getAllWidgets();
  const grouped: Record<string, WidgetDefinition[]> = {};
  for (const w of allWidgets) {
    (grouped[w.category] ??= []).push(w);
  }
  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, widgets]) => ({
      id: category,
      label: category,
      count: widgets.length,
      data: { category, widgets },
    }));
}

function buildWidgetItems(
  selections: FinderSelections,
  placedIds: Set<string>,
  checkAccess: (entitlements: string[]) => boolean,
): FinderItem<WidgetDefinition & { isPlaced: boolean; hasAccess: boolean }>[] {
  const categorySelection = selections["category"];
  if (!categorySelection) return [];

  const { widgets } = categorySelection.data as CategoryData;
  return widgets.map((w) => ({
    id: w.id,
    label: w.label,
    status: w.singleton && placedIds.has(w.id) ? "added" : undefined,
    data: {
      ...w,
      isPlaced: placedIds.has(w.id),
      hasAccess: checkAccess(w.requiredEntitlements),
    },
  }));
}

export function buildCatalogColumns(
  placedIds: Set<string>,
  checkAccess: (entitlements: string[]) => boolean,
): FinderColumnDef[] {
  return [
    {
      id: "category",
      label: "Category",
      width: "w-[220px]",
      defaultWidthPx: 220,
      minWidthPx: 160,
      maxWidthPx: 320,
      getItems: () => buildCategories(),
    },
    {
      id: "widget",
      label: "Widget",
      width: "flex-1",
      showSearch: true,
      searchPlaceholder: "Filter widgets…",
      getItems: (selections) => buildWidgetItems(selections, placedIds, checkAccess),
      renderLabel: (item: FinderItem) => {
        const data = item.data as WidgetDefinition & { isPlaced: boolean; hasAccess: boolean };
        return (
          <span className={cn("flex-1 min-w-0 flex items-center gap-1.5", finderText.body)}>
            <data.icon className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="font-medium break-words text-left leading-snug">{item.label}</span>
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
  selections: FinderSelections,
  totalWidgets: number,
  totalCategories: number,
  lockedCount: number,
): FinderContextStats {
  const selectedCategory = selections["category"];
  const selectedWidget = selections["widget"];

  return {
    name: selectedWidget
      ? (selectedWidget.data as WidgetDefinition).label
      : selectedCategory
        ? selectedCategory.label
        : "Widget Catalog",
    badges:
      lockedCount > 0 ? [{ label: `${lockedCount} locked`, variant: "border-amber-400/30 text-amber-400" }] : undefined,
    metrics: [
      { label: "widgets", value: totalWidgets, format: "number" },
      { label: "categories", value: totalCategories, format: "number" },
    ],
  };
}
