"use client";

import { Suspense } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { PnLDataProvider } from "@/components/widgets/pnl/pnl-data-context";
import { TradingFamilyFilterBanner } from "@/components/architecture-v2/trading-family-filter-banner";

/**
 * P&L page. Exposes a FamilyArchetypePicker banner that writes to
 * `useGlobalScope` (Phase 3 p3-wire-picker-orders-positions). P&L surfaces
 * are aggregated — strategy-level rows are filtered via the global
 * `strategyFamily` / `strategyArchetype` state when the data-context
 * derives strategy-scoped rows via `getStrategyIdsForScope`.
 */
function PnlFilterBanner() {
  return <TradingFamilyFilterBanner testIdPrefix="pnl" />;
}

function PnlPageContent() {
  return (
    <PnLDataProvider>
      <div className="h-full flex flex-col overflow-auto p-2">
        <div className="px-2 pb-2">
          <PnlFilterBanner />
        </div>
        <WidgetGrid tab="pnl" />
      </div>
    </PnLDataProvider>
  );
}

export default function PnlPage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center h-64">Loading P&amp;L…</div>}>
      <PnlPageContent />
    </Suspense>
  );
}
