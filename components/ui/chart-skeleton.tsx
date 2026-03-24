// IMPORT THIS — do not create custom loading states
import * as React from "react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

function ChartSkeleton() {
  return (
    <div data-slot="chart-skeleton" className={cn("flex flex-col gap-3")}>
      {/* Chart title placeholder */}
      <Skeleton className="h-4 w-1/4" />
      {/* Chart area */}
      <div className="relative h-64 w-full overflow-hidden rounded-lg border">
        <Skeleton className="absolute inset-0 rounded-none" />
        {/* Wavy line overlay to suggest chart shape */}
        <svg
          className="text-accent-foreground/5 absolute inset-0 h-full w-full"
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
        >
          <path
            d="M0,150 C50,120 80,180 130,100 C180,20 200,80 250,60 C300,40 330,120 370,90 L400,70"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
        </svg>
      </div>
      {/* Legend placeholders */}
      <div className="flex gap-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export { ChartSkeleton };
