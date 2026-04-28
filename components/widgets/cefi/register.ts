import { Activity, BarChart3, Coins, Flame, Grid3x3, PieChart, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { registerPresets } from "../preset-registry";
import { registerWidget } from "../widget-registry";
import { BasisCurveWidget } from "./basis-curve-widget";
import { FundingRateMatrixWidget } from "./funding-rate-matrix-widget";
import { GainersLosersWidget } from "./gainers-losers-widget";
import { LiquidationHeatmapWidget } from "./liquidation-heatmap-widget";
import { LongShortRatioWidget } from "./long-short-ratio-widget";
import { MarketCapRankingWidget } from "./market-cap-ranking-widget";
import { OpenInterestRankingWidget } from "./open-interest-ranking-widget";
import { TrendingTokensWidget } from "./trending-tokens-widget";
import { VolumeDominanceWidget } from "./volume-dominance-widget";

/**
 * CeFi widget registry — Coinglass / CoinMarketCap style cross-venue
 * derivatives + spot-discovery views borrowed for the DART terminal.
 *
 * Per the "no orphans, all in DART" constraint of the cross-asset-group
 * market-data terminal plan, every widget here mounts inside one of the
 * existing /services/trading/<tab> tabs (terminal / overview / markets /
 * book) — there are no standalone CeFi pages.
 *
 * Phase 1 ships 5 widgets: FundingRateMatrix, OpenInterestRanking,
 * LiquidationHeatmap, LongShortRatio, BasisCurve. All exercise the P0.3
 * primitive layer + the asset-group-aware data hook end-to-end.
 */

registerPresets("markets", [
  {
    id: "markets-cross-venue-derivatives",
    name: "Cross-venue derivatives",
    tab: "markets",
    isPreset: true,
    layouts: [
      // Top row — funding matrix (left) + OI ranking (right)
      { widgetId: "cefi-funding-rate-matrix", instanceId: "cefi-funding-rate-matrix-1", x: 0, y: 0, w: 14, h: 8 },
      { widgetId: "cefi-open-interest-ranking", instanceId: "cefi-open-interest-ranking-1", x: 14, y: 0, w: 10, h: 8 },
      // Middle row — liquidation heatmap full width
      { widgetId: "cefi-liquidation-heatmap", instanceId: "cefi-liquidation-heatmap-1", x: 0, y: 8, w: 24, h: 7 },
      // Bottom row — long/short gauge (left) + basis curve (right)
      { widgetId: "cefi-long-short-ratio", instanceId: "cefi-long-short-ratio-1", x: 0, y: 15, w: 8, h: 5 },
      { widgetId: "cefi-basis-curve", instanceId: "cefi-basis-curve-1", x: 8, y: 15, w: 16, h: 5 },
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
  defaultW: 14,
  defaultH: 8,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "CEFI",
  catalogGroup: "Markets",
  availableOn: ["overview", "terminal", "markets"],
  singleton: false,
  component: FundingRateMatrixWidget,
});

registerWidget({
  id: "cefi-open-interest-ranking",
  label: "Open interest ranking",
  description: "Coinglass-style OI ranking — assets sorted by 24h open interest with sparkline + change.",
  icon: BarChart3,
  minW: 6,
  minH: 6,
  defaultW: 10,
  defaultH: 8,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "CEFI",
  catalogGroup: "Markets",
  availableOn: ["overview", "terminal", "markets"],
  singleton: false,
  component: OpenInterestRankingWidget,
});

registerWidget({
  id: "cefi-liquidation-heatmap",
  label: "Liquidation heatmap",
  description: "Coinglass-style liquidations by price level over time — long/short colour split.",
  icon: Flame,
  minW: 12,
  minH: 6,
  defaultW: 24,
  defaultH: 7,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "CEFI",
  catalogGroup: "Markets",
  availableOn: ["overview", "terminal", "markets"],
  singleton: false,
  component: LiquidationHeatmapWidget,
});

registerWidget({
  id: "cefi-long-short-ratio",
  label: "Long/Short ratio",
  description: "Coinglass-style cross-venue long/short imbalance gauge with historical sparkline.",
  icon: Activity,
  minW: 4,
  minH: 4,
  defaultW: 8,
  defaultH: 5,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "CEFI",
  catalogGroup: "Markets",
  availableOn: ["overview", "terminal", "markets"],
  singleton: false,
  component: LongShortRatioWidget,
});

registerWidget({
  id: "cefi-basis-curve",
  label: "Basis curve",
  description: "Cross-venue futures basis (premium over spot) by expiry — term structure XY plot.",
  icon: TrendingUp,
  minW: 8,
  minH: 4,
  defaultW: 16,
  defaultH: 5,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "CEFI",
  catalogGroup: "Markets",
  availableOn: ["overview", "terminal", "markets"],
  singleton: false,
  component: BasisCurveWidget,
});

// ─── CoinMarketCap-style market discovery (P3 of DART terminal plan) ───────

registerPresets("markets", [
  {
    id: "markets-cmc-discovery",
    name: "Market discovery",
    tab: "markets",
    isPreset: true,
    layouts: [
      { widgetId: "cefi-market-cap-ranking", instanceId: "cefi-market-cap-ranking-1", x: 0, y: 0, w: 16, h: 10 },
      { widgetId: "cefi-volume-dominance", instanceId: "cefi-volume-dominance-1", x: 16, y: 0, w: 8, h: 5 },
      { widgetId: "cefi-trending-tokens", instanceId: "cefi-trending-tokens-1", x: 16, y: 5, w: 8, h: 5 },
      { widgetId: "cefi-gainers-losers", instanceId: "cefi-gainers-losers-1", x: 0, y: 10, w: 24, h: 7 },
    ],
    createdAt: "2026-04-28T00:00:00Z",
    updatedAt: "2026-04-28T00:00:00Z",
  },
]);

registerWidget({
  id: "cefi-market-cap-ranking",
  label: "Market cap ranking",
  description: "CoinMarketCap-style ranking with market cap, dominance, 24h volume, sparkline.",
  icon: Coins,
  minW: 8,
  minH: 6,
  defaultW: 16,
  defaultH: 10,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "CEFI",
  catalogGroup: "Markets",
  availableOn: ["overview", "terminal", "markets"],
  singleton: false,
  component: MarketCapRankingWidget,
});

registerWidget({
  id: "cefi-gainers-losers",
  label: "Gainers / Losers",
  description: "Top 50 24h gainers + losers with two-tab toggle.",
  icon: TrendingDown,
  minW: 8,
  minH: 5,
  defaultW: 24,
  defaultH: 7,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "CEFI",
  catalogGroup: "Markets",
  availableOn: ["overview", "terminal", "markets"],
  singleton: false,
  component: GainersLosersWidget,
});

registerWidget({
  id: "cefi-volume-dominance",
  label: "Volume dominance",
  description: "24h volume share by exchange + by chain (donut charts).",
  icon: PieChart,
  minW: 4,
  minH: 4,
  defaultW: 8,
  defaultH: 5,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "CEFI",
  catalogGroup: "Markets",
  availableOn: ["overview", "terminal", "markets"],
  singleton: false,
  component: VolumeDominanceWidget,
});

registerWidget({
  id: "cefi-trending-tokens",
  label: "Trending tokens",
  description: "Ranked by 24h volume %change vs 7d average — early-mover signal.",
  icon: Sparkles,
  minW: 4,
  minH: 4,
  defaultW: 8,
  defaultH: 5,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "CEFI",
  catalogGroup: "Markets",
  availableOn: ["overview", "terminal", "markets"],
  singleton: false,
  component: TrendingTokensWidget,
});
