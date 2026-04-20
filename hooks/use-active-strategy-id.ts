import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { parseSlotLabel, type ParsedSlotLabel } from "@/lib/types/defi";

/**
 * Returns the single active strategy_id from global scope, or undefined.
 *
 * The global scope holds a multi-select strategy filter. When exactly one
 * strategy is selected we treat it as "active" for order emission; zero or
 * many selections are ambiguous, so the widget should fall back to its own
 * default literal.
 *
 * The value may be either a legacy venue-id (e.g. "AAVE_LENDING") or a
 * canonical slot-label (`{ARCHETYPE}@{slot}-{env}`). Callers that need the
 * archetype component should prefer `useActiveStrategy()` below.
 */
export function useActiveStrategyId(): string | undefined {
  const strategyIds = useGlobalScope((s) => s.scope.strategyIds);
  return strategyIds.length === 1 ? strategyIds[0] : undefined;
}

/**
 * Returns the active strategy_id parsed into `{ archetype, slot, env }` when
 * it matches the slot-label grammar, or `undefined` otherwise (no selection
 * or legacy venue-id that does not parse).
 *
 * Most widgets only consume `.archetype`; use `.raw` when passing the full
 * slot-label through to order emission.
 */
export function useActiveStrategy(): ParsedSlotLabel | undefined {
  return parseSlotLabel(useActiveStrategyId());
}
