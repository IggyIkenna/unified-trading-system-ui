"use client";

import { UpgradeCard } from "@/components/platform/upgrade-card";
import { Spinner } from "@/components/shared/spinner";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { WidgetHeaderEndSlotContext } from "@/components/widgets/widget-chrome-context";
import { useAuth } from "@/hooks/use-auth";
import { useActiveLayouts, useWorkspaceStore } from "@/lib/stores/workspace-store";
import { cn } from "@/lib/utils";
import { GripHorizontal, Maximize2, Minimize2, Plus, RefreshCw, X } from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";
import { WidgetContextGuard } from "./widget-context-guard";
import { getActivePreset } from "./widget-chrome-presets";
import { type WidgetDefinition, type WidgetPlacement, getAllWidgets, getWidget } from "./widget-registry";

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

  private handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full items-center justify-center p-4">
          <div className="text-center space-y-2">
            <p className="text-xs font-medium text-rose-400">{this.props.widgetLabel} failed to load</p>
            <p className="text-[10px] text-muted-foreground">{this.state.error.message}</p>
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md border border-border bg-muted hover:bg-accent transition-colors"
            >
              <RefreshCw className="size-3" />
              Retry
            </button>
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
    <WidgetScroll axes="both" className="min-h-0 flex-1">
      {hasAccess ? (
        <WidgetContextGuard widgetLabel={definition.label}>
          <WidgetErrorBoundary widgetLabel={definition.label}>
            <React.Suspense
              fallback={
                <div className="flex h-full items-center justify-center">
                  <Spinner size="sm" className="text-muted-foreground" />
                </div>
              }
            >
              <Component instanceId={instanceId} config={config} />
            </React.Suspense>
          </WidgetErrorBoundary>
        </WidgetContextGuard>
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

/** Searchable widget list — used inside PopoverContent (popover is anchored to the widget header in WidgetWrapper). */
function AddWidgetPickerContent({
  pageTab,
  placement,
  currentAllWidgetIds,
  available,
  onClose,
}: {
  pageTab: string;
  placement: WidgetPlacement;
  currentAllWidgetIds: string[];
  available: WidgetDefinition[];
  onClose: () => void;
}) {
  const mergeWidget = useWorkspaceStore((s) => s.mergeWidget);
  const addWidget = useWorkspaceStore((s) => s.addWidget);

  const grouped = available.reduce<Record<string, WidgetDefinition[]>>((acc, w) => {
    (acc[w.category] ??= []).push(w);
    return acc;
  }, {});
  const categories = Object.keys(grouped).sort();

  return (
    <Command className="rounded-lg border-0 shadow-none" shouldFilter>
      <CommandInput placeholder="Search widgets…" className="h-9 text-xs" />
      <CommandList className="max-h-72">
        <CommandEmpty className="py-6 text-xs text-muted-foreground">No widgets match your search.</CommandEmpty>
        {categories.map((cat) => (
          <CommandGroup key={cat} heading={cat} className="overflow-hidden p-1">
            {grouped[cat].map((w) => {
              const alreadyOnScreen = currentAllWidgetIds.includes(w.id);
              const searchBlob = `${w.id} ${w.label} ${w.description} ${w.category}`;
              return (
                <CommandItem
                  key={w.id}
                  value={searchBlob}
                  className="gap-2 rounded-sm px-2 py-2 text-xs cursor-pointer aria-selected:bg-accent"
                  onSelect={() => {
                    if (alreadyOnScreen) {
                      mergeWidget(pageTab, placement.instanceId, w.id);
                    } else {
                      addWidget(pageTab, w.id);
                    }
                    onClose();
                  }}
                >
                  <w.icon className="size-3.5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{w.label}</div>
                    <div className="text-[10px] text-muted-foreground/80 truncate leading-snug">{w.description}</div>
                  </div>
                  {alreadyOnScreen ? (
                    <span className="text-[9px] text-primary/80 shrink-0 font-medium">merge</span>
                  ) : null}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
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

  const availableAddWidgets = React.useMemo(
    () => getAllWidgets().filter((w) => w.id !== placement.widgetId && !(placement.coTabs ?? []).includes(w.id)),
    [placement.widgetId, placement.coTabs],
  );

  const [addWidgetOpen, setAddWidgetOpen] = React.useState(false);
  const [headerEndSlot, setHeaderEndSlot] = React.useState<React.ReactNode>(null);
  const chromePreset = getActivePreset();

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
  // Add-widget popover is anchored to the full header row (PopoverAnchor) so align="start"
  // lines up with the widget’s left edge instead of the small [+] button (align="end" overlap).
  const showAddWidgetPlus = !expanded && availableAddWidgets.length > 0;

  const headerRow = (
    <div
      className={cn(
        "widget-drag-handle group/header flex items-center gap-0 px-1 shrink-0",
        chromePreset.header,
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
        {showAddWidgetPlus && (
          <div className="opacity-0 group-hover/header:opacity-100 transition-opacity shrink-0">
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="p-0.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                aria-label="Add widget as tab"
                aria-expanded={addWidgetOpen}
              >
                <Plus className="size-3" />
              </button>
            </PopoverTrigger>
          </div>
        )}
      </div>

      {/* Right: optional KPI layout (from widget body) → fullscreen → remove */}
      <div className="flex items-center gap-0.5 shrink-0 ml-1">
        {headerEndSlot}
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

        {!expanded && (
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

  const header = showAddWidgetPlus ? (
    <Popover open={addWidgetOpen} onOpenChange={setAddWidgetOpen}>
      <PopoverAnchor asChild>{headerRow}</PopoverAnchor>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        collisionPadding={8}
        className="p-0 z-[60] w-[min(22rem,calc(100vw-2rem))] max-w-[min(22rem,var(--radix-popper-anchor-width,100%))]"
        onClick={(e) => e.stopPropagation()}
      >
        <AddWidgetPickerContent
          pageTab={pageTab}
          placement={placement}
          currentAllWidgetIds={currentAllWidgetIds}
          available={availableAddWidgets}
          onClose={() => setAddWidgetOpen(false)}
        />
      </PopoverContent>
    </Popover>
  ) : (
    headerRow
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
    <WidgetHeaderEndSlotContext.Provider value={setHeaderEndSlot}>
      <>
        <div
          className={cn(
            "flex flex-col h-full overflow-hidden relative z-[1]",
            chromePreset.container,
            editMode && "hover:border-border/80",
            expanded && "invisible",
          )}
        >
          {header}
          {body}
        </div>
        {fullscreenOverlay}
      </>
    </WidgetHeaderEndSlotContext.Provider>
  );
}
