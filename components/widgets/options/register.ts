import { registerWidget } from "../widget-registry";
import { registerPresets } from "../preset-registry";
import { Activity, BarChart3, ClipboardPen, Grid3X3, Settings2, Star, Zap } from "lucide-react";
import { OptionsControlBarWidget } from "./options-control-bar-widget";
import { OptionsWatchlistWidget } from "./options-watchlist-widget";
import { OptionsChainWidget } from "./options-chain-widget";
import { OptionsTradePanelWidget } from "./options-trade-panel-widget";
import { OptionsFuturesTableWidget } from "./options-futures-table-widget";
import { OptionsFuturesTradePanelWidget } from "./options-futures-trade-panel-widget";
import { OptionsStrategiesWidget } from "./options-strategies-widget";
import { OptionsScenarioWidget } from "./options-scenario-widget";
import { OptionsGreekSurfaceWidget } from "./options-greek-surface-widget";

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
      { widgetId: "options-trade-panel", instanceId: "options-trade-panel-1", x: 9, y: 1, w: 3, h: 6 },
      { widgetId: "options-greek-surface", instanceId: "options-greek-surface-1", x: 9, y: 7, w: 3, h: 4 },
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
      { widgetId: "options-strategies", instanceId: "options-strategies-1", x: 0, y: 1, w: 7, h: 7 },
      { widgetId: "options-scenario", instanceId: "options-scenario-1", x: 7, y: 1, w: 5, h: 7 },
      { widgetId: "options-trade-panel", instanceId: "options-trade-panel-2", x: 0, y: 8, w: 4, h: 5 },
      { widgetId: "options-chain", instanceId: "options-chain-2", x: 4, y: 8, w: 8, h: 5 },
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
  requiredEntitlements: ["execution-basic", "execution-full"],
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
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["options"],
  singleton: true,
  component: OptionsWatchlistWidget,
});

registerWidget({
  id: "options-chain",
  label: "Options Chain",
  description: "Calls and puts per strike with greeks, IV, and open interest.",
  icon: Grid3X3,
  minW: 6,
  minH: 5,
  defaultW: 9,
  defaultH: 8,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["options"],
  singleton: true,
  component: OptionsChainWidget,
});

registerWidget({
  id: "options-trade-panel",
  label: "Options Trade Panel",
  description: "Order entry for options, spreads, and combos from chain or strategies.",
  icon: ClipboardPen,
  minW: 3,
  minH: 4,
  defaultW: 3,
  defaultH: 6,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["options"],
  singleton: true,
  component: OptionsTradePanelWidget,
});

registerWidget({
  id: "futures-table",
  label: "Futures Table",
  description: "Perpetual and dated futures with funding, basis, and volume.",
  icon: BarChart3,
  minW: 5,
  minH: 4,
  defaultW: 9,
  defaultH: 6,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["options"],
  singleton: true,
  component: OptionsFuturesTableWidget,
});

registerWidget({
  id: "futures-trade-panel",
  label: "Futures Trade Panel",
  description: "Futures order entry after selecting a contract in the futures table.",
  icon: ClipboardPen,
  minW: 3,
  minH: 3,
  defaultW: 3,
  defaultH: 5,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["options"],
  singleton: true,
  component: OptionsFuturesTradePanelWidget,
});

registerWidget({
  id: "options-strategies",
  label: "Strategy Builder",
  description: "Futures calendar spreads and multi-leg options combos.",
  icon: Zap,
  minW: 5,
  minH: 4,
  defaultW: 9,
  defaultH: 6,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["options"],
  singleton: true,
  component: OptionsStrategiesWidget,
});

registerWidget({
  id: "options-scenario",
  label: "Scenario Analysis",
  description: "Spot and vol shock grid with preset scenarios.",
  icon: Activity,
  minW: 5,
  minH: 4,
  defaultW: 9,
  defaultH: 6,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["options"],
  singleton: true,
  component: OptionsScenarioWidget,
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
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["options"],
  singleton: false,
  component: OptionsGreekSurfaceWidget,
});
