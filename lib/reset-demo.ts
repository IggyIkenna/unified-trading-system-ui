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

  // Clear React Query cache
  const qc = getQueryClient()
  qc.clear()

  // Clear localStorage
  localStorage.removeItem("portal_user")
  localStorage.removeItem("portal_token")
  localStorage.removeItem("odum_user")
  localStorage.removeItem("nav-preference")
  localStorage.removeItem("unified-ui-prefs")
  localStorage.removeItem("unified-global-scope")

  // Reload to fresh state
  window.location.href = "/"
}
