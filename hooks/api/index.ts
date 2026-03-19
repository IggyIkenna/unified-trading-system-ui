/**
 * API Hooks
 * 
 * Central exports for all React Query / SWR data hooks.
 * 
 * These hooks provide:
 * - Automatic caching and deduplication
 * - Loading and error states
 * - Refresh/refetch capabilities
 * - Persona-scoped data filtering (via MSW handlers)
 */

// Data service hooks
export {
  useCatalogue,
  useInstruments,
  useInstrument,
  useFreshness,
  useUniqueVenues,
  useUniqueCategories,
  type UseCatalogueOptions,
  type UseInstrumentsOptions,
} from "./use-data"

// Execution service hooks
export {
  useVenues,
  useAlgos,
  useOrders,
  useTCA,
  type Venue,
  type Algo,
  type Order,
  type TCAMetrics,
  type TCAByVenue,
  type UseOrdersOptions,
  type UseTCAOptions,
} from "./use-execution"

// Strategy service hooks
export {
  useStrategies,
  useStrategy,
  useBacktests,
  useBacktest,
  useStrategyStats,
  type Strategy,
  type Backtest,
  type UseStrategiesOptions,
  type UseBacktestsOptions,
} from "./use-strategies"
