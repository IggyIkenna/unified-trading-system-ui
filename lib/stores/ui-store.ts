/**
 * UI Store
 * 
 * Global UI state for layout and preferences.
 * Manages sidebar, panels, and view preferences.
 * 
 * Usage:
 *   const { sidebarOpen, toggleSidebar } = useUIStore()
 */

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export type ViewMode = "table" | "grid" | "chart"
export type SidebarPosition = "left" | "right"

interface UIState {
  // Sidebar
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  
  // Panels
  rightPanelOpen: boolean
  rightPanelWidth: number
  setRightPanelOpen: (open: boolean) => void
  setRightPanelWidth: (width: number) => void
  
  // View preferences
  defaultViewMode: ViewMode
  setDefaultViewMode: (mode: ViewMode) => void
  
  // Command palette
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  toggleCommandPalette: () => void
  
  // Notifications
  notificationsPanelOpen: boolean
  setNotificationsPanelOpen: (open: boolean) => void
  
  // Dense mode (compact tables)
  denseMode: boolean
  setDenseMode: (dense: boolean) => void
  
  // Global reset
  reset: () => void
}

const initialState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  rightPanelOpen: false,
  rightPanelWidth: 400,
  defaultViewMode: "table" as ViewMode,
  commandPaletteOpen: false,
  notificationsPanelOpen: false,
  denseMode: false,
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      ...initialState,
      
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),
      
      setRightPanelOpen: (open) =>
        set({ rightPanelOpen: open }),
      
      setRightPanelWidth: (width) =>
        set({ rightPanelWidth: Math.max(200, Math.min(800, width)) }),
      
      setDefaultViewMode: (mode) =>
        set({ defaultViewMode: mode }),
      
      setCommandPaletteOpen: (open) =>
        set({ commandPaletteOpen: open }),
      
      toggleCommandPalette: () =>
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
      
      setNotificationsPanelOpen: (open) =>
        set({ notificationsPanelOpen: open }),
      
      setDenseMode: (dense) =>
        set({ denseMode: dense }),
      
      reset: () => set(initialState),
    }),
    {
      name: "odum-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        rightPanelWidth: state.rightPanelWidth,
        defaultViewMode: state.defaultViewMode,
        denseMode: state.denseMode,
      }),
    }
  )
)
