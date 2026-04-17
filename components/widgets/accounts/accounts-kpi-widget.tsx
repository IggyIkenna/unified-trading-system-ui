"use client";

import { KpiSummaryWidget, type KpiMetric } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { formatCurrency } from "@/lib/reference-data";
import { useAccountsData } from "./accounts-data-context";

export function AccountsKpiWidget(_props: WidgetComponentProps) {
  const { balances, isLoading, error, totalNAV, totalFree, totalLocked } = useAccountsData();

  if (isLoading) {
    return (
      <div className="flex h-full items-center gap-2 p-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 flex-1 rounded-md" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-xs text-destructive text-center py-4">Failed to load account balances: {error.message}</p>
    );
  }

  if (balances.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-4">No balance data for connected venues.</p>;
  }

  const metrics: KpiMetric[] = [
    {
      label: "Total NAV",
      value: `$${formatCurrency(totalNAV)}`,
      sentiment: "neutral",
    },
    {
      label: "Available (Free)",
      value: `$${formatCurrency(totalFree)}`,
      sentiment: "positive",
    },
    {
      label: "Locked (In Use)",
      value: `$${formatCurrency(totalLocked)}`,
      sentiment: "neutral",
    },
  ];

  return <KpiSummaryWidget metrics={metrics} storageKey="uts-accounts-kpi-layout" />;
}
