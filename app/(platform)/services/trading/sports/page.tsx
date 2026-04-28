"use client";

import { Suspense } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { SportsDataProvider } from "@/components/widgets/sports/sports-data-context";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { PageEntitlementGate } from "@/components/platform/page-entitlement-gate";

function SportsPageContent() {
  return (
    <SportsDataProvider>
      <WidgetScroll viewportClassName="p-2">
        <WidgetGrid tab="sports" />
      </WidgetScroll>
    </SportsDataProvider>
  );
}

export default function SportsBettingPage() {
  // 2026-04-28 DART tile-split: asset_group gating. The Sports page surfaces
  // sports-event widgets — only unlocks for users whose entitled (or FOMO-
  // teaser) strategies are in the SPORTS asset_group. SSOT:
  // codex/14-playbooks/dart/dart-terminal-vs-research.md.
  return (
    <PageEntitlementGate
      requiredAssetGroups={["SPORTS"]}
      featureName="Sports Trading"
      description="Subscribe to a sports-betting strategy (e.g. EVENT_DRIVEN_SPORTS, STAT_ARB_SPORTS) to unlock this view."
    >
      <Suspense fallback={<div className="p-6 flex items-center justify-center h-64">Loading sports…</div>}>
        <SportsPageContent />
      </Suspense>
    </PageEntitlementGate>
  );
}
