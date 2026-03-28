import { registerWidget } from "../widget-registry";
import { registerPresets } from "../preset-registry";
import { Activity, BarChart3, FileText, LayoutGrid, LineChart, TrendingUp } from "lucide-react";
import { PnlControlsWidget } from "./pnl-controls-widget";
import { PnlWaterfallWidget } from "./pnl-waterfall-widget";
import { PnlTimeSeriesWidget } from "./pnl-time-series-widget";
import { PnlByClientWidget } from "./pnl-by-client-widget";
import { PnlFactorDrilldownWidget } from "./pnl-factor-drilldown-widget";
import { PnlReportButtonWidget } from "./pnl-report-button-widget";

registerPresets("pnl", [
  {
    id: "pnl-default",
    name: "Default",
    tab: "pnl",
    isPreset: true,
    layouts: [
      { widgetId: "pnl-controls", instanceId: "pnl-controls-1", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "pnl-waterfall", instanceId: "pnl-waterfall-1", x: 0, y: 2, w: 7, h: 8 },
      { widgetId: "pnl-by-client", instanceId: "pnl-by-client-1", x: 7, y: 2, w: 5, h: 8 },
      { widgetId: "pnl-factor-drilldown", instanceId: "pnl-factor-drilldown-1", x: 0, y: 10, w: 12, h: 5 },
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
      { widgetId: "pnl-controls", instanceId: "pnl-controls-1", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "pnl-time-series", instanceId: "pnl-time-series-1", x: 0, y: 2, w: 12, h: 5 },
      { widgetId: "pnl-waterfall", instanceId: "pnl-waterfall-1", x: 0, y: 7, w: 7, h: 6 },
      { widgetId: "pnl-by-client", instanceId: "pnl-by-client-1", x: 7, y: 7, w: 5, h: 6 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);

const PNL_ENTITLEMENTS = ["execution-basic", "execution-full"] as const;

registerWidget({
  id: "pnl-controls",
  label: "P&L Controls",
  description: "View mode, live/batch, date range, group-by, data mode badge.",
  icon: LayoutGrid,
  minW: 4,
  minH: 2,
  defaultW: 12,
  defaultH: 2,
  requiredEntitlements: [...PNL_ENTITLEMENTS],
  category: "P&L",
  availableOn: ["pnl"],
  singleton: true,
  component: PnlControlsWidget,
});

registerWidget({
  id: "pnl-waterfall",
  label: "P&L Waterfall",
  description: "Structural P&L, factor bars with drill-down, residual, net total.",
  icon: BarChart3,
  minW: 4,
  minH: 4,
  defaultW: 7,
  defaultH: 8,
  requiredEntitlements: [...PNL_ENTITLEMENTS],
  category: "P&L",
  availableOn: ["pnl"],
  singleton: true,
  component: PnlWaterfallWidget,
});

registerWidget({
  id: "pnl-time-series",
  label: "P&L Time Series",
  description: "Stacked area chart of ten factors over time.",
  icon: LineChart,
  minW: 4,
  minH: 3,
  defaultW: 12,
  defaultH: 5,
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
  defaultH: 8,
  requiredEntitlements: [...PNL_ENTITLEMENTS],
  category: "P&L",
  availableOn: ["pnl"],
  singleton: true,
  component: PnlByClientWidget,
});

registerWidget({
  id: "pnl-factor-drilldown",
  label: "Factor Breakdown",
  description: "Per-strategy breakdown for the selected factor plus mini time series.",
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

registerWidget({
  id: "pnl-report-button",
  label: "P&L Report",
  description: "Placeholder CTA to generate a P&L report.",
  icon: FileText,
  minW: 2,
  minH: 1,
  defaultW: 2,
  defaultH: 1,
  requiredEntitlements: [...PNL_ENTITLEMENTS],
  category: "P&L",
  availableOn: ["pnl"],
  singleton: true,
  component: PnlReportButtonWidget,
});
