import { useGlobalScope } from "@/lib/stores/global-scope-store";

/**
 * Returns the single active strategy_id from global scope, or undefined.
 *
 * The global scope holds a multi-select strategy filter. When exactly one
 * strategy is selected we treat it as "active" for order emission; zero or
 * many selections are ambiguous, so the widget should fall back to its own
 * default literal.
 */
export function useActiveStrategyId(): string | undefined {
  const strategyIds = useGlobalScope((s) => s.scope.strategyIds);
  return strategyIds.length === 1 ? strategyIds[0] : undefined;
}
