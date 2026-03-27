"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { MarketDetailPanel } from "@/components/trading/predictions/markets-tab";
import { usePredictionsData } from "./predictions-data-context";

export function PredMarketDetailWidget(_props: WidgetComponentProps) {
  const { selectedMarket, markets, setSelectedMarketId } = usePredictionsData();

  if (!selectedMarket) {
    return (
      <Card className="bg-card border-border/50 h-full">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Select a market from the Markets grid to view detail, chart, and trade controls.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-auto">
      <MarketDetailPanel
        market={selectedMarket}
        allMarkets={markets}
        onClose={() => setSelectedMarketId(null)}
        onSelectRelated={setSelectedMarketId}
      />
    </div>
  );
}
