import { create } from "zustand"

export interface UIPrefsState {
  /** Sidebar collapsed state */
  sidebarCollapsed: boolean
  /** Current theme (dark is the only supported theme for now) */
  theme: "dark"
  /** Show debug panel */
  showDebugPanel: boolean

  toggleSidebar: () => void
  toggleDebugPanel: () => void
  reset: () => void
}

const initialState = {
  sidebarCollapsed: false,
  theme: "dark" as const,
  showDebugPanel: false,
}

export const useUIPrefsStore = create<UIPrefsState>((set) => ({
  ...initialState,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleDebugPanel: () => set((s) => ({ showDebugPanel: !s.showDebugPanel })),
  reset: () => set(initialState),
}))
