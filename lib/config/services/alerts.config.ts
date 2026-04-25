import type { ExportColumn } from "@/lib/utils/export";

/** Alert classification drawn from unified-api-contracts risk + DeFi enums. */
export type AlertType =
  // Risk engine (unified_api_contracts/internal/risk.py AlertType enum)
  | "PRE_TRADE_REJECTION"
  | "RISK_WARNING"
  | "RISK_CRITICAL"
  | "EXPOSURE_BREACH"
  | "MARGIN_WARNING"
  | "LIQUIDATION_RISK"
  | "DRAWDOWN_LIMIT"
  | "CONCENTRATION_LIMIT"
  // DeFi (unified_api_contracts/canonical/crosscutting/errors/defi.py DefiAlertType enum)
  | "HEALTH_FACTOR_CRITICAL"
  | "POSITION_LIQUIDATED"
  | "WEETH_DEPEG"
  | "AAVE_UTILIZATION_SPIKE"
  | "FUNDING_RATE_FLIP"
  | "FEATURE_STALE"
  | "TX_SIMULATION_FAILED"
  | "RATE_DEVIATION"
  // Catch-all for alerts that don't map to a contract enum value
  | "GENERIC";

/**
 * Mock values for the alerts KPI strip until the alerts summary API
 * returns average-resolution and 24h-total metrics. See
 * docs/manifest/widget-certification/alerts-kpi-strip.json (knownIssue L1.7).
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
