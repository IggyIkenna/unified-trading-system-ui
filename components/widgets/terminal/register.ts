import { ArrowRightLeft, BookOpen, Calendar, Layers2, LineChart, Radio, ShoppingCart, Star } from "lucide-react";
import { registerPresets } from "../preset-registry";
import { registerWidget } from "../widget-registry";
import { CalendarEventsWidget } from "./calendar-events-widget";
import { EventsFeedWidget } from "./events-feed-widget";
import { MarketTradesWidget } from "./market-trades-widget";
import { OrderBookWidget } from "./order-book-widget";
import { OrderEntryWidget } from "./order-entry-widget";
import { PriceChartWidget } from "./price-chart-widget";
import { TerminalOptionsWidget } from "./terminal-options-widget";
import { TerminalWatchlistWidget } from "./terminal-watchlist-widget";

registerPresets("terminal", [
  {
    id: "terminal-default",
    name: "Default",
    tab: "terminal",
    isPreset: true,
    layouts: [
      // Row 1 (y=0, h=10): watchlist | order book | chart | market trades — all same height
      { widgetId: "terminal-watchlist", instanceId: "terminal-watchlist-1", x: 0, y: 0, w: 4, h: 10 },
      { widgetId: "order-book", instanceId: "order-book-1", x: 4, y: 0, w: 4, h: 10 },
      { widgetId: "price-chart", instanceId: "price-chart-1", x: 8, y: 0, w: 10, h: 10 },
      { widgetId: "market-trades", instanceId: "market-trades-1", x: 18, y: 0, w: 6, h: 10 },
      // Row 2 (y=10, h=8): order entry form + calendar — same height, form fully visible
      { widgetId: "order-entry", instanceId: "order-entry-1", x: 0, y: 10, w: 8, h: 8 },
      { widgetId: "calendar-events", instanceId: "calendar-events-1", x: 8, y: 10, w: 16, h: 8 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "terminal-full",
    name: "Full",
    tab: "terminal",
    isPreset: true,
    layouts: [
      // Row 1 (y=0, h=10): watchlist | order book | chart | market trades — semantic peer row
      { widgetId: "terminal-watchlist", instanceId: "terminal-watchlist-full", x: 0, y: 0, w: 4, h: 10 },
      { widgetId: "order-book", instanceId: "order-book-full", x: 4, y: 0, w: 4, h: 10 },
      { widgetId: "price-chart", instanceId: "price-chart-full", x: 8, y: 0, w: 10, h: 10 },
      { widgetId: "market-trades", instanceId: "market-trades-full", x: 18, y: 0, w: 6, h: 10 },
      // Row 2 (y=10, h=8): order entry form + calendar — forms grouped, fully visible
      { widgetId: "order-entry", instanceId: "order-entry-full", x: 0, y: 10, w: 8, h: 8 },
      { widgetId: "calendar-events", instanceId: "calendar-events-full", x: 8, y: 10, w: 16, h: 8 },
      // Row 3 (y=18, h=8): options chain + events feed — same height peers
      { widgetId: "terminal-options", instanceId: "terminal-options-full", x: 0, y: 18, w: 16, h: 8 },
      { widgetId: "events-feed", instanceId: "events-feed-full", x: 16, y: 18, w: 8, h: 8 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);

registerWidget({
  id: "terminal-watchlist",
  label: "Watchlist",
  description: "Instrument list grouped by category with search and one-click selection.",
  icon: Star,
  minW: 4,
  minH: 4,
  defaultW: 6,
  defaultH: 12,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "PLATFORM",
  catalogGroup: "Terminal",
  availableOn: ["terminal"],
  singleton: true,
  component: TerminalWatchlistWidget,
});

registerWidget({
  id: "order-book",
  label: "Order Book",
  description: "Live bid/ask ladder with depth visualization.",
  icon: BookOpen,
  minW: 4,
  minH: 2,
  defaultW: 6,
  defaultH: 8,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "PLATFORM",
  catalogGroup: "Terminal",
  availableOn: ["terminal"],
  singleton: false,
  component: OrderBookWidget,
});

registerWidget({
  id: "price-chart",
  label: "Price Chart",
  description: "Candlestick and line chart with technical indicators and timeframe controls.",
  icon: LineChart,
  minW: 6,
  minH: 2,
  defaultW: 12,
  defaultH: 8,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "PLATFORM",
  catalogGroup: "Terminal",
  availableOn: ["terminal"],
  singleton: false,
  component: PriceChartWidget,
});

registerWidget({
  id: "terminal-options",
  label: "Options Chain",
  description: "Options chain and volatility surface for the selected underlying.",
  icon: Layers2,
  minW: 8,
  minH: 4,
  defaultW: 16,
  defaultH: 8,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "PLATFORM",
  catalogGroup: "Terminal",
  availableOn: ["terminal"],
  singleton: false,
  component: TerminalOptionsWidget,
});

registerWidget({
  id: "order-entry",
  label: "Order Entry",
  description: "Buy/sell order form with strategy linking and constraint validation.",
  icon: ShoppingCart,
  minW: 6,
  minH: 6,
  defaultW: 8,
  defaultH: 8,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "PLATFORM",
  catalogGroup: "Terminal",
  availableOn: ["terminal"],
  singleton: true,
  component: OrderEntryWidget,
});

registerWidget({
  id: "market-trades",
  label: "Market Trades",
  description: "Real-time market trades and your own trade history.",
  icon: ArrowRightLeft,
  minW: 2,
  minH: 2,
  defaultW: 6,
  defaultH: 4,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "PLATFORM",
  catalogGroup: "Terminal",
  availableOn: ["terminal"],
  singleton: true,
  component: MarketTradesWidget,
});

registerWidget({
  id: "calendar-events",
  label: "Calendar Events",
  description: "Economic calendar and corporate actions feed.",
  icon: Calendar,
  minW: 6,
  minH: 2,
  defaultW: 12,
  defaultH: 3,
  assetGroup: "PLATFORM",
  catalogGroup: "Terminal",
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  availableOn: ["terminal", "overview"],
  singleton: true,
  component: CalendarEventsWidget,
});

registerWidget({
  id: "events-feed",
  label: "Events Feed",
  description: "Real-time system event stream with execution, risk, data, strategy, and system domain events.",
  icon: Radio,
  minW: 8,
  minH: 3,
  defaultW: 12,
  defaultH: 6,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  assetGroup: "PLATFORM",
  catalogGroup: "Terminal",
  availableOn: ["terminal", "overview", "strategies"],
  singleton: true,
  component: EventsFeedWidget,
});
