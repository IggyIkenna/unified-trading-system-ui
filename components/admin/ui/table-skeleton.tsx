import * as React from "react";

import { cn } from "@/lib/admin/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div data-slot="table-skeleton" className="w-full">
      <div
        className={cn("mb-3 grid gap-4")}
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }).map((_, col) => (
          <Skeleton key={col} className="h-4 w-3/4" />
        ))}
      </div>
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
