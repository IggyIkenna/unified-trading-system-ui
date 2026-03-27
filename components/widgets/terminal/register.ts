import { registerWidget } from "../widget-registry";
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

registerWidget({
  id: "instrument-bar",
  label: "Instrument & Account",
  description: "Instrument selector, account picker, live price, and quick actions.",
  icon: BarChart3,
  minW: 6,
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
  minW: 3,
  minH: 3,
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
  minW: 4,
  minH: 3,
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
  minW: 3,
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
  minW: 3,
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
  minW: 4,
  minH: 2,
  defaultW: 6,
  defaultH: 3,
  requiredEntitlements: ["data-basic", "data-pro"],
  availableOn: ["terminal", "overview"],
  singleton: true,
  component: CalendarEventsWidget,
});
