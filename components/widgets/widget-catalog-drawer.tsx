"use client";

import type { FinderSelections } from "@/components/shared/finder";
import { FinderBrowser, finderText } from "@/components/shared/finder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useActiveLayouts, useWorkspaceStore } from "@/lib/stores/workspace-store";
import { cn } from "@/lib/utils";
import { Check, LayoutGrid, Lock, Plus } from "lucide-react";
import * as React from "react";
import { buildCatalogColumns, getCatalogContextStats } from "./widget-catalog-finder-config";
import { getAllWidgets, type WidgetDefinition } from "./widget-registry";

interface WidgetCatalogDrawerProps {
  tab: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function useCanAccessWidget(): (required: string[]) => boolean {
  const { hasEntitlement, isAdmin, isInternal } = useAuth();
  return React.useCallback(
    (required: string[]) => {
      if (isAdmin() || isInternal()) return true;
      if (required.length === 0) return true;
      return required.some((e) => hasEntitlement(e as never));
    },
    [hasEntitlement, isAdmin, isInternal],
  );
}

function WidgetDetailPanel({
  selections,
  tab,
  placedIds,
  checkAccess,
  onAdd,
}: {
  selections: FinderSelections;
  tab: string;
  placedIds: Set<string>;
  checkAccess: (entitlements: string[]) => boolean;
  onAdd: (widgetId: string) => void;
}) {
  const widgetSelection = selections["widget"];

  if (!widgetSelection) {
    const categorySelection = selections["category"];
    if (categorySelection) {
      const catData = categorySelection.data as { category: string; widgets: WidgetDefinition[] };
      return (
        <div className="p-4 space-y-3">
          <p className="text-sm font-semibold">{catData.category}</p>
          <p className="text-xs text-muted-foreground">
            {catData.widgets.length} widget{catData.widgets.length !== 1 ? "s" : ""} in this category. Select a widget
            to see details.
          </p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <LayoutGrid className="size-8 mb-2 opacity-20" />
        <p className={cn(finderText.title, "font-medium text-muted-foreground")}>No widget selected</p>
        <p className={cn(finderText.sub, "opacity-60 mt-1")}>
          Browse categories and select a widget to see its details
        </p>
      </div>
    );
  }

  const def = widgetSelection.data as WidgetDefinition & { isPlaced: boolean; hasAccess: boolean };
  const hasAccess = checkAccess(def.requiredEntitlements);
  const isPlaced = placedIds.has(def.id);
  const isDisabled = !hasAccess || (def.singleton && isPlaced);

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex size-9 items-center justify-center rounded-lg shrink-0",
              hasAccess ? "bg-accent" : "bg-amber-500/10",
            )}
          >
            {hasAccess ? (
              <def.icon className="size-4.5 text-foreground" />
            ) : (
              <Lock className="size-4.5 text-amber-500" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{def.label}</p>
            <p className="text-[10px] text-muted-foreground font-mono">{def.id}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{def.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground mb-1">Category</p>
          <p className="font-medium">{def.category}</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Default size</p>
          <p className="font-mono">
            {def.defaultW} x {def.defaultH}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Min size</p>
          <p className="font-mono">
            {def.minW} x {def.minH}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Singleton</p>
          <p>{def.singleton ? "Yes" : "No"}</p>
        </div>
      </div>

      {def.availableOn.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Available on</p>
          <div className="flex flex-wrap gap-1">
            {def.availableOn.map((t) => (
              <Badge
                key={t}
                variant="outline"
                className={cn("text-[10px] h-5 px-1.5", t === tab && "border-primary/50 text-primary")}
              >
                {t}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {def.requiredEntitlements.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Required entitlements</p>
          <div className="flex flex-wrap gap-1">
            {def.requiredEntitlements.map((e) => (
              <Badge
                key={e}
                variant="outline"
                className={cn(
                  "text-[10px] h-5 px-1.5",
                  hasAccess ? "border-emerald-400/30 text-emerald-400" : "border-amber-400/30 text-amber-400",
                )}
              >
                {hasAccess ? <Check className="size-2.5 mr-0.5" /> : <Lock className="size-2.5 mr-0.5" />}
                {e}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {!hasAccess && (
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-xs">
          <div className="flex items-center gap-2 text-amber-400 font-medium mb-1">
            <Lock className="size-3" />
            Subscription required
          </div>
          <p className="text-muted-foreground">Upgrade your subscription to unlock this widget.</p>
        </div>
      )}

      <Button size="sm" className="w-full gap-2" disabled={isDisabled} onClick={() => onAdd(def.id)}>
        {def.singleton && isPlaced ? (
          <>
            <Check className="size-3.5" />
            Already added
          </>
        ) : (
          <>
            <Plus className="size-3.5" />
            Add to Workspace
          </>
        )}
      </Button>
    </div>
  );
}

export function WidgetCatalogDrawer({ tab, open, onOpenChange }: WidgetCatalogDrawerProps) {
  const placements = useActiveLayouts(tab);
  const addWidget = useWorkspaceStore((s) => s.addWidget);
  const checkAccess = useCanAccessWidget();

  const placedIds = React.useMemo(() => new Set(placements.map((p) => p.widgetId)), [placements]);

  const handleAdd = React.useCallback(
    (widgetId: string) => {
      addWidget(tab, widgetId);
    },
    [addWidget, tab],
  );

  const allWidgets = React.useMemo(() => getAllWidgets(), []);
  const totalWidgets = allWidgets.length;
  const categories = React.useMemo(() => {
    const cats = new Set(allWidgets.map((w) => w.category));
    return cats.size;
  }, [allWidgets]);
  const lockedCount = React.useMemo(
    () => allWidgets.filter((w) => !checkAccess(w.requiredEntitlements)).length,
    [allWidgets, checkAccess],
  );

  const columns = React.useMemo(() => buildCatalogColumns(placedIds, checkAccess), [placedIds, checkAccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "flex flex-col gap-0 p-0 overflow-hidden sm:max-w-none",
          "w-[min(96vw,1200px)] max-w-[min(96vw,1200px)]",
          "h-[min(90vh,820px)] max-h-[min(90vh,820px)]",
        )}
      >
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0 border-b border-border/60 space-y-1.5 text-left">
          <DialogTitle className="text-base">Widget Catalog</DialogTitle>
          <DialogDescription className="text-xs">
            Browse all widgets by category. Select a widget to see details, then add it to your workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 min-w-0 overflow-hidden px-0 pb-0">
          <FinderBrowser
            columns={columns}
            detailPanel={(selections) => (
              <WidgetDetailPanel
                selections={selections}
                tab={tab}
                placedIds={placedIds}
                checkAccess={checkAccess}
                onAdd={handleAdd}
              />
            )}
            contextStats={(selections) => getCatalogContextStats(selections, totalWidgets, categories, lockedCount)}
            detailPanelTitle="Widget Detail"
            detailPanelWidth="w-[min(100%,340px)] sm:w-[340px]"
            emptyState={
              <div className="text-center">
                <LayoutGrid className="size-10 mb-2 opacity-20 mx-auto" />
                <p className={cn(finderText.title, "font-medium")}>Select a category</p>
                <p className={cn(finderText.sub, "opacity-60 mt-1")}>
                  Browse {totalWidgets} widgets across {categories} categories
                </p>
              </div>
            }
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
