"use client";

import * as React from "react";
import { FilterBar, useFilterState, type FilterDefinition } from "@/components/shared/filter-bar";
import { cn } from "@/lib/utils";

interface FilterBarWidgetProps {
  /** Column filter definitions — passed straight to FilterBar */
  filters: FilterDefinition[];
  /** Initial filter values keyed by filter.key */
  initialValues?: Record<string, unknown>;
  /** Callback fired on every filter change */
  onFiltersChange?: (values: Record<string, unknown>) => void;
  /** Persist filter state into URL search params */
  persistToUrl?: boolean;
  className?: string;
}

export function FilterBarWidget({
  filters,
  initialValues,
  onFiltersChange,
  persistToUrl = false,
  className,
}: FilterBarWidgetProps) {
  const { filters: values, updateFilter, resetFilters } = useFilterState(initialValues ?? {});

  React.useEffect(() => {
    onFiltersChange?.(values);
  }, [values, onFiltersChange]);

  return (
    <FilterBar
      filters={filters}
      values={values}
      onChange={updateFilter}
      onReset={resetFilters}
      persistToUrl={persistToUrl}
      className={cn("border-b-0 px-2 py-1", className)}
    />
  );
}
