"use client";

import { KpiStrip, type KpiMetric } from "@/components/widgets/shared";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { formatCurrency } from "@/lib/reference-data";
import { useAccountsData } from "./accounts-data-context";

export function AccountsKpiWidget(_props: WidgetComponentProps) {
  const { totalNAV, totalFree, totalLocked } = useAccountsData();

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

  return <KpiStrip metrics={metrics} columns={3} />;
}
