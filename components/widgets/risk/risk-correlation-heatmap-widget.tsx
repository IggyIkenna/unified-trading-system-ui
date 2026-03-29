"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { WidgetComponentProps } from "../widget-registry";

const DynamicCorrelationHeatmap = dynamic(
  () => import("@/components/risk/correlation-heatmap").then((m) => m.CorrelationHeatmap),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-1.5 p-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full rounded-md" />
        ))}
      </div>
    ),
  },
);

export function RiskCorrelationHeatmapWidget(_props: WidgetComponentProps) {
  return (
    <div className="h-full overflow-auto">
      <DynamicCorrelationHeatmap />
    </div>
  );
}
