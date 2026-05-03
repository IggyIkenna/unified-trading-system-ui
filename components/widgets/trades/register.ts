import { Receipt } from "lucide-react";
import { registerPresets } from "../preset-registry";
import { registerWidget } from "../widget-registry";
import { TradesTableWidget } from "./trades-table-widget";

// "Positions + Trades" preset: stacks KPI strip, positions table, and trades
// table on the same canvas — click "View trades" in the positions table to
// filter the trades widget without leaving the page.
registerPresets("positions", [
  {
    id: "positions-with-trades",
    name: "Positions + Trades",
    tab: "positions",
    isPreset: true,
    layouts: [
      { widgetId: "positions-kpi-strip", instanceId: "positions-kpi-strip-pt", x: 0, y: 0, w: 24, h: 2 },
      { widgetId: "positions-table", instanceId: "positions-table-pt", x: 0, y: 2, w: 24, h: 8 },
      { widgetId: "positions-trades-table", instanceId: "positions-trades-table-1", x: 0, y: 10, w: 24, h: 8 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);

registerWidget({
  id: "positions-trades-table",
  label: "Trades",
  description:
    "Fill-level trade ledger. Shows all trades for the current scope. When you click 'View trades' on a position row the widget automatically filters to that position's fills.",
  icon: Receipt,
  minW: 12,
  minH: 4,
  defaultW: 24,
  defaultH: 8,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "PLATFORM",
  catalogGroup: "Positions",
  availableOn: ["positions"],
  singleton: true,
  component: TradesTableWidget,
});
