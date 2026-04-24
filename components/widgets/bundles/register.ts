import { Layers, Zap } from "lucide-react";
import { registerPresets } from "../preset-registry";
import { registerWidget } from "../widget-registry";
import { BundleBuilderWidget } from "./bundle-builder-widget";
import { DefiAtomicBundleWidget } from "./defi-atomic-bundle-widget";

registerPresets("bundles", [
  {
    id: "bundles-default",
    name: "Default",
    tab: "bundles",
    isPreset: true,
    layouts: [
      { widgetId: "bundle-builder", instanceId: "bundle-builder-1", x: 0, y: 0, w: 24, h: 14 },
      { widgetId: "defi-atomic-bundle", instanceId: "defi-atomic-bundle-1", x: 0, y: 14, w: 24, h: 8 },
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
      { widgetId: "bundle-builder", instanceId: "bundle-builder-1", x: 0, y: 0, w: 24, h: 10 },
      { widgetId: "defi-atomic-bundle", instanceId: "defi-atomic-bundle-1", x: 0, y: 10, w: 24, h: 8 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "bundles-full",
    name: "Full",
    tab: "bundles",
    isPreset: true,
    layouts: [
      // Stacked full-width: bundle builder then defi atomic (same full width)
      { widgetId: "bundle-builder", instanceId: "bundle-builder-full", x: 0, y: 0, w: 24, h: 14 },
      { widgetId: "defi-atomic-bundle", instanceId: "defi-atomic-bundle-full", x: 0, y: 14, w: 24, h: 8 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);

registerWidget({
  id: "bundle-builder",
  label: "Bundle Builder",
  description: "Template gallery, multi-leg step editor, P&L estimate, and simulate/submit actions in one workflow.",
  icon: Layers,
  minW: 12,
  minH: 8,
  defaultW: 24,
  defaultH: 14,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Bundles",
  availableOn: ["bundles"],
  singleton: true,
  component: BundleBuilderWidget,
});

registerWidget({
  id: "defi-atomic-bundle",
  label: "DeFi Atomic Bundles",
  description:
    "DeFi-specific atomic bundle builder with operation selector, pre-built templates (Flash Loan Arb, Leverage Long, Yield Harvest), gas estimation, and Tenderly simulation.",
  icon: Zap,
  minW: 8,
  minH: 5,
  defaultW: 16,
  defaultH: 8,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Bundles",
  availableOn: ["bundles"],
  singleton: true,
  component: DefiAtomicBundleWidget,
});
