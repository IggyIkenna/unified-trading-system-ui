"use client";

import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getPageHelpInfo } from "@/components/platform/page-help";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface TabSectionHelpProps {
  href: string;
  tabLabel: string;
  className?: string;
}

/** Compact help control for service tab rows (feedback stays on breadcrumb `PageHelp`). */
export function TabSectionHelp({ href, tabLabel, className }: TabSectionHelpProps) {
  const { isInternal } = useAuth();
  const normalized = href.replace(/\/$/, "") || "/";
  const info = getPageHelpInfo(normalized) ?? {
    title: tabLabel,
    description: `Open ${tabLabel} from the tab bar, or switch between related sections using the other tabs.`,
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "p-0.5 rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50 transition-colors",
            className,
          )}
          aria-label={`Help: ${info.title}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <HelpCircle className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-64 p-3" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="space-y-1.5">
          <p className="text-sm font-medium">{info.title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{info.description}</p>
          {isInternal() && info.internalNotes && (
            <div className="mt-2 pt-2 border-t border-border/40">
              <p className="text-[10px] font-semibold text-amber-500 mb-1">Internal Notes</p>
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed font-mono">{info.internalNotes}</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
