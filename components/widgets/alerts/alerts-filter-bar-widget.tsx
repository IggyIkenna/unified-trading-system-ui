"use client";

import { FilterBar } from "@/components/platform/filter-bar";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useAlertsData } from "./alerts-data-context";

export function AlertsFilterBarWidget(_props: WidgetComponentProps) {
  const { alertFilterDefs, alertFilterValues, handleFilterChange, handleFilterReset } = useAlertsData();

  return (
    <FilterBar
      filters={alertFilterDefs}
      values={alertFilterValues}
      onChange={handleFilterChange}
      onReset={handleFilterReset}
      className="border-b-0 px-2 py-1"
    />
  );
}
