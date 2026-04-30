import { BarChart3, Grid3X3, Settings2, Star, Zap } from "lucide-react";
import { registerPresets } from "../preset-registry";
import { registerWidget } from "../widget-registry";
import { OptionsChainWidget } from "./options-chain-widget";
import { OptionsControlBarWidget } from "./options-control-bar-widget";
import { OptionsFuturesTableWidget } from "./options-futures-table-widget";
import { OptionsGreekSurfaceWidget } from "./options-greek-surface-widget";
import { OptionsStrategiesWidget } from "./options-strategies-widget";
import { OptionsWatchlistWidget } from "./options-watchlist-widget";

registerPresets("options", [
  {
    id: "options-default",
    name: "Default",
    tab: "options",
    isPreset: true,
    layouts: [
      { widgetId: "options-control-bar", instanceId: "options-control-bar-1", x: 0, y: 0, w: 24, h: 1 },
      // Row 1 (y=1, h=8): watchlist | chain | greek surface — all same height, no gap
      { widgetId: "options-watchlist", instanceId: "options-watchlist-1", x: 0, y: 1, w: 6, h: 8 },
      { widgetId: "options-chain", instanceId: "options-chain-1", x: 6, y: 1, w: 12, h: 8 },
      { widgetId: "options-greek-surface", instanceId: "options-greek-surface-1", x: 18, y: 1, w: 6, h: 8 },
      // Row 2 (y=9): futures table full width
      { widgetId: "futures-table", instanceId: "futures-table-1", x: 0, y: 9, w: 24, h: 5 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "options-strategies-preset",
    name: "Strategies & scenario",
    tab: "options",
    isPreset: true,
    layouts: [
      { widgetId: "options-control-bar", instanceId: "options-control-bar-2", x: 0, y: 0, w: 24, h: 1 },
      { widgetId: "options-strategies", instanceId: "options-strategies-1", x: 0, y: 1, w: 24, h: 7 },
      { widgetId: "options-chain", instanceId: "options-chain-2", x: 0, y: 8, w: 24, h: 5 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "options-full",
    name: "Full",
    tab: "options",
    isPreset: true,
    layouts: [
      { widgetId: "options-control-bar", instanceId: "options-control-bar-full", x: 0, y: 0, w: 24, h: 1 },
      // Row 1 (y=1, h=10): watchlist | chain — same height, no bottom gap
      { widgetId: "options-watchlist", instanceId: "options-watchlist-full", x: 0, y: 1, w: 6, h: 10 },
      { widgetId: "options-chain", instanceId: "options-chain-full", x: 6, y: 1, w: 18, h: 10 },
      // Row 2: futures full width
      { widgetId: "futures-table", instanceId: "futures-table-full", x: 0, y: 11, w: 24, h: 6 },
      // Row 3: strategies builder (form) full width, minH respected
      { widgetId: "options-strategies", instanceId: "options-strategies-full", x: 0, y: 17, w: 24, h: 7 },
      // Row 4: greek surface full width — no dead side strip
      { widgetId: "options-greek-surface", instanceId: "options-greek-surface-full", x: 0, y: 24, w: 24, h: 5 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);

registerWidget({
  id: "options-control-bar",
  label: "Options Controls",
  description: "Asset class, venue, settlement, main tabs, watchlist toggle.",
  icon: Settings2,
  minW: 12,
  minH: 1,
  defaultW: 24,
  defaultH: 1,
  requiredEntitlements: [{ domain: "trading-options", tier: "basic" }],
  assetGroup: "PLATFORM",
  catalogGroup: "Options & Futures",
  availableOn: ["options"],
  singleton: true,
  component: OptionsControlBarWidget,
  // Phase 5 cockpit-axis metadata: scope-aware reshaping.
  dartMeta: {
    surfaces: ["terminal", "research"],
    terminalModes: ["markets"],
    importance: "primary",
    scopePredicate: (scope) =>
      scope.instrumentTypes.length === 0 ||
      scope.instrumentTypes.includes("option") ||
      scope.instrumentTypes.includes("future"),
  },
});

registerWidget({
  id: "options-watchlist",
  label: "Watchlist",
  description: "Saved watchlists and symbol selection for the active underlying.",
  icon: Star,
  minW: 4,
  minH: 4,
  defaultW: 6,
  defaultH: 10,
  requiredEntitlements: [{ domain: "trading-options", tier: "basic" }],
  assetGroup: "PLATFORM",
  catalogGroup: "Options & Futures",
  availableOn: ["options"],
  singleton: true,
  component: OptionsWatchlistWidget,
});

registerWidget({
  id: "options-chain",
  label: "Options Chain",
  description:
    "Calls and puts per strike with greeks, IV, and open interest. Trade panel docks as a right-side pane when a contract is selected.",
  icon: Grid3X3,
  minW: 12,
  minH: 5,
  defaultW: 18,
  defaultH: 8,
  requiredEntitlements: [{ domain: "trading-options", tier: "basic" }],
  assetGroup: "PLATFORM",
  catalogGroup: "Options & Futures",
  availableOn: ["options"],
  singleton: true,
  component: OptionsChainWidget,
});

registerWidget({
  id: "futures-table",
  label: "Futures Table",
  description:
    "Perpetual and dated futures with funding, basis, and volume. Trade panel docks as a bottom pane when a contract is selected.",
  icon: BarChart3,
  minW: 10,
  minH: 5,
  defaultW: 18,
  defaultH: 6,
  requiredEntitlements: [{ domain: "trading-options", tier: "basic" }],
  assetGroup: "PLATFORM",
  catalogGroup: "Options & Futures",
  availableOn: ["options"],
  singleton: true,
  component: OptionsFuturesTableWidget,
});

registerWidget({
  id: "options-strategies",
  label: "Strategy Builder",
  description: "Futures calendar spreads and multi-leg options combos with a scenario payoff pane.",
  icon: Zap,
  minW: 12,
  minH: 5,
  defaultW: 24,
  defaultH: 7,
  requiredEntitlements: [{ domain: "trading-options", tier: "basic" }],
  assetGroup: "PLATFORM",
  catalogGroup: "Options & Futures",
  availableOn: ["options"],
  singleton: true,
  component: OptionsStrategiesWidget,
});

registerWidget({
  id: "options-greek-surface",
  label: "Greek / vol surface",
  description: "Crypto greek surface; TradFi shows skew-aware vol grid.",
  icon: BarChart3,
  minW: 6,
  minH: 3,
  defaultW: 12,
  defaultH: 4,
  requiredEntitlements: [{ domain: "trading-options", tier: "basic" }],
  assetGroup: "PLATFORM",
  catalogGroup: "Options & Futures",
  availableOn: ["options"],
  singleton: false,
  component: OptionsGreekSurfaceWidget,
});

// ─── Deribit-style options analytics (P6 of DART terminal plan) ────────────
// UI scaffolds; data gated on Greeks/IV computation in features-derivatives-
// service (P6 data prereq). Each widget renders graceful "data unavailable"
// placeholder until the backend lands.

import { IvSmileWidget, IvTermStructureWidget, MaxPainChartWidget, PutCallRatioWidget } from "./dart-options-analytics";
import {
  Activity as ActivityP6,
  Grid3x3 as Grid3x3P6,
  TrendingDown as TrendingDownP6,
  TrendingUp as TrendingUpP6,
} from "lucide-react";

registerPresets("options", [
  {
    id: "options-deribit-analytics",
    name: "Deribit analytics",
    tab: "options",
    isPreset: true,
    layouts: [
      { widgetId: "options-iv-smile", instanceId: "options-iv-smile-1", x: 0, y: 0, w: 14, h: 8 },
      { widgetId: "options-iv-term-structure", instanceId: "options-iv-term-structure-1", x: 14, y: 0, w: 10, h: 8 },
      { widgetId: "options-max-pain", instanceId: "options-max-pain-1", x: 0, y: 8, w: 16, h: 6 },
      { widgetId: "options-put-call-ratio", instanceId: "options-put-call-ratio-1", x: 16, y: 8, w: 8, h: 6 },
    ],
    createdAt: "2026-04-28T00:00:00Z",
    updatedAt: "2026-04-28T00:00:00Z",
  },
]);

registerWidget({
  id: "options-iv-smile",
  label: "IV smile",
  description: "Strike × expiry IV matrix — diverging colour scale. P6 data prereq: Greeks/IV computation.",
  icon: Grid3x3P6,
  minW: 8,
  minH: 6,
  defaultW: 14,
  defaultH: 8,
  requiredEntitlements: [{ domain: "trading-options", tier: "basic" }],
  assetGroup: "CEFI",
  catalogGroup: "Options & Futures",
  availableOn: ["options"],
  singleton: false,
  component: IvSmileWidget,
});

registerWidget({
  id: "options-iv-term-structure",
  label: "IV term structure",
  description: "ATM IV per expiry — XY plot xKind=expiry. P6 data prereq.",
  icon: TrendingUpP6,
  minW: 6,
  minH: 5,
  defaultW: 10,
  defaultH: 8,
  requiredEntitlements: [{ domain: "trading-options", tier: "basic" }],
  assetGroup: "CEFI",
  catalogGroup: "Options & Futures",
  availableOn: ["options"],
  singleton: false,
  component: IvTermStructureWidget,
});

registerWidget({
  id: "options-max-pain",
  label: "Max pain",
  description: "Pain per strike with current price marker. P6 data prereq.",
  icon: TrendingDownP6,
  minW: 8,
  minH: 4,
  defaultW: 16,
  defaultH: 6,
  requiredEntitlements: [{ domain: "trading-options", tier: "basic" }],
  assetGroup: "CEFI",
  catalogGroup: "Options & Futures",
  availableOn: ["options"],
  singleton: false,
  component: MaxPainChartWidget,
});

registerWidget({
  id: "options-put-call-ratio",
  label: "Put/Call ratio",
  description: "Single-asset P/C ratio gauge with historical sparkline. P6 data prereq.",
  icon: ActivityP6,
  minW: 4,
  minH: 4,
  defaultW: 8,
  defaultH: 6,
  requiredEntitlements: [{ domain: "trading-options", tier: "basic" }],
  assetGroup: "CEFI",
  catalogGroup: "Options & Futures",
  availableOn: ["options"],
  singleton: false,
  component: PutCallRatioWidget,
});
