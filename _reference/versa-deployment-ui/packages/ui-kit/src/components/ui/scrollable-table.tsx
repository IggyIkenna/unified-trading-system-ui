import * as React from "react";
import { cn } from "../../lib/utils";

interface ScrollableTableProps {
  children: React.ReactNode;
  className?: string;
  /** Maximum height before vertical scroll engages (CSS value, e.g. "400px" or "60vh") */
  maxHeight?: string;
}

/**
 * ScrollableTable — wraps a <table> with horizontal scroll on narrow viewports
 * and optional vertical scroll when maxHeight is set.
 *
 * Usage:
 *   <ScrollableTable>
 *     <table>
 *       <thead>...</thead>
 *       <tbody>...</tbody>
 *     </table>
 *   </ScrollableTable>
 */
export function ScrollableTable({
  children,
  className,
  maxHeight,
}: ScrollableTableProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--color-border-default)] overflow-hidden",
        className,
      )}
    >
      <div
        style={{
          overflowX: "auto",
          overflowY: maxHeight ? "auto" : "visible",
          maxHeight: maxHeight ?? undefined,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {children}
      </div>
    </div>
  );
}
