import { ArrowUpDown, Table2 } from "lucide-react";
import { registerPresets } from "../preset-registry";
import { registerWidget } from "../widget-registry";
import { OrdersKpiStripWidget } from "./orders-kpi-strip-widget";
import { OrdersTableWidget } from "./orders-table-widget";

registerPresets("orders", [
  {
    id: "orders-default",
    name: "Default",
    tab: "orders",
    isPreset: true,
    layouts: [
      { widgetId: "orders-kpi-strip", instanceId: "orders-kpi-strip-1", x: 0, y: 0, w: 24, h: 2 },
      { widgetId: "orders-table", instanceId: "orders-table-1", x: 0, y: 2, w: 24, h: 10 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "orders-full",
    name: "Full",
    tab: "orders",
    isPreset: true,
    layouts: [
      { widgetId: "orders-kpi-strip", instanceId: "orders-kpi-strip-full", x: 0, y: 0, w: 24, h: 2 },
      { widgetId: "orders-table", instanceId: "orders-table-full", x: 0, y: 2, w: 24, h: 10 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);

registerWidget({
  id: "orders-kpi-strip",
  label: "Order Summary",
  description:
    "6 KPIs: total, open, partial, filled, rejected, and failed order counts. Layout and responsive grid via KPI summary shell.",
  icon: ArrowUpDown,
  minW: 2,
  minH: 1,
  defaultW: 24,
  defaultH: 1,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Orders",
  availableOn: ["orders"],
  singleton: true,
  component: OrdersKpiStripWidget,
});

registerWidget({
  id: "orders-table",
  label: "Orders Table",
  description: "Full orders DataTable with integrated filters, sorting, column visibility, cancel and amend actions.",
  icon: Table2,
  minW: 12,
  minH: 5,
  defaultW: 24,
  defaultH: 10,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Orders",
  availableOn: ["orders"],
  singleton: true,
  component: OrdersTableWidget,
});
