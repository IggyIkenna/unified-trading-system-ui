"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LiveFeedWidget } from "@/components/shared/live-feed-widget";
import { RefreshCw, RotateCcw } from "lucide-react";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { InstructionPipelineRows } from "./instruction-pipeline-rows";
import { useInstructionsData } from "./instructions-data-context";

export function InstructionsPipelineTableWidget(_props: WidgetComponentProps) {
  const { refresh, filterDefs, filterValues, handleFilterChange, resetFilters } = useInstructionsData();

  const activeFilterCount = Object.values(filterValues).filter(Boolean).length;

  const toolbar = (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/40 bg-muted/10 overflow-x-auto min-w-0">
      {filterDefs.map((def) => (
        <Select
          key={def.key}
          value={(filterValues[def.key] as string | undefined) ?? "all"}
          onValueChange={(v) => handleFilterChange(def.key, v === "all" ? undefined : v)}
        >
          <SelectTrigger className="h-7 text-xs shrink-0 w-36">
            <SelectValue placeholder={def.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {def.label}s</SelectItem>
            {(def.options ?? [])
              .filter((o) => o.value)
              .map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      ))}

      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1 text-muted-foreground shrink-0"
          onClick={resetFilters}
        >
          <RotateCcw className="size-3" />
          Reset ({activeFilterCount})
        </Button>
      )}

      <div className="flex-1 min-w-2" />

      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs shrink-0" onClick={refresh}>
        <RefreshCw className="size-3" />
        Refresh
      </Button>
    </div>
  );

  return (
    <LiveFeedWidget header={toolbar}>
      <div className="flex flex-col flex-1 min-h-0">
        <InstructionPipelineRows fillHeight />
      </div>
    </LiveFeedWidget>
  );
}
