"use client";

import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";

/**
 * WidgetScroll — shared scroll container for widgets and all other UI surfaces.
 *
 * Supports vertical, horizontal, or both axes simultaneously.
 * Uses Radix ScrollArea for accessible, cross-browser custom scrollbars.
 *
 * Usage:
 *   <WidgetScroll>…content…</WidgetScroll>                    // vertical only
 *   <WidgetScroll axes="horizontal">…</WidgetScroll>           // horizontal only
 *   <WidgetScroll axes="both">…</WidgetScroll>                 // both axes
 *   <WidgetScroll scrollbarSize="thin">…</WidgetScroll>        // thinner thumb
 */

type ScrollAxes = "vertical" | "horizontal" | "both";
type ScrollbarSize = "default" | "thin";

interface WidgetScrollProps {
  children: React.ReactNode;
  axes?: ScrollAxes;
  scrollbarSize?: ScrollbarSize;
  className?: string;
  viewportClassName?: string;
}

export function WidgetScroll({
  children,
  axes = "vertical",
  scrollbarSize = "default",
  className,
  viewportClassName,
}: WidgetScrollProps) {
  const showVertical = axes === "vertical" || axes === "both";
  const showHorizontal = axes === "horizontal" || axes === "both";

  return (
    <ScrollAreaPrimitive.Root
      data-slot="widget-scroll"
      className={cn("relative h-full w-full overflow-hidden", className)}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="widget-scroll-viewport"
        className={cn("h-full w-full rounded-[inherit]", showHorizontal && "overflow-x-auto", viewportClassName)}
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
