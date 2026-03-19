import * as React from "react";
import { cn } from "../../lib/utils";

interface CardGridProps {
  /** Number of columns at each breakpoint. Defaults to responsive auto-fill. */
  cols?: 1 | 2 | 3 | 4;
  /** Gap between cards in pixels (default: 16) */
  gap?: number;
  children: React.ReactNode;
  className?: string;
}

const colsMap: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
};

/**
 * CardGrid — uniform-spacing grid for Card components.
 * Ensures consistent gap and responsive column count across all UIs.
 */
export function CardGrid({
  cols = 3,
  gap = 16,
  children,
  className,
}: CardGridProps) {
  return (
    <div className={cn("grid", colsMap[cols], className)} style={{ gap }}>
      {children}
    </div>
  );
}
