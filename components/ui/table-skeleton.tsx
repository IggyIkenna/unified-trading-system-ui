// IMPORT THIS — do not create custom loading states
import * as React from "react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div data-slot="table-skeleton" className="w-full">
      {/* Header row */}
      <div
        className={cn("mb-3 grid gap-4")}
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }).map((_, col) => (
          <Skeleton key={col} className="h-4 w-3/4" />
        ))}
      </div>
      {/* Data rows */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, row) => (
          <div
            key={row}
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: columns }).map((_, col) => (
              <Skeleton key={col} className="h-4" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export { TableSkeleton };
