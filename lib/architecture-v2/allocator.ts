import type { AllocatorArchetype, ShareClass } from "./enums";

/**
 * Allocator UI types + fixture schema.
 *
 * SSOT: `unified-api-contracts/unified_api_contracts/internal/architecture_v2/schemas.py`
 * (AllocationDirective, StrategyEquityDirective, AllocatorArchetype).
 *
 * The portfolio-allocator-service (phase 5) will publish `AllocationDirective`
 * events with the payload shape below. These TS types mirror the Python
 * dataclass fields so the UI can consume the same JSON once the service is
 * live. Until then the mock fixtures use this shape.
 */

export type AllocatorCadence = "DAILY" | "HOURLY" | "WEEKLY" | "ON_EVENT";

export type AllocatorMode = "PRIMARY" | "SHADOW";

export type AllocatorInstanceStatus = "ACTIVE" | "PAUSED" | "PENDING_APPROVAL";

export interface AllocatorGuardRails {
  max_weight: number;
  min_weight: number;
  max_turnover_pct: number;
  correlation_cap: number;
  family_diversification: boolean;
  category_diversification: boolean;
}

export interface AllocatorInstance {
  allocator_instance_id: string;
  client_id: string;
  client_name: string;
  archetype: AllocatorArchetype;
  mode: AllocatorMode;
  cadence: AllocatorCadence;
  share_class: ShareClass;
  status: AllocatorInstanceStatus;
  managed_strategy_instance_ids: readonly string[];
  guard_rails: AllocatorGuardRails;
  last_directive_at: string | null;
  total_managed_nav_usd: number;
  partner_primary_id?: string;
}

export interface StrategyEquityDirectivePayload {
  strategy_instance_id: string;
  target_equity_usd: number;
  weight: number;
  previous_weight: number;
}

export interface AllocationDirective {
  directive_id: string;
  allocator_instance_id: string;
  client_id: string;
  emitted_at: string;
  cadence_trigger: AllocatorCadence;
  archetype: AllocatorArchetype;
  mode: AllocatorMode;
  share_class: ShareClass;
  equity_directives: readonly StrategyEquityDirectivePayload[];
  total_nav_usd: number;
  approved: boolean;
  approved_by: string | null;
  notes: string | null;
}

export interface ShadowCompareRow {
  strategy_instance_id: string;
  primary_weight: number;
  shadow_weight: number;
  abs_diff_bps: number;
}

export interface ManualApprovalQueueItem {
  directive_id: string;
  allocator_instance_id: string;
  client_id: string;
  client_name: string;
  archetype: AllocatorArchetype;
  emitted_at: string;
  proposed_total_nav_usd: number;
  num_strategies: number;
  age_minutes: number;
}
