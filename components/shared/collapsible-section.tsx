"use client";

import * as React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  /** Start open or collapsed */
  defaultOpen?: boolean;
  /** Optional count badge shown next to the title */
  count?: number;
  /** Optional right-side element (e.g. a toggle or link) */
  trailing?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  defaultOpen = true,
  count,
  trailing,
  children,
  className,
}: CollapsibleSectionProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={className}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-1.5 w-full px-2 py-1.5 hover:bg-muted/40 transition-colors rounded-sm group">
          <ChevronRight
            className={cn("size-3 text-muted-foreground transition-transform duration-150", open && "rotate-90")}
          />
          <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            {title}
          </span>
          {count !== undefined && (
            <span className="ml-auto text-[10px] text-muted-foreground/70 font-mono tabular-nums">{count}</span>
          )}
          {trailing && <span className="ml-auto">{trailing}</span>}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
