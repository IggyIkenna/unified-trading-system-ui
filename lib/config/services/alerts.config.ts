import type { ExportColumn } from "@/lib/utils/export";

/**
 * Mock values for the alerts KPI strip until the alerts summary API
 * returns average-resolution and 24h-total metrics. See
 * docs/widget-certification/alerts-kpi-strip.json (knownIssue L1.7).
 */
export const MOCK_AVG_RESOLUTION_DISPLAY = "12m";
export const MOCK_LAST_24H_DISPLAY = "23";

export const ALERT_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "severity", header: "Severity" },
  { key: "status", header: "Status" },
  { key: "title", header: "Title" },
  { key: "source", header: "Source" },
  { key: "entity", header: "Entity" },
  { key: "value", header: "Value", format: "number" },
  { key: "threshold", header: "Threshold", format: "number" },
  { key: "timestamp", header: "Timestamp" },
];
