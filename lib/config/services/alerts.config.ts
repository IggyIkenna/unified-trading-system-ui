import type { ExportColumn } from "@/lib/utils/export";

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
