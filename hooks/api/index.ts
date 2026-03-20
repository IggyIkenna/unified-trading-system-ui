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

// =============================================================================
// DATA SERVICE HOOKS
// =============================================================================
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

// =============================================================================
// EXECUTION SERVICE HOOKS
// =============================================================================
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

// =============================================================================
// STRATEGY SERVICE HOOKS
// =============================================================================
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

// =============================================================================
// POSITIONS SERVICE HOOKS
// =============================================================================
export {
  usePositions,
  usePositionSummary,
  useRiskGroups,
  useMargin,
  usePositionHistory,
  type Position,
  type PositionSummary,
  type RiskGroup,
  type MarginInfo,
  type HistoricalSnapshot,
  type UsePositionsOptions,
} from "./use-positions"

// =============================================================================
// RISK SERVICE HOOKS
// =============================================================================
export {
  useRiskSummary,
  useRiskLimits,
  useExposure,
  useVaR,
  useGreeks,
  useStressScenarios,
  type RiskLimit,
  type Exposure,
  type VaRMetrics,
  type VaRBreakdown,
  type Greeks,
  type StressScenario,
  type StressScenarioResult,
  type RiskSummary,
  type UseRiskLimitsOptions,
  type UseStressScenariosOptions,
} from "./use-risk"

// =============================================================================
// ML SERVICE HOOKS
// =============================================================================
export {
  useMLModels,
  useMLModel,
  useExperiments,
  useFeatures,
  useTrainingJobs,
  useModelValidation,
  useModelGovernance,
  type MLModel,
  type MLExperiment,
  type Feature,
  type TrainingJob,
  type ModelValidation,
  type ValidationResult,
  type ModelGovernance,
  type ComplianceCheck as MLComplianceCheck,
  type UseMLModelsOptions,
  type UseExperimentsOptions,
} from "./use-ml-models"

// =============================================================================
// TRADING / P&L HOOKS
// =============================================================================
export {
  usePnLSummary,
  usePnLTimeSeries,
  usePnLAttribution,
  usePerformanceMetrics,
  useTradingActivity,
  useDailyPnL,
  type PnLSummary,
  type PnLTimeSeries,
  type PnLAttribution,
  type PerformanceMetrics,
  type TradingActivity,
  type DailyPnL,
  type UsePnLTimeSeriesOptions,
  type UseDailyPnLOptions,
} from "./use-trading"

// =============================================================================
// MARKET DATA HOOKS
// =============================================================================
export {
  useOHLCV,
  useOrderBook,
  useTrades,
  useMarketStats,
  useTickers,
  type OHLCV,
  type OrderBookSnapshot,
  type OrderBookLevel,
  type Trade,
  type MarketStats,
  type Ticker,
  type UseOHLCVOptions,
  type UseTradesOptions,
} from "./use-market-data"

// =============================================================================
// ALERTS SERVICE HOOKS
// =============================================================================
export {
  useAlerts,
  useAlert,
  useAlertStats,
  useAlertRules,
  useAcknowledgeAlert,
  useResolveAlert,
  useSnoozeAlert,
  type Alert,
  type AlertRule,
  type AlertStats,
  type UseAlertsOptions,
} from "./use-alerts"

// =============================================================================
// REPORTS / SETTLEMENT HOOKS
// =============================================================================
export {
  useReports,
  useReport,
  useSettlement,
  useReconciliation,
  useInvoices,
  type Report,
  type SettlementRecord,
  type ReconciliationResult,
  type Invoice,
  type InvoiceLineItem,
  type UseReportsOptions,
  type UseSettlementOptions,
  type UseReconciliationOptions,
} from "./use-reports"

// =============================================================================
// DEPLOYMENT SERVICE HOOKS (INTERNAL-ONLY)
// =============================================================================
export {
  useServices,
  useService,
  useDeployments,
  useShards,
  useCloudBuilds,
  type Service,
  type ServiceEndpoint,
  type Deployment,
  type Shard,
  type CloudBuild,
  type UseDeploymentsOptions,
  type UseServicesOptions,
} from "./use-deployments"

// =============================================================================
// SERVICE STATUS HOOKS
// =============================================================================
export {
  useSystemOverview,
  useServiceHealth,
  useFeatureFreshness,
  useIncidents,
  useMaintenanceWindows,
  type ServiceHealth,
  type SystemOverview,
  type FeatureFreshness,
  type Incident,
  type IncidentUpdate,
  type MaintenanceWindow,
} from "./use-service-status"

// =============================================================================
// AUDIT / COMPLIANCE HOOKS (INTERNAL-ONLY)
// =============================================================================
export {
  useComplianceChecks,
  useComplianceSummary,
  useAuditEvents,
  useDataHealth,
  type ComplianceCheck,
  type AuditEvent,
  type DataHealthMetric,
  type ComplianceSummary,
  type UseComplianceChecksOptions,
  type UseAuditEventsOptions,
  type UseDataHealthOptions,
} from "./use-audit"

// =============================================================================
// ORGANIZATION / USER MANAGEMENT HOOKS
// =============================================================================
export {
  useOrganizations,
  useOrganization,
  useMyOrganization,
  useUsers,
  useUser,
  useUserActivity,
  type Organization,
  type SubscriptionTier,
  type Contact,
  type OrganizationLimits,
  type User,
  type UserActivity,
  type UseOrganizationsOptions,
  type UseUsersOptions,
} from "./use-organizations"
