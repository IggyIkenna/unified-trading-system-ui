"use client";

/**
 * Out-of-scope placeholder for widgets whose `dartMeta` rejects the active
 * `WorkspaceScope`. Per dart_ux_cockpit_refactor §10 + Phase 5 of §17.
 *
 * Renders a greyed card with the widget's label + a "Change scope" affordance
 * so the user understands WHY the widget is dim and HOW to bring it back.
 */

import * as React from "react";
import { EyeOff } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OutOfScopePlaceholderProps {
  readonly widgetLabel: string;
  readonly reason?: string;
  readonly className?: string;
}

export function OutOfScopePlaceholder({ widgetLabel, reason, className }: OutOfScopePlaceholderProps) {
  return (
    <Card
      className={cn("h-full opacity-60 border-dashed border-border/50 bg-muted/10", className)}
      data-testid="widget-out-of-scope"
      data-widget-label={widgetLabel}
    >
      <CardContent className="flex flex-col items-center justify-center h-full p-4 text-center gap-1.5">
        <EyeOff className="size-4 text-muted-foreground/60" aria-hidden />
        <p className="text-xs font-medium text-muted-foreground">{widgetLabel}</p>
        <p className="text-[10px] text-muted-foreground/60 leading-tight max-w-[14rem]">
          {reason ?? "Out of scope. Change Asset Group, Family, or Surface to bring this widget back into focus."}
        </p>
      </CardContent>
    </Card>
  );
}
