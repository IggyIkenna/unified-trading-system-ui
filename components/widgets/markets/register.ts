import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  Clock,
  Database,
  FileText,
  LayoutGrid,
} from "lucide-react";
import { registerPresets } from "../preset-registry";
import { registerWidget } from "../widget-registry";
import { MarketsControlsWidget } from "./markets-controls-widget";
import { MarketsDefiAmmWidget } from "./markets-defi-amm-widget";
import { MarketsLatencyDetailWidget } from "./markets-latency-detail-widget";
import { MarketsLatencySummaryWidget } from "./markets-latency-summary-widget";
import { MarketsLiveBookWidget } from "./markets-live-book-widget";
import { MarketsMyOrdersWidget } from "./markets-my-orders-widget";
import { MarketsOrderFlowWidget } from "./markets-order-flow-widget";
import { MarketsReconWidget } from "./markets-recon-widget";

registerPresets("markets", [
  {
    id: "markets-default",
    name: "Trade Desk",
    tab: "markets",
    isPreset: true,
    layouts: [
      { widgetId: "markets-controls", instanceId: "markets-controls-1", x: 0, y: 0, w: 24, h: 1 },
      { widgetId: "markets-order-flow", instanceId: "markets-order-flow-1", x: 0, y: 1, w: 24, h: 7 },
      { widgetId: "markets-recon", instanceId: "markets-recon-1", x: 0, y: 8, w: 12, h: 4 },
      { widgetId: "markets-latency-summary", instanceId: "markets-latency-summary-1", x: 12, y: 8, w: 12, h: 4 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "markets-live-book",
    name: "Live Book",
    tab: "markets",
    isPreset: true,
    layouts: [
      { widgetId: "markets-controls", instanceId: "markets-controls-1", x: 0, y: 0, w: 24, h: 1 },
      { widgetId: "markets-live-book", instanceId: "markets-live-book-1", x: 0, y: 1, w: 24, h: 8 },
      { widgetId: "markets-my-orders", instanceId: "markets-my-orders-1", x: 0, y: 9, w: 24, h: 4 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "markets-latency",
    name: "Latency",
    tab: "markets",
    isPreset: true,
    layouts: [
      { widgetId: "markets-controls", instanceId: "markets-controls-1", x: 0, y: 0, w: 24, h: 1 },
      { widgetId: "markets-latency-summary", instanceId: "markets-latency-summary-1", x: 0, y: 1, w: 10, h: 6 },
      { widgetId: "markets-latency-detail", instanceId: "markets-latency-detail-1", x: 10, y: 1, w: 14, h: 6 },
      { widgetId: "markets-recon", instanceId: "markets-recon-1", x: 0, y: 7, w: 24, h: 4 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "markets-full",
    name: "Full",
    tab: "markets",
    isPreset: true,
    layouts: [
      // Controls (always full width)
      { widgetId: "markets-controls", instanceId: "markets-controls-full", x: 0, y: 0, w: 24, h: 1 },
      // Order flow table (wide, keep full width)
      { widgetId: "markets-order-flow", instanceId: "markets-order-flow-full", x: 0, y: 1, w: 24, h: 7 },
      // Live book (needs width — minW=16)
      { widgetId: "markets-live-book", instanceId: "markets-live-book-full", x: 0, y: 8, w: 24, h: 7 },
      // Row: my orders + recon side by side, same h=5
      { widgetId: "markets-my-orders", instanceId: "markets-my-orders-full", x: 0, y: 15, w: 12, h: 5 },
      { widgetId: "markets-recon", instanceId: "markets-recon-full", x: 12, y: 15, w: 12, h: 5 },
      // Row: latency summary + latency detail, same h=6
      { widgetId: "markets-latency-summary", instanceId: "markets-latency-summary-full", x: 0, y: 20, w: 10, h: 6 },
      { widgetId: "markets-latency-detail", instanceId: "markets-latency-detail-full", x: 10, y: 20, w: 14, h: 6 },
      // DeFi AMM activity (full width)
      { widgetId: "markets-defi-amm", instanceId: "markets-defi-amm-full", x: 0, y: 26, w: 24, h: 5 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);

const MARKETS_ENTITLEMENTS = [{ domain: "trading-common" as const, tier: "basic" as const }];

registerWidget({
  id: "markets-controls",
  label: "Markets Controls",
  description: "Global and trade-desk controls: view/data mode, date range, asset, order-flow range and depth.",
  icon: LayoutGrid,
  minW: 8,
  minH: 1,
  defaultW: 24,
  defaultH: 1,
  requiredEntitlements: [...MARKETS_ENTITLEMENTS],
  category: "Markets",
  availableOn: ["markets"],
  singleton: true,
  component: MarketsControlsWidget,
});

registerWidget({
  id: "markets-order-flow",
  label: "Market Order Flow",
  description: "Scrollable order table with timestamps, latency, side, venue, aggressor.",
  icon: ArrowRightLeft,
  minW: 12,
  minH: 4,
  defaultW: 24,
  defaultH: 7,
  requiredEntitlements: [...MARKETS_ENTITLEMENTS],
  category: "Markets",
  availableOn: ["markets"],
  singleton: true,
  component: MarketsOrderFlowWidget,
});

registerWidget({
  id: "markets-live-book",
  label: "Live Order Book",
  description: "HFT-style book + trades with bid/ask columns and legend.",
  icon: BarChart3,
  minW: 16,
  minH: 4,
  defaultW: 24,
  defaultH: 7,
  requiredEntitlements: [...MARKETS_ENTITLEMENTS],
  category: "Markets",
  availableOn: ["markets"],
  singleton: true,
  component: MarketsLiveBookWidget,
});

registerWidget({
  id: "markets-my-orders",
  label: "My Orders",
  description: "Own order history with fill status and order IDs.",
  icon: FileText,
  minW: 12,
  minH: 3,
  defaultW: 24,
  defaultH: 5,
  requiredEntitlements: [...MARKETS_ENTITLEMENTS],
  category: "Markets",
  availableOn: ["markets"],
  singleton: true,
  component: MarketsMyOrdersWidget,
});

registerWidget({
  id: "markets-recon",
  label: "Reconciliation",
  description: "Recon runs with break counts, resolution, and break value.",
  icon: AlertTriangle,
  minW: 8,
  minH: 3,
  defaultW: 24,
  defaultH: 4,
  requiredEntitlements: [...MARKETS_ENTITLEMENTS],
  category: "Markets",
  availableOn: ["markets"],
  singleton: true,
  component: MarketsReconWidget,
});

registerWidget({
  id: "markets-latency-summary",
  label: "Latency Summary",
  description: "Service list with p50/p95/p99 and latency view/data toggles.",
  icon: Clock,
  minW: 8,
  minH: 3,
  defaultW: 24,
  defaultH: 5,
  requiredEntitlements: [...MARKETS_ENTITLEMENTS],
  category: "Markets",
  availableOn: ["markets"],
  singleton: true,
  component: MarketsLatencySummaryWidget,
});

registerWidget({
  id: "markets-latency-detail",
  label: "Latency Detail",
  description: "Selected service KPIs, lifecycle bars, time series, compare table.",
  icon: Activity,
  minW: 12,
  minH: 4,
  defaultW: 24,
  defaultH: 6,
  requiredEntitlements: [...MARKETS_ENTITLEMENTS],
  category: "Markets",
  availableOn: ["markets"],
  singleton: true,
  component: MarketsLatencyDetailWidget,
});

registerWidget({
  id: "markets-defi-amm",
  label: "DeFi Pool Activity",
  description: "AMM swap / LP style table for DeFi venues (mock).",
  icon: Database,
  minW: 12,
  minH: 3,
  defaultW: 24,
  defaultH: 5,
  requiredEntitlements: [...MARKETS_ENTITLEMENTS],
  category: "Markets",
  availableOn: ["markets"],
  singleton: true,
  component: MarketsDefiAmmWidget,
});
