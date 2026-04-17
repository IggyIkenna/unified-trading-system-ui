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
      { widgetId: "pred-markets-grid", instanceId: "pred-markets-grid-1", x: 0, y: 0, w: 8, h: 7 },
      { widgetId: "pred-trade-panel", instanceId: "pred-trade-panel-1", x: 8, y: 0, w: 4, h: 7 },
      { widgetId: "pred-portfolio-kpis", instanceId: "pred-portfolio-kpis-1", x: 0, y: 7, w: 12, h: 2 },
      { widgetId: "pred-open-positions", instanceId: "pred-open-positions-1", x: 0, y: 9, w: 12, h: 4 },
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
      { widgetId: "pred-arb-stream", instanceId: "pred-arb-stream-1", x: 0, y: 0, w: 6, h: 6 },
      { widgetId: "pred-arb-closed", instanceId: "pred-arb-closed-1", x: 6, y: 0, w: 6, h: 4 },
      { widgetId: "pred-odum-focus", instanceId: "pred-odum-focus-1", x: 0, y: 6, w: 12, h: 6 },
      { widgetId: "pred-recent-fills", instanceId: "pred-recent-fills-1", x: 6, y: 4, w: 6, h: 2 },
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
      { widgetId: "pred-portfolio-kpis", instanceId: "pred-portfolio-kpis-full", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "pred-markets-grid", instanceId: "pred-markets-grid-full", x: 0, y: 2, w: 8, h: 7 },
      { widgetId: "pred-market-detail", instanceId: "pred-market-detail-full", x: 8, y: 2, w: 4, h: 7 },
      { widgetId: "pred-open-positions", instanceId: "pred-open-positions-full", x: 0, y: 9, w: 12, h: 4 },
      { widgetId: "pred-settled-positions", instanceId: "pred-settled-positions-full", x: 0, y: 13, w: 12, h: 3 },
      { widgetId: "pred-top-markets", instanceId: "pred-top-markets-full", x: 0, y: 16, w: 6, h: 4 },
      { widgetId: "pred-recent-fills", instanceId: "pred-recent-fills-full", x: 6, y: 16, w: 6, h: 4 },
      { widgetId: "pred-odum-focus", instanceId: "pred-odum-focus-full", x: 0, y: 20, w: 12, h: 6 },
      { widgetId: "pred-arb-stream", instanceId: "pred-arb-stream-full", x: 0, y: 26, w: 6, h: 6 },
      { widgetId: "pred-arb-closed", instanceId: "pred-arb-closed-full", x: 6, y: 26, w: 6, h: 4 },
      { widgetId: "pred-trade-panel", instanceId: "pred-trade-panel-full", x: 0, y: 32, w: 6, h: 7 },
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
  minW: 4,
  minH: 4,
  defaultW: 8,
  defaultH: 7,
  requiredEntitlements: [...PRED_ENTITLEMENTS],
  category: "Predictions",
  availableOn: ["predictions"],
  singleton: true,
  component: PredMarketsGridWidget,
});

registerWidget({
  id: "pred-market-detail",
  label: "Market Detail",
  description: "Single market detail with price history, order book summary, and trade entry.",
  icon: FileText,
  minW: 4,
  minH: 5,
  defaultW: 4,
  defaultH: 7,
  requiredEntitlements: [...PRED_ENTITLEMENTS],
  category: "Predictions",
  availableOn: ["predictions"],
  singleton: true,
  component: PredMarketDetailWidget,
});

registerWidget({
  id: "pred-portfolio-kpis",
  label: "Portfolio KPIs",
  description: "Open positions count, total staked, unrealised P&L, and win rate.",
  icon: BarChart3,
  minW: 4,
  minH: 1,
  defaultW: 12,
  defaultH: 2,
  requiredEntitlements: [...PRED_ENTITLEMENTS],
  category: "Predictions",
  availableOn: ["predictions"],
  singleton: true,
  component: PredPortfolioKpisWidget,
});

registerWidget({
  id: "pred-open-positions",
  label: "Open Positions",
  description: "Open prediction market positions with entry/current price and P&L.",
  icon: Target,
  minW: 6,
  minH: 3,
  defaultW: 12,
  defaultH: 4,
  requiredEntitlements: [...PRED_ENTITLEMENTS],
  category: "Predictions",
  availableOn: ["predictions"],
  singleton: true,
  component: PredOpenPositionsWidget,
});

registerWidget({
  id: "pred-settled-positions",
  label: "Settled Positions",
  description: "Collapsible table of settled positions with win/loss/void outcome.",
  icon: TrendingUp,
  minW: 6,
  minH: 2,
  defaultW: 12,
  defaultH: 3,
  requiredEntitlements: [...PRED_ENTITLEMENTS],
  category: "Predictions",
  availableOn: ["predictions"],
  singleton: true,
  component: PredSettledPositionsWidget,
});

registerWidget({
  id: "pred-odum-focus",
  label: "ODUM Focus",
  description: "Dual-axis price/odds charts and divergence signals for crypto, TradFi, and football.",
  icon: Activity,
  minW: 4,
  minH: 4,
  defaultW: 12,
  defaultH: 6,
  requiredEntitlements: [...PRED_ENTITLEMENTS],
  category: "Predictions",
  availableOn: ["predictions"],
  singleton: true,
  component: PredOdumFocusWidget,
});

registerWidget({
  id: "pred-arb-stream",
  label: "Arb Stream",
  description: "Live prediction market arb opportunities with decay bars and execute actions.",
  icon: Zap,
  minW: 4,
  minH: 4,
  defaultW: 6,
  defaultH: 6,
  requiredEntitlements: [...PRED_ENTITLEMENTS],
  category: "Predictions",
  availableOn: ["predictions"],
  singleton: true,
  component: PredArbStreamWidget,
});

registerWidget({
  id: "pred-arb-closed",
  label: "Closed Arbs",
  description: "Collapsed list of closed or decayed arb opportunities.",
  icon: TrendingDown,
  minW: 3,
  minH: 3,
  defaultW: 6,
  defaultH: 4,
  requiredEntitlements: [...PRED_ENTITLEMENTS],
  category: "Predictions",
  availableOn: ["predictions"],
  singleton: true,
  component: PredArbClosedWidget,
});

registerWidget({
  id: "pred-trade-panel",
  label: "Quick Trade",
  description: "Market selector and trade panel with Kelly stake suggestion.",
  icon: ClipboardPen,
  minW: 4,
  minH: 5,
  defaultW: 6,
  defaultH: 7,
  requiredEntitlements: [...PRED_ENTITLEMENTS],
  category: "Predictions",
  availableOn: ["predictions"],
  singleton: true,
  component: PredTradePanelWidget,
});

registerWidget({
  id: "pred-top-markets",
  label: "Top Markets",
  description: "Top markets by volume as quick-access cards.",
  icon: Flame,
  minW: 3,
  minH: 3,
  defaultW: 6,
  defaultH: 4,
  requiredEntitlements: [...PRED_ENTITLEMENTS],
  category: "Predictions",
  availableOn: ["predictions"],
  singleton: true,
  component: PredTopMarketsWidget,
});

registerWidget({
  id: "pred-recent-fills",
  label: "Recent Trades",
  description: "Recent prediction market fills.",
  icon: CheckCircle2,
  minW: 3,
  minH: 3,
  defaultW: 6,
  defaultH: 4,
  requiredEntitlements: [...PRED_ENTITLEMENTS],
  category: "Predictions",
  availableOn: ["predictions"],
  singleton: true,
  component: PredRecentFillsWidget,
});
