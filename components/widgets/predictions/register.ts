import {
  Activity,
  BarChart3,
  CheckCircle2,
  ClipboardPen,
  FileText,
  Flame,
  LayoutGrid,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { registerPresets } from "../preset-registry";
import { registerWidget } from "../widget-registry";
import { PredArbClosedWidget } from "./pred-arb-closed-widget";
import { PredArbStreamWidget } from "./pred-arb-stream-widget";
import { PredMarketDetailWidget } from "./pred-market-detail-widget";
import { PredMarketsGridWidget } from "./pred-markets-grid-widget";
import { PredOdumFocusWidget } from "./pred-odum-focus-widget";
import { PredOpenPositionsWidget } from "./pred-open-positions-widget";
import { PredPortfolioKpisWidget } from "./pred-portfolio-kpis-widget";
import { PredRecentFillsWidget } from "./pred-recent-fills-widget";
import { PredSettledPositionsWidget } from "./pred-settled-positions-widget";
import { PredTopMarketsWidget } from "./pred-top-markets-widget";
import { PredTradePanelWidget } from "./pred-trade-panel-widget";

const PRED_ENTITLEMENTS = [{ domain: "trading-predictions" as const, tier: "basic" as const }];

registerPresets("predictions", [
  {
    id: "predictions-default",
    name: "Default",
    tab: "predictions",
    isPreset: true,
    layouts: [
      { widgetId: "pred-markets-grid", instanceId: "pred-markets-grid-1", x: 0, y: 0, w: 16, h: 7 },
      { widgetId: "pred-trade-panel", instanceId: "pred-trade-panel-1", x: 16, y: 0, w: 8, h: 7 },
      { widgetId: "pred-portfolio-kpis", instanceId: "pred-portfolio-kpis-1", x: 0, y: 7, w: 24, h: 2 },
      { widgetId: "pred-open-positions", instanceId: "pred-open-positions-1", x: 0, y: 9, w: 24, h: 4 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "predictions-arb-focus",
    name: "Arb Focus",
    tab: "predictions",
    isPreset: true,
    layouts: [
      // Arb stream + closed (same height)
      { widgetId: "pred-arb-stream", instanceId: "pred-arb-stream-1", x: 0, y: 0, w: 12, h: 6 },
      { widgetId: "pred-arb-closed", instanceId: "pred-arb-closed-1", x: 12, y: 0, w: 12, h: 6 },
      // ODUM focus full width
      { widgetId: "pred-odum-focus", instanceId: "pred-odum-focus-1", x: 0, y: 6, w: 24, h: 6 },
      // Recent fills full width
      { widgetId: "pred-recent-fills", instanceId: "pred-recent-fills-1", x: 0, y: 12, w: 24, h: 4 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "predictions-full",
    name: "Full",
    tab: "predictions",
    isPreset: true,
    layouts: [
      // KPIs
      { widgetId: "pred-portfolio-kpis", instanceId: "pred-portfolio-kpis-full", x: 0, y: 0, w: 24, h: 2 },
      // Markets grid + detail + trade panel row-ish (grid h:7, detail h:7, trade-panel stacked below detail)
      { widgetId: "pred-markets-grid", instanceId: "pred-markets-grid-full", x: 0, y: 2, w: 16, h: 7 },
      { widgetId: "pred-market-detail", instanceId: "pred-market-detail-full", x: 16, y: 2, w: 8, h: 7 },
      // Positions
      { widgetId: "pred-open-positions", instanceId: "pred-open-positions-full", x: 0, y: 9, w: 24, h: 4 },
      { widgetId: "pred-settled-positions", instanceId: "pred-settled-positions-full", x: 0, y: 13, w: 24, h: 3 },
      // Top markets + recent fills (same height)
      { widgetId: "pred-top-markets", instanceId: "pred-top-markets-full", x: 0, y: 16, w: 12, h: 4 },
      { widgetId: "pred-recent-fills", instanceId: "pred-recent-fills-full", x: 12, y: 16, w: 12, h: 4 },
      // ODUM focus full width
      { widgetId: "pred-odum-focus", instanceId: "pred-odum-focus-full", x: 0, y: 20, w: 24, h: 6 },
      // Arb group: stream + closed (same height)
      { widgetId: "pred-arb-stream", instanceId: "pred-arb-stream-full", x: 0, y: 26, w: 12, h: 6 },
      { widgetId: "pred-arb-closed", instanceId: "pred-arb-closed-full", x: 12, y: 26, w: 12, h: 6 },
      // Trade panel full width at bottom
      { widgetId: "pred-trade-panel", instanceId: "pred-trade-panel-full", x: 0, y: 32, w: 24, h: 7 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);

registerWidget({
  id: "pred-markets-grid",
  label: "Markets",
  description: "Filterable grid of prediction markets with category, venue, sort, and search.",
  icon: LayoutGrid,
  minW: 8,
  minH: 4,
  defaultW: 16,
  defaultH: 7,
  requiredEntitlements: [...PRED_ENTITLEMENTS],
  assetGroup: "PREDICTION",
  catalogGroup: "Predictions",
  availableOn: ["predictions"],
  singleton: true,
  component: PredMarketsGridWidget,
});

registerWidget({
  id: "pred-market-detail",
  label: "Market Detail",
  description: "Single market detail with price history, order book summary, and trade entry.",
  icon: FileText,
  minW: 8,
  minH: 5,
  defaultW: 8,
  defaultH: 7,
  requiredEntitlements: [...PRED_ENTITLEMENTS],
  assetGroup: "PREDICTION",
  catalogGroup: "Predictions",
  availableOn: ["predictions"],
  singleton: true,
  component: PredMarketDetailWidget,
});

registerWidget({
  id: "pred-portfolio-kpis",
  label: "Portfolio KPIs",
  description: "Open positions count, total staked, unrealised P&L, and win rate.",
  icon: BarChart3,
  minW: 8,
  minH: 1,
  defaultW: 24,
  defaultH: 2,
  requiredEntitlements: [...PRED_ENTITLEMENTS],
  assetGroup: "PREDICTION",
  catalogGroup: "Predictions",
  availableOn: ["predictions"],
  singleton: true,
  component: PredPortfolioKpisWidget,
});

registerWidget({
  id: "pred-open-positions",
  label: "Open Positions",
  description: "Open prediction market positions with entry/current price and P&L.",
  icon: Target,
  minW: 12,
  minH: 3,
  defaultW: 24,
  defaultH: 4,
  requiredEntitlements: [...PRED_ENTITLEMENTS],
  assetGroup: "PREDICTION",
  catalogGroup: "Predictions",
  availableOn: ["predictions"],
  singleton: true,
  component: PredOpenPositionsWidget,
});

registerWidget({
  id: "pred-settled-positions",
  label: "Settled Positions",
  description: "Collapsible table of settled positions with win/loss/void outcome.",
  icon: TrendingUp,
  minW: 12,
  minH: 2,
  defaultW: 24,
  defaultH: 3,
  requiredEntitlements: [...PRED_ENTITLEMENTS],
  assetGroup: "PREDICTION",
  catalogGroup: "Predictions",
  availableOn: ["predictions"],
  singleton: true,
  component: PredSettledPositionsWidget,
});

registerWidget({
  id: "pred-odum-focus",
  label: "ODUM Focus",
  description: "Dual-axis price/odds charts and divergence signals for crypto, TradFi, and football.",
  icon: Activity,
  minW: 8,
  minH: 4,
  defaultW: 24,
  defaultH: 6,
  requiredEntitlements: [...PRED_ENTITLEMENTS],
  assetGroup: "PREDICTION",
  catalogGroup: "Predictions",
  availableOn: ["predictions"],
  singleton: true,
  component: PredOdumFocusWidget,
});

registerWidget({
  id: "pred-arb-stream",
  label: "Arb Stream",
  description: "Live prediction market arb opportunities with decay bars and execute actions.",
  icon: Zap,
  minW: 8,
  minH: 4,
  defaultW: 12,
  defaultH: 6,
  requiredEntitlements: [...PRED_ENTITLEMENTS],
  assetGroup: "PREDICTION",
  catalogGroup: "Predictions",
  availableOn: ["predictions"],
  singleton: true,
  component: PredArbStreamWidget,
});

registerWidget({
  id: "pred-arb-closed",
  label: "Closed Arbs",
  description: "Collapsed list of closed or decayed arb opportunities.",
  icon: TrendingDown,
  minW: 6,
  minH: 3,
  defaultW: 12,
  defaultH: 4,
  requiredEntitlements: [...PRED_ENTITLEMENTS],
  assetGroup: "PREDICTION",
  catalogGroup: "Predictions",
  availableOn: ["predictions"],
  singleton: true,
  component: PredArbClosedWidget,
});

registerWidget({
  id: "pred-trade-panel",
  label: "Quick Trade",
  description: "Market selector and trade panel with Kelly stake suggestion.",
  icon: ClipboardPen,
  minW: 8,
  minH: 5,
  defaultW: 12,
  defaultH: 7,
  requiredEntitlements: [...PRED_ENTITLEMENTS],
  assetGroup: "PREDICTION",
  catalogGroup: "Predictions",
  availableOn: ["predictions"],
  singleton: true,
  component: PredTradePanelWidget,
});

registerWidget({
  id: "pred-top-markets",
  label: "Top Markets",
  description: "Top markets by volume as quick-access cards.",
  icon: Flame,
  minW: 6,
  minH: 3,
  defaultW: 12,
  defaultH: 4,
  requiredEntitlements: [...PRED_ENTITLEMENTS],
  assetGroup: "PREDICTION",
  catalogGroup: "Predictions",
  availableOn: ["predictions"],
  singleton: true,
  component: PredTopMarketsWidget,
});

registerWidget({
  id: "pred-recent-fills",
  label: "Recent Trades",
  description: "Recent prediction market fills.",
  icon: CheckCircle2,
  minW: 6,
  minH: 3,
  defaultW: 12,
  defaultH: 4,
  requiredEntitlements: [...PRED_ENTITLEMENTS],
  assetGroup: "PREDICTION",
  catalogGroup: "Predictions",
  availableOn: ["predictions"],
  singleton: true,
  component: PredRecentFillsWidget,
});

// ─── Polymarket-style depth (P3a of DART terminal plan) ────────────────────
import {
  ClosingSoonWidget,
  MarketProbabilityCurveWidget,
  OutcomeOrderBookWidget,
  OutcomeVolumeChartWidget,
  ResolutionLedgerWidget,
  TopicBrowserWidget,
  TrendingMarketsWidget,
} from "./polymarket-widgets";
import {
  Activity as ActivityP3a,
  BookOpen,
  Calendar,
  Clock as ClockP3a,
  Layers as LayersP3a,
  ListChecks,
  TrendingUp as TrendingUpP3a,
} from "lucide-react";

registerPresets("predictions", [
  {
    id: "predictions-polymarket-depth",
    name: "Polymarket depth",
    tab: "predictions",
    isPreset: true,
    layouts: [
      { widgetId: "pred-topic-browser", instanceId: "pred-topic-browser-1", x: 0, y: 0, w: 24, h: 4 },
      { widgetId: "pred-trending-markets", instanceId: "pred-trending-markets-1", x: 0, y: 4, w: 12, h: 8 },
      { widgetId: "pred-closing-soon", instanceId: "pred-closing-soon-1", x: 12, y: 4, w: 12, h: 8 },
      {
        widgetId: "pred-market-probability-curve",
        instanceId: "pred-market-probability-curve-1",
        x: 0,
        y: 12,
        w: 16,
        h: 7,
      },
      { widgetId: "pred-outcome-order-book", instanceId: "pred-outcome-order-book-1", x: 16, y: 12, w: 8, h: 7 },
      { widgetId: "pred-outcome-volume-chart", instanceId: "pred-outcome-volume-chart-1", x: 0, y: 19, w: 24, h: 6 },
      { widgetId: "pred-resolution-ledger", instanceId: "pred-resolution-ledger-1", x: 0, y: 25, w: 24, h: 6 },
    ],
    createdAt: "2026-04-28T00:00:00Z",
    updatedAt: "2026-04-28T00:00:00Z",
  },
]);

registerWidget({
  id: "pred-market-probability-curve",
  label: "Probability curve",
  description: "Polymarket-style multi-outcome implied probability over time.",
  icon: TrendingUpP3a,
  minW: 8,
  minH: 5,
  defaultW: 16,
  defaultH: 7,
  requiredEntitlements: [{ domain: "trading-predictions", tier: "basic" }],
  assetGroup: "PREDICTION",
  catalogGroup: "Predictions",
  availableOn: ["predictions"],
  singleton: false,
  component: MarketProbabilityCurveWidget,
});

registerWidget({
  id: "pred-outcome-order-book",
  label: "Outcome book",
  description: "Polymarket-style per-outcome bid/ask depth area chart.",
  icon: BookOpen,
  minW: 4,
  minH: 5,
  defaultW: 8,
  defaultH: 7,
  requiredEntitlements: [{ domain: "trading-predictions", tier: "basic" }],
  assetGroup: "PREDICTION",
  catalogGroup: "Predictions",
  availableOn: ["predictions"],
  singleton: false,
  component: OutcomeOrderBookWidget,
});

registerWidget({
  id: "pred-outcome-volume-chart",
  label: "Outcome volume",
  description: "Volume by outcome (Yes vs No) over time, stacked, with cumulative net.",
  icon: ActivityP3a,
  minW: 12,
  minH: 4,
  defaultW: 24,
  defaultH: 6,
  requiredEntitlements: [{ domain: "trading-predictions", tier: "basic" }],
  assetGroup: "PREDICTION",
  catalogGroup: "Predictions",
  availableOn: ["predictions"],
  singleton: false,
  component: OutcomeVolumeChartWidget,
});

registerWidget({
  id: "pred-trending-markets",
  label: "Trending markets",
  description: "Polymarket-style discovery — 24h volume %change vs 7d average.",
  icon: TrendingUpP3a,
  minW: 6,
  minH: 6,
  defaultW: 12,
  defaultH: 8,
  requiredEntitlements: [{ domain: "trading-predictions", tier: "basic" }],
  assetGroup: "PREDICTION",
  catalogGroup: "Predictions",
  availableOn: ["predictions"],
  singleton: false,
  component: TrendingMarketsWidget,
});

registerWidget({
  id: "pred-closing-soon",
  label: "Closing soon",
  description: "Markets resolving soonest — > $10K volume, ranked by time-to-resolution ascending.",
  icon: ClockP3a,
  minW: 6,
  minH: 6,
  defaultW: 12,
  defaultH: 8,
  requiredEntitlements: [{ domain: "trading-predictions", tier: "basic" }],
  assetGroup: "PREDICTION",
  catalogGroup: "Predictions",
  availableOn: ["predictions"],
  singleton: false,
  component: ClosingSoonWidget,
});

registerWidget({
  id: "pred-topic-browser",
  label: "Topic browser",
  description: "Polymarket homepage-style category tiles — Politics / Crypto / Sports / Science / etc.",
  icon: LayersP3a,
  minW: 12,
  minH: 3,
  defaultW: 24,
  defaultH: 4,
  requiredEntitlements: [{ domain: "trading-predictions", tier: "basic" }],
  assetGroup: "PREDICTION",
  catalogGroup: "Predictions",
  availableOn: ["predictions"],
  singleton: false,
  component: TopicBrowserWidget,
});

registerWidget({
  id: "pred-resolution-ledger",
  label: "Resolution ledger",
  description: "Recently-resolved markets — final probability + payout. PARTIAL: full ledger backfill in P7.",
  icon: ListChecks,
  minW: 8,
  minH: 5,
  defaultW: 24,
  defaultH: 6,
  requiredEntitlements: [{ domain: "trading-predictions", tier: "basic" }],
  assetGroup: "PREDICTION",
  catalogGroup: "Predictions",
  availableOn: ["predictions"],
  singleton: false,
  component: ResolutionLedgerWidget,
});
