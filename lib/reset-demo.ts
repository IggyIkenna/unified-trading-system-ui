import { resetState as resetMockProvisioningState } from "./api/mock-provisioning-state"
import { resetOnboardingState } from "./api/mock-onboarding-state"
import { resetMockOrders } from "./api/mock-trade-ledger"
import { useFilterStore } from "./stores/filter-store"
import { useAuthStore } from "./stores/auth-store"
import { useUIPrefsStore } from "./stores/ui-prefs-store"
import { getQueryClient } from "./query-client"

/**
 * Reset all demo state — Zustand stores, React Query cache, localStorage.
 * Wire this to a "Reset Demo" button in the shell debug panel.
 */
export function resetDemo() {
  // Reset Zustand stores
  useFilterStore.getState().reset()
  useAuthStore.getState().reset()
  useUIPrefsStore.getState().reset()

  // Stateful mock: admin users, access requests, etc. (`mock-provisioning-state` in localStorage)
  resetMockProvisioningState()

  // Stateful mock: onboarding applications and documents (`mock-onboarding-state` in localStorage)
  resetOnboardingState()

  // Stateful mock: trade ledger orders (`mock-trade-ledger` in localStorage)
  resetMockOrders()

  // Clear React Query cache
  const qc = getQueryClient()
  qc.clear()

  // Clear localStorage (auth + UI prefs; provisioning reset above rewrites its key)
  localStorage.removeItem("portal_user")
  localStorage.removeItem("portal_token")
  localStorage.removeItem("odum_user")
  localStorage.removeItem("nav-preference")
  localStorage.removeItem("unified-ui-prefs")
  localStorage.removeItem("unified-global-scope")

  // Reload to fresh state
  window.location.href = "/"
}
