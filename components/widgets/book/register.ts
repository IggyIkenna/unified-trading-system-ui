import { Building2, ClipboardPen, History } from "lucide-react";
import { registerPresets } from "../preset-registry";
import { registerWidget } from "../widget-registry";
import { BookHierarchyBarWidget } from "./book-hierarchy-bar-widget";
import { BookOrderEntryWidget } from "./book-order-entry-widget";
import { BookTradeHistoryWidget } from "./book-trade-history-widget";

registerPresets("book", [
  {
    id: "book-default",
    name: "Default",
    tab: "book",
    isPreset: true,
    layouts: [
      // Hierarchy selector up top; order entry (16) + trade history (8) side-by-side so
      // the form doesn't stretch absurdly wide on 2K monitors and the trade history
      // stays visible without scrolling.
      { widgetId: "book-hierarchy-bar", instanceId: "book-hierarchy-bar-1", x: 0, y: 0, w: 24, h: 1 },
      { widgetId: "book-order-entry", instanceId: "book-order-entry-1", x: 0, y: 1, w: 16, h: 14 },
      { widgetId: "book-trade-history", instanceId: "book-trade-history-1", x: 16, y: 1, w: 8, h: 14 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "book-full",
    name: "Full",
    tab: "book",
    isPreset: true,
    layouts: [
      { widgetId: "book-hierarchy-bar", instanceId: "book-hierarchy-bar-full", x: 0, y: 0, w: 24, h: 1 },
      { widgetId: "book-order-entry", instanceId: "book-order-entry-full", x: 0, y: 1, w: 16, h: 13 },
      { widgetId: "book-trade-history", instanceId: "book-trade-history-full", x: 16, y: 1, w: 8, h: 13 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);

registerWidget({
  id: "book-trade-history",
  label: "Trade History",
  description: "Table of executed trades with search, sort, and filtering",
  icon: History,
  minW: 12,
  minH: 4,
  defaultW: 24,
  defaultH: 8,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Trade Booking",
  availableOn: ["book"],
  singleton: true,
  component: BookTradeHistoryWidget,
});

registerWidget({
  id: "book-hierarchy-bar",
  label: "Hierarchy Selector",
  description: "Org → Client → Strategy selector strip",
  icon: Building2,
  minW: 12,
  minH: 1,
  defaultW: 24,
  defaultH: 1,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Trade Booking",
  availableOn: ["book"],
  singleton: true,
  component: BookHierarchyBarWidget,
});

registerWidget({
  id: "book-order-entry",
  label: "Book Order Entry",
  description: "Full trade booking workflow: form, algo config, record-only details, preview & compliance",
  icon: ClipboardPen,
  minW: 12,
  minH: 10,
  defaultW: 24,
  defaultH: 14,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Trade Booking",
  availableOn: ["book"],
  singleton: true,
  component: BookOrderEntryWidget,
});
