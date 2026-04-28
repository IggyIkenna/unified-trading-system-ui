"use client";

import { Suspense } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { OptionsDataProvider } from "@/components/widgets/options/options-data-context";
import { PageEntitlementGate } from "@/components/platform/page-entitlement-gate";

function OptionsPageContent() {
  return (
    <OptionsDataProvider>
      <div className="h-full flex flex-col overflow-hidden p-2 min-h-0">
        <WidgetGrid tab="options" />
      </div>
    </OptionsDataProvider>
  );
}

export default function OptionsFuturesPage() {
  // 2026-04-28 DART tile-split: instrument-type gating. The Options page
  // surfaces option + future widgets — only unlocks for users whose entitled
  // (or FOMO-teaser) strategies use those instrument types. SSOT:
  // codex/14-playbooks/dart/dart-terminal-vs-research.md.
  return (
    <PageEntitlementGate
      requiredInstrumentTypes={["option", "future"]}
      featureName="Options & Futures"
      description="Subscribe to a strategy that trades options or futures to unlock this view (e.g. VOL_TRADING_OPTIONS, ARBITRAGE_FUTURES_BASIS)."
    >
      <Suspense fallback={<div className="p-6 flex items-center justify-center h-64">Loading options…</div>}>
        <OptionsPageContent />
      </Suspense>
    </PageEntitlementGate>
  );
}
