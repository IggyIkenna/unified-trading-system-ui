import { registerPresets } from "../preset-registry";
import { registerWidget } from "../widget-registry";
import { AlertCircle, Bell, Power, Search } from "lucide-react";
import { AlertsFilterBarWidget } from "./alerts-filter-bar-widget";
import { AlertsKillSwitchWidget } from "./alerts-kill-switch-widget";
import { AlertsKpiStripWidget } from "./alerts-kpi-strip-widget";
import { AlertsTableWidget } from "./alerts-table-widget";

registerPresets("alerts", [
  {
    id: "alerts-default",
    name: "Default",
    tab: "alerts",
    isPreset: true,
    layouts: [
      { widgetId: "alerts-kpi-strip", instanceId: "alerts-kpi-strip-1", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "alerts-filter-bar", instanceId: "alerts-filter-bar-1", x: 0, y: 2, w: 12, h: 1 },
      { widgetId: "alerts-table", instanceId: "alerts-table-1", x: 0, y: 3, w: 9, h: 8 },
      { widgetId: "alerts-kill-switch", instanceId: "alerts-kill-switch-1", x: 9, y: 3, w: 3, h: 8 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);

registerWidget({
  id: "alerts-kpi-strip",
  label: "Alert Summary",
  description: "Active count, critical count, avg resolution, 24h total.",
  icon: Bell,
  minW: 4,
  minH: 1,
  defaultW: 12,
  defaultH: 2,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["alerts"],
  singleton: true,
  component: AlertsKpiStripWidget,
});

registerWidget({
  id: "alerts-filter-bar",
  label: "Alert Filters",
  description: "Search plus status and severity filters for the alert feed.",
  icon: Search,
  minW: 4,
  minH: 1,
  defaultW: 12,
  defaultH: 1,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["alerts"],
  singleton: true,
  component: AlertsFilterBarWidget,
});

registerWidget({
  id: "alerts-table",
  label: "Alert Feed",
  description: "Filterable alert table with severity, entity, actions, and detail sheet.",
  icon: AlertCircle,
  minW: 6,
  minH: 3,
  defaultW: 12,
  defaultH: 8,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["alerts"],
  singleton: true,
  component: AlertsTableWidget,
});

registerWidget({
  id: "alerts-kill-switch",
  label: "Kill Switch",
  description: "Emergency intervention panel: scope, actions, rationale, impact preview.",
  icon: Power,
  minW: 3,
  minH: 4,
  defaultW: 4,
  defaultH: 6,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["alerts"],
  singleton: true,
  component: AlertsKillSwitchWidget,
});
