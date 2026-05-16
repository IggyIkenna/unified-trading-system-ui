/**
 * Scope filtering helpers — derive client/strategy sets from global scope org IDs.
 *
 * The hierarchy is: Organization -> Client -> Strategy.
 *   - ORGANIZATIONS[].id === CLIENTS[].orgId
 *   - CLIENTS[].id === Strategy.clientId (from lib/mocks/fixtures/strategy-instances)
 *
 * These helpers let any data context resolve "which strategies belong to the
 * selected organisations" without duplicating the lookup logic.
 *
 * Inputs are `readonly string[]` to match the unified `WorkspaceScope` shape
 * (Phase 1 of dart_ux_cockpit_refactor_2026_04_29.plan).
 */

import type { WorkspaceScope } from "@/lib/architecture-v2/workspace-scope";
import { STRATEGIES } from "@/lib/mocks/fixtures/strategy-instances";
import { CLIENTS } from "@/lib/mocks/fixtures/trading-data";

/** Return client IDs that belong to the given organisation IDs. */
export function getClientIdsForOrgs(orgIds: readonly string[]): string[] {
  if (orgIds.length === 0) return [];
  return CLIENTS.filter((c) => orgIds.includes(c.orgId)).map((c) => c.id);
}

/** Return strategy IDs that belong to the given client IDs. */
export function getStrategyIdsForClients(clientIds: readonly string[]): string[] {
  if (clientIds.length === 0) return [];
  return STRATEGIES.filter((s) => clientIds.includes(s.clientId)).map((s) => s.id);
}

/** Return strategy IDs that match the full scope cascade: org -> client -> strategy. */
export function getStrategyIdsForScope(
  scope: Pick<WorkspaceScope, "organizationIds" | "clientIds" | "strategyIds">,
): string[] {
  // If explicit strategy IDs are set, those take highest precedence.
  if (scope.strategyIds.length > 0) return [...scope.strategyIds];

  // Resolve client IDs from org IDs (or use explicit client IDs).
  let effectiveClientIds: readonly string[] = scope.clientIds;
  if (effectiveClientIds.length === 0 && scope.organizationIds.length > 0) {
    effectiveClientIds = getClientIdsForOrgs(scope.organizationIds);
  }

  if (effectiveClientIds.length > 0) {
    return getStrategyIdsForClients(effectiveClientIds);
  }

  // No scope restrictions — return empty array meaning "show all".
  return [];
}

/**
 * Deterministic seed from org IDs — lets mock generators produce different
 * numbers per organisation while staying deterministic.
 */
export function orgSeed(orgIds: readonly string[]): number {
  if (orgIds.length === 0) return 0;
  let h = 0;
  const key = [...orgIds].sort().join(",");
  for (let i = 0; i < key.length; i++) {
    h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  }
  return (h >>> 0) / 4294967296;
}
