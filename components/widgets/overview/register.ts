import { registerWidget } from "../widget-registry";
import { BarChart3, LineChart, LayoutGrid, Table2, PieChart, Bell, ArrowRightLeft, Server } from "lucide-react";
import { ScopeSummaryWidget } from "./scope-summary-widget";
import { PnLChartWidget } from "./pnl-chart-widget";
import { KPIStripWidget } from "./kpi-strip-widget";
import { StrategyTableWidget } from "./strategy-table-widget";
import { PnLAttributionWidget, AlertsPreviewWidget, RecentFillsWidget, HealthGridWidget } from "./bottom-widgets";

registerWidget({
  id: "scope-summary",
  label: "Scope & Controls",
  description: "Global scope summary with intervention controls and terminal link.",
  icon: LayoutGrid,
  minW: 6,
  minH: 2,
  defaultW: 12,
  defaultH: 2,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["overview"],
  singleton: true,
  component: ScopeSummaryWidget,
});

registerWidget({
  id: "pnl-chart",
  label: "P&L / NAV / Exposure Charts",
  description: "Live vs batch time series comparison with drift analysis.",
  icon: LineChart,
  minW: 4,
  minH: 3,
  defaultW: 12,
  defaultH: 4,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["overview"],
  singleton: true,
  component: PnLChartWidget,
});

registerWidget({
  id: "kpi-strip",
  label: "Key Metrics",
  description: "P&L, exposure, margin, live strategies, and alerts at a glance.",
  icon: BarChart3,
  minW: 6,
  minH: 1,
  defaultW: 12,
  defaultH: 2,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["overview"],
  singleton: true,
  component: KPIStripWidget,
});

registerWidget({
  id: "strategy-table",
  label: "Strategy Performance",
  description: "Filterable strategy table grouped by asset class with real-time P&L.",
  icon: Table2,
  minW: 6,
  minH: 3,
  defaultW: 12,
  defaultH: 4,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["overview"],
  singleton: true,
  component: StrategyTableWidget,
});

registerWidget({
  id: "pnl-attribution",
  label: "P&L Attribution",
  description: "Breakdown of P&L by factor: funding, carry, basis, delta, etc.",
  icon: PieChart,
  minW: 3,
  minH: 2,
  defaultW: 3,
  defaultH: 3,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["overview"],
  singleton: true,
  component: PnLAttributionWidget,
});

registerWidget({
  id: "alerts-preview",
  label: "Alerts",
  description: "Recent critical and high alerts with severity indicators.",
  icon: Bell,
  minW: 3,
  minH: 2,
  defaultW: 3,
  defaultH: 3,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["overview"],
  singleton: true,
  component: AlertsPreviewWidget,
});

registerWidget({
  id: "recent-fills",
  label: "Recent Fills",
  description: "Latest order fills with side, instrument, and status.",
  icon: ArrowRightLeft,
  minW: 3,
  minH: 2,
  defaultW: 3,
  defaultH: 3,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["overview"],
  singleton: true,
  component: RecentFillsWidget,
});

registerWidget({
  id: "health-grid",
  label: "System Health",
  description: "Service health grid showing status of platform services.",
  icon: Server,
  minW: 3,
  minH: 2,
  defaultW: 3,
  defaultH: 3,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["overview"],
  singleton: true,
  component: HealthGridWidget,
});
