import * as React from "react";
import { cn } from "../../lib/utils";

interface ResponsiveGridProps {
  /** Minimum column width in pixels (default: 280) */
  minColWidth?: number;
  /** Gap between grid items in pixels (default: 16) */
  gap?: number;
  /** Maximum number of columns (default: unlimited) */
  maxCols?: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * ResponsiveGrid — CSS Grid that auto-fills columns based on available width.
 * Columns never shrink below minColWidth, preventing broken layouts on small screens.
 */
export function ResponsiveGrid({
  minColWidth = 280,
  gap = 16,
  maxCols,
  children,
  className,
}: ResponsiveGridProps) {
  const templateCols = maxCols
    ? `repeat(auto-fill, minmax(min(${minColWidth}px, 100%), 1fr))`
    : `repeat(auto-fill, minmax(min(${minColWidth}px, 100%), 1fr))`;

  return (
    <div
      className={cn(className)}
      style={{
        display: "grid",
        gridTemplateColumns: templateCols,
        gap,
        ...(maxCols ? { maxWidth: maxCols * (minColWidth + gap) } : {}),
      }}
    >
      {children}
    </div>
  );
}
