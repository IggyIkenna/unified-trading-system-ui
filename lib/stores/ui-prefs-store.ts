import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UIPrefsState {
  /** Sidebar collapsed state */
  sidebarCollapsed: boolean;
  /** Current theme (dark is the only supported theme for now) */
  theme: "dark";
  /** Show debug panel */
  showDebugPanel: boolean;
  /** Last visited page path — set by the shell on navigation */
  lastVisitedPage: string | null;
  /** Per-table column visibility keyed by table ID */
  columnPreferences: Record<string, string[]>;
  /** Panel sizes for react-resizable-panels layouts */
  panelSizes: Record<string, number[]>;

  toggleSidebar: () => void;
  toggleDebugPanel: () => void;
  setLastVisitedPage: (path: string) => void;
  setColumnPreferences: (tableId: string, columns: string[]) => void;
  setPanelSizes: (panelId: string, sizes: number[]) => void;
  resetPreferences: () => void;
  reset: () => void;
}

const STORAGE_KEY = "unified-ui-prefs";

const initialState = {
  sidebarCollapsed: false,
  theme: "dark" as const,
  showDebugPanel: false,
  lastVisitedPage: null as string | null,
  columnPreferences: {} as Record<string, string[]>,
  panelSizes: {} as Record<string, number[]>,
};

export const useUIPrefsStore = create<UIPrefsState>()(
  persist(
    (set) => ({
      ...initialState,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleDebugPanel: () => set((s) => ({ showDebugPanel: !s.showDebugPanel })),
      setLastVisitedPage: (path) => set({ lastVisitedPage: path }),
      setColumnPreferences: (tableId, columns) =>
        set((s) => ({
          columnPreferences: { ...s.columnPreferences, [tableId]: columns },
        })),
      setPanelSizes: (panelId, sizes) => set((s) => ({ panelSizes: { ...s.panelSizes, [panelId]: sizes } })),
      resetPreferences: () => {
        localStorage.removeItem(STORAGE_KEY);
        set(initialState);
      },
      reset: () => {
        localStorage.removeItem(STORAGE_KEY);
        set(initialState);
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        if (version < 1) {
          // v0 had no version — merge what we can, reset unknown fields.
          const s = (persistedState ?? {}) as Partial<typeof initialState>;
          return {
            ...initialState,
            sidebarCollapsed:
              typeof s.sidebarCollapsed === "boolean" ? s.sidebarCollapsed : initialState.sidebarCollapsed,
            showDebugPanel: typeof s.showDebugPanel === "boolean" ? s.showDebugPanel : initialState.showDebugPanel,
            lastVisitedPage: typeof s.lastVisitedPage === "string" ? s.lastVisitedPage : null,
            columnPreferences:
              s.columnPreferences && typeof s.columnPreferences === "object" ? s.columnPreferences : {},
            panelSizes: s.panelSizes && typeof s.panelSizes === "object" ? s.panelSizes : {},
          };
        }
        return persistedState;
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn("[ui-prefs-store] rehydration error — resetting", error);
          localStorage.removeItem(STORAGE_KEY);
        }
      },
    },
  ),
);
