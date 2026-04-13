"use client";

import { Suspense } from "react";
import { DeFiSwapWidget } from "@/components/widgets/defi/defi-swap-widget";
import { DeFiDataProvider } from "@/components/widgets/defi/defi-data-context";

function BasisTradePageContent() {
  return (
    <DeFiDataProvider>
      <div className="h-full flex flex-col overflow-auto p-2">
        <div className="flex-1 flex flex-col gap-4">
          {/* Basis Trade Swap Widget */}
          <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
            <div className="border-b border-border px-4 py-3 bg-card/80">
              <h2 className="text-sm font-semibold">Basis Trade Swap (90% Capital)</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Swap 90% of total capital to ETH (funding rate arbitrage hedge)
              </p>
            </div>
            <div className="flex-1 min-h-0 overflow-auto">
              <DeFiSwapWidget instanceId="basis-trade-swap-1" config={{ mode: "basis-trade" }} />
            </div>
          </div>

          {/* Perp Short Position (future component) */}
          <div className="bg-card border border-border rounded-lg p-4 text-center text-sm text-muted-foreground">
            <p>Perp short position management (coming soon)</p>
          </div>
        </div>
      </div>
    </DeFiDataProvider>
  );
}

export default function BasisTradePage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center h-64">Loading Basis Trade…</div>}>
      <BasisTradePageContent />
    </Suspense>
  );
}
