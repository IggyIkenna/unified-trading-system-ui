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
      { widgetId: "options-control-bar", instanceId: "options-control-bar-1", x: 0, y: 0, w: 12, h: 1 },
      { widgetId: "options-watchlist", instanceId: "options-watchlist-1", x: 0, y: 1, w: 3, h: 10 },
      { widgetId: "options-chain", instanceId: "options-chain-1", x: 3, y: 1, w: 6, h: 8 },
      { widgetId: "options-greek-surface", instanceId: "options-greek-surface-1", x: 9, y: 1, w: 3, h: 4 },
      { widgetId: "futures-table", instanceId: "futures-table-1", x: 3, y: 9, w: 9, h: 4 },
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
      { widgetId: "options-control-bar", instanceId: "options-control-bar-2", x: 0, y: 0, w: 12, h: 1 },
      { widgetId: "options-strategies", instanceId: "options-strategies-1", x: 0, y: 1, w: 12, h: 7 },
      { widgetId: "options-chain", instanceId: "options-chain-2", x: 0, y: 8, w: 12, h: 5 },
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
      { widgetId: "options-control-bar", instanceId: "options-control-bar-full", x: 0, y: 0, w: 12, h: 1 },
      { widgetId: "options-watchlist", instanceId: "options-watchlist-full", x: 0, y: 1, w: 3, h: 10 },
      { widgetId: "options-chain", instanceId: "options-chain-full", x: 3, y: 1, w: 9, h: 8 },
      { widgetId: "futures-table", instanceId: "futures-table-full", x: 0, y: 11, w: 12, h: 6 },
      { widgetId: "options-strategies", instanceId: "options-strategies-full", x: 0, y: 17, w: 12, h: 7 },
      { widgetId: "options-greek-surface", instanceId: "options-greek-surface-full", x: 0, y: 24, w: 6, h: 4 },
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
  minW: 6,
  minH: 1,
  defaultW: 12,
  defaultH: 1,
  requiredEntitlements: [{ domain: "trading-options", tier: "basic" }],
  category: "Options & Futures",
  availableOn: ["options"],
  singleton: true,
  component: OptionsControlBarWidget,
});

registerWidget({
  id: "options-watchlist",
  label: "Watchlist",
  description: "Saved watchlists and symbol selection for the active underlying.",
  icon: Star,
  minW: 2,
  minH: 4,
  defaultW: 3,
  defaultH: 10,
  requiredEntitlements: [{ domain: "trading-options", tier: "basic" }],
  category: "Options & Futures",
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
  minW: 6,
  minH: 5,
  defaultW: 9,
  defaultH: 8,
  requiredEntitlements: [{ domain: "trading-options", tier: "basic" }],
  category: "Options & Futures",
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
  minW: 5,
  minH: 5,
  defaultW: 9,
  defaultH: 6,
  requiredEntitlements: [{ domain: "trading-options", tier: "basic" }],
  category: "Options & Futures",
  availableOn: ["options"],
  singleton: true,
  component: OptionsFuturesTableWidget,
});

registerWidget({
  id: "options-strategies",
  label: "Strategy Builder",
  description: "Futures calendar spreads and multi-leg options combos with a scenario payoff pane.",
  icon: Zap,
  minW: 6,
  minH: 5,
  defaultW: 12,
  defaultH: 7,
  requiredEntitlements: [{ domain: "trading-options", tier: "basic" }],
  category: "Options & Futures",
  availableOn: ["options"],
  singleton: true,
  component: OptionsStrategiesWidget,
});

registerWidget({
  id: "options-greek-surface",
  label: "Greek / vol surface",
  description: "Crypto greek surface; TradFi shows skew-aware vol grid.",
  icon: BarChart3,
  minW: 4,
  minH: 3,
  defaultW: 6,
  defaultH: 4,
  requiredEntitlements: [{ domain: "trading-options", tier: "basic" }],
  category: "Options & Futures",
  availableOn: ["options"],
  singleton: false,
  component: OptionsGreekSurfaceWidget,
});
