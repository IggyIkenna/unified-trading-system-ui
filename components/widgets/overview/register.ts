import { ArrowRightLeft, BarChart3, Bell, LayoutGrid, LineChart, PieChart, Server, Table2 } from "lucide-react";
import { registerPresets } from "../preset-registry";
import { registerWidget } from "../widget-registry";
import { AlertsPreviewWidget, HealthGridWidget, PnLAttributionWidget, RecentFillsWidget } from "./bottom-widgets";
import { KPIStripWidget } from "./kpi-strip-widget";
import { PnLChartWidget } from "./pnl-chart-widget";
import { ScopeSummaryWidget } from "./scope-summary-widget";
import { StrategyTableWidget } from "./strategy-table-widget";

registerPresets("overview", [
  {
    id: "overview-default",
    name: "Default",
    tab: "overview",
    isPreset: true,
    layouts: [
      { widgetId: "scope-summary", instanceId: "scope-summary-1", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "pnl-chart", instanceId: "pnl-chart-1", x: 0, y: 2, w: 12, h: 4 },
      { widgetId: "kpi-strip", instanceId: "kpi-strip-1", x: 0, y: 6, w: 12, h: 2 },
      { widgetId: "strategy-table", instanceId: "strategy-table-1", x: 0, y: 8, w: 12, h: 4 },
      { widgetId: "pnl-attribution", instanceId: "pnl-attribution-1", x: 0, y: 12, w: 3, h: 3 },
      { widgetId: "alerts-preview", instanceId: "alerts-preview-1", x: 3, y: 12, w: 3, h: 3 },
      { widgetId: "recent-fills", instanceId: "recent-fills-1", x: 6, y: 12, w: 3, h: 3 },
      { widgetId: "health-grid", instanceId: "health-grid-1", x: 9, y: 12, w: 3, h: 3 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "overview-full",
    name: "Full",
    tab: "overview",
    isPreset: true,
    layouts: [
      { widgetId: "scope-summary", instanceId: "scope-summary-full", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "kpi-strip", instanceId: "kpi-strip-full", x: 0, y: 2, w: 12, h: 2 },
      { widgetId: "pnl-chart", instanceId: "pnl-chart-full", x: 0, y: 4, w: 12, h: 4 },
      { widgetId: "strategy-table", instanceId: "strategy-table-full", x: 0, y: 8, w: 12, h: 4 },
      { widgetId: "pnl-attribution", instanceId: "pnl-attribution-full", x: 0, y: 12, w: 3, h: 3 },
      { widgetId: "alerts-preview", instanceId: "alerts-preview-full", x: 3, y: 12, w: 3, h: 3 },
      { widgetId: "recent-fills", instanceId: "recent-fills-full", x: 6, y: 12, w: 3, h: 3 },
      { widgetId: "health-grid", instanceId: "health-grid-full", x: 9, y: 12, w: 3, h: 3 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);

registerWidget({
  id: "scope-summary",
  label: "Scope & Controls",
  description: "Global scope summary with intervention controls and terminal link.",
  icon: LayoutGrid,
  minW: 4,
  minH: 1,
  defaultW: 12,
  defaultH: 2,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Overview",
  availableOn: ["overview"],
  singleton: true,
  component: ScopeSummaryWidget,
});

registerWidget({
  id: "pnl-chart",
  label: "P&L / NAV / Exposure Charts",
  description: "Live vs batch time series comparison with drift analysis.",
  icon: LineChart,
  minW: 3,
  minH: 2,
  defaultW: 12,
  defaultH: 4,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Overview",
  availableOn: ["overview"],
  singleton: true,
  component: PnLChartWidget,
});

registerWidget({
  id: "kpi-strip",
  label: "Key Metrics",
  description: "P&L, exposure, margin, live strategies, and alerts at a glance.",
  icon: BarChart3,
  minW: 3,
  minH: 1,
  defaultW: 12,
  defaultH: 2,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Overview",
  availableOn: ["overview"],
  singleton: true,
  component: KPIStripWidget,
});

registerWidget({
  id: "strategy-table",
  label: "Strategy Performance",
  description: "Filterable strategy table grouped by asset class with real-time P&L.",
  icon: Table2,
  minW: 4,
  minH: 2,
  defaultW: 12,
  defaultH: 4,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Overview",
  availableOn: ["overview"],
  singleton: true,
  component: StrategyTableWidget,
});

registerWidget({
  id: "pnl-attribution",
  label: "P&L Attribution",
  description: "Breakdown of P&L by factor: funding, carry, basis, delta, etc.",
  icon: PieChart,
  minW: 2,
  minH: 2,
  defaultW: 3,
  defaultH: 3,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Overview",
  availableOn: ["overview"],
  singleton: true,
  component: PnLAttributionWidget,
});

registerWidget({
  id: "alerts-preview",
  label: "Alerts",
  description: "Recent critical and high alerts with severity indicators.",
  icon: Bell,
  minW: 2,
  minH: 2,
  defaultW: 3,
  defaultH: 3,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Overview",
  availableOn: ["overview"],
  singleton: true,
  component: AlertsPreviewWidget,
});

registerWidget({
  id: "recent-fills",
  label: "Recent Fills",
  description: "Latest order fills with side, instrument, and status.",
  icon: ArrowRightLeft,
  minW: 2,
  minH: 2,
  defaultW: 3,
  defaultH: 3,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Overview",
  availableOn: ["overview"],
  singleton: true,
  component: RecentFillsWidget,
});

registerWidget({
  id: "health-grid",
  label: "System Health",
  description: "Service health grid showing status of platform services.",
  icon: Server,
  minW: 2,
  minH: 2,
  defaultW: 3,
  defaultH: 3,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Overview",
  availableOn: ["overview"],
  singleton: true,
  component: HealthGridWidget,
});
