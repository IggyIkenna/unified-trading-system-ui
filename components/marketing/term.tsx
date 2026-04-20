"use client";

import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getTerm } from "@/lib/glossary";
import { cn } from "@/lib/utils";

/**
 * Inline glossary tooltip — lets running copy mention "CeFi" or "SMA" without
 * spelling out the definition in the surrounding sentence. Readers who need
 * the expansion hover (or focus on mobile/keyboard) and see a short line.
 *
 * Use via the `id` prop keyed into `lib/glossary.ts`:
 *   <Term id="cefi" />            → label from glossary
 *   <Term id="cefi">CeFi</Term>   → custom label, same definition
 *
 * Accessibility: renders a `<button>` under the hood (Radix Tooltip's
 * TooltipTrigger default) so it's focusable by keyboard; screen readers
 * announce the definition via `aria-describedby`.
 *
 * No tooltip library wrapping is needed at the page level — the Radix
 * `TooltipProvider` wraps each instance so it Just Works from anywhere.
 */
export interface TermProps {
  readonly id: string;
  readonly children?: React.ReactNode;
  readonly className?: string;
}

export function Term({ id, children, className }: TermProps) {
  const entry = getTerm(id);
  if (!entry) {
    // Fallback: render the provided children (or id) as plain text.
    // Don't break the page just because a term hasn't been defined yet.
    return <span className={className}>{children ?? id}</span>;
  }

  const label = children ?? entry.label;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            className={cn(
              "cursor-help border-b border-dotted border-muted-foreground/60 hover:border-foreground focus-visible:outline-none focus-visible:border-foreground transition-colors",
              className,
            )}
            aria-label={`${entry.label} — ${entry.definition}`}
          >
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs leading-relaxed">
          {entry.definition}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
