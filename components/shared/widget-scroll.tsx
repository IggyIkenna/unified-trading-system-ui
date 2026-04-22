"use client";

import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

/**
 * WidgetScroll — shared scroll container for widgets and all other UI surfaces.
 *
 * Extends the base ScrollArea/ScrollBar from components/ui/scroll-area with:
 *   - Multi-axis support (vertical, horizontal, both)
 *   - Scrollbar size variants (default, thin)
 *   - Viewport className passthrough
 *
 * For simple single-axis scrolling without size variants, prefer the base
 * ScrollArea from @/components/ui/scroll-area directly.
 *
 * Usage:
 *   <WidgetScroll>…content…</WidgetScroll>                    // vertical only
 *   <WidgetScroll axes="horizontal">…</WidgetScroll>           // horizontal only
 *   <WidgetScroll axes="both">…</WidgetScroll>                 // both axes
 *   <WidgetScroll scrollbarSize="thin">…</WidgetScroll>        // thinner thumb
 */

// Re-export base scroll primitives for consumers that only need the simple version
export { ScrollArea, ScrollBar };

type ScrollAxes = "vertical" | "horizontal" | "both";
type ScrollbarSize = "default" | "thin";

interface WidgetScrollProps {
  children: React.ReactNode;
  axes?: ScrollAxes;
  scrollbarSize?: ScrollbarSize;
  className?: string;
  viewportClassName?: string;
  viewportRef?: React.Ref<HTMLDivElement>;
}

export function WidgetScroll({
  children,
  axes = "vertical",
  scrollbarSize = "default",
  className,
  viewportClassName,
  viewportRef,
}: WidgetScrollProps) {
  const showVertical = axes === "vertical" || axes === "both";
  const showHorizontal = axes === "horizontal" || axes === "both";

  return (
    <ScrollAreaPrimitive.Root
      data-slot="widget-scroll"
      className={cn("relative flex h-full min-h-0 w-full flex-col overflow-hidden", className)}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        data-slot="widget-scroll-viewport"
        className={cn(
          "min-h-0 min-w-0 flex-1 rounded-[inherit]",
          showHorizontal && "overflow-x-auto",
          viewportClassName,
        )}
        style={{ overflowY: showVertical ? undefined : "hidden" }}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>

      {showVertical && <WidgetScrollBar orientation="vertical" size={scrollbarSize} />}
      {showHorizontal && <WidgetScrollBar orientation="horizontal" size={scrollbarSize} />}
      {axes === "both" && <ScrollAreaPrimitive.Corner />}
    </ScrollAreaPrimitive.Root>
  );
}

interface WidgetScrollBarProps {
  orientation: "vertical" | "horizontal";
  size?: ScrollbarSize;
  className?: string;
}

export function WidgetScrollBar({ orientation, size = "default", className }: WidgetScrollBarProps) {
  const isVertical = orientation === "vertical";
  const isThin = size === "thin";

  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="widget-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none select-none transition-colors",
        // Track sizing
        isVertical && ["h-full border-l border-l-transparent", isThin ? "w-1.5 p-[1px]" : "w-2 p-[1px]"],
        !isVertical && ["flex-col border-t border-t-transparent", isThin ? "h-1.5 p-[1px]" : "h-2 p-[1px]"],
        className,
      )}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="widget-scrollbar-thumb"
        className={cn("relative flex-1 rounded-full", "bg-border/60 hover:bg-border transition-colors")}
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}
