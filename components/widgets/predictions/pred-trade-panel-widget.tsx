"use client";

import { Search } from "lucide-react";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { MarketSelector, TradePanelInner } from "@/components/trading/predictions/trade-tab";
import { usePredictionsData } from "./predictions-data-context";

export function PredTradePanelWidget(_props: WidgetComponentProps) {
  const { markets, quickTradeMarketId, setQuickTradeMarketId, placeTrade } = usePredictionsData();
  const selectedMarket = quickTradeMarketId ? (markets.find((m) => m.id === quickTradeMarketId) ?? null) : null;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-auto px-1 py-0.5 space-y-4">
      <MarketSelector markets={markets} value={quickTradeMarketId} onChange={setQuickTradeMarketId} />
      {selectedMarket ? (
        <TradePanelInner market={selectedMarket} onPlaceTrade={placeTrade} />
      ) : (
        <div className="py-6 text-center">
          <Search className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Search or select a market above</p>
        </div>
      )}
    </div>
  );
}
