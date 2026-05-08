import { AlertCircle, Bell, PieChart, Power } from "lucide-react";
import { registerPresets } from "../preset-registry";
import { registerWidget } from "../widget-registry";
import { AlertsKillSwitchWidget } from "./alerts-kill-switch-widget";
import { AlertsKpiStripWidget } from "./alerts-kpi-strip-widget";
import { AlertsTableWidget } from "./alerts-table-widget";
import { SeverityBreakdownWidget } from "./severity-breakdown-widget";

registerPresets("alerts", [
  {
    id: "alerts-default",
    name: "Default",
    tab: "alerts",
    isPreset: true,
    layouts: [
      { widgetId: "alerts-kpi-strip", instanceId: "alerts-kpi-strip-1", x: 0, y: 0, w: 24, h: 1 },
      { widgetId: "alerts-table", instanceId: "alerts-table-1", x: 0, y: 1, w: 16, h: 11 },
      { widgetId: "alerts-kill-switch", instanceId: "alerts-kill-switch-1", x: 16, y: 1, w: 8, h: 11 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "alerts-full",
    name: "Full",
    tab: "alerts",
    isPreset: true,
    layouts: [
      { widgetId: "alerts-kpi-strip", instanceId: "alerts-kpi-strip-full", x: 0, y: 0, w: 24, h: 1 },
      { widgetId: "alerts-table", instanceId: "alerts-table-full", x: 0, y: 1, w: 16, h: 11 },
      { widgetId: "alerts-kill-switch", instanceId: "alerts-kill-switch-full", x: 16, y: 1, w: 8, h: 11 },
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
  minW: 8,
  minH: 1,
  defaultW: 24,
  defaultH: 1,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "PLATFORM",
  catalogGroup: "Alerts",
  availableOn: ["alerts"],
  singleton: true,
  component: AlertsKpiStripWidget,
});

registerWidget({
  id: "alerts-table",
  label: "Alert Feed",
  description: "Filterable alert table with integrated filters, severity, entity, actions, and detail sheet.",
  icon: AlertCircle,
  minW: 12,
  minH: 5,
  defaultW: 24,
  defaultH: 9,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "PLATFORM",
  catalogGroup: "Alerts",
  availableOn: ["alerts"],
  singleton: true,
  component: AlertsTableWidget,
});

registerWidget({
  id: "alerts-kill-switch",
  label: "Kill Switch",
  description: "Emergency intervention panel: scope, actions, rationale, impact preview.",
  icon: Power,
  minW: 6,
  minH: 8,
  defaultW: 8,
  defaultH: 11,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "PLATFORM",
  catalogGroup: "Alerts",
  availableOn: ["alerts"],
  singleton: true,
  component: AlertsKillSwitchWidget,
});

registerWidget({
  id: "alerts-severity-breakdown",
  label: "Severity Breakdown",
  description: "Pie chart of active alerts by severity (critical / high / medium / low / info).",
  icon: PieChart,
  minW: 4,
  minH: 4,
  defaultW: 8,
  defaultH: 6,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "PLATFORM",
  catalogGroup: "Alerts",
  availableOn: ["alerts"],
  singleton: true,
  component: SeverityBreakdownWidget,
});
