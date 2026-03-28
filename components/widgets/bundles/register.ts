import { registerWidget } from "../widget-registry";
import { registerPresets } from "../preset-registry";
import { DollarSign, FileText, Layers, Send, Zap } from "lucide-react";
import { BundleTemplatesWidget } from "./bundle-templates-widget";
import { BundleStepsWidget } from "./bundle-steps-widget";
import { BundlePnlWidget } from "./bundle-pnl-widget";
import { BundleActionsWidget } from "./bundle-actions-widget";
import { DefiAtomicBundleWidget } from "./defi-atomic-bundle-widget";

registerPresets("bundles", [
  {
    id: "bundles-default",
    name: "Default",
    tab: "bundles",
    isPreset: true,
    layouts: [
      { widgetId: "bundle-templates", instanceId: "bundle-templates-1", x: 0, y: 0, w: 4, h: 5 },
      { widgetId: "bundle-steps", instanceId: "bundle-steps-1", x: 4, y: 0, w: 8, h: 7 },
      { widgetId: "bundle-pnl", instanceId: "bundle-pnl-1", x: 0, y: 5, w: 4, h: 3 },
      { widgetId: "bundle-actions", instanceId: "bundle-actions-1", x: 0, y: 8, w: 4, h: 1 },
      { widgetId: "defi-atomic-bundle", instanceId: "defi-atomic-bundle-1", x: 4, y: 7, w: 8, h: 8 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "bundles-compact",
    name: "Compact",
    tab: "bundles",
    isPreset: true,
    layouts: [
      { widgetId: "bundle-steps", instanceId: "bundle-steps-1", x: 0, y: 0, w: 8, h: 8 },
      { widgetId: "bundle-pnl", instanceId: "bundle-pnl-1", x: 8, y: 0, w: 4, h: 4 },
      { widgetId: "bundle-templates", instanceId: "bundle-templates-1", x: 8, y: 4, w: 4, h: 4 },
      { widgetId: "bundle-actions", instanceId: "bundle-actions-1", x: 0, y: 8, w: 12, h: 1 },
      { widgetId: "defi-atomic-bundle", instanceId: "defi-atomic-bundle-1", x: 0, y: 9, w: 12, h: 8 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);

registerWidget({
  id: "bundle-templates",
  label: "Bundle Templates",
  description: "Pre-built template gallery with category badges, estimated cost/profit, step preview.",
  icon: FileText,
  minW: 3,
  minH: 3,
  defaultW: 4,
  defaultH: 5,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Bundles",
  availableOn: ["bundles"],
  singleton: true,
  component: BundleTemplatesWidget,
});

registerWidget({
  id: "bundle-steps",
  label: "Execution Steps",
  description: "Step list with reorder, duplicate, fields, dependency links, and visual flow.",
  icon: Layers,
  minW: 4,
  minH: 4,
  defaultW: 8,
  defaultH: 7,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Bundles",
  availableOn: ["bundles"],
  singleton: true,
  component: BundleStepsWidget,
});

registerWidget({
  id: "bundle-pnl",
  label: "P&L Estimate",
  description: "Buy/sell notional, gas estimate, net P&L via KPI strip and collapsible breakdown.",
  icon: DollarSign,
  minW: 3,
  minH: 2,
  defaultW: 4,
  defaultH: 3,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Bundles",
  availableOn: ["bundles"],
  singleton: true,
  component: BundlePnlWidget,
});

registerWidget({
  id: "bundle-actions",
  label: "Bundle Actions",
  description: "Simulate (dry run) and submit with leg count badge.",
  icon: Send,
  minW: 3,
  minH: 1,
  defaultW: 4,
  defaultH: 1,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Bundles",
  availableOn: ["bundles"],
  singleton: true,
  component: BundleActionsWidget,
});

registerWidget({
  id: "defi-atomic-bundle",
  label: "DeFi Atomic Bundles",
  description:
    "DeFi-specific atomic bundle builder with operation selector, pre-built templates (Flash Loan Arb, Leverage Long, Yield Harvest), gas estimation, and Tenderly simulation.",
  icon: Zap,
  minW: 4,
  minH: 5,
  defaultW: 8,
  defaultH: 8,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "Bundles",
  availableOn: ["bundles"],
  singleton: true,
  component: DefiAtomicBundleWidget,
});
