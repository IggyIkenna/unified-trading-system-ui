"use client";

import * as React from "react";
import { FilterBar } from "@/components/platform/filter-bar";
import { Button } from "@/components/ui/button";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import Link from "next/link";
import { usePositionsData } from "./positions-data-context";

export function PositionsFilterWidget(_props: WidgetComponentProps) {
  const {
    filterDefs,
    filterValues,
    handleFilterChange,
    resetFilters,
    instrumentTypeFilter,
    setInstrumentTypeFilter,
    instrumentTypes,
    strategyFilter,
  } = usePositionsData();

  return (
    <div className="flex flex-col gap-2 h-full">
      <FilterBar
        filters={filterDefs}
        values={filterValues}
        onChange={handleFilterChange}
        onReset={resetFilters}
        className="border-b-0 px-2 py-1"
      />
      <div className="flex items-center gap-1 px-2 pb-1 flex-wrap">
        {instrumentTypes.map((type) => (
          <Button
            key={type}
            variant={instrumentTypeFilter === type ? "default" : "outline"}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => setInstrumentTypeFilter(type)}
          >
            {type}
          </Button>
        ))}
        {strategyFilter !== "all" && (
          <Link href={`/services/trading/strategies/${strategyFilter}`} className="ml-auto">
            <Button variant="outline" size="sm" className="h-7 text-xs">
              View Strategy Details
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
