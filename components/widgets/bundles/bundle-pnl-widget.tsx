"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { CollapsibleSection } from "@/components/shared/collapsible-section";
import { KpiStrip, type KpiMetric } from "@/components/shared/kpi-strip";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { AlertTriangle } from "lucide-react";
import { useBundlesData } from "./bundles-data-context";
import { formatNumber } from "@/lib/utils/formatters";

export function BundlePnlWidget(_props: WidgetComponentProps) {
  const { steps, totalCost, totalRevenue, estimatedGas, netPnl } = useBundlesData();

  if (steps.length === 0) {
    return (
      <div className="p-3 text-caption text-muted-foreground text-center">
        Add legs to see buy/sell notionals and net P&amp;L.
      </div>
    );
  }

  const metrics: KpiMetric[] = [
    {
      label: "Buy notional",
      value: `-$${totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      sentiment: "negative",
    },
    {
      label: "Sell notional",
      value: `+$${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      sentiment: "positive",
    },
    {
      label: `Gas est. (${steps.length} txns)`,
      value: `-$${formatNumber(estimatedGas, 2)}`,
      sentiment: "negative",
    },
    {
      label: "Net P&L",
      value: `${netPnl >= 0 ? "+" : ""}$${netPnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      sentiment: netPnl >= 0 ? "positive" : "negative",
    },
  ];

  return (
    <div className="p-2 space-y-2 flex flex-col min-h-0">
      <KpiStrip metrics={metrics} columns={4} className="rounded-md" />
      <CollapsibleSection title="Line breakdown" defaultOpen={false}>
        <div className="px-2 pb-2 space-y-1 text-xs">
          <div className="grid grid-cols-2 gap-1">
            <span className="text-muted-foreground">Buy notional</span>
            <span className="font-mono text-rose-400 text-right">
              -$
              {totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            <span className="text-muted-foreground">Sell notional</span>
            <span className="font-mono text-emerald-400 text-right">
              +$
              {totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            <span className="text-muted-foreground">Est. gas</span>
            <span className="font-mono text-rose-400 text-right">-${formatNumber(estimatedGas, 2)}</span>
            <Separator className="col-span-2 my-1" />
            <span className="font-medium">Net P&amp;L</span>
            <span className={cn("font-mono font-bold text-right", netPnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
              {netPnl >= 0 ? "+" : ""}${netPnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
          {netPnl < 0 && (
            <div className="flex items-center gap-1.5 text-micro text-amber-400 pt-1">
              <AlertTriangle className="size-3 shrink-0" />
              Bundle shows negative expected P&amp;L
            </div>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}
