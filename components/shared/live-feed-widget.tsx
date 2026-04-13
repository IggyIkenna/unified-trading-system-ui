"use client";

import { Spinner } from "@/components/shared/spinner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle, RefreshCw } from "lucide-react";
import * as React from "react";

/**
 * Ring-buffer hook for live-feed widgets.
 *
 * Currently caps the incoming array at `maxItems` (newest-first assumed — all
 * feed contexts prepend). When real WebSocket push replaces mock data, upgrade
 * to internal state that prepends truly-new items instead of slicing the full
 * array on every render.
 *
 * Every streaming widget uses this hook so any future ring-buffer logic change
 * propagates to all 10 widgets in one edit.
 */
export function useLiveFeed<T>(items: T[], maxItems = 500): T[] {
  return React.useMemo(() => items.slice(0, maxItems), [items, maxItems]);
}

export interface LiveFeedWidgetProps {
  /** When true, shows a centered spinner in place of children. */
  isLoading?: boolean;
  /** When truthy, shows a centered error message + optional retry button. */
  error?: string | null;
  /** Retry callback — renders a button when `error` is set. */
  onRetry?: () => void;
  /**
   * When true (and not loading/erroring), shows `emptyMessage` centered in the
   * body instead of children. Derive from `items.length === 0`.
   * Leave undefined/false to let the child component handle its own empty state
   * (e.g. DataTable already renders "No data" internally).
   */
  isEmpty?: boolean;
  /** Shown when `isEmpty` is true. Defaults to "No data yet". */
  emptyMessage?: string;
  /**
   * Rendered above the scrollable body (shrink-0).
   * Use for tabs, search bars, badge rows, filter toggles, export buttons, etc.
   */
  header?: React.ReactNode;
  /**
   * Rendered below the scrollable body (shrink-0).
   * Use for legends, row counts, footnotes, etc.
   */
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/**
 * Shared shell for live-feed list widgets.
 *
 * Provides:
 * - Consistent loading / error / empty states
 * - `header` slot for controls above the list
 * - `footer` slot for metadata below the list
 * - A scrollable body that fills remaining height (`flex-1 overflow-auto`)
 *
 * Usage:
 * ```tsx
 * const rows = useLiveFeed(rawItems, 500);
 *
 * return (
 *   <LiveFeedWidget
 *     isEmpty={rows.length === 0}
 *     emptyMessage="No trades yet"
 *     header={<MyTabs ... />}
 *   >
 *     {rows.map((r) => <Row key={r.id} row={r} />)}
 *   </LiveFeedWidget>
 * );
 * ```
 *
 * Pair with `useLiveFeed` to centralise ring-buffer capping.
 * Analogue of `KpiSummaryWidget` for list-based widgets.
 */
export function LiveFeedWidget({
  isLoading,
  error,
  onRetry,
  isEmpty,
  emptyMessage = "No data yet",
  header,
  footer,
  className,
  children,
}: LiveFeedWidgetProps) {
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
        <Spinner className="size-5" />
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground px-4 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm">{error}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="size-3.5 mr-1.5" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex h-full flex-col overflow-hidden min-h-0", className)}>
      {header != null && <div className="shrink-0">{header}</div>}
      <div className="flex-1 overflow-auto min-h-0">
        {isEmpty ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{emptyMessage}</div>
        ) : (
          children
        )}
      </div>
      {footer != null && <div className="shrink-0">{footer}</div>}
    </div>
  );
}
