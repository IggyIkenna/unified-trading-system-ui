import { Activity, LayoutGrid, LineChart } from "lucide-react";
import { registerPresets } from "../preset-registry";
import { registerWidget } from "../widget-registry";
import { StrategiesCatalogueWidget } from "./strategies-catalogue-widget";
import { StrategiesGridLinkWidget } from "./strategies-grid-link-widget";
import { StrategiesKpiWidget } from "./strategies-kpi-widget";

registerPresets("strategies", [
  {
    id: "strategies-default",
    name: "Default",
    tab: "strategies",
    isPreset: true,
    layouts: [
      { widgetId: "strategies-kpi-strip", instanceId: "strategies-kpi-strip-1", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "strategies-catalogue", instanceId: "strategies-catalogue-1", x: 0, y: 2, w: 12, h: 9 },
      { widgetId: "strategies-grid-link", instanceId: "strategies-grid-link-1", x: 0, y: 11, w: 12, h: 1 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "strategies-full",
    name: "Full",
    tab: "strategies",
    isPreset: true,
    layouts: [
      { widgetId: "strategies-kpi-strip", instanceId: "strategies-kpi-strip-full", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "strategies-catalogue", instanceId: "strategies-catalogue-full", x: 0, y: 2, w: 12, h: 9 },
      { widgetId: "strategies-grid-link", instanceId: "strategies-grid-link-full", x: 0, y: 11, w: 12, h: 1 },
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
  category: "Strategies",
  availableOn: ["strategies"],
  singleton: true,
  component: StrategiesKpiWidget,
});

registerWidget({
  id: "strategies-catalogue",
  label: "Strategy List",
  description: "Grouped card grid with integrated filters, performance metrics, sparklines, and action links.",
  icon: LayoutGrid,
  minW: 6,
  minH: 6,
  defaultW: 12,
  defaultH: 9,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Strategies",
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
  category: "Strategies",
  availableOn: ["strategies"],
  singleton: true,
  component: StrategiesGridLinkWidget,
});
