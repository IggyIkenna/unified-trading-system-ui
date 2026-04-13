"use client";

import { useActiveLayouts, useWorkspaceStore } from "@/lib/stores/workspace-store";
import * as React from "react";
import type { Layout, LayoutItem, ResponsiveLayouts } from "react-grid-layout";
import { ResponsiveGridLayout, useContainerWidth, verticalCompactor } from "react-grid-layout";
import { AllWidgetProviders } from "./all-widget-providers";
import { getWidget, type WidgetPlacement } from "./widget-registry";
import { WidgetWrapper } from "./widget-wrapper";

import "react-grid-layout/css/styles.css";

const ROW_HEIGHT = 80;
const COLS = { lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 };
const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const MARGIN: [number, number] = [2, 2];
const CONTAINER_PADDING: [number, number] = [0, 0];
const RESIZE_HANDLES = ["se", "e", "s"] as const;

interface WidgetGridProps {
  tab: string;
}

function placementsToLayouts(placements: WidgetPlacement[]): Layout {
  return placements.map((p) => {
    const def = getWidget(p.widgetId);
    return {
      i: p.instanceId,
      x: p.x,
      y: p.y,
      w: p.w,
      h: p.h,
      minW: def?.minW ?? 3,
      minH: def?.minH ?? 2,
      maxW: def?.maxW,
      maxH: def?.maxH,
    } satisfies LayoutItem;
  });
}

function layoutsToPartialPlacements(layout: Layout, existing: WidgetPlacement[]): WidgetPlacement[] {
  return existing.map((p) => {
    const updated = layout.find((l) => l.i === p.instanceId);
    if (!updated) return p;
    return { ...p, x: updated.x, y: updated.y, w: updated.w, h: updated.h };
  });
}

export function WidgetGrid({ tab }: WidgetGridProps) {
  const ensureTab = useWorkspaceStore((s) => s.ensureTab);
  React.useEffect(() => ensureTab(tab), [ensureTab, tab]);

  const placements = useActiveLayouts(tab);
  const updateLayout = useWorkspaceStore((s) => s.updateLayout);
  const removeWidget = useWorkspaceStore((s) => s.removeWidget);
  const editMode = useWorkspaceStore((s) => s.editMode);

  // Transient fullscreen state — never persisted, restores on collapse automatically
  const [expandedInstanceId, setExpandedInstanceId] = React.useState<string | null>(null);
  const handleExpand = React.useCallback((id: string) => setExpandedInstanceId(id), []);
  const handleCollapse = React.useCallback(() => setExpandedInstanceId(null), []);

  const { width: containerWidth, containerRef } = useContainerWidth();

  const layout = React.useMemo(() => placementsToLayouts(placements), [placements]);

  // Pass the same layout to every breakpoint so RGL never auto-generates
  // an overlapping layout for sm/md/xs breakpoints.
  const allBreakpointLayouts = React.useMemo(
    () => ({ lg: layout, md: layout, sm: layout, xs: layout, xxs: layout }),
    [layout],
  );

  const dragConfig = React.useMemo(() => ({ enabled: true, handle: ".widget-drag-handle" }), []);

  const resizeConfig = React.useMemo(() => ({ enabled: true, handles: RESIZE_HANDLES }), []);

  const handleLayoutChange = React.useCallback(
    (currentLayout: Layout, _allLayouts: ResponsiveLayouts) => {
      const updated = layoutsToPartialPlacements(currentLayout as Layout, placements);
      const changed = updated.some((u, i) => {
        const o = placements[i];
        return o && (u.x !== o.x || u.y !== o.y || u.w !== o.w || u.h !== o.h);
      });
      if (changed) {
        updateLayout(tab, updated);
      }
    },
    [placements, updateLayout, tab],
  );

  const handleRemove = React.useCallback(
    (instanceId: string) => {
      removeWidget(tab, instanceId);
    },
    [removeWidget, tab],
  );

  if (placements.length === 0) {
    return (
      <div ref={containerRef} className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <p className="text-sm">No widgets in this workspace</p>
          <p className="text-xs">Click &quot;Add Widget&quot; in the toolbar to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <AllWidgetProviders>
        <ResponsiveGridLayout
          className="widget-grid"
          layouts={allBreakpointLayouts}
          breakpoints={BREAKPOINTS}
          cols={COLS}
          rowHeight={ROW_HEIGHT}
          margin={MARGIN}
          containerPadding={CONTAINER_PADDING}
          width={containerWidth}
          dragConfig={dragConfig}
          resizeConfig={resizeConfig}
          compactor={verticalCompactor}
          onLayoutChange={handleLayoutChange}
        >
          {placements.map((placement) => {
            const def = getWidget(placement.widgetId);
            if (!def) return <div key={placement.instanceId} />;
            const isExpanded = expandedInstanceId === placement.instanceId;
            return (
              <div key={placement.instanceId} className="h-full min-h-0">
                <WidgetWrapper
                  definition={def}
                  placement={placement}
                  pageTab={tab}
                  editMode={editMode}
                  onRemove={handleRemove}
                  expanded={isExpanded}
                  onExpand={handleExpand}
                  onCollapse={handleCollapse}
                />
              </div>
            );
          })}
        </ResponsiveGridLayout>
      </AllWidgetProviders>
    </div>
  );
}
