import { registerWidget } from "../widget-registry";
import { registerPresets } from "../preset-registry";
import {
  BarChart3,
  LineChart,
  BookOpen,
  ShoppingCart,
  ArrowRightLeft,
  Calendar,
  Layers,
  BarChart2,
} from "lucide-react";
import { InstrumentBarWidget } from "./instrument-bar-widget";
import { OrderBookWidget } from "./order-book-widget";
import { PriceChartWidget } from "./price-chart-widget";
import { OrderEntryWidget } from "./order-entry-widget";
import { MarketTradesWidget } from "./market-trades-widget";
import { CalendarEventsWidget } from "./calendar-events-widget";

registerPresets("terminal", [
  {
    id: "terminal-default",
    name: "Default",
    tab: "terminal",
    isPreset: true,
    layouts: [
      { widgetId: "instrument-bar", instanceId: "instrument-bar-1", x: 0, y: 0, w: 12, h: 1 },
      { widgetId: "order-book", instanceId: "order-book-1", x: 0, y: 1, w: 3, h: 8 },
      { widgetId: "price-chart", instanceId: "price-chart-1", x: 3, y: 1, w: 6, h: 8 },
      { widgetId: "order-entry", instanceId: "order-entry-1", x: 9, y: 1, w: 3, h: 8 },
      { widgetId: "market-trades", instanceId: "market-trades-1", x: 0, y: 9, w: 6, h: 3 },
      { widgetId: "calendar-events", instanceId: "calendar-events-1", x: 6, y: 9, w: 6, h: 3 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);

registerWidget({
  id: "instrument-bar",
  label: "Instrument & Account",
  description: "Instrument selector, account picker, live price, and quick actions.",
  icon: BarChart3,
  minW: 4,
  minH: 1,
  defaultW: 12,
  defaultH: 1,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["terminal"],
  singleton: true,
  component: InstrumentBarWidget,
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
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["terminal"],
  singleton: false,
  component: OrderBookWidget,
});

registerWidget({
  id: "price-chart",
  label: "Price Chart",
  description: "Candlestick, line, depth, or options chain chart with indicators.",
  icon: LineChart,
  minW: 3,
  minH: 2,
  defaultW: 6,
  defaultH: 8,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["terminal"],
  singleton: false,
  component: PriceChartWidget,
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
  requiredEntitlements: ["execution-basic", "execution-full"],
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
  defaultH: 3,
  requiredEntitlements: ["execution-basic", "execution-full"],
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
  requiredEntitlements: ["data-basic", "data-pro"],
  availableOn: ["terminal", "overview"],
  singleton: true,
  component: CalendarEventsWidget,
});
