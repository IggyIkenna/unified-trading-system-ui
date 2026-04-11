"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DataStatusFiltersHeader } from "./data-status-filters-header";
import { DataStatusFiltersUpper } from "./data-status-filters-upper";
import { DataStatusFiltersLower } from "./data-status-filters-lower";

export function DataStatusSectionFilters() {
  return (
    <Card>
      <DataStatusFiltersHeader />
      <CardContent>
        <DataStatusFiltersUpper />
        <DataStatusFiltersLower />
      </CardContent>
    </Card>
  );
}
