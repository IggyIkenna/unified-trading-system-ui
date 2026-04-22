"use client";

import { OctagonX } from "lucide-react";
import { ApiError } from "@/components/shared/api-error";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { RiskDataProvider } from "@/components/widgets/risk/risk-data-context";
import { useRiskPageData } from "@/components/widgets/risk/use-risk-page-data";

export default function RiskPage() {
  const { riskData, isLoading, hasError, error, refetch } = useRiskPageData();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (hasError && error) {
    return (
      <div className="p-6">
        <ApiError error={error} onRetry={refetch} title="Failed to load risk data" />
      </div>
    );
  }

  return (
    <div className="h-full bg-background flex flex-col">
      {riskData.anyKillSwitchActive && (
        <div className="mx-2 mt-2 rounded-lg border-2 border-rose-500 bg-rose-500/10 p-3 flex items-center gap-3 shrink-0">
          <OctagonX className="size-5 text-rose-400 shrink-0" />
          <div>
            <p className="font-semibold text-rose-400 text-sm">KILL SWITCH ACTIVE</p>
            <p className="text-xs text-rose-300">One or more strategies have been forcibly stopped.</p>
          </div>
        </div>
      )}
      <WidgetScroll viewportClassName="p-2">
        <RiskDataProvider value={riskData}>
          <WidgetGrid tab="risk" />
        </RiskDataProvider>
      </WidgetScroll>
    </div>
  );
}
