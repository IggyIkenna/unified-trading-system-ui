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
      { widgetId: "terminal-watchlist", instanceId: "terminal-watchlist-1", x: 0, y: 0, w: 3, h: 12 },
      { widgetId: "order-book", instanceId: "order-book-1", x: 3, y: 0, w: 2, h: 8 },
      { widgetId: "price-chart", instanceId: "price-chart-1", x: 5, y: 0, w: 4, h: 8 },
      { widgetId: "order-entry", instanceId: "order-entry-1", x: 9, y: 0, w: 3, h: 8 },
      { widgetId: "market-trades", instanceId: "market-trades-1", x: 3, y: 8, w: 4, h: 4 },
      { widgetId: "calendar-events", instanceId: "calendar-events-1", x: 7, y: 8, w: 5, h: 4 },
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
      { widgetId: "terminal-watchlist", instanceId: "terminal-watchlist-full", x: 0, y: 0, w: 3, h: 12 },
      { widgetId: "order-book", instanceId: "order-book-full", x: 3, y: 0, w: 2, h: 8 },
      { widgetId: "price-chart", instanceId: "price-chart-full", x: 5, y: 0, w: 4, h: 8 },
      { widgetId: "order-entry", instanceId: "order-entry-full", x: 9, y: 0, w: 3, h: 8 },
      { widgetId: "market-trades", instanceId: "market-trades-full", x: 3, y: 8, w: 4, h: 4 },
      { widgetId: "calendar-events", instanceId: "calendar-events-full", x: 7, y: 8, w: 5, h: 4 },
      { widgetId: "terminal-options", instanceId: "terminal-options-full", x: 0, y: 12, w: 8, h: 8 },
      { widgetId: "events-feed", instanceId: "events-feed-full", x: 0, y: 20, w: 6, h: 6 },
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
  minW: 2,
  minH: 4,
  defaultW: 3,
  defaultH: 12,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Terminal",
  availableOn: ["terminal"],
  singleton: true,
  component: TerminalWatchlistWidget,
});

registerWidget({
  id: "order-book",
  label: "Order Book",
  description: "Live bid/ask ladder with depth visualization.",
  icon: BookOpen,
  minW: 2,
  minH: 2,
  defaultW: 3,
  defaultH: 8,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Terminal",
  availableOn: ["terminal"],
  singleton: false,
  component: OrderBookWidget,
});

registerWidget({
  id: "price-chart",
  label: "Price Chart",
  description: "Candlestick and line chart with technical indicators and timeframe controls.",
  icon: LineChart,
  minW: 3,
  minH: 2,
  defaultW: 6,
  defaultH: 8,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Terminal",
  availableOn: ["terminal"],
  singleton: false,
  component: PriceChartWidget,
});

registerWidget({
  id: "terminal-options",
  label: "Options Chain",
  description: "Options chain and volatility surface for the selected underlying.",
  icon: Layers2,
  minW: 4,
  minH: 4,
  defaultW: 8,
  defaultH: 8,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Terminal",
  availableOn: ["terminal"],
  singleton: false,
  component: TerminalOptionsWidget,
});

registerWidget({
  id: "order-entry",
  label: "Order Entry",
  description: "Buy/sell order form with strategy linking and constraint validation.",
  icon: ShoppingCart,
  minW: 2,
  minH: 3,
  defaultW: 3,
  defaultH: 8,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Terminal",
  availableOn: ["terminal"],
  singleton: true,
  component: OrderEntryWidget,
});

registerWidget({
  id: "market-trades",
  label: "Market Trades",
  description: "Real-time market trades and your own trade history.",
  icon: ArrowRightLeft,
  minW: 1,
  minH: 2,
  defaultW: 3,
  defaultH: 4,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Terminal",
  availableOn: ["terminal"],
  singleton: true,
  component: MarketTradesWidget,
});

registerWidget({
  id: "calendar-events",
  label: "Calendar Events",
  description: "Economic calendar and corporate actions feed.",
  icon: Calendar,
  minW: 3,
  minH: 2,
  defaultW: 6,
  defaultH: 3,
  category: "Terminal",
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
  minW: 4,
  minH: 3,
  defaultW: 6,
  defaultH: 6,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Terminal",
  availableOn: ["terminal", "overview", "strategies"],
  singleton: true,
  component: EventsFeedWidget,
});
