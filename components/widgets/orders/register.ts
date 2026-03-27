import { registerWidget } from "../widget-registry";
import { registerPresets } from "../preset-registry";
import { ArrowUpDown, Filter, Table2 } from "lucide-react";
import { OrdersKpiStripWidget } from "./orders-kpi-strip-widget";
import { OrdersFilterWidget } from "./orders-filter-widget";
import { OrdersTableWidget } from "./orders-table-widget";

registerPresets("orders", [
  {
    id: "orders-default",
    name: "Default",
    tab: "orders",
    isPreset: true,
    layouts: [
      { widgetId: "orders-filter", instanceId: "orders-filter-1", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "orders-kpi-strip", instanceId: "orders-kpi-strip-1", x: 0, y: 2, w: 12, h: 1 },
      { widgetId: "orders-table", instanceId: "orders-table-1", x: 0, y: 3, w: 12, h: 8 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);

registerWidget({
  id: "orders-kpi-strip",
  label: "Order Summary",
  description: "4 KPIs: total, open, partial, filled order counts.",
  icon: ArrowUpDown,
  minW: 4,
  minH: 1,
  defaultW: 12,
  defaultH: 1,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["orders"],
  singleton: true,
  component: OrdersKpiStripWidget,
});

registerWidget({
  id: "orders-filter",
  label: "Order Filters",
  description: "Unified filter bar with search, venue, status and instrument type pills.",
  icon: Filter,
  minW: 4,
  minH: 1,
  defaultW: 12,
  defaultH: 2,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["orders"],
  singleton: true,
  component: OrdersFilterWidget,
});

registerWidget({
  id: "orders-table",
  label: "Orders Table",
  description: "Full orders DataTable with sorting, column visibility, cancel and amend actions.",
  icon: Table2,
  minW: 6,
  minH: 3,
  defaultW: 12,
  defaultH: 8,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["orders"],
  singleton: true,
  component: OrdersTableWidget,
});
