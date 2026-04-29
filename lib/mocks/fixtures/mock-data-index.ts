/**
 * Mock data access layer — provides scope-filtered seed data.
 *
 * Static seed data is committed to git (seed.ts).
 * Interactive state (workspace layouts, filter selections) is in localStorage
 * and can be reset via resetDemo().
 */

export * from "./mock-data-seed";

import {
  SEED_POSITIONS,
  SEED_ORDERS,
  SEED_TRADES,
  SEED_ALERTS,
  SEED_STRATEGIES,
  SEED_PNL_DAILY,
  type SeedPosition,
  type SeedOrder,
  type SeedTrade,
  type SeedAlert,
  type SeedStrategy,
  type SeedPnlDay,
} from "./mock-data-seed";

// ── Scope resolution ─────────────────────────────────────────────────────────

/** Resolve strategy IDs from org/client/strategy scope cascade */
function resolveStrategyIds(orgIds: readonly string[], clientIds: readonly string[], strategyIds: readonly string[]): string[] | null {
  // Explicit strategy filter takes priority
  if (strategyIds.length > 0) return [...strategyIds];

  // Client filter → get strategies for those clients
  if (clientIds.length > 0) {
    const ids = SEED_STRATEGIES.filter((s) => clientIds.includes(s.clientId)).map((s) => s.id);
    return ids.length > 0 ? ids : [];
  }

  // Org filter → get all strategies for those orgs
  if (orgIds.length > 0) {
    const ids = SEED_STRATEGIES.filter((s) => orgIds.includes(s.orgId)).map((s) => s.id);
    return ids.length > 0 ? ids : [];
  }

  // No filter → return null (show all)
  return null;
}

// ── Filtered accessors ───────────────────────────────────────────────────────

export function getPositionsForScope(orgIds: readonly string[], clientIds: readonly string[], strategyIds: readonly string[]): SeedPosition[] {
  const resolved = resolveStrategyIds(orgIds, clientIds, strategyIds);
  if (!resolved) return SEED_POSITIONS;
  return SEED_POSITIONS.filter((p) => resolved.includes(p.strategyId));
}

export function getOrdersForScope(orgIds: readonly string[], clientIds: readonly string[], strategyIds: readonly string[]): SeedOrder[] {
  const resolved = resolveStrategyIds(orgIds, clientIds, strategyIds);
  if (!resolved) return SEED_ORDERS;
  return SEED_ORDERS.filter((o) => resolved.includes(o.strategyId));
}

export function getTradesForScope(orgIds: readonly string[], clientIds: readonly string[], strategyIds: readonly string[]): SeedTrade[] {
  const resolved = resolveStrategyIds(orgIds, clientIds, strategyIds);
  if (!resolved) return SEED_TRADES;
  return SEED_TRADES.filter((t) => resolved.includes(t.strategyId));
}

/** Trades linked to a position row (drill-down). */
export function getTradesForPosition(positionId: string): SeedTrade[] {
  return SEED_TRADES.filter((t) => t.positionId === positionId);
}

export function getAlertsForScope(orgIds: readonly string[], clientIds: readonly string[], strategyIds: readonly string[]): SeedAlert[] {
  const resolved = resolveStrategyIds(orgIds, clientIds, strategyIds);
  if (!resolved) return SEED_ALERTS;
  return SEED_ALERTS.filter((a) => resolved.includes(a.strategyId));
}

export function getStrategiesForScope(orgIds: readonly string[], clientIds: readonly string[], strategyIds: readonly string[]): SeedStrategy[] {
  const resolved = resolveStrategyIds(orgIds, clientIds, strategyIds);
  if (!resolved) return SEED_STRATEGIES;
  return SEED_STRATEGIES.filter((s) => resolved.includes(s.id));
}

export function getPnlForScope(
  orgIds: readonly string[],
  clientIds: readonly string[],
  strategyIds: readonly string[],
): Record<string, SeedPnlDay[]> {
  const resolved = resolveStrategyIds(orgIds, clientIds, strategyIds);
  if (!resolved) return SEED_PNL_DAILY;
  const filtered: Record<string, SeedPnlDay[]> = {};
  for (const [key, value] of Object.entries(SEED_PNL_DAILY)) {
    if (resolved.includes(key)) filtered[key] = value;
  }
  return filtered;
}

/** Aggregate daily P&L across all in-scope strategies */
export function getAggregatedPnlForScope(orgIds: readonly string[], clientIds: readonly string[], strategyIds: readonly string[]): SeedPnlDay[] {
  const pnlMap = getPnlForScope(orgIds, clientIds, strategyIds);
  const daily = new Map<string, number>();
  for (const days of Object.values(pnlMap)) {
    for (const d of days) {
      daily.set(d.date, (daily.get(d.date) ?? 0) + d.pnl);
    }
  }
  return Array.from(daily.entries())
    .map(([date, pnl]) => ({ date, pnl: Math.round(pnl * 100) / 100 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
