import { Activity, AlertTriangle, BarChart2, BookOpen, Gauge, LayoutGrid, LineChart, Settings, TrendingUp } from "lucide-react";
import { registerPresets } from "../preset-registry";
import { registerWidget } from "../widget-registry";
import { ActiveLPDashboardWidget } from "./active-lp-dashboard-widget";
import { CeFiStrategyConfigWidget } from "./cefi-strategy-config-widget";
import { CommodityRegimeWidget } from "./commodity-regime-widget";
import { LendingArbDashboardWidget } from "./lending-arb-dashboard-widget";
import { LiquidationMonitorWidget } from "./liquidation-monitor-widget";
import { StrategiesCatalogueWidget } from "./strategies-catalogue-widget";
import { StrategyFamilyBrowserWidget } from "./strategy-family-browser-widget";
import { StrategiesGridLinkWidget } from "./strategies-grid-link-widget";
import { StrategiesKpiWidget } from "./strategies-kpi-widget";

registerPresets("strategies", [
  {
    id: "strategies-default",
    name: "Default",
    tab: "strategies",
    isPreset: true,
    layouts: [
      { widgetId: "strategies-kpi-strip", instanceId: "strategies-kpi-strip-1", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "strategies-catalogue", instanceId: "strategies-catalogue-1", x: 0, y: 2, w: 12, h: 9 },
      { widgetId: "strategies-grid-link", instanceId: "strategies-grid-link-1", x: 0, y: 11, w: 12, h: 1 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "strategies-full",
    name: "Full",
    tab: "strategies",
    isPreset: true,
    layouts: [
      { widgetId: "strategies-kpi-strip", instanceId: "strategies-kpi-strip-full", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "strategies-catalogue", instanceId: "strategies-catalogue-full", x: 0, y: 2, w: 8, h: 9 },
      { widgetId: "cefi-strategy-config", instanceId: "cefi-strategy-config-full", x: 8, y: 2, w: 4, h: 9 },
      { widgetId: "strategy-family-browser", instanceId: "strategy-family-browser-full", x: 0, y: 11, w: 12, h: 8 },
      { widgetId: "strategies-grid-link", instanceId: "strategies-grid-link-full", x: 0, y: 19, w: 12, h: 1 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);

registerWidget({
  id: "strategies-kpi-strip",
  label: "Strategy Summary",
  description: "Active count, total AUM, total P&L, MTD P&L with execution mode badge.",
  icon: Activity,
  minW: 4,
  minH: 1,
  defaultW: 12,
  defaultH: 2,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Strategies",
  availableOn: ["strategies"],
  singleton: true,
  component: StrategiesKpiWidget,
});

registerWidget({
  id: "strategies-catalogue",
  label: "Strategy List",
  description: "Grouped card grid with integrated filters, performance metrics, sparklines, and action links.",
  icon: LayoutGrid,
  minW: 6,
  minH: 6,
  defaultW: 12,
  defaultH: 9,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Strategies",
  availableOn: ["strategies"],
  singleton: true,
  component: StrategiesCatalogueWidget,
});

registerWidget({
  id: "strategies-grid-link",
  label: "Batch Grid Link",
  description: "CTA to open DimensionalGrid for batch analysis.",
  icon: LineChart,
  minW: 4,
  minH: 1,
  defaultW: 12,
  defaultH: 1,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Strategies",
  availableOn: ["strategies"],
  singleton: true,
  component: StrategiesGridLinkWidget,
});

registerWidget({
  id: "cefi-strategy-config",
  label: "CeFi / TradFi Strategy Config",
  description:
    "Configure CeFi, TradFi, Options, and Prediction strategies — momentum, mean-rev, ML, stat-arb, cross-exchange, market-making, commodity regime, event macro.",
  icon: Settings,
  minW: 3,
  minH: 4,
  defaultW: 4,
  defaultH: 6,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Strategies",
  availableOn: ["strategies"],
  singleton: true,
  component: CeFiStrategyConfigWidget,
});

registerWidget({
  id: "lending-arb-dashboard",
  label: "Lending Arb Dashboard",
  description: "Cross-protocol lending rate comparison with spread and utilization tracking across Aave, Morpho, Compound, and Kamino.",
  icon: TrendingUp,
  minW: 4,
  minH: 4,
  defaultW: 6,
  defaultH: 6,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Strategies",
  availableOn: ["strategies"],
  singleton: true,
  component: LendingArbDashboardWidget,
});

registerWidget({
  id: "liquidation-monitor",
  label: "Liquidation Monitor",
  description: "Real-time cascade risk monitor showing at-risk DeFi positions, health factors, and liquidation price proximity.",
  icon: AlertTriangle,
  minW: 4,
  minH: 4,
  defaultW: 6,
  defaultH: 6,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Risk",
  availableOn: ["strategies"],
  singleton: true,
  component: LiquidationMonitorWidget,
});

registerWidget({
  id: "active-lp-dashboard",
  label: "Active LP Dashboard",
  description: "Concentrated liquidity position tracker with TVL, fees, impermanent loss, and range status monitoring.",
  icon: BarChart2,
  minW: 4,
  minH: 4,
  defaultW: 6,
  defaultH: 6,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Strategies",
  availableOn: ["strategies"],
  singleton: true,
  component: ActiveLPDashboardWidget,
});

registerWidget({
  id: "commodity-regime",
  label: "Commodity Regime",
  description: "Regime detection dashboard with factor scores, signals, and active commodity positions with P&L tracking.",
  icon: Gauge,
  minW: 4,
  minH: 4,
  defaultW: 6,
  defaultH: 6,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Strategies",
  availableOn: ["strategies"],
  singleton: true,
  component: CommodityRegimeWidget,
});

registerWidget({
  id: "strategy-family-browser",
  label: "Strategy Family Browser",
  description: "Browse all 65+ strategy types across DeFi, CeFi, TradFi, and Sports — grouped by family with configurable parameters.",
  icon: BookOpen,
  minW: 6,
  minH: 5,
  defaultW: 12,
  defaultH: 8,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Strategies",
  availableOn: ["strategies"],
  singleton: true,
  component: StrategyFamilyBrowserWidget,
});
