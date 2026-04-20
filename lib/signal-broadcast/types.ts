/**
 * TypeScript mirrors of UAC `unified_api_contracts.internal.domain.signal_broadcast`
 * Python types. Names MUST stay aligned with the Python SSOT; regenerate if
 * the upstream contracts change.
 *
 * Python SSOT:
 *   unified-api-contracts/unified_api_contracts/internal/domain/signal_broadcast/
 */

export type CounterpartyId = string;

export type SchemaDepth = "MINIMAL" | "STANDARD" | "RICH";

export type DeliveryStatus =
  | "delivered"
  | "retrying"
  | "failed"
  | "pending";

export type AckStatus = "received" | "processed" | "rejected";

export interface Counterparty {
  readonly id: CounterpartyId;
  readonly name: string;
  readonly endpoint: string;
  readonly schema_depth: SchemaDepth;
  readonly active: boolean;
  readonly allowed_slots: readonly string[];
  readonly rate_limit_per_strategy_per_sec: number;
  readonly pnl_reporting_enabled: boolean;
}

export interface SignalEmission {
  readonly emission_id: string;
  readonly strategy_id: string;
  readonly slot_label: string;
  readonly counterparty_id: CounterpartyId;
  readonly emission_timestamp: string;
  readonly schema_depth: SchemaDepth;
  /**
   * Human-readable summary of the payload envelope (not the full payload — the
   * UI surface is observability, not data egress).
   */
  readonly signal_payload_summary: string;
  readonly delivery_status: DeliveryStatus;
  readonly delivery_attempt: number;
  readonly idempotency_key: string;
}

export interface BacktestVsLiveRow {
  readonly slot_label: string;
  readonly backtest_sharpe: number;
  readonly backtest_return_pct: number;
  readonly live_signal_count: number;
  readonly live_signal_hit_rate: number;
}

export interface DeliveryHealth {
  readonly success_rate: number;
  readonly retries_24h: number;
  readonly avg_latency_ms: number;
  readonly last_delivery_at: string;
  readonly total_deliveries_24h: number;
}

export interface PnlAttributionRow {
  readonly slot_label: string;
  readonly reported_pnl_usd: number;
  readonly reported_signal_count: number;
  readonly reporting_window_start: string;
  readonly reporting_window_end: string;
}
