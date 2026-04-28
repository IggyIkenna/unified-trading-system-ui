"use client";

import { Suspense } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { DeFiDataProvider } from "@/components/widgets/defi/defi-data-context";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { PageEntitlementGate } from "@/components/platform/page-entitlement-gate";

function DeFiPageContent() {
  return (
    <DeFiDataProvider>
      <WidgetScroll viewportClassName="p-2">
        <WidgetGrid tab="defi" />
      </WidgetScroll>
    </DeFiDataProvider>
  );
}

export default function DeFiOpsPage() {
  // 2026-04-28 DART tile-split: asset_group gating. The DeFi page surfaces
  // on-chain widgets — only unlocks for users whose entitled (or FOMO-teaser)
  // strategies are in the DEFI asset_group. SSOT:
  // codex/14-playbooks/dart/dart-terminal-vs-research.md.
  return (
    <PageEntitlementGate
      requiredAssetGroups={["DEFI"]}
      featureName="DeFi Trading"
      description="Subscribe to an on-chain DeFi strategy (e.g. ARBITRAGE_FUNDING_RATE, CARRY_LIQUIDITY_POOL) to unlock this view."
    >
      <Suspense fallback={<div className="p-6 flex items-center justify-center h-64">Loading DeFi…</div>}>
        <DeFiPageContent />
      </Suspense>
    </PageEntitlementGate>
  );
}
