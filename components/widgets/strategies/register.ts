import {
  Activity,
  AlertTriangle,
  BarChart2,
  BookOpen,
  Gauge,
  LayoutGrid,
  LineChart,
  Settings,
  TrendingUp,
} from "lucide-react";
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
      { widgetId: "strategies-kpi-strip", instanceId: "strategies-kpi-strip-1", x: 0, y: 0, w: 24, h: 1 },
      { widgetId: "strategies-catalogue", instanceId: "strategies-catalogue-1", x: 0, y: 1, w: 24, h: 9 },
      { widgetId: "strategies-grid-link", instanceId: "strategies-grid-link-1", x: 0, y: 10, w: 24, h: 1 },
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
      // Row 1: KPI strip (full width)
      { widgetId: "strategies-kpi-strip", instanceId: "strategies-kpi-strip-full", x: 0, y: 0, w: 24, h: 1 },
      // Row 2: Strategy list + config form, same height
      { widgetId: "strategies-catalogue", instanceId: "strategies-catalogue-full", x: 0, y: 1, w: 16, h: 9 },
      { widgetId: "cefi-strategy-config", instanceId: "cefi-strategy-config-full", x: 16, y: 1, w: 8, h: 9 },
      // Row 3: Family browser (full width)
      { widgetId: "strategy-family-browser", instanceId: "strategy-family-browser-full", x: 0, y: 10, w: 24, h: 8 },
      // Row 4: Two DeFi dashboards, same height
      { widgetId: "lending-arb-dashboard", instanceId: "lending-arb-dashboard-full", x: 0, y: 18, w: 12, h: 6 },
      { widgetId: "liquidation-monitor", instanceId: "liquidation-monitor-full", x: 12, y: 18, w: 12, h: 6 },
      // Row 5: LP dashboard + commodity regime, same height (pair to sum to 24)
      { widgetId: "active-lp-dashboard", instanceId: "active-lp-dashboard-full", x: 0, y: 24, w: 12, h: 6 },
      { widgetId: "commodity-regime", instanceId: "commodity-regime-full", x: 12, y: 24, w: 12, h: 6 },
      // Row 6: Grid link CTA (full width)
      { widgetId: "strategies-grid-link", instanceId: "strategies-grid-link-full", x: 0, y: 30, w: 24, h: 1 },
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
  minW: 8,
  minH: 1,
  defaultW: 24,
  defaultH: 1,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
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
  minW: 12,
  minH: 6,
  defaultW: 24,
  defaultH: 9,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
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
  minW: 8,
  minH: 1,
  defaultW: 24,
  defaultH: 1,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Strategies",
  availableOn: ["strategies"],
  singleton: true,
  component: StrategiesGridLinkWidget,
});

registerWidget({
  id: "cefi-strategy-config",
  label: "CeFi / TradFi Strategy Config",
  description:
    "Configure CeFi, TradFi, Options, and Prediction strategies: momentum, mean-rev, ML, stat-arb, cross-exchange, market-making, commodity regime, event macro.",
  icon: Settings,
  minW: 6,
  minH: 7,
  defaultW: 8,
  defaultH: 9,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Strategies",
  availableOn: ["strategies"],
  singleton: true,
  component: CeFiStrategyConfigWidget,
});

registerWidget({
  id: "lending-arb-dashboard",
  label: "Lending Arb Dashboard",
  description:
    "Cross-protocol lending rate comparison with spread and utilization tracking across Aave, Morpho, Compound, and Kamino.",
  icon: TrendingUp,
  minW: 8,
  minH: 4,
  defaultW: 12,
  defaultH: 6,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Strategies",
  availableOn: ["strategies", "defi", "overview"],
  singleton: true,
  component: LendingArbDashboardWidget,
});

registerWidget({
  id: "liquidation-monitor",
  label: "Liquidation Monitor",
  description:
    "Real-time cascade risk monitor showing at-risk DeFi positions, health factors, and liquidation price proximity.",
  icon: AlertTriangle,
  minW: 8,
  minH: 4,
  defaultW: 12,
  defaultH: 6,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Strategies",
  availableOn: ["strategies", "defi", "risk"],
  singleton: true,
  component: LiquidationMonitorWidget,
});

registerWidget({
  id: "active-lp-dashboard",
  label: "Active LP Dashboard",
  description: "Concentrated liquidity position tracker with TVL, fees, impermanent loss, and range status monitoring.",
  icon: BarChart2,
  minW: 8,
  minH: 4,
  defaultW: 12,
  defaultH: 6,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Strategies",
  availableOn: ["strategies", "defi"],
  singleton: true,
  component: ActiveLPDashboardWidget,
});

registerWidget({
  id: "commodity-regime",
  label: "Commodity Regime",
  description:
    "Regime detection dashboard with factor scores, signals, and active commodity positions with P&L tracking.",
  icon: Gauge,
  minW: 8,
  minH: 4,
  defaultW: 12,
  defaultH: 6,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Strategies",
  availableOn: ["strategies", "overview"],
  singleton: true,
  component: CommodityRegimeWidget,
});

registerWidget({
  id: "strategy-family-browser",
  label: "Strategy Family Browser",
  description:
    "Browse all 65+ strategy types across DeFi, CeFi, TradFi, and Sports: grouped by family with configurable parameters.",
  icon: BookOpen,
  minW: 12,
  minH: 5,
  defaultW: 24,
  defaultH: 8,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Strategies",
  availableOn: ["strategies"],
  singleton: true,
  component: StrategyFamilyBrowserWidget,
});
