/**
 * Zustand Stores
 * 
 * Central exports for all global state stores.
 * 
 * Each store has a reset() method for testing and logout.
 */

export { useAuthStore, type AuthUser } from "./auth-store"
export { 
  useFiltersStore, 
  type DataFilters, 
  type StrategyFilters,
  type ExecutionFilters,
  type DataCategory,
  type CloudProvider,
  type DateRange,
  type StrategyStatus,
} from "./filters-store"
export {
  useUIStore,
  type ViewMode,
  type SidebarPosition,
} from "./ui-store"

// Helper to reset all stores (useful for logout/testing)
export function resetAllStores() {
  const { useAuthStore } = require("./auth-store")
  const { useFiltersStore } = require("./filters-store")
  const { useUIStore } = require("./ui-store")
  
  useAuthStore.getState().reset()
  useFiltersStore.getState().reset()
  useUIStore.getState().reset()
}
