"use client";

import * as React from "react";
import { FilterBar } from "@/components/shared/filter-bar";
import { Button } from "@/components/ui/button";
import { RefreshCw, Filter } from "lucide-react";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { InstructionPipelineRows } from "./instruction-pipeline-rows";
import { useInstructionsData } from "./instructions-data-context";

export function InstructionsPipelineTableWidget(_props: WidgetComponentProps) {
  const { refresh, filterDefs, filterValues, handleFilterChange, resetFilters } = useInstructionsData();
  const [showFilters, setShowFilters] = React.useState(true);

  return (
    <div className="flex flex-col h-full min-h-0 border border-border rounded-md overflow-hidden bg-card">
      <div className="flex items-center justify-between gap-2 px-2 py-1 border-b border-border shrink-0">
        <button
          onClick={() => setShowFilters((f) => !f)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Filter className="size-3" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1.5" type="button" onClick={refresh}>
          <RefreshCw className="size-3" />
          Refresh
        </Button>
      </div>
      {showFilters && (
        <div className="px-3 py-2 border-b border-border/30 bg-muted/20">
          <FilterBar
            filters={filterDefs}
            values={filterValues as Record<string, string | undefined>}
            onChange={handleFilterChange}
            onReset={resetFilters}
            className="border-b-0 px-0 py-0"
          />
        </div>
      )}
      <div className="flex flex-col flex-1 min-h-0">
        <InstructionPipelineRows fillHeight />
      </div>
    </div>
  );
}
