import { Building2, ClipboardPen, FileText, History, Settings2, ShieldCheck } from "lucide-react";
import { registerPresets } from "../preset-registry";
import { registerWidget } from "../widget-registry";
import { BookAlgoConfigWidget } from "./book-algo-config-widget";
import { BookHierarchyBarWidget } from "./book-hierarchy-bar-widget";
import { BookOrderFormWidget } from "./book-order-form-widget";
import { BookPreviewComplianceWidget } from "./book-preview-compliance-widget";
import { BookRecordDetailsWidget } from "./book-record-details-widget";
import { BookTradeHistoryWidget } from "./book-trade-history-widget";

registerPresets("book", [
  {
    id: "book-default",
    name: "Default",
    tab: "book",
    isPreset: true,
    layouts: [
      { widgetId: "book-trade-history", instanceId: "book-trade-history-1", x: 0, y: 0, w: 12, h: 8 },
      { widgetId: "book-hierarchy-bar", instanceId: "book-hierarchy-bar-1", x: 0, y: 8, w: 12, h: 1 },
      { widgetId: "book-order-form", instanceId: "book-order-form-1", x: 0, y: 9, w: 6, h: 8 },
      { widgetId: "book-algo-config", instanceId: "book-algo-config-1", x: 6, y: 9, w: 6, h: 4 },
      { widgetId: "book-record-details", instanceId: "book-record-details-1", x: 6, y: 13, w: 6, h: 3 },
      { widgetId: "book-preview-compliance", instanceId: "book-preview-compliance-1", x: 6, y: 16, w: 6, h: 5 },
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
      { widgetId: "book-hierarchy-bar", instanceId: "book-hierarchy-bar-full", x: 0, y: 0, w: 12, h: 1 },
      { widgetId: "book-order-form", instanceId: "book-order-form-full", x: 0, y: 1, w: 6, h: 8 },
      { widgetId: "book-algo-config", instanceId: "book-algo-config-full", x: 6, y: 1, w: 6, h: 4 },
      { widgetId: "book-record-details", instanceId: "book-record-details-full", x: 0, y: 9, w: 6, h: 3 },
      { widgetId: "book-preview-compliance", instanceId: "book-preview-compliance-full", x: 6, y: 9, w: 6, h: 5 },
      { widgetId: "book-trade-history", instanceId: "book-trade-history-full", x: 0, y: 14, w: 12, h: 8 },
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
  minW: 6,
  minH: 4,
  defaultW: 12,
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
  minW: 6,
  minH: 1,
  defaultW: 12,
  defaultH: 1,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Trade Booking",
  availableOn: ["book"],
  singleton: true,
  component: BookHierarchyBarWidget,
});

registerWidget({
  id: "book-order-form",
  label: "Book Order Entry",
  description: "Core order form: mode toggle, category, venue, instrument, side, qty, price",
  icon: ClipboardPen,
  minW: 4,
  minH: 5,
  defaultW: 6,
  defaultH: 8,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Trade Booking",
  availableOn: ["book"],
  singleton: true,
  component: BookOrderFormWidget,
});

registerWidget({
  id: "book-algo-config",
  label: "Algo Configuration",
  description: "Algorithm selector + conditional params (TWAP/VWAP duration, iceberg display qty, benchmark)",
  icon: Settings2,
  minW: 3,
  minH: 3,
  defaultW: 6,
  defaultH: 4,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Trade Booking",
  availableOn: ["book"],
  singleton: true,
  component: BookAlgoConfigWidget,
});

registerWidget({
  id: "book-record-details",
  label: "Record Details",
  description: "Counterparty, source reference, fee fields for record-only mode",
  icon: FileText,
  minW: 3,
  minH: 3,
  defaultW: 6,
  defaultH: 3,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Trade Booking",
  availableOn: ["book"],
  singleton: true,
  component: BookRecordDetailsWidget,
});

registerWidget({
  id: "book-preview-compliance",
  label: "Preview & Compliance",
  description: "Order preview grid + pre-trade compliance checks with pass/fail badges",
  icon: ShieldCheck,
  minW: 4,
  minH: 3,
  defaultW: 6,
  defaultH: 5,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Trade Booking",
  availableOn: ["book"],
  singleton: true,
  component: BookPreviewComplianceWidget,
});
