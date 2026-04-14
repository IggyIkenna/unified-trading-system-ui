import { useFilterStore } from "./stores/filter-store";
import { useAuthStore } from "./stores/auth-store";
import { useUIPrefsStore } from "./stores/ui-prefs-store";
import { usePromoteLifecycleStore } from "./stores/promote-lifecycle-store";
import { useWorkspaceStore } from "./stores/workspace-store";
import { getQueryClient } from "./query-client";
import { resetMockOrders } from "./api/mock-trade-ledger";
import { resetDefiStrategyConfigs } from "./stores/defi-strategy-store";

/**
 * Reset all client-side state — Zustand stores, React Query cache, localStorage,
 * mock trade ledger, and DeFi strategy configs.
 *
 * Static seed data (lib/mocks/fixtures/mock-data-seed) is committed and unaffected.
 * This resets interactive/runtime state to clean defaults.
 */
export function resetDemo() {
  useFilterStore.getState().reset();
  useAuthStore.getState().reset();
  useUIPrefsStore.getState().reset();
  usePromoteLifecycleStore.getState().reset();
  useWorkspaceStore.getState().reset();

  // Reset mock trade ledger (DeFi + CeFi orders) back to seed defaults
  resetMockOrders();

  // Reset DeFi strategy configurations
  resetDefiStrategyConfigs();

  const qc = getQueryClient();
  qc.clear();

  localStorage.removeItem("nav-preference");
  localStorage.removeItem("unified-ui-prefs");
  localStorage.removeItem("unified-global-scope");
  localStorage.removeItem("unified-workspace-layouts");

  window.location.href = "/";
}
