import { Activity, BarChart3, LineChart, TrendingUp } from "lucide-react";
import { registerPresets } from "../preset-registry";
import { registerWidget } from "../widget-registry";
import { PnlByClientWidget } from "./pnl-by-client-widget";
import { PnlFactorDrilldownWidget } from "./pnl-factor-drilldown-widget";
import { PnlTimeSeriesWidget } from "./pnl-time-series-widget";
import { PnlWaterfallWidget } from "./pnl-waterfall-widget";

// Controls are now embedded in the Waterfall widget header — no standalone
// pnl-controls widget. The PnLDataProvider still owns all shared state
// (date range, data mode, etc.) so every other widget reacts to changes
// made inside the waterfall.

registerPresets("pnl", [
  {
    id: "pnl-default",
    name: "Default",
    tab: "pnl",
    isPreset: true,
    layouts: [
      // Waterfall is taller to accommodate its embedded controls bar
      { widgetId: "pnl-waterfall", instanceId: "pnl-waterfall-1", x: 0, y: 0, w: 7, h: 11 },
      { widgetId: "pnl-by-client", instanceId: "pnl-by-client-1", x: 7, y: 0, w: 5, h: 11 },
      { widgetId: "pnl-factor-drilldown", instanceId: "pnl-factor-drilldown-1", x: 0, y: 11, w: 12, h: 5 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "pnl-time-series",
    name: "Time Series",
    tab: "pnl",
    isPreset: true,
    layouts: [
      { widgetId: "pnl-waterfall", instanceId: "pnl-waterfall-ts", x: 0, y: 0, w: 7, h: 11 },
      { widgetId: "pnl-by-client", instanceId: "pnl-by-client-ts", x: 7, y: 0, w: 5, h: 11 },
      { widgetId: "pnl-time-series", instanceId: "pnl-time-series-ts", x: 0, y: 11, w: 12, h: 7 },
      { widgetId: "pnl-factor-drilldown", instanceId: "pnl-factor-drilldown-ts", x: 0, y: 18, w: 12, h: 5 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "pnl-full",
    name: "Full",
    tab: "pnl",
    isPreset: true,
    layouts: [
      { widgetId: "pnl-waterfall", instanceId: "pnl-waterfall-full", x: 0, y: 0, w: 7, h: 11 },
      { widgetId: "pnl-by-client", instanceId: "pnl-by-client-full", x: 7, y: 0, w: 5, h: 11 },
      { widgetId: "pnl-time-series", instanceId: "pnl-time-series-full", x: 0, y: 11, w: 12, h: 7 },
      { widgetId: "pnl-factor-drilldown", instanceId: "pnl-factor-drilldown-full", x: 0, y: 18, w: 12, h: 5 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);

const PNL_ENTITLEMENTS = [{ domain: "trading-common" as const, tier: "basic" as const }];

registerWidget({
  id: "pnl-waterfall",
  label: "P&L Waterfall",
  description: "Controls, structural P&L, factor attribution with drill-down, DeFi breakdown, residual, net total.",
  icon: BarChart3,
  minW: 4,
  minH: 6,
  defaultW: 7,
  defaultH: 11,
  requiredEntitlements: [...PNL_ENTITLEMENTS],
  category: "P&L",
  availableOn: ["pnl"],
  singleton: true,
  component: PnlWaterfallWidget,
});

registerWidget({
  id: "pnl-time-series",
  label: "P&L Time Series",
  description:
    "Multi-line chart: one line per factor showing cumulative P&L over time. Includes backtest vs live view.",
  icon: LineChart,
  minW: 4,
  minH: 4,
  defaultW: 12,
  defaultH: 7,
  requiredEntitlements: [...PNL_ENTITLEMENTS],
  category: "P&L",
  availableOn: ["pnl"],
  singleton: true,
  component: PnlTimeSeriesWidget,
});

registerWidget({
  id: "pnl-by-client",
  label: "P&L by Client",
  description: "Client-level P&L with org, strategy count, and change percent.",
  icon: TrendingUp,
  minW: 3,
  minH: 3,
  defaultW: 5,
  defaultH: 11,
  requiredEntitlements: [...PNL_ENTITLEMENTS],
  category: "P&L",
  availableOn: ["pnl"],
  singleton: true,
  component: PnlByClientWidget,
});

registerWidget({
  id: "pnl-factor-drilldown",
  label: "Factor Breakdown",
  description: "Factor summary table — click any factor for per-strategy attribution and mini time series.",
  icon: Activity,
  minW: 4,
  minH: 3,
  defaultW: 12,
  defaultH: 5,
  requiredEntitlements: [...PNL_ENTITLEMENTS],
  category: "P&L",
  availableOn: ["pnl"],
  singleton: true,
  component: PnlFactorDrilldownWidget,
});
