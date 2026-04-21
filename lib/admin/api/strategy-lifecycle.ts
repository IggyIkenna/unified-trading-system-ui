/**
 * Strategy-instance lifecycle API client.
 *
 * Wraps `unified-trading-api` endpoints under `/api/v1/registry/strategy-instances`
 * (SSOT: `unified-trading-api/unified_trading_api/routes/registry.py`).
 * Firestore owns the mutable lifecycle state (`strategy_instance_lifecycle/{id}`);
 * UAC owns the immutable catalogue.
 */

import { apiClient } from "@/lib/admin/api/client";
import type {
  ProductRouting,
  StrategyMaturityPhase,
} from "@/lib/architecture-v2/lifecycle";

export interface LifecyclePhaseHistoryRow {
  readonly from_phase: StrategyMaturityPhase | null;
  readonly to_phase: StrategyMaturityPhase;
  readonly transitioned_at_utc: string;
  readonly transitioned_by: string;
  readonly rationale: string;
}

export interface LifecycleRecord {
  readonly instance_id: string;
  readonly maturity_phase?: StrategyMaturityPhase;
  readonly product_routing?: ProductRouting;
  readonly available_since?: string | null;
  readonly phased_at?: string | null;
  readonly phase_history?: readonly LifecyclePhaseHistoryRow[];
  // Firestore adds `id` alongside `instance_id`; include for completeness.
  readonly id?: string;
}

export interface LifecyclePatchBody {
  readonly maturity_phase?: StrategyMaturityPhase;
  readonly product_routing?: ProductRouting;
  readonly rationale?: string;
}

/** List every lifecycle record. Empty collection returns []. */
export async function listStrategyInstanceLifecycles(): Promise<LifecycleRecord[]> {
  const { data } = await apiClient.get<LifecycleRecord[]>(
    "/registry/strategy-instances/lifecycle",
  );
  // apiClient wraps the payload → the server returns `{data: [...]}` which
  // becomes `data: {data: [...]}` here after apiClient's own `{data}` wrap.
  // Unwrap one level: the inner payload IS the list we want.
  const payload = data as unknown as { data: LifecycleRecord[] } | LifecycleRecord[];
  return Array.isArray(payload) ? payload : payload.data;
}

/** Fetch one lifecycle record. Throws on 404. */
export async function getStrategyInstanceLifecycle(
  instanceId: string,
): Promise<LifecycleRecord> {
  const { data } = await apiClient.get<LifecycleRecord>(
    `/registry/strategy-instances/${encodeURIComponent(instanceId)}/lifecycle`,
  );
  const payload = data as unknown as { data: LifecycleRecord } | LifecycleRecord;
  return "instance_id" in (payload as LifecycleRecord)
    ? (payload as LifecycleRecord)
    : (payload as { data: LifecycleRecord }).data;
}

/**
 * Transition maturity phase and/or product routing for one instance.
 * Server validates forward-only ladder + `retired` terminal. Body must contain
 * at least one of `maturity_phase` or `product_routing`.
 */
export async function patchStrategyInstanceLifecycle(
  instanceId: string,
  body: LifecyclePatchBody,
): Promise<LifecycleRecord> {
  const { data } = await apiClient.patch<LifecycleRecord>(
    `/registry/strategy-instances/${encodeURIComponent(instanceId)}/lifecycle`,
    body,
  );
  const payload = data as unknown as { data: LifecycleRecord } | LifecycleRecord;
  return "instance_id" in (payload as LifecycleRecord)
    ? (payload as LifecycleRecord)
    : (payload as { data: LifecycleRecord }).data;
}
