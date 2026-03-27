import { registerWidget } from "../widget-registry";
import { registerPresets } from "../preset-registry";
import { Activity, Filter, LayoutGrid, LineChart } from "lucide-react";
import { StrategiesKpiWidget } from "./strategies-kpi-widget";
import { StrategiesFilterWidget } from "./strategies-filter-widget";
import { StrategiesCatalogueWidget } from "./strategies-catalogue-widget";
import { StrategiesGridLinkWidget } from "./strategies-grid-link-widget";

registerPresets("strategies", [
  {
    id: "strategies-default",
    name: "Default",
    tab: "strategies",
    isPreset: true,
    layouts: [
      { widgetId: "strategies-kpi-strip", instanceId: "strategies-kpi-strip-1", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "strategies-filter-bar", instanceId: "strategies-filter-bar-1", x: 0, y: 2, w: 12, h: 1 },
      { widgetId: "strategies-catalogue", instanceId: "strategies-catalogue-1", x: 0, y: 3, w: 12, h: 8 },
      { widgetId: "strategies-grid-link", instanceId: "strategies-grid-link-1", x: 0, y: 11, w: 12, h: 1 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);

registerWidget({
  id: "strategies-kpi-strip",
  label: "Strategy Summary",
  description: "Active count, total AUM, total P&L, MTD P&L with execution mode badge.",
  icon: Activity,
  minW: 4,
  minH: 1,
  defaultW: 12,
  defaultH: 2,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["strategies"],
  singleton: true,
  component: StrategiesKpiWidget,
});

registerWidget({
  id: "strategies-filter-bar",
  label: "Strategy Filters",
  description: "Search plus asset class, archetype, and status multi-select filters with badges.",
  icon: Filter,
  minW: 4,
  minH: 1,
  defaultW: 12,
  defaultH: 1,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["strategies"],
  singleton: true,
  component: StrategiesFilterWidget,
});

registerWidget({
  id: "strategies-catalogue",
  label: "Strategy List",
  description: "Grouped card grid with performance metrics, sparklines, and action links.",
  icon: LayoutGrid,
  minW: 6,
  minH: 4,
  defaultW: 12,
  defaultH: 8,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["strategies"],
  singleton: true,
  component: StrategiesCatalogueWidget,
});

registerWidget({
  id: "strategies-grid-link",
  label: "Batch Grid Link",
  description: "CTA to open DimensionalGrid for batch analysis.",
  icon: LineChart,
  minW: 4,
  minH: 1,
  defaultW: 12,
  defaultH: 1,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["strategies"],
  singleton: true,
  component: StrategiesGridLinkWidget,
});
