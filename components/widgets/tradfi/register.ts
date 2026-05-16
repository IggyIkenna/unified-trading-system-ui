import { BarChart3, Grid3x3, Landmark, TrendingUp } from "lucide-react";
import { registerPresets } from "../preset-registry";
import { registerWidget } from "../widget-registry";
import { EtfFlowsTradfiWidget, RatesCurveWidget, SectorHeatmapWidget, VolSurfaceTradfiWidget } from "./tradfi-widgets";

/**
 * TradFi widget registry — P4 of the DART cross-asset-group market-data
 * terminal plan. Net-new asset_group surface bootstrapped under the
 * existing trading-common entitlement (no dedicated trading-tradfi domain
 * yet — follow-up).
 *
 * All widgets register on the new /services/trading/tradfi tab (see
 * components/shell/service-tabs.tsx and app/(platform)/services/trading/
 * tradfi/page.tsx).
 */

registerPresets("tradfi", [
  {
    id: "tradfi-default",
    name: "Default",
    tab: "tradfi",
    isPreset: true,
    layouts: [
      { widgetId: "tradfi-rates-curve", instanceId: "tradfi-rates-curve-1", x: 0, y: 0, w: 12, h: 7 },
      { widgetId: "tradfi-vol-surface", instanceId: "tradfi-vol-surface-1", x: 12, y: 0, w: 12, h: 7 },
      { widgetId: "tradfi-etf-flows", instanceId: "tradfi-etf-flows-1", x: 0, y: 7, w: 24, h: 6 },
      { widgetId: "tradfi-sector-heatmap", instanceId: "tradfi-sector-heatmap-1", x: 0, y: 13, w: 24, h: 7 },
    ],
    createdAt: "2026-04-28T00:00:00Z",
    updatedAt: "2026-04-28T00:00:00Z",
  },
]);

registerWidget({
  id: "tradfi-rates-curve",
  label: "US Treasury yield curve",
  description: "FRED-sourced US Treasury yields by maturity (DGS1–DGS30) — term structure XY plot.",
  icon: TrendingUp,
  minW: 6,
  minH: 5,
  defaultW: 12,
  defaultH: 7,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "TRADFI",
  catalogGroup: "TradFi",
  availableOn: ["tradfi", "overview"],
  singleton: false,
  component: RatesCurveWidget,
});

registerWidget({
  id: "tradfi-vol-surface",
  label: "TradFi vol surface",
  description: "Single-underlying options vol surface (Databento OPRA). Wraps the existing VolSurfaceChart.",
  icon: Landmark,
  minW: 6,
  minH: 5,
  defaultW: 12,
  defaultH: 7,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "TRADFI",
  catalogGroup: "TradFi",
  availableOn: ["tradfi", "options", "overview"],
  singleton: false,
  component: VolSurfaceTradfiWidget,
});

registerWidget({
  id: "tradfi-etf-flows",
  label: "ETF flows",
  description: "TradFi ETF inflow/outflow flow chart with cumulative net overlay.",
  icon: BarChart3,
  minW: 12,
  minH: 4,
  defaultW: 24,
  defaultH: 6,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "TRADFI",
  catalogGroup: "TradFi",
  availableOn: ["tradfi", "overview", "markets"],
  singleton: false,
  component: EtfFlowsTradfiWidget,
});

registerWidget({
  id: "tradfi-sector-heatmap",
  label: "Sector heatmap",
  description: "S&P 500 sector %change matrix — diverging colour scale by period.",
  icon: Grid3x3,
  minW: 12,
  minH: 5,
  defaultW: 24,
  defaultH: 7,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "TRADFI",
  catalogGroup: "TradFi",
  availableOn: ["tradfi", "overview", "markets"],
  singleton: false,
  component: SectorHeatmapWidget,
});
