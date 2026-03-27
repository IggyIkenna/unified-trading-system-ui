"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FinderColumnResizeHandleProps {
  onResizeDelta: (deltaX: number) => void;
  className?: string;
}

/**
 * Narrow hit target between finder columns; adjusts the column to the left on drag.
 */
export function FinderColumnResizeHandle({ onResizeDelta, className }: FinderColumnResizeHandleProps) {
  const lastX = React.useRef(0);

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      lastX.current = e.clientX;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - lastX.current;
        lastX.current = ev.clientX;
        if (dx !== 0) onResizeDelta(dx);
      };

      const onUp = (ev: PointerEvent) => {
        (ev.target as HTMLElement).releasePointerCapture(ev.pointerId);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [onResizeDelta],
  );

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize column"
      onPointerDown={onPointerDown}
      className={cn(
        "group relative w-2 shrink-0 cursor-col-resize select-none touch-none flex items-stretch justify-center",
        className,
      )}
    >
      <div
        className={cn("w-px h-full bg-border/50 group-hover:bg-primary/50 group-active:bg-primary transition-colors")}
      />
    </div>
  );
}
