import { Activity, Table2 } from "lucide-react";
import { registerPresets } from "../preset-registry";
import { registerWidget } from "../widget-registry";
import { PositionsKpiWidget } from "./positions-kpi-widget";
import { PositionsTableWidget } from "./positions-table-widget";

registerPresets("positions", [
  {
    id: "positions-default",
    name: "Default",
    tab: "positions",
    isPreset: true,
    layouts: [
      { widgetId: "positions-kpi-strip", instanceId: "positions-kpi-strip-1", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "positions-table", instanceId: "positions-table-1", x: 0, y: 2, w: 12, h: 10 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "positions-full",
    name: "Full",
    tab: "positions",
    isPreset: true,
    layouts: [
      { widgetId: "positions-kpi-strip", instanceId: "positions-kpi-strip-full", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "positions-table", instanceId: "positions-table-full", x: 0, y: 2, w: 12, h: 8 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);

registerWidget({
  id: "positions-kpi-strip",
  label: "Position Summary",
  description: "6 KPIs: count, notional, unrealized P&L, margin, long/short exposure.",
  icon: Activity,
  minW: 4,
  minH: 1,
  defaultW: 12,
  defaultH: 2,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Positions",
  availableOn: ["positions"],
  singleton: true,
  component: PositionsKpiWidget,
});

registerWidget({
  id: "positions-table",
  label: "Positions Table",
  description:
    "Main positions data table with integrated filters, instrument links, side, today vs net P&L, and trades drill-down.",
  icon: Table2,
  minW: 6,
  minH: 5,
  defaultW: 12,
  defaultH: 8,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Positions",
  availableOn: ["positions"],
  singleton: true,
  component: PositionsTableWidget,
});
