"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { GripHorizontal, Maximize2, Minimize2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { UpgradeCard } from "@/components/platform/upgrade-card";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { type WidgetDefinition, type WidgetPlacement, getWidget, getWidgetsForTab } from "./widget-registry";
import { useWorkspaceStore, useActiveLayouts } from "@/lib/stores/workspace-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WidgetWrapperProps {
  definition: WidgetDefinition;
  placement: WidgetPlacement;
  pageTab: string;
  editMode: boolean;
  onRemove: (instanceId: string) => void;
  expanded?: boolean;
  onExpand?: (instanceId: string) => void;
  onCollapse?: () => void;
}

class WidgetErrorBoundary extends React.Component<
  { widgetLabel: string; children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full items-center justify-center p-4">
          <div className="text-center space-y-1">
            <p className="text-xs font-medium text-rose-400">{this.props.widgetLabel} failed to load</p>
            <p className="text-[10px] text-muted-foreground">{this.state.error.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function useHasAnyEntitlement(required: string[]): boolean {
  const { hasEntitlement, isAdmin, isInternal } = useAuth();
  if (isAdmin() || isInternal()) return true;
  if (required.length === 0) return true;
  return required.some((e) => hasEntitlement(e as never));
}

function WidgetBody({
  definition,
  instanceId,
  config,
  hasAccess,
}: {
  definition: WidgetDefinition;
  instanceId: string;
  config?: Record<string, unknown>;
  hasAccess: boolean;
}) {
  const Component = definition.component;
  return (
    <WidgetScroll axes="both" className="flex-1 min-h-0">
      {hasAccess ? (
        <WidgetErrorBoundary widgetLabel={definition.label}>
          <React.Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              </div>
            }
          >
            <Component instanceId={instanceId} config={config} />
          </React.Suspense>
        </WidgetErrorBoundary>
      ) : (
        <UpgradeCard
          serviceName={definition.label}
          description={`Subscribe to unlock the ${definition.label} widget.`}
          className="h-full border-0 rounded-none"
        />
      )}
    </WidgetScroll>
  );
}

function AddCoTabButton({
  pageTab,
  placement,
  currentAllWidgetIds,
}: {
  pageTab: string;
  placement: WidgetPlacement;
  currentAllWidgetIds: string[];
}) {
  const mergeWidget = useWorkspaceStore((s) => s.mergeWidget);
  const available = getWidgetsForTab(pageTab).filter(
    (w) => w.id !== placement.widgetId && !(placement.coTabs ?? []).includes(w.id),
  );

  if (available.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="p-0.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label="Add widget as tab"
        >
          <Plus className="size-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 z-[60]" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground pb-1">
          Add as tab
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {available.map((w) => {
          const alreadyOnScreen = currentAllWidgetIds.includes(w.id);
          return (
            <DropdownMenuItem
              key={w.id}
              className="gap-2 text-xs cursor-pointer"
              onSelect={() => mergeWidget(pageTab, placement.instanceId, w.id)}
            >
              <w.icon className="size-3 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{w.label}</span>
              {alreadyOnScreen && <span className="text-[9px] text-muted-foreground shrink-0">merge</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function WidgetWrapper({
  definition,
  placement,
  pageTab,
  editMode,
  onRemove,
  expanded = false,
  onExpand,
  onCollapse,
}: WidgetWrapperProps) {
  const removeCoTab = useWorkspaceStore((s) => s.removeCoTab);
  const setActiveCoTab = useWorkspaceStore((s) => s.setActiveCoTab);
  const allLayouts = useActiveLayouts(pageTab);

  const { instanceId, coTabs = [], activeTabId } = placement;

  const allTabIds = [placement.widgetId, ...coTabs];
  const resolvedActiveId = activeTabId ?? placement.widgetId;
  const isMultiTab = allTabIds.length > 1;

  const activeDef = getWidget(resolvedActiveId) ?? definition;
  const hasAccess = useHasAnyEntitlement(activeDef.requiredEntitlements);

  const currentAllWidgetIds = React.useMemo(() => allLayouts.map((l) => l.widgetId), [allLayouts]);

  React.useEffect(() => {
    if (!expanded) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCollapse?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [expanded, onCollapse]);

  // ── Single header row — tab pills inline (Deribit-style) ─────────────────
  // Layout: [grip?] [tab-pill | tab-pill | ...OR... icon+label] [+]  ...  [expand] [X?]
  // The [+], expand, and [×] buttons are hidden until the widget is hovered (group-hover).
  const header = (
    <div
      className={cn(
        "widget-drag-handle group/header flex items-center gap-0 px-1 border-b border-border bg-card/80 shrink-0",
        editMode && !expanded ? "cursor-grab active:cursor-grabbing" : "cursor-default",
      )}
    >
      {editMode && !expanded && <GripHorizontal className="size-3.5 text-muted-foreground shrink-0 mx-0.5" />}

      {/* Left area: tab pills (or single label) + the [+] button right next to them */}
      <div className="flex items-center flex-1 min-w-0 overflow-x-auto scrollbar-none">
        {isMultiTab ? (
          allTabIds.map((wid) => {
            const def = getWidget(wid);
            if (!def) return null;
            const isActive = wid === resolvedActiveId;
            const isPrimary = wid === placement.widgetId;
            return (
              <div key={wid} className="flex items-center group shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCoTab(pageTab, instanceId, wid);
                  }}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 text-[10px] whitespace-nowrap transition-colors border-b-2",
                    isActive
                      ? "text-foreground border-primary"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <def.icon className="size-2.5 shrink-0" />
                  {def.label}
                </button>
                {!isPrimary && editMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCoTab(pageTab, instanceId, wid);
                    }}
                    className="opacity-0 group-hover:opacity-100 -ml-1 mr-0.5 p-0.5 text-muted-foreground hover:text-rose-400 transition-all"
                    aria-label={`Remove ${def.label} tab`}
                  >
                    <X className="size-2" />
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex items-center gap-1.5 px-1 py-0.5">
            <definition.icon className="size-3 text-muted-foreground shrink-0" />
            <span className="text-[11px] font-medium text-muted-foreground truncate">{definition.label}</span>
          </div>
        )}

        {/* [+] button sits right next to the title / last tab pill */}
        {!expanded && (
          <div className="opacity-0 group-hover/header:opacity-100 transition-opacity shrink-0">
            <AddCoTabButton pageTab={pageTab} placement={placement} currentAllWidgetIds={currentAllWidgetIds} />
          </div>
        )}
      </div>

      {/* Right action buttons — hidden until hover */}
      <div className="flex items-center gap-0.5 shrink-0 ml-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            expanded ? onCollapse?.() : onExpand?.(instanceId);
          }}
          className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={expanded ? "Collapse widget" : "Expand widget to full screen"}
        >
          {expanded ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
        </button>

        {editMode && !expanded && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(instanceId);
            }}
            className="p-0.5 text-muted-foreground hover:text-rose-400 transition-colors"
            aria-label={`Remove ${definition.label}`}
          >
            <X className="size-3" />
          </button>
        )}
      </div>
    </div>
  );

  const body = (
    <WidgetBody definition={activeDef} instanceId={instanceId} config={placement.config} hasAccess={hasAccess} />
  );

  // Portal to the content-panel boundary so fullscreen stays inside
  // the trading panel (doesn't cover nav, sidebar, or tabs).
  // The boundary div has `position: relative` so `absolute inset-0` fills it.
  const [boundaryEl, setBoundaryEl] = React.useState<HTMLElement | null>(null);
  React.useEffect(() => {
    setBoundaryEl(document.getElementById("widget-fullscreen-boundary"));
  }, []);

  const fullscreenOverlay =
    expanded && boundaryEl
      ? createPortal(
          <>
            <div className="absolute inset-0 z-[9998] bg-background/60 backdrop-blur-[2px]" onClick={onCollapse} />
            <div className="absolute inset-0 z-[9999] flex flex-col border border-border bg-card overflow-hidden">
              {header}
              {body}
            </div>
          </>,
          boundaryEl,
        )
      : null;

  return (
    <>
      <div
        className={cn(
          "flex flex-col h-full rounded-lg border border-border bg-card overflow-hidden",
          editMode && "hover:border-border/80",
          expanded && "invisible",
        )}
      >
        {header}
        {body}
      </div>
      {fullscreenOverlay}
    </>
  );
}
