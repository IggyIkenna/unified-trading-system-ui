"use client";

import { MarginUtilization } from "@/components/trading/margin-utilization";
import { Skeleton } from "@/components/ui/skeleton";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useAccountsData } from "./accounts-data-context";

export function AccountsMarginUtilWidget(_props: WidgetComponentProps) {
  const { venueMargins, isLoading, error } = useAccountsData();

  if (isLoading) {
    return (
      <div className="space-y-3 p-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-xs text-destructive text-center py-4">Failed to load margin data: {error.message}</p>;
  }

  if (venueMargins.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-4">No margin data for connected venues.</p>;
  }

  return <MarginUtilization venues={venueMargins} className="border-0 shadow-none" />;
}
