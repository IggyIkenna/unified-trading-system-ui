import { useFilterStore } from "./stores/filter-store";
import { useAuthStore } from "./stores/auth-store";
import { useUIPrefsStore } from "./stores/ui-prefs-store";
import { usePromoteLifecycleStore } from "./stores/promote-lifecycle-store";
import { useWorkspaceStore } from "./stores/workspace-store";
import { getQueryClient } from "./query-client";

/**
 * Reset all client-side state — Zustand stores, React Query cache, localStorage.
 *
 * Static seed data (lib/mock-data/) is committed and unaffected.
 * This only clears interactive/runtime state:
 *   - Workspace layouts and custom panels
 *   - Filter selections (org, client, strategy)
 *   - UI preferences
 *   - Auth state
 *   - React Query cache
 */
export function resetDemo() {
  useFilterStore.getState().reset();
  useAuthStore.getState().reset();
  useUIPrefsStore.getState().reset();
  usePromoteLifecycleStore.getState().reset();
  useWorkspaceStore.getState().reset();

  const qc = getQueryClient();
  qc.clear();

  localStorage.removeItem("nav-preference");
  localStorage.removeItem("unified-ui-prefs");
  localStorage.removeItem("unified-global-scope");
  localStorage.removeItem("unified-workspace-layouts");

  window.location.href = "/";
}
