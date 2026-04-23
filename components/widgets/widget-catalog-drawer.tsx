"use client";

import type { FinderSelections } from "@/components/shared/finder";
import { FinderBrowser, finderText } from "@/components/shared/finder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { isTradingEntitlement, checkTradingEntitlement, type TradingEntitlement } from "@/lib/config/auth";
import { useAuth } from "@/hooks/use-auth";
import { useActiveLayouts, useWorkspaceStore } from "@/lib/stores/workspace-store";
import { cn } from "@/lib/utils";
import { Check, LayoutGrid, Lock, Plus, X } from "lucide-react";
import * as React from "react";
import { buildCatalogColumns } from "./widget-catalog-finder-config";
import { getAllWidgets, type WidgetDefinition } from "./widget-registry";

/** Deterministic color class for a tab name (cycles through a small palette). */
const TAB_BADGE_COLORS = [
  "border-blue-400/50 text-blue-400 bg-blue-400/8",
  "border-violet-400/50 text-violet-400 bg-violet-400/8",
  "border-amber-400/50 text-amber-400 bg-amber-400/8",
  "border-emerald-400/50 text-emerald-400 bg-emerald-400/8",
  "border-rose-400/50 text-rose-400 bg-rose-400/8",
  "border-cyan-400/50 text-cyan-400 bg-cyan-400/8",
  "border-orange-400/50 text-orange-400 bg-orange-400/8",
  "border-pink-400/50 text-pink-400 bg-pink-400/8",
] as const;

function tabBadgeColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return TAB_BADGE_COLORS[h % TAB_BADGE_COLORS.length];
}

interface WidgetCatalogDrawerProps {
  tab: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function useCanAccessWidget(): (required: (string | TradingEntitlement)[]) => boolean {
  const { hasEntitlement, isAdmin, isInternal, user } = useAuth();
  return React.useCallback(
    (required: (string | TradingEntitlement)[]) => {
      if (isAdmin() || isInternal()) return true;
      if (required.length === 0) return true;
      const userEnts = user?.entitlements ?? [];
      return required.some((e) => {
        if (isTradingEntitlement(e)) return checkTradingEntitlement(userEnts, e);
        return hasEntitlement(e as never);
      });
    },
    [hasEntitlement, isAdmin, isInternal, user],
  );
}

function WidgetDetailPanel({
  selections,
  tab,
  placedIds,
  placedTabsMap,
  checkAccess,
  onAdd,
  onRemoveFromTab,
}: {
  selections: FinderSelections;
  tab: string;
  placedIds: Set<string>;
  /** widgetId → list of tabs where it is currently placed in the active workspace */
  placedTabsMap: Record<string, string[]>;
  checkAccess: (entitlements: (string | TradingEntitlement)[]) => boolean;
  onAdd: (widgetId: string) => void;
  onRemoveFromTab: (widgetId: string, fromTab: string) => void;
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
    <WidgetScroll className="h-full">
      <div className="p-4 space-y-4">
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
            <p className="text-muted-foreground mb-1">Singleton</p>
            <p>{def.singleton ? "Yes" : "No"}</p>
          </div>
        </div>

        {(() => {
          const placedTabs = placedTabsMap[def.id] ?? [];
          const count = placedTabs.length;
          return (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                Placed on
                <span
                  className={cn(
                    "tabular-nums font-mono text-[10px] font-medium",
                    count === 0 ? "text-muted-foreground/60" : "text-foreground",
                  )}
                >
                  {count} {count === 1 ? "tab" : "tabs"}
                </span>
              </p>
              {count === 0 ? (
                <p className="text-[10px] text-muted-foreground/50 italic">Not placed on any tab yet</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {placedTabs.map((t) => (
                    <span
                      key={t}
                      className={cn(
                        "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                        tabBadgeColor(t),
                      )}
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => onRemoveFromTab(def.id, t)}
                        className="ml-0.5 rounded-full opacity-60 hover:opacity-100 transition-opacity"
                        aria-label={`Remove from ${t}`}
                      >
                        <X className="size-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        <div className="grid grid-cols-2 gap-3 text-xs">
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
        </div>

        {def.requiredEntitlements.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Required entitlements</p>
            <div className="flex flex-wrap gap-1">
              {def.requiredEntitlements.map((e) => {
                const label = isTradingEntitlement(e) ? `${e.domain}/${e.tier}` : e;
                return (
                  <Badge
                    key={label}
                    variant="outline"
                    className={cn(
                      "text-[10px] h-5 px-1.5",
                      hasAccess ? "border-emerald-400/30 text-emerald-400" : "border-amber-400/30 text-amber-400",
                    )}
                  >
                    {hasAccess ? <Check className="size-2.5 mr-0.5" /> : <Lock className="size-2.5 mr-0.5" />}
                    {label}
                  </Badge>
                );
              })}
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
    </WidgetScroll>
  );
}

export function WidgetCatalogDrawer({ tab, open, onOpenChange }: WidgetCatalogDrawerProps) {
  // Drag-to-move: shift from center via margin (leaves Radix's transform animations untouched)
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const dragRef = React.useRef({ active: false, startX: 0, startY: 0, fromX: 0, fromY: 0 });

  // Reset position when the dialog closes
  React.useEffect(() => {
    if (!open) setDragOffset({ x: 0, y: 0 });
  }, [open]);

  const handleHeaderMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("button, a, input")) return;
      e.preventDefault();
      const ref = dragRef.current;
      ref.active = true;
      ref.startX = e.clientX;
      ref.startY = e.clientY;
      ref.fromX = dragOffset.x;
      ref.fromY = dragOffset.y;
      setIsDragging(true);

      const onMove = (ev: MouseEvent) => {
        if (!ref.active) return;
        setDragOffset({ x: ref.fromX + (ev.clientX - ref.startX), y: ref.fromY + (ev.clientY - ref.startY) });
      };
      const onUp = () => {
        ref.active = false;
        setIsDragging(false);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [dragOffset],
  );
  const placements = useActiveLayouts(tab);
  const addWidget = useWorkspaceStore((s) => s.addWidget);
  const removeWidget = useWorkspaceStore((s) => s.removeWidget);
  const checkAccess = useCanAccessWidget();

  // All workspaces + active ids — used to compute cross-tab placement
  const allWorkspaces = useWorkspaceStore((s) => s.workspaces);
  const activeIds = useWorkspaceStore((s) => s.activeWorkspaceId);

  const placedIds = React.useMemo(() => new Set(placements.map((p) => p.widgetId)), [placements]);

  /** widgetId → list of tabs where the widget is currently placed in the active workspace */
  const placedTabsMap = React.useMemo(() => {
    const result: Record<string, string[]> = {};
    for (const [t, wsList] of Object.entries(allWorkspaces)) {
      const ws = wsList?.find((w) => w.id === activeIds[t]);
      if (!ws) continue;
      for (const placement of ws.layouts) {
        (result[placement.widgetId] ??= []).push(t);
        for (const coTabId of placement.coTabs ?? []) {
          (result[coTabId] ??= []).push(t);
        }
      }
    }
    return result;
  }, [allWorkspaces, activeIds]);

  const handleAdd = React.useCallback(
    (widgetId: string) => {
      addWidget(tab, widgetId);
    },
    [addWidget, tab],
  );

  const handleRemoveFromTab = React.useCallback(
    (widgetId: string, fromTab: string) => {
      const wsList = allWorkspaces[fromTab];
      const ws = wsList?.find((w) => w.id === activeIds[fromTab]);
      if (!ws) return;
      const placement = ws.layouts.find((p) => p.widgetId === widgetId);
      if (placement) removeWidget(fromTab, placement.instanceId);
    },
    [allWorkspaces, activeIds, removeWidget],
  );

  const allWidgets = React.useMemo(() => getAllWidgets(), []);
  const totalWidgets = allWidgets.length;
  const allWidgetIdSet = React.useMemo(() => new Set(allWidgets.map((w) => w.id)), [allWidgets]);

  /** Unique registered widget types that are placed on at least one tab */
  const uniquePlacedCount = React.useMemo(
    () => Object.keys(placedTabsMap).filter((id) => allWidgetIdSet.has(id)).length,
    [placedTabsMap, allWidgetIdSet],
  );

  const columns = React.useMemo(() => buildCatalogColumns(placedIds, checkAccess), [placedIds, checkAccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        style={{ marginLeft: dragOffset.x, marginTop: dragOffset.y }}
        className={cn(
          "flex flex-col gap-0 p-0 overflow-hidden sm:max-w-none",
          "w-[min(96vw,1200px)] max-w-[min(96vw,1200px)]",
          "h-[min(90vh,820px)] max-h-[min(90vh,820px)]",
        )}
      >
        <DialogHeader
          className={cn(
            "px-5 pt-5 pb-3 shrink-0 border-b border-border/60 text-left select-none",
            isDragging ? "cursor-grabbing" : "cursor-grab",
          )}
          onMouseDown={handleHeaderMouseDown}
        >
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-base">Widget Catalog</DialogTitle>
            <span className="text-xs text-muted-foreground tabular-nums shrink-0 pr-6">
              <span className="text-foreground font-semibold">{uniquePlacedCount}</span>
              <span className="mx-0.5">/</span>
              {totalWidgets}
              <span className="ml-1 text-muted-foreground/70">placed</span>
            </span>
          </div>
          <DialogDescription className="text-xs mt-1">
            Browse all widgets by category. Select a widget to see details, then add it to your workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
          <FinderBrowser
            columns={columns}
            detailPanel={(selections) => (
              <WidgetDetailPanel
                selections={selections}
                tab={tab}
                placedIds={placedIds}
                placedTabsMap={placedTabsMap}
                checkAccess={checkAccess}
                onAdd={handleAdd}
                onRemoveFromTab={handleRemoveFromTab}
              />
            )}
            detailPanelTitle="Widget Detail"
            detailPanelWidth="w-[min(100%,340px)] sm:w-[340px]"
            emptyState={
              <div className="text-center">
                <LayoutGrid className="size-10 mb-2 opacity-20 mx-auto" />
                <p className={cn(finderText.title, "font-medium")}>Select a category</p>
                <p className={cn(finderText.sub, "opacity-60 mt-1")}>
                  Browse {totalWidgets} widgets across all categories
                </p>
              </div>
            }
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
