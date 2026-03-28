"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Lock, Plus, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { getAllWidgets, type WidgetDefinition } from "./widget-registry";
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
  const allWidgets = React.useMemo(() => getAllWidgets(), []);
  const placements = useActiveLayouts(tab);
  const addWidget = useWorkspaceStore((s) => s.addWidget);
  const [search, setSearch] = React.useState("");

  const placedWidgetIds = React.useMemo(() => new Set(placements.map((p) => p.widgetId)), [placements]);

  const handleAdd = React.useCallback(
    (widgetId: string) => {
      addWidget(tab, widgetId);
    },
    [addWidget, tab],
  );

  // Reset search when drawer closes
  React.useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  // Group widgets by category, filtering by search query
  const groupedByCategory = React.useMemo(() => {
    const query = search.toLowerCase().trim();
    const filtered = query
      ? allWidgets.filter(
          (w) =>
            w.label.toLowerCase().includes(query) ||
            w.description.toLowerCase().includes(query) ||
            w.category.toLowerCase().includes(query),
        )
      : allWidgets;

    const grouped: Record<string, WidgetDefinition[]> = {};
    for (const w of filtered) {
      (grouped[w.category] ??= []).push(w);
    }
    return grouped;
  }, [allWidgets, search]);

  const sortedCategories = React.useMemo(
    () => Object.keys(groupedByCategory).sort(),
    [groupedByCategory],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[360px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-sm">Widget Catalog</SheetTitle>
          <SheetDescription className="text-xs">
            Add widgets from any category to your workspace.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-3 relative">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search widgets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        <div className="mt-3 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)] pr-1">
          {sortedCategories.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">No widgets match your search.</p>
          )}

          {sortedCategories.map((category) => (
            <div key={category}>
              <div className="flex items-center gap-2 pt-3 pb-1.5">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider shrink-0">
                  {category}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-1.5">
                {groupedByCategory[category].map((w) => (
                  <WidgetCatalogItem
                    key={w.id}
                    definition={w}
                    tab={tab}
                    isPlaced={placedWidgetIds.has(w.id)}
                    onAdd={handleAdd}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
