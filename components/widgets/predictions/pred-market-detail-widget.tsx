"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { MarketDetailPanel } from "@/components/trading/predictions/markets-tab";
import { usePredictionsData } from "./predictions-data-context";

export function PredMarketDetailWidget(_props: WidgetComponentProps) {
  const { selectedMarket, markets, setSelectedMarketId } = usePredictionsData();

  // PredictionsDataContext is synchronous (mock) — isLoading is always false.
  // When the context adds isLoading + error fields, wire them here.
  const isLoading = false;
  const error: string | null = null;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-xs text-muted-foreground">Loading market detail…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-xs text-destructive">{error}</p>
      </div>
    );
  }

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
    <div className="h-full min-h-0">
      <MarketDetailPanel
        market={selectedMarket}
        allMarkets={markets}
        onClose={() => setSelectedMarketId(null)}
        onSelectRelated={setSelectedMarketId}
      />
    </div>
  );
}
