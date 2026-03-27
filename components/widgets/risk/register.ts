import { registerWidget } from "../widget-registry";
import { registerPresets } from "../preset-registry";
import {
  Shield,
  Zap,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Activity,
  Wallet,
  Clock,
  Target,
  LineChart,
} from "lucide-react";
import { RiskKpiStripWidget } from "./risk-kpi-strip-widget";
import { RiskStrategyHeatmapWidget } from "./risk-strategy-heatmap-widget";
import { RiskUtilizationWidget } from "./risk-utilization-widget";
import { RiskVarChartWidget } from "./risk-var-chart-widget";
import { RiskStressTableWidget } from "./risk-stress-table-widget";
import { RiskExposureAttributionWidget } from "./risk-exposure-attribution-widget";
import { RiskGreeksSummaryWidget } from "./risk-greeks-summary-widget";
import { RiskMarginWidget } from "./risk-margin-widget";
import { RiskTermStructureWidget } from "./risk-term-structure-widget";
import { RiskLimitsHierarchyWidget } from "./risk-limits-hierarchy-widget";
import { RiskWhatIfSliderWidget } from "./risk-what-if-slider-widget";
import { RiskCircuitBreakersWidget } from "./risk-circuit-breakers-widget";
import { RiskCorrelationHeatmapWidget } from "./risk-correlation-heatmap-widget";

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

registerPresets("risk", [
  {
    id: "risk-cro-briefing",
    name: "CRO Morning Briefing",
    tab: "risk",
    isPreset: true,
    layouts: [
      { widgetId: "risk-kpi-strip", instanceId: "risk-kpi-1", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "risk-strategy-heatmap", instanceId: "risk-heatmap-1", x: 0, y: 2, w: 12, h: 4 },
      { widgetId: "risk-utilization", instanceId: "risk-util-1", x: 0, y: 6, w: 6, h: 3 },
      { widgetId: "risk-var-chart", instanceId: "risk-var-1", x: 6, y: 6, w: 6, h: 3 },
      { widgetId: "risk-stress-table", instanceId: "risk-stress-1", x: 0, y: 9, w: 12, h: 4 },
      { widgetId: "risk-exposure-attribution", instanceId: "risk-exposure-1", x: 0, y: 13, w: 12, h: 5 },
      { widgetId: "risk-greeks-summary", instanceId: "risk-greeks-1", x: 0, y: 18, w: 12, h: 5 },
      { widgetId: "risk-margin", instanceId: "risk-margin-1", x: 0, y: 23, w: 6, h: 5 },
      { widgetId: "risk-term-structure", instanceId: "risk-term-1", x: 6, y: 23, w: 6, h: 4 },
      { widgetId: "risk-what-if-slider", instanceId: "risk-whatif-1", x: 0, y: 28, w: 12, h: 2 },
      { widgetId: "risk-circuit-breakers", instanceId: "risk-cb-1", x: 0, y: 30, w: 6, h: 3 },
      { widgetId: "risk-correlation-heatmap", instanceId: "risk-corr-1", x: 6, y: 30, w: 6, h: 4 },
      { widgetId: "risk-limits-hierarchy", instanceId: "risk-limits-1", x: 0, y: 34, w: 12, h: 5 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "risk-quick",
    name: "Quick Risk",
    tab: "risk",
    isPreset: true,
    layouts: [
      { widgetId: "risk-kpi-strip", instanceId: "risk-kpi-1", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "risk-strategy-heatmap", instanceId: "risk-heatmap-1", x: 0, y: 2, w: 12, h: 4 },
      { widgetId: "risk-var-chart", instanceId: "risk-var-1", x: 0, y: 6, w: 6, h: 4 },
      { widgetId: "risk-margin", instanceId: "risk-margin-1", x: 6, y: 6, w: 6, h: 4 },
      { widgetId: "risk-circuit-breakers", instanceId: "risk-cb-1", x: 0, y: 10, w: 12, h: 3 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);

// ---------------------------------------------------------------------------
// Widget registrations
// ---------------------------------------------------------------------------

registerWidget({
  id: "risk-kpi-strip",
  label: "Risk KPIs",
  description: "9 metrics: P&L, exposure, margin%, VaR95, ES95, alerts, VaR99, ES99, kill switches.",
  icon: Shield,
  minW: 4,
  minH: 1,
  defaultW: 12,
  defaultH: 2,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["risk"],
  singleton: true,
  component: RiskKpiStripWidget,
});

registerWidget({
  id: "risk-strategy-heatmap",
  label: "Strategy Heatmap",
  description: "Strategy risk status with CB trip/reset, scale, and kill actions.",
  icon: Zap,
  minW: 6,
  minH: 3,
  defaultW: 12,
  defaultH: 4,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["risk"],
  singleton: true,
  component: RiskStrategyHeatmapWidget,
});

registerWidget({
  id: "risk-utilization",
  label: "Highest Utilization",
  description: "Top N limits ranked by utilization with limit bars.",
  icon: BarChart3,
  minW: 4,
  minH: 2,
  defaultW: 12,
  defaultH: 3,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["risk"],
  singleton: true,
  component: RiskUtilizationWidget,
});

registerWidget({
  id: "risk-var-chart",
  label: "Component VaR",
  description: "Horizontal bar chart: marginal VaR contribution by position.",
  icon: BarChart3,
  minW: 4,
  minH: 3,
  defaultW: 12,
  defaultH: 4,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["risk"],
  singleton: true,
  component: RiskVarChartWidget,
});

registerWidget({
  id: "risk-stress-table",
  label: "Stress Scenarios",
  description: "Historical stress scenario table with multiplier, P&L, breaches, and on-demand stress test.",
  icon: AlertTriangle,
  minW: 6,
  minH: 3,
  defaultW: 12,
  defaultH: 4,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["risk"],
  singleton: true,
  component: RiskStressTableWidget,
});

registerWidget({
  id: "risk-exposure-attribution",
  label: "Exposure Attribution",
  description: "Grouped exposure table (first/second/structural/operational/domain) with time series.",
  icon: TrendingUp,
  minW: 6,
  minH: 3,
  defaultW: 12,
  defaultH: 5,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["risk"],
  singleton: true,
  component: RiskExposureAttributionWidget,
});

registerWidget({
  id: "risk-greeks-summary",
  label: "Portfolio Greeks",
  description: "5 Greek cards, per-position table, time series, and second-order risks.",
  icon: Activity,
  minW: 4,
  minH: 2,
  defaultW: 12,
  defaultH: 5,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["risk"],
  singleton: true,
  component: RiskGreeksSummaryWidget,
});

registerWidget({
  id: "risk-margin",
  label: "Margin & Health",
  description: "CeFi margin bars, SPAN summary, DeFi HF, distance to liquidation.",
  icon: Wallet,
  minW: 4,
  minH: 3,
  defaultW: 6,
  defaultH: 5,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["risk"],
  singleton: true,
  component: RiskMarginWidget,
});

registerWidget({
  id: "risk-term-structure",
  label: "Term Structure",
  description: "Stacked bar chart: exposure by maturity bucket.",
  icon: Clock,
  minW: 4,
  minH: 3,
  defaultW: 6,
  defaultH: 4,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["risk"],
  singleton: true,
  component: RiskTermStructureWidget,
});

registerWidget({
  id: "risk-limits-hierarchy",
  label: "Limits Hierarchy",
  description: "Interactive 6-level hierarchy tree table + all limits detail.",
  icon: AlertTriangle,
  minW: 6,
  minH: 3,
  defaultW: 12,
  defaultH: 5,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["risk"],
  singleton: true,
  component: RiskLimitsHierarchyWidget,
});

registerWidget({
  id: "risk-what-if-slider",
  label: "What-If Slider",
  description: "BTC price shock slider with estimated PnL via delta + gamma approximation.",
  icon: Target,
  minW: 4,
  minH: 2,
  defaultW: 12,
  defaultH: 2,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["risk"],
  singleton: true,
  component: RiskWhatIfSliderWidget,
});

registerWidget({
  id: "risk-circuit-breakers",
  label: "Circuit Breaker Status",
  description: "Per-venue circuit breaker cards with status badges.",
  icon: Zap,
  minW: 4,
  minH: 2,
  defaultW: 12,
  defaultH: 3,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["risk"],
  singleton: true,
  component: RiskCircuitBreakersWidget,
});

registerWidget({
  id: "risk-correlation-heatmap",
  label: "Correlation Heatmap",
  description: "Asset correlation matrix heatmap (self-contained, dynamic import).",
  icon: LineChart,
  minW: 4,
  minH: 3,
  defaultW: 12,
  defaultH: 4,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["risk"],
  singleton: true,
  component: RiskCorrelationHeatmapWidget,
});
