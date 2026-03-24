import { useFilterStore } from "./stores/filter-store";
import { useAuthStore } from "./stores/auth-store";
import { useUIPrefsStore } from "./stores/ui-prefs-store";
import { getQueryClient } from "./query-client";

/**
 * Reset all client-side state — Zustand stores, React Query cache, localStorage.
 */
export function resetDemo() {
  useFilterStore.getState().reset();
  useAuthStore.getState().reset();
  useUIPrefsStore.getState().reset();

  const qc = getQueryClient();
  qc.clear();

  localStorage.removeItem("nav-preference");
  localStorage.removeItem("unified-ui-prefs");
  localStorage.removeItem("unified-global-scope");

  window.location.href = "/";
}
