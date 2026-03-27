import type { Workspace } from "@/lib/stores/workspace-store";

export const OVERVIEW_PRESETS: Workspace[] = [
  {
    id: "overview-default",
    name: "Default",
    tab: "overview",
    isPreset: true,
    layouts: [
      { widgetId: "scope-summary", instanceId: "scope-summary-1", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "pnl-chart", instanceId: "pnl-chart-1", x: 0, y: 2, w: 12, h: 4 },
      { widgetId: "kpi-strip", instanceId: "kpi-strip-1", x: 0, y: 6, w: 12, h: 2 },
      { widgetId: "strategy-table", instanceId: "strategy-table-1", x: 0, y: 8, w: 12, h: 4 },
      { widgetId: "pnl-attribution", instanceId: "pnl-attribution-1", x: 0, y: 12, w: 3, h: 3 },
      { widgetId: "alerts-preview", instanceId: "alerts-preview-1", x: 3, y: 12, w: 3, h: 3 },
      { widgetId: "recent-fills", instanceId: "recent-fills-1", x: 6, y: 12, w: 3, h: 3 },
      { widgetId: "health-grid", instanceId: "health-grid-1", x: 9, y: 12, w: 3, h: 3 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "overview-blank",
    name: "Blank Canvas",
    tab: "overview",
    isPreset: true,
    layouts: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

export const TERMINAL_PRESETS: Workspace[] = [
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
  {
    id: "terminal-blank",
    name: "Blank Canvas",
    tab: "terminal",
    isPreset: true,
    layouts: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];
