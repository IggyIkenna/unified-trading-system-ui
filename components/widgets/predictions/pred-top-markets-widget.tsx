"use client";

import * as React from "react";
import { BarChart3 } from "lucide-react";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { TopMarketCard } from "@/components/trading/predictions/trade-tab";
import { usePredictionsData } from "./predictions-data-context";

export function PredTopMarketsWidget(_props: WidgetComponentProps) {
  const { markets, setQuickTradeMarketId, setSelectedMarketId } = usePredictionsData();

  const topMarkets = React.useMemo(() => [...markets].sort((a, b) => b.volume - a.volume).slice(0, 6), [markets]);

  if (topMarkets.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No markets available</div>
    );
  }

  return (
    <div className="flex flex-col gap-2 h-full min-h-0 overflow-auto">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 shrink-0">
        <BarChart3 className="size-3.5" />
        Top Markets by Volume
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-h-0">
        {topMarkets.map((m) => (
          <TopMarketCard
            key={m.id}
            market={m}
            onSelect={(id) => {
              setQuickTradeMarketId(id);
              setSelectedMarketId(id);
            }}
          />
        ))}
      </div>
    </div>
  );
}
