"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FinderDetailPanelProps {
  children: React.ReactNode;
  title?: string;
  width?: string;
  defaultOpen?: boolean;
}

export function FinderDetailPanel({
  children,
  title = "Detail",
  width = "w-[420px]",
  defaultOpen = true,
}: FinderDetailPanelProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  if (!open) {
    return (
      <div className="shrink-0 flex flex-col items-center border-l border-border/40 bg-muted/5">
        <button
          onClick={() => setOpen(true)}
          className="p-2 hover:bg-muted/40 transition-colors"
          aria-label="Expand detail panel"
        >
          <ChevronLeft className="size-3.5 text-muted-foreground" />
        </button>
        <span className="text-[10px] text-muted-foreground [writing-mode:vertical-rl] rotate-180 mt-2">
          {title}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "shrink-0 flex flex-col min-h-0 bg-muted/5 border-l border-border/40",
        width,
      )}
    >
      {/* Header with collapse toggle */}
      <div className="px-3 py-1.5 border-b border-border/40 bg-muted/30 flex items-center gap-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex-1">
          {title}
        </p>
        <button
          onClick={() => setOpen(false)}
          className="p-0.5 hover:bg-muted/40 rounded transition-colors"
          aria-label="Collapse detail panel"
        >
          <ChevronRight className="size-3 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
