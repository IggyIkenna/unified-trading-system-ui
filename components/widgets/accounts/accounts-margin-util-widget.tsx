"use client";

import { MarginUtilization } from "@/components/trading/margin-utilization";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useAccountsData } from "./accounts-data-context";

export function AccountsMarginUtilWidget(_props: WidgetComponentProps) {
  const { venueMargins } = useAccountsData();

  if (venueMargins.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-4">No margin data for connected venues.</p>;
  }

  return <MarginUtilization venues={venueMargins} className="border-0 shadow-none" />;
}
