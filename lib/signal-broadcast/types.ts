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

/**
 * Three-way comparison across the full maturity ladder (backtest → paper → live)
 * over the SAME period window. Mirrors the DART trading-platform strategy
 * detail-page semantics (see lib/architecture-v2 StrategyMaturity ladder).
 *
 * `window_start` / `window_end` bound every metric on the row so numbers are
 * comparable. Paper metrics are null when the slot hasn't yet reached the
 * `PAPER_TRADING` maturity stage.
 */
export interface BacktestPaperLiveRow {
  readonly slot_label: string;
  readonly window_start: string;
  readonly window_end: string;
  readonly backtest_sharpe: number;
  readonly backtest_return_pct: number;
  readonly paper_sharpe: number | null;
  readonly paper_return_pct: number | null;
  readonly paper_signal_count: number | null;
  readonly live_signal_count: number;
  readonly live_signal_hit_rate: number;
  readonly live_return_pct: number | null;
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
