"use client";

import React from "react";
import { Columns } from "lucide-react";
import { cn } from "@/lib/utils";
import { FinderColumn } from "@/components/shared/finder/finder-column";
import { FinderContextStrip } from "@/components/shared/finder/finder-context-strip";
import { FinderBreadcrumb } from "@/components/shared/finder/finder-breadcrumb";
import { FinderDetailPanel } from "@/components/shared/finder/finder-detail-panel";
import { FinderColumnResizeHandle } from "@/components/shared/finder/finder-column-resize-handle";
import {
  buildInitialFinderColumnWidths,
  clampFinderColumnWidth,
  getFinderColumnDefaultWidthPx,
  isFlexFinderColumn,
  isResizableFinderColumn,
} from "@/components/shared/finder/column-width-utils";
import { finderText } from "@/components/shared/finder/finder-text-sizes";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import type {
  FinderBrowserProps,
  FinderColumnDef,
  FinderItem,
  FinderSelections,
} from "@/components/shared/finder/types";

export function FinderBrowser({
  columns,
  detailPanel,
  contextStats,
  emptyState,
  search,
  detailPanelWidth = "w-[420px]",
  detailPanelDefaultOpen = true,
  detailPanelTitle = "Detail",
}: FinderBrowserProps) {
  const [selections, setSelections] = React.useState<FinderSelections>(() => {
    const initial: FinderSelections = {};
    for (const col of columns) {
      initial[col.id] = null;
    }
    return initial;
  });

  const layoutKey = React.useMemo(() => columns.map((c) => `${c.id}:${c.width}`).join("|"), [columns]);

  const prevLayoutKeyRef = React.useRef<string | null>(null);
  const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>(() =>
    buildInitialFinderColumnWidths(columns),
  );

  React.useLayoutEffect(() => {
    if (prevLayoutKeyRef.current === null) {
      prevLayoutKeyRef.current = layoutKey;
      return;
    }
    if (prevLayoutKeyRef.current !== layoutKey) {
      prevLayoutKeyRef.current = layoutKey;
      setColumnWidths(buildInitialFinderColumnWidths(columns));
    }
  }, [columns, layoutKey]);

  const applyResize = React.useCallback(
    (columnId: string, deltaX: number) => {
      if (deltaX === 0) return;
      setColumnWidths((prev) => {
        const col = columns.find((c) => c.id === columnId);
        if (!col || !isResizableFinderColumn(col)) return prev;
        const cur = prev[columnId] ?? getFinderColumnDefaultWidthPx(col);
        const nextW = clampFinderColumnWidth(col, cur + deltaX);
        if (nextW === cur) return prev;
        return { ...prev, [columnId]: nextW };
      });
    },
    [columns],
  );

  // When a column selection changes, clear all selections for columns after it
  const handleSelect = React.useCallback(
    (columnIndex: number, item: FinderItem) => {
      setSelections((prev) => {
        const next: FinderSelections = { ...prev };
        next[columns[columnIndex].id] = item;
        // Clear all subsequent columns
        for (let i = columnIndex + 1; i < columns.length; i++) {
          next[columns[i].id] = null;
        }
        return next;
      });
    },
    [columns],
  );

  // Reset selections from a given column index onwards (used by breadcrumb)
  const handleResetFrom = React.useCallback(
    (columnIndex: number) => {
      setSelections((prev) => {
        const next: FinderSelections = { ...prev };
        for (let i = columnIndex; i < columns.length; i++) {
          next[columns[i].id] = null;
        }
        return next;
      });
    },
    [columns],
  );

  // Determine which columns are visible
  const visibleColumns = columns.filter((col, idx) => {
    if (col.visibleWhen) {
      return col.visibleWhen(selections);
    }
    // Default: first column always visible; others visible when previous column has a selection
    if (idx === 0) return true;
    return selections[columns[idx - 1].id] !== null;
  });

  // Show the empty-state area only when some columns are hidden (waiting for a selection upstream)
  const hasHiddenColumns = visibleColumns.length < columns.length;

  // Compute stats from current selections (only when provided)
  const stats = contextStats ? contextStats(selections) : null;

  const columnStyle = React.useCallback(
    (col: FinderColumnDef): React.CSSProperties | undefined => {
      if (isFlexFinderColumn(col.width)) {
        return {
          minWidth: col.minWidthPx ?? 200,
        };
      }
      if (!isResizableFinderColumn(col)) {
        return undefined;
      }
      const w = columnWidths[col.id] ?? getFinderColumnDefaultWidthPx(col);
      return {
        width: w,
        minWidth: col.minWidthPx ?? 96,
        maxWidth: col.maxWidthPx,
      };
    },
    [columnWidths],
  );

  const showResizeAfter = React.useCallback(
    (col: FinderColumnDef, index: number) => {
      if (!isResizableFinderColumn(col)) return false;
      if (index < visibleColumns.length - 1) return true;
      return hasHiddenColumns;
    },
    [visibleColumns.length, hasHiddenColumns],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Context strip — only rendered when contextStats is provided */}
      {stats && <FinderContextStrip stats={stats} />}

      {/* Breadcrumb */}
      <FinderBreadcrumb columns={columns} selections={selections} onResetFrom={handleResetFrom} />

      {/* Column browser + detail panel */}
      <div className="flex flex-1 min-h-0 overflow-hidden border-t border-border/20">
        {/* Left: columns — WidgetScroll handles horizontal overflow; the inner div
            provides the flex row that Radix's inner table wrapper would otherwise break. */}
        <WidgetScroll axes="horizontal" scrollbarSize="thin" className="flex-1 min-w-0 min-h-0">
          <div className="flex h-full">
            {visibleColumns.map((col, visIndex) => {
              const colIndex = columns.indexOf(col);
              const items = col.getItems(selections);
              const flex = isFlexFinderColumn(col.width);

              return (
                <React.Fragment key={col.id}>
                  <div
                    className={cn(
                      "shrink-0 flex flex-col min-h-0 overflow-hidden border-r border-border/50",
                      flex && "flex-1 min-w-0",
                      !flex && !isResizableFinderColumn(col) && col.width,
                    )}
                    style={isResizableFinderColumn(col) || flex ? columnStyle(col) : undefined}
                  >
                    <FinderColumn
                      columnDef={col}
                      items={items}
                      selected={selections[col.id]}
                      onSelect={(item) => handleSelect(colIndex, item)}
                      search={colIndex === 0 ? search : undefined}
                    />
                  </div>
                  {showResizeAfter(col, visIndex) && (
                    <FinderColumnResizeHandle onResizeDelta={(dx) => applyResize(col.id, dx)} />
                  )}
                </React.Fragment>
              );
            })}

            {/* Empty state — fills space when some columns are hidden (waiting for upstream selection) */}
            {hasHiddenColumns && (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8 text-muted-foreground min-w-0">
                {emptyState ?? (
                  <>
                    <Columns className="size-10 mb-2 opacity-20" />
                    <p className={cn(finderText.title, "font-medium")}>Select an item</p>
                    <p className={cn(finderText.sub, "opacity-60 mt-1")}>Drill down to browse details</p>
                  </>
                )}
              </div>
            )}
          </div>
        </WidgetScroll>

        {/* Right: detail panel */}
        <FinderDetailPanel title={detailPanelTitle} width={detailPanelWidth} defaultOpen={detailPanelDefaultOpen}>
          {detailPanel(selections)}
        </FinderDetailPanel>
      </div>
    </div>
  );
}
