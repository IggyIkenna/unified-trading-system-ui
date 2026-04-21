"use client";

import { Suspense } from "react";
import { DeFiSwapWidget } from "@/components/widgets/defi/defi-swap-widget";
import { DeFiDataProvider } from "@/components/widgets/defi/defi-data-context";

/**
 * Carry-Basis strategy page (was /services/trading/strategies/basis-trade/).
 *
 * Renamed to v2-canonical slug `carry-basis` per Phase 8 of
 * plans/active/ui_unification_v2_sanitisation_2026_04_20.plan.md. Internal
 * strategy IDs map to `CARRY_AND_YIELD.CARRY_BASIS_PERP.{id}` — see
 * codex/09-strategy/architecture-v2/families/ for canonical naming.
 */
function CarryBasisPageContent() {
  return (
    <DeFiDataProvider>
      <div className="h-full flex flex-col overflow-auto p-2">
        <div className="flex-1 flex flex-col gap-4">
          {/* Carry-Basis Swap Widget (internal id: CARRY_AND_YIELD.CARRY_BASIS_PERP) */}
          <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
            <div className="border-b border-border px-4 py-3 bg-card/80">
              <h2 className="text-sm font-semibold">Carry-Basis Swap (90% Capital)</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Swap 90% of total capital to ETH (funding rate arbitrage hedge) —
                {" "}CARRY_AND_YIELD.CARRY_BASIS_PERP archetype
              </p>
            </div>
            <div className="flex-1 min-h-0 overflow-auto">
              <DeFiSwapWidget
                instanceId="carry-basis-swap-1"
                config={{ mode: "basis-trade" }}
              />
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

export default function CarryBasisPage() {
  return (
    <Suspense
      fallback={<div className="p-6 flex items-center justify-center h-64">Loading Carry-Basis…</div>}
    >
      <CarryBasisPageContent />
    </Suspense>
  );
}
