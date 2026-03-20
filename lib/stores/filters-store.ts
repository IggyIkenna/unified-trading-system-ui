/**
 * Filters Store
 * 
 * Global filter state for data tables and views.
 * Manages category, venue, cloud, search filters.
 * 
 * Usage:
 *   const { filters, setFilter, clearFilters } = useFiltersStore()
 */

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export type DataCategory = "cefi" | "tradfi" | "defi" | "onchain_perps" | "prediction_market" | "all"
export type CloudProvider = "gcp" | "aws" | "both" | "all"
export type DateRange = "7d" | "30d" | "90d" | "1y" | "all"
export type StrategyStatus = "live" | "paper" | "backtest" | "draft" | "all"

export interface DataFilters {
  category: DataCategory
  venue: string | null
  cloud: CloudProvider
  search: string
  dateRange: DateRange
}

export interface StrategyFilters {
  status: StrategyStatus
  org: string | null
  search: string
}

export interface ExecutionFilters {
  venue: string | null
  status: string | null
  dateRange: DateRange
}

interface FiltersState {
  // Data filters
  dataFilters: DataFilters
  setDataFilter: <K extends keyof DataFilters>(key: K, value: DataFilters[K]) => void
  resetDataFilters: () => void
  
  // Strategy filters
  strategyFilters: StrategyFilters
  setStrategyFilter: <K extends keyof StrategyFilters>(key: K, value: StrategyFilters[K]) => void
  resetStrategyFilters: () => void
  
  // Execution filters
  executionFilters: ExecutionFilters
  setExecutionFilter: <K extends keyof ExecutionFilters>(key: K, value: ExecutionFilters[K]) => void
  resetExecutionFilters: () => void
  
  // Global reset
  reset: () => void
}

const defaultDataFilters: DataFilters = {
  category: "all",
  venue: null,
  cloud: "all",
  search: "",
  dateRange: "30d",
}

const defaultStrategyFilters: StrategyFilters = {
  status: "all",
  org: null,
  search: "",
}

const defaultExecutionFilters: ExecutionFilters = {
  venue: null,
  status: null,
  dateRange: "7d",
}

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      dataFilters: defaultDataFilters,
      strategyFilters: defaultStrategyFilters,
      executionFilters: defaultExecutionFilters,
      
      setDataFilter: (key, value) =>
        set((state) => ({
          dataFilters: { ...state.dataFilters, [key]: value },
        })),
      
      resetDataFilters: () =>
        set({ dataFilters: defaultDataFilters }),
      
      setStrategyFilter: (key, value) =>
        set((state) => ({
          strategyFilters: { ...state.strategyFilters, [key]: value },
        })),
      
      resetStrategyFilters: () =>
        set({ strategyFilters: defaultStrategyFilters }),
      
      setExecutionFilter: (key, value) =>
        set((state) => ({
          executionFilters: { ...state.executionFilters, [key]: value },
        })),
      
      resetExecutionFilters: () =>
        set({ executionFilters: defaultExecutionFilters }),
      
      reset: () =>
        set({
          dataFilters: defaultDataFilters,
          strategyFilters: defaultStrategyFilters,
          executionFilters: defaultExecutionFilters,
        }),
    }),
    {
      name: "odum-filters",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
