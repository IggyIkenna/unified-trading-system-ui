import { registerWidget } from "../widget-registry";
import { registerPresets } from "../preset-registry";
import { Activity, Filter, Table2, Wallet } from "lucide-react";
import { PositionsKpiWidget } from "./positions-kpi-widget";
import { PositionsFilterWidget } from "./positions-filter-widget";
import { PositionsTableWidget } from "./positions-table-widget";
import { AccountBalancesWidget } from "./account-balances-widget";

registerPresets("positions", [
  {
    id: "positions-default",
    name: "Default",
    tab: "positions",
    isPreset: true,
    layouts: [
      { widgetId: "positions-filter", instanceId: "positions-filter-1", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "positions-kpi-strip", instanceId: "positions-kpi-strip-1", x: 0, y: 2, w: 12, h: 2 },
      { widgetId: "account-balances", instanceId: "account-balances-1", x: 0, y: 4, w: 12, h: 3 },
      { widgetId: "positions-table", instanceId: "positions-table-1", x: 0, y: 7, w: 12, h: 6 },
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
  availableOn: ["positions"],
  singleton: true,
  component: PositionsKpiWidget,
});

registerWidget({
  id: "positions-filter",
  label: "Position Filters",
  description: "Unified filter bar with instrument type pills.",
  icon: Filter,
  minW: 4,
  minH: 1,
  defaultW: 12,
  defaultH: 2,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["positions"],
  singleton: true,
  component: PositionsFilterWidget,
});

registerWidget({
  id: "positions-table",
  label: "Positions Table",
  description: "Main positions data table with instrument links, side, P&L, and health factor.",
  icon: Table2,
  minW: 6,
  minH: 3,
  defaultW: 12,
  defaultH: 6,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["positions"],
  singleton: true,
  component: PositionsTableWidget,
});

registerWidget({
  id: "account-balances",
  label: "Account Balances",
  description: "Venue balances table with utilization bars, collapsible.",
  icon: Wallet,
  minW: 4,
  minH: 2,
  defaultW: 12,
  defaultH: 3,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["positions"],
  singleton: true,
  component: AccountBalancesWidget,
});
