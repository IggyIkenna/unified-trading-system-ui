"use client";

import { PredictionMarketsPanel } from "@/components/trading/prediction-markets-panel";

export default function PredictionMarketsPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Prediction Markets</h1>
          <p className="text-sm text-muted-foreground">
            Browse and trade prediction markets across Polymarket and Kalshi
          </p>
        </div>
      </div>
      <PredictionMarketsPanel />
    </div>
  );
}
