"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { getWidgetsForTab, type WidgetDefinition } from "./widget-registry";
import { useWorkspaceStore, useActiveLayouts } from "@/lib/stores/workspace-store";

interface WidgetCatalogDrawerProps {
  tab: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function useCanAccessWidget(required: string[]): boolean {
  const { hasEntitlement, isAdmin, isInternal } = useAuth();
  if (isAdmin() || isInternal()) return true;
  if (required.length === 0) return true;
  return required.some((e) => hasEntitlement(e as never));
}

function WidgetCatalogItem({
  definition,
  tab,
  isPlaced,
  onAdd,
}: {
  definition: WidgetDefinition;
  tab: string;
  isPlaced: boolean;
  onAdd: (widgetId: string) => void;
}) {
  const hasAccess = useCanAccessWidget(definition.requiredEntitlements);
  const isDisabled = !hasAccess || (definition.singleton && isPlaced);

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border border-border transition-colors",
        isDisabled ? "opacity-60 bg-muted/30" : "hover:border-foreground/20 hover:bg-accent/50 cursor-pointer",
      )}
      onClick={() => !isDisabled && onAdd(definition.id)}
    >
      <div
        className={cn(
          "flex size-8 items-center justify-center rounded-md shrink-0",
          hasAccess ? "bg-accent" : "bg-amber-500/10",
        )}
      >
        {hasAccess ? (
          <definition.icon className="size-4 text-foreground" />
        ) : (
          <Lock className="size-4 text-amber-500" />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{definition.label}</span>
          {definition.singleton && isPlaced && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1">
              <Check className="size-2.5 mr-0.5" />
              Added
            </Badge>
          )}
          {!hasAccess && (
            <Badge variant="outline" className="text-[10px] h-4 px-1 border-amber-500/30 text-amber-500">
              <Lock className="size-2.5 mr-0.5" />
              Locked
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{definition.description}</p>
        {!hasAccess && <p className="text-[10px] text-amber-500/80">Subscribe to unlock this widget</p>}
      </div>

      {!isDisabled && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onAdd(definition.id);
          }}
        >
          <Plus className="size-3.5" />
        </Button>
      )}
    </div>
  );
}

export function WidgetCatalogDrawer({ tab, open, onOpenChange }: WidgetCatalogDrawerProps) {
  const widgets = React.useMemo(() => getWidgetsForTab(tab), [tab]);
  const placements = useActiveLayouts(tab);
  const addWidget = useWorkspaceStore((s) => s.addWidget);

  const placedWidgetIds = React.useMemo(() => new Set(placements.map((p) => p.widgetId)), [placements]);

  const handleAdd = React.useCallback(
    (widgetId: string) => {
      addWidget(tab, widgetId);
    },
    [addWidget, tab],
  );

  const { accessible, locked } = React.useMemo(() => {
    const acc: WidgetDefinition[] = [];
    const loc: WidgetDefinition[] = [];
    for (const w of widgets) {
      if (w.requiredEntitlements.length === 0) {
        acc.push(w);
      } else {
        acc.push(w);
      }
    }
    return { accessible: acc, locked: loc };
  }, [widgets]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[360px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-sm">Widget Catalog</SheetTitle>
          <SheetDescription className="text-xs">
            Add widgets to your workspace. Locked widgets require a subscription upgrade.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)] pr-1">
          {accessible.map((w) => (
            <WidgetCatalogItem
              key={w.id}
              definition={w}
              tab={tab}
              isPlaced={placedWidgetIds.has(w.id)}
              onAdd={handleAdd}
            />
          ))}

          {locked.length > 0 && (
            <>
              <div className="flex items-center gap-2 pt-3 pb-1">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] text-amber-500 font-medium uppercase tracking-wider">Premium</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              {locked.map((w) => (
                <WidgetCatalogItem
                  key={w.id}
                  definition={w}
                  tab={tab}
                  isPlaced={placedWidgetIds.has(w.id)}
                  onAdd={handleAdd}
                />
              ))}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
