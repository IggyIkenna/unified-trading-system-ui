import { Grid3x3 } from "lucide-react";
import { registerPresets } from "../preset-registry";
import { registerWidget } from "../widget-registry";
import { FundingRateMatrixWidget } from "./funding-rate-matrix-widget";

/**
 * CeFi widget registry — Coinglass / CoinMarketCap style cross-venue
 * derivatives + spot-discovery views borrowed for the DART terminal.
 *
 * Per the "no orphans, all in DART" constraint of the cross-asset-group
 * market-data terminal plan, every widget here mounts inside one of the
 * existing `/services/trading/<tab>` tabs (terminal / overview / markets /
 * book) — there are no standalone CeFi pages.
 *
 * Phase 1 ships FundingRateMatrix as the vertical slice that exercises
 * the primitives stack (CategoricalMatrix) + the asset-group-aware data
 * hook. Subsequent P1 widgets (OpenInterestRanking, LiquidationHeatmap,
 * LongShortRatio, BasisCurve) follow.
 */

registerPresets("markets", [
  {
    id: "markets-cross-venue-derivatives",
    name: "Cross-venue derivatives",
    tab: "markets",
    isPreset: true,
    layouts: [
      {
        widgetId: "cefi-funding-rate-matrix",
        instanceId: "cefi-funding-rate-matrix-1",
        x: 0,
        y: 0,
        w: 24,
        h: 8,
      },
    ],
    createdAt: "2026-04-28T00:00:00Z",
    updatedAt: "2026-04-28T00:00:00Z",
  },
]);

registerWidget({
  id: "cefi-funding-rate-matrix",
  label: "Funding rate matrix",
  description: "Coinglass-style cross-venue funding rates — rows=asset, cols=venue, cells=8h funding (bp).",
  icon: Grid3x3,
  minW: 8,
  minH: 6,
  defaultW: 16,
  defaultH: 8,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "CEFI",
  catalogGroup: "Markets",
  availableOn: ["overview", "terminal", "markets"],
  singleton: false,
  component: FundingRateMatrixWidget,
});
