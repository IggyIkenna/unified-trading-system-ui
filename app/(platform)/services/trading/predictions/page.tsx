"use client";

import { Suspense } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { PredictionsDataProvider } from "@/components/widgets/predictions/predictions-data-context";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { PageEntitlementGate } from "@/components/platform/page-entitlement-gate";

function PredictionsPageContent() {
  return (
    <PredictionsDataProvider>
      <WidgetScroll viewportClassName="p-2">
        <WidgetGrid tab="predictions" />
      </WidgetScroll>
    </PredictionsDataProvider>
  );
}

export default function PredictionMarketsPage() {
  // 2026-04-28 DART tile-split: asset_group gating. The Predictions page
  // surfaces prediction-event widgets — only unlocks for users whose entitled
  // (or FOMO-teaser) strategies are in the PREDICTION asset_group. SSOT:
  // codex/14-playbooks/dart/dart-terminal-vs-research.md.
  return (
    <PageEntitlementGate
      requiredAssetGroups={["PREDICTION"]}
      featureName="Prediction Markets"
      description="Subscribe to a prediction-market strategy (e.g. STAT_ARB_PAIRS_PREDICTION) to unlock this view."
    >
      <Suspense
        fallback={<div className="p-6 flex items-center justify-center h-64">Loading prediction markets...</div>}
      >
        <PredictionsPageContent />
      </Suspense>
    </PageEntitlementGate>
  );
}
