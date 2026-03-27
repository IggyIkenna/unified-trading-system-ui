"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { Play, Send } from "lucide-react";
import { useBundlesData } from "./bundles-data-context";

export function BundleActionsWidget(_props: WidgetComponentProps) {
  const { steps } = useBundlesData();

  if (steps.length === 0) {
    return (
      <div className="p-2 flex items-center justify-center min-h-[44px]">
        <p className="text-[11px] text-muted-foreground">Simulate and submit unlock once you add legs.</p>
      </div>
    );
  }

  return (
    <div className="p-2 flex flex-wrap items-center gap-2">
      <Badge variant="secondary" className="text-[10px] font-mono">
        {steps.length} leg{steps.length === 1 ? "" : "s"}
      </Badge>
      <div className="flex flex-1 gap-2 min-w-[200px]">
        <Button variant="outline" className="text-xs h-9 flex-1" type="button">
          <Play className="size-3.5 mr-1.5 shrink-0" />
          Simulate (dry run)
        </Button>
        <Button className="text-xs h-9 flex-1" type="button" disabled={steps.length === 0}>
          <Send className="size-3.5 mr-1.5 shrink-0" />
          Submit bundle
        </Button>
      </div>
    </div>
  );
}
