"use client";

import * as React from "react";
import { FilterBar } from "@/components/platform/filter-bar";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useInstructionsData } from "./instructions-data-context";

export function InstructionsFilterWidget(_props: WidgetComponentProps) {
  const { filterDefs, filterValues, handleFilterChange, resetFilters } = useInstructionsData();

  return (
    <div className="flex flex-col gap-2 h-full min-h-0">
      <FilterBar
        filters={filterDefs}
        values={filterValues as Record<string, string | undefined>}
        onChange={handleFilterChange}
        onReset={resetFilters}
        className="border-b-0 px-2 py-1"
      />
    </div>
  );
}
