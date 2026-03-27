"use client";

import * as React from "react";
import type { WidgetComponentProps } from "../widget-registry";
import { FilterBar, type FilterDefinition } from "@/components/platform/filter-bar";
import { Button } from "@/components/ui/button";
import { useOrdersData, type InstrumentType } from "./orders-data-context";

const INSTRUMENT_TYPES: InstrumentType[] = ["All", "Spot", "Perp", "Futures", "Options", "DeFi", "Prediction"];

export function OrdersFilterWidget(_props: WidgetComponentProps) {
  const {
    searchQuery,
    setSearchQuery,
    venueFilter,
    setVenueFilter,
    statusFilter,
    setStatusFilter,
    instrumentTypeFilter,
    setInstrumentTypeFilter,
    resetFilters,
    uniqueVenues,
    uniqueStatuses,
  } = useOrdersData();

  const filterDefs: FilterDefinition[] = React.useMemo(
    () => [
      {
        key: "search",
        label: "Search",
        type: "search" as const,
        placeholder: "Search by order ID, instrument, venue...",
      },
      {
        key: "venue",
        label: "Venue",
        type: "select" as const,
        options: uniqueVenues.map((v) => ({ value: v, label: v })),
      },
      {
        key: "status",
        label: "Status",
        type: "select" as const,
        options: uniqueStatuses.map((s) => ({ value: s, label: s })),
      },
    ],
    [uniqueVenues, uniqueStatuses],
  );

  const filterValues = React.useMemo(
    () => ({
      search: searchQuery || undefined,
      venue: venueFilter !== "all" ? venueFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
    }),
    [searchQuery, venueFilter, statusFilter],
  );

  const handleFilterChange = React.useCallback(
    (key: string, value: unknown) => {
      switch (key) {
        case "search":
          setSearchQuery((value as string) || "");
          break;
        case "venue":
          setVenueFilter((value as string) || "all");
          break;
        case "status":
          setStatusFilter((value as string) || "all");
          break;
      }
    },
    [setSearchQuery, setVenueFilter, setStatusFilter],
  );

  return (
    <div className="h-full flex flex-col gap-2 p-2 overflow-hidden">
      <FilterBar
        filters={filterDefs}
        values={filterValues}
        onChange={handleFilterChange}
        onReset={resetFilters}
        className="border-b-0"
      />
      <div className="flex items-center gap-1 flex-wrap px-1">
        {INSTRUMENT_TYPES.map((type) => (
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
      </div>
    </div>
  );
}
