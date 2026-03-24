/**
 * UI Reference Data
 *
 * Pure data constants (venue lists, enum arrays) are sourced from
 * lib/registry/generated.ts (derived from UAC-generated JSON).
 *
 * This module re-exports those constants and adds UI-specific objects
 * (strategy archetypes with colors, service definitions, helper functions).
 */

// ---------------------------------------------------------------------------
// Re-exports from UAC-generated registry (SSOT for pure data)
// ---------------------------------------------------------------------------

export {
  VENUE_CATEGORY_MAP,
  CLOB_VENUES,
  DEX_VENUES,
  SPORTS_VENUES,
  ZERO_ALPHA_VENUES,
  INSTRUMENT_TYPES_BY_VENUE,
  ENDPOINT_REGISTRY,
  ORDER_SIDES,
  ORDER_TYPES,
  ORDER_STATUSES,
  TIME_IN_FORCE,
  EXECUTION_STATUSES,
  EXECUTION_MODES,
  INSTRUCTION_TYPES,
  MARKET_STATES,
  SPORTS,
  ODDS_FORMATS,
  ODDS_TYPES,
  BET_STATUSES,
  BET_SIDES,
  MATCH_PERIODS,
  RISK_TYPES,
  RISK_CATEGORIES,
  RISK_STATUSES,
  RISK_AGGREGATION_LEVELS,
  ALERT_TYPES,
  POSITION_SIDES,
  MARGIN_TYPES,
  MODEL_TYPES,
  TARGET_TYPES,
  REGIME_STATES,
  FACTOR_TYPES,
  ASSET_CLASSES,
  CLOUD_PROVIDERS,
  COMPUTE_TYPES,
  DATA_MODES,
  RUNTIME_MODES,
  TESTING_STAGES,
  PHASE_MODES,
  DEPLOYMENT_STATUSES,
  DATA_TYPES,
  BOOK_TYPES,
  ERROR_CATEGORIES,
  ERROR_SEVERITIES,
  ERROR_RECOVERY_STRATEGIES,
  LIFECYCLE_EVENT_TYPES,
  LOG_LEVELS,
  DURATION_BUCKETS,
  EMERGENCY_EXIT_TYPES,
  STRESS_SCENARIO_TYPES,
  VAR_METHODS,
  URGENCY_LEVELS,
  PERMISSIONS,
  INTERNAL_PUBSUB_TOPICS,
} from "@/lib/registry/generated";

export {
  UAC_OPERATION_TYPES as OPERATION_TYPES,
  UAC_INSTRUMENT_TYPES as INSTRUMENT_TYPES,
} from "@/lib/registry/generated";

// ---------------------------------------------------------------------------
// Types derived from re-exported arrays
// ---------------------------------------------------------------------------

import {
  VENUE_CATEGORY_MAP,
  CLOB_VENUES,
  DEX_VENUES,
  SPORTS_VENUES,
  ZERO_ALPHA_VENUES,
  ORDER_STATUSES,
  BET_STATUSES,
  DEPLOYMENT_STATUSES,
  RISK_STATUSES,
  INSTRUMENT_TYPES_BY_VENUE,
} from "@/lib/registry/generated";

export type OrderSide = "buy" | "sell";
export type OrderType =
  | "market"
  | "limit"
  | "stop"
  | "stop_limit"
  | "trailing_stop"
  | "twap"
  | "vwap";
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type TimeInForce = "GTC" | "IOC" | "FOK" | "GTD" | "POST_ONLY";
export type ExecutionStatus =
  | "pending"
  | "submitted"
  | "partial"
  | "completed"
  | "failed"
  | "cancelled"
  | "timeout";
export type ExecutionMode =
  | "AGGRESSIVE"
  | "PASSIVE"
  | "NEUTRAL"
  | "TWAP"
  | "VWAP";
export type OperationType =
  | "BUY"
  | "SELL"
  | "SWAP"
  | "LEND"
  | "BORROW"
  | "REPAY"
  | "WITHDRAW"
  | "DEPOSIT"
  | "REBALANCE"
  | "ADD_LIQUIDITY"
  | "REMOVE_LIQUIDITY"
  | "COLLECT_FEES";
export type InstructionType =
  | "TRADE"
  | "SWAP"
  | "ZERO_ALPHA"
  | "PREDICTION_BET"
  | "SPORTS_BET"
  | "SPORTS_EXCHANGE_ORDER"
  | "FUTURES_ROLL"
  | "OPTIONS_COMBO"
  | "ADD_LIQUIDITY"
  | "REMOVE_LIQUIDITY"
  | "COLLECT_FEES";
export type InstrumentType = string;
export type MarketState =
  | "normal"
  | "halted"
  | "auction"
  | "pre_market"
  | "post_market"
  | "closed";
export type PositionSide = "LONG" | "SHORT" | "FLAT";
export type MarginType = "linear" | "inverse" | "quanto";
export type RiskType = string;
export type RiskCategory =
  | "first_order"
  | "second_order"
  | "structural"
  | "operational"
  | "domain_specific";
export type RiskStatus = (typeof RISK_STATUSES)[number];
export type RiskAggregationLevel =
  | "company"
  | "client"
  | "account"
  | "strategy"
  | "underlying"
  | "instrument";
export type AlertType = string;
export type Sport = string;
export type OddsFormat = "decimal" | "american" | "fractional";
export type OddsType = string;
export type BetStatus = (typeof BET_STATUSES)[number];
export type BetSide = "back" | "lay";
export type MatchPeriod = string;
export type ModelType = string;
export type TargetType = string;
export type RegimeState = string;
export type FactorType = string;
export type AssetClass = string;
export type CloudProvider = string;
export type ComputeType = string;
export type DataMode = "mock" | "real";
export type RuntimeMode = "live" | "batch";
export type TestingStage =
  | "MOCK"
  | "HISTORICAL"
  | "LIVE_MOCK"
  | "LIVE_TESTNET"
  | "STAGING"
  | "LIVE_REAL";
export type PhaseMode = "phase1" | "phase2" | "phase3";
export type DeploymentStatus = (typeof DEPLOYMENT_STATUSES)[number];
export type DataType = string;
export type BookType = string;
export type AccessMode =
  | "rest_polling"
  | "streaming_websocket"
  | "batch_file"
  | "graphql";
export type ErrorCategory = string;
export type ErrorSeverity = "low" | "medium" | "high" | "critical";
export type ErrorRecoveryStrategy = string;
export type LifecycleEventType = string;
export type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";
export type DurationBucket = string;
export type EmergencyExitType = string;
export type StressScenarioType = string;
export type VarMethod = string;
export type UrgencyLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Permission = string;
export type InternalPubSubTopic = string;

// ---------------------------------------------------------------------------
// Venue categories (UI display labels)
// ---------------------------------------------------------------------------

export const VENUE_CATEGORIES: Record<string, string> = {
  cefi: "CeFi",
  tradfi: "TradFi",
  defi: "DeFi",
  onchain_perps: "On-Chain Perps",
  sports: "Sports",
  prediction: "Prediction",
};

export type VenueCategory =
  | "cefi"
  | "tradfi"
  | "defi"
  | "onchain_perps"
  | "sports"
  | "prediction";

// ---------------------------------------------------------------------------
// Venue access modes
// ---------------------------------------------------------------------------

export const VENUE_ACCESS_MODES: Record<string, string> = {
  POLYMARKET: "streaming_websocket",
  DATABENTO: "streaming_websocket",
  IBKR: "streaming_websocket",
  TARDIS: "batch_file",
  BARCHART: "batch_file",
  THEGRAPH: "graphql",
};

export function getVenueAccessMode(venue: string): string {
  return VENUE_ACCESS_MODES[venue] || "rest_polling";
}

export const ACCESS_MODES = [
  "rest_polling",
  "streaming_websocket",
  "batch_file",
  "graphql",
] as const;

// ---------------------------------------------------------------------------
// Asset class labels
// ---------------------------------------------------------------------------

export const ASSET_CLASS_LABELS: Record<string, string> = {
  crypto: "Crypto",
  equity: "Equity",
  fx: "FX",
  commodity: "Commodity",
  fixed_income: "Fixed Income",
};

// ---------------------------------------------------------------------------
// Service port registry (flat map for quick lookup)
// ---------------------------------------------------------------------------

export const SERVICE_PORTS: Record<string, number> = {
  "deployment-api": 8004,
  "config-api": 8005,
  "execution-results-api": 8006,
  "alerting-service": 8007,
  "pnl-attribution-service": 8008,
  "market-data-processing-service": 8009,
  "ml-training-api": 8010,
  "execution-service": 8011,
  "trading-analytics-api": 8012,
  "batch-audit-api": 8013,
  "client-reporting-api": 8014,
  "ml-inference-api": 8015,
  "market-data-api": 8016,
  "risk-and-exposure-service": 8019,
  "position-balance-monitor-service": 8020,
  "strategy-service": 8025,
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export function getVenuesByCategory(category: VenueCategory): string[] {
  return Object.entries(VENUE_CATEGORY_MAP)
    .filter(([, cat]) => cat === category)
    .map(([venue]) => venue);
}

export function getVenueCategory(venue: string): VenueCategory | undefined {
  return (VENUE_CATEGORY_MAP as Record<string, string>)[venue] as
    | VenueCategory
    | undefined;
}

export function getInstrumentTypesForVenue(venue: string): string[] {
  return (
    INSTRUMENT_TYPES_BY_VENUE[
      venue as keyof typeof INSTRUMENT_TYPES_BY_VENUE
    ] || []
  );
}

export function isExchangeVenue(venue: string): boolean {
  return (
    (CLOB_VENUES as readonly string[]).includes(venue) ||
    (DEX_VENUES as readonly string[]).includes(venue)
  );
}

export function isSportsVenue(venue: string): boolean {
  return (
    (SPORTS_VENUES as readonly string[]).includes(venue) ||
    VENUE_CATEGORY_MAP[venue as keyof typeof VENUE_CATEGORY_MAP] === "sports"
  );
}

export function isZeroAlphaVenue(venue: string): boolean {
  return (ZERO_ALPHA_VENUES as readonly string[]).includes(venue);
}

export function getRiskStatusColor(status: string): string {
  switch (status) {
    case "OK":
      return "var(--status-live)";
    case "WARNING":
      return "var(--status-warning)";
    case "CRITICAL":
      return "var(--status-critical)";
    default:
      return "var(--muted-foreground)";
  }
}

export function getOrderStatusColor(status: string): string {
  switch (status) {
    case "filled":
      return "var(--status-live)";
    case "partially_filled":
      return "var(--status-warning)";
    case "open":
    case "pending":
      return "var(--status-running)";
    case "cancelled":
    case "expired":
      return "var(--status-idle)";
    case "rejected":
      return "var(--status-critical)";
    default:
      return "var(--muted-foreground)";
  }
}

export function getBetStatusColor(status: string): string {
  switch (status) {
    case "settled_win":
      return "var(--pnl-positive)";
    case "settled_loss":
      return "var(--pnl-negative)";
    case "matched":
      return "var(--status-live)";
    case "partially_matched":
      return "var(--status-warning)";
    case "pending":
    case "placed":
      return "var(--status-running)";
    case "cancelled":
    case "settled_void":
      return "var(--status-idle)";
    case "rejected":
      return "var(--status-critical)";
    default:
      return "var(--muted-foreground)";
  }
}

export function getDeploymentStatusColor(status: string): string {
  switch (status) {
    case "completed":
      return "var(--status-live)";
    case "running":
      return "var(--status-running)";
    case "pending":
      return "var(--status-idle)";
    case "failed":
    case "timed_out":
      return "var(--status-critical)";
    case "cancelled":
      return "var(--status-warning)";
    default:
      return "var(--muted-foreground)";
  }
}

export function getVenueCategoryColor(category: VenueCategory): string {
  switch (category) {
    case "cefi":
      return "var(--surface-trading)";
    case "tradfi":
      return "var(--surface-markets)";
    case "defi":
      return "var(--surface-config)";
    case "sports":
      return "var(--surface-strategy)";
    default:
      return "var(--muted-foreground)";
  }
}

// ---------------------------------------------------------------------------
// Strategy archetypes (UI config with colors)
// ---------------------------------------------------------------------------

export const STRATEGY_ARCHETYPES = [
  {
    id: "ARBITRAGE",
    label: "Arbitrage",
    description: "Cross-venue price discrepancy exploitation",
    color: "#4ade80",
  },
  {
    id: "MARKET_MAKING",
    label: "Market Making",
    description: "Continuous quoting and spread capture",
    color: "#60a5fa",
  },
  {
    id: "DIRECTIONAL",
    label: "Directional",
    description: "Trend-following and ML-based predictions",
    color: "#f472b6",
  },
  {
    id: "YIELD",
    label: "Yield",
    description: "Lending, staking, and LP provision",
    color: "#fbbf24",
  },
  {
    id: "BASIS_TRADE",
    label: "Basis Trade",
    description: "Spot vs derivative funding rate capture",
    color: "#22d3ee",
  },
  {
    id: "MOMENTUM",
    label: "Momentum",
    description: "Trend continuation strategies",
    color: "#a78bfa",
  },
  {
    id: "MEAN_REVERSION",
    label: "Mean Reversion",
    description: "Statistical reversion to mean",
    color: "#fb923c",
  },
  {
    id: "STATISTICAL_ARB",
    label: "Statistical Arb",
    description: "Pairs and basket trading",
    color: "#2dd4bf",
  },
  {
    id: "OPTIONS",
    label: "Options",
    description: "Options market making and delta hedging",
    color: "#ec4899",
  },
] as const;

export type StrategyArchetype = (typeof STRATEGY_ARCHETYPES)[number]["id"];

// ---------------------------------------------------------------------------
// Strategy types (UI config)
// ---------------------------------------------------------------------------

export const STRATEGY_TYPES = [
  {
    id: "CEFI_MOMENTUM",
    label: "CeFi Momentum",
    archetype: "MOMENTUM",
    domain: "cefi",
  },
  {
    id: "CEFI_ARBITRAGE",
    label: "CeFi Arbitrage",
    archetype: "ARBITRAGE",
    domain: "cefi",
  },
  {
    id: "CEFI_MARKET_MAKING",
    label: "CeFi Market Making",
    archetype: "MARKET_MAKING",
    domain: "cefi",
  },
  {
    id: "CEFI_BASIS",
    label: "CeFi Basis Trade",
    archetype: "BASIS_TRADE",
    domain: "cefi",
  },
  {
    id: "DEFI_LENDING",
    label: "DeFi Lending",
    archetype: "YIELD",
    domain: "defi",
  },
  {
    id: "DEFI_LP",
    label: "DeFi LP Provision",
    archetype: "YIELD",
    domain: "defi",
  },
  {
    id: "DEFI_STAKING",
    label: "DeFi Staking",
    archetype: "YIELD",
    domain: "defi",
  },
  {
    id: "DEFI_ARB",
    label: "DeFi Arbitrage",
    archetype: "ARBITRAGE",
    domain: "defi",
  },
  {
    id: "TRADFI_MOMENTUM",
    label: "TradFi Momentum",
    archetype: "MOMENTUM",
    domain: "tradfi",
  },
  {
    id: "TRADFI_STAT_ARB",
    label: "TradFi Stat Arb",
    archetype: "STATISTICAL_ARB",
    domain: "tradfi",
  },
  {
    id: "SPORTS_VALUE",
    label: "Sports Value Betting",
    archetype: "DIRECTIONAL",
    domain: "sports",
  },
  {
    id: "SPORTS_ARB",
    label: "Sports Arbitrage",
    archetype: "ARBITRAGE",
    domain: "sports",
  },
] as const;

export type StrategyType = (typeof STRATEGY_TYPES)[number]["id"];

// ---------------------------------------------------------------------------
// Data flows (UI-specific topology)
// ---------------------------------------------------------------------------

export interface DataFlow {
  id: string;
  domain: string;
  mode: "live" | "batch";
  service: string | null;
  dataSource: "gcs" | "pubsub" | "gcp-api";
  api: string | null;
  ui: string | string[];
  note?: string;
}

export const DATA_FLOWS: DataFlow[] = [
  {
    id: "client-reporting",
    domain: "client-reporting",
    mode: "batch",
    service: "pnl-attribution-service",
    dataSource: "gcs",
    api: "client-reporting-api",
    ui: "client-reporting-ui",
  },
  {
    id: "client-reporting-live",
    domain: "client-reporting",
    mode: "live",
    service: "pnl-attribution-service",
    dataSource: "pubsub",
    api: "client-reporting-api",
    ui: "client-reporting-ui",
  },
  {
    id: "execution-results",
    domain: "execution",
    mode: "batch",
    service: "execution-service",
    dataSource: "gcs",
    api: "execution-results-api",
    ui: "execution-analytics-ui",
  },
  {
    id: "execution-results-live",
    domain: "execution",
    mode: "live",
    service: "execution-service",
    dataSource: "pubsub",
    api: "execution-results-api",
    ui: [
      "execution-analytics-ui",
      "trading-analytics-ui",
      "live-health-monitor-ui",
    ],
  },
  {
    id: "market-data",
    domain: "market-data",
    mode: "batch",
    service: "market-data-processing-service",
    dataSource: "gcs",
    api: "market-data-api",
    ui: ["trading-analytics-ui", "batch-audit-ui"],
  },
  {
    id: "market-data-live",
    domain: "market-data",
    mode: "live",
    service: "market-data-processing-service",
    dataSource: "pubsub",
    api: "market-data-api",
    ui: ["trading-analytics-ui", "batch-audit-ui"],
  },
  {
    id: "batch-audit",
    domain: "batch-audit",
    mode: "batch",
    service: "batch-live-reconciliation-service",
    dataSource: "gcs",
    api: "batch-audit-api",
    ui: ["batch-audit-ui", "logs-dashboard-ui"],
  },
  {
    id: "ml-inference",
    domain: "ml",
    mode: "batch",
    service: "ml-inference-service",
    dataSource: "gcs",
    api: "ml-inference-api",
    ui: "ml-training-ui",
  },
  {
    id: "ml-inference-live",
    domain: "ml",
    mode: "live",
    service: "ml-inference-service",
    dataSource: "pubsub",
    api: "ml-inference-api",
    ui: "ml-training-ui",
  },
  {
    id: "ml-training",
    domain: "ml",
    mode: "batch",
    service: "ml-training-service",
    dataSource: "gcs",
    api: "ml-training-api",
    ui: "ml-training-ui",
  },
  {
    id: "trading-analytics",
    domain: "execution",
    mode: "batch",
    service: "execution-service",
    dataSource: "gcs",
    api: "trading-analytics-api",
    ui: "trading-analytics-ui",
  },
  {
    id: "trading-analytics-live",
    domain: "execution",
    mode: "live",
    service: "execution-service",
    dataSource: "pubsub",
    api: "trading-analytics-api",
    ui: "trading-analytics-ui",
  },
  {
    id: "deployment",
    domain: "deployment",
    mode: "live",
    service: "deployment-service",
    dataSource: "gcp-api",
    api: "deployment-api",
    ui: ["deployment-ui", "execution-analytics-ui"],
  },
  {
    id: "strategy-direct",
    domain: "strategy",
    mode: "batch",
    service: "strategy-service",
    dataSource: "gcs",
    api: null,
    ui: "strategy-ui",
    note: "Direct service call, no API layer",
  },
  {
    id: "strategy-direct-live",
    domain: "strategy",
    mode: "live",
    service: "strategy-service",
    dataSource: "pubsub",
    api: null,
    ui: "strategy-ui",
  },
  {
    id: "settlement",
    domain: "settlement",
    mode: "batch",
    service: "position-balance-monitor-service",
    dataSource: "gcs",
    api: "settlement-api",
    ui: "settlement-ui",
  },
  {
    id: "settlement-live",
    domain: "settlement",
    mode: "live",
    service: "position-balance-monitor-service",
    dataSource: "pubsub",
    api: "settlement-api",
    ui: "settlement-ui",
  },
  {
    id: "alerting",
    domain: "observability",
    mode: "live",
    service: "alerting-service",
    dataSource: "pubsub",
    api: null,
    ui: "live-health-monitor-ui",
    note: "Alerts tab, SSE stream",
  },
];

export function getDataFlowsByDomain(domain: string): DataFlow[] {
  return DATA_FLOWS.filter((f) => f.domain === domain);
}

export function getDataFlowsByMode(mode: "live" | "batch"): DataFlow[] {
  return DATA_FLOWS.filter((f) => f.mode === mode);
}

// ---------------------------------------------------------------------------
// Services (UI-specific topology)
// ---------------------------------------------------------------------------

export interface Service {
  id: string;
  name: string;
  type:
    | "api-service"
    | "service"
    | "batch-service"
    | "ui"
    | "library"
    | "infrastructure";
  tier: number;
  domain: string;
  mode: "live" | "batch" | null;
  capabilities: string[];
  status: "active" | "scaffolded" | "deprecated";
  servesUi: string[] | null;
  coveragePct: number | null;
}

export const SERVICES: Service[] = [
  {
    id: "execution-service",
    name: "Execution Service",
    type: "service",
    tier: 3,
    domain: "execution",
    mode: "live",
    capabilities: ["event_bus", "cache", "config_store"],
    status: "active",
    servesUi: null,
    coveragePct: 26,
  },
  {
    id: "strategy-service",
    name: "Strategy Service",
    type: "service",
    tier: 3,
    domain: "strategy",
    mode: "live",
    capabilities: ["event_bus", "cache", "data_source"],
    status: "active",
    servesUi: null,
    coveragePct: 68,
  },
  {
    id: "pnl-attribution-service",
    name: "P&L Attribution Service",
    type: "batch-service",
    tier: 3,
    domain: "analytics",
    mode: "batch",
    capabilities: ["data_source", "data_sink", "event_bus"],
    status: "active",
    servesUi: null,
    coveragePct: 46,
  },
  {
    id: "market-data-processing-service",
    name: "Market Data Processing",
    type: "service",
    tier: 3,
    domain: "market-data",
    mode: "live",
    capabilities: ["data_source", "data_sink", "event_bus"],
    status: "active",
    servesUi: null,
    coveragePct: 39,
  },
  {
    id: "deployment-service",
    name: "Deployment Service",
    type: "infrastructure",
    tier: 3,
    domain: "deployment",
    mode: null,
    capabilities: [],
    status: "active",
    servesUi: null,
    coveragePct: 81,
  },
  {
    id: "alerting-service",
    name: "Alerting Service",
    type: "service",
    tier: 3,
    domain: "observability",
    mode: "live",
    capabilities: ["data_source", "data_sink", "event_bus", "cache"],
    status: "active",
    servesUi: null,
    coveragePct: 87,
  },
  {
    id: "batch-live-reconciliation-service",
    name: "Batch-Live Reconciliation",
    type: "batch-service",
    tier: 3,
    domain: "analytics",
    mode: "batch",
    capabilities: ["data_source", "data_sink", "event_bus"],
    status: "active",
    servesUi: null,
    coveragePct: null,
  },
  {
    id: "position-balance-monitor-service",
    name: "Position Balance Monitor",
    type: "service",
    tier: 3,
    domain: "settlement",
    mode: "live",
    capabilities: ["data_source", "event_bus"],
    status: "active",
    servesUi: null,
    coveragePct: 77,
  },
  {
    id: "ml-inference-service",
    name: "ML Inference Service",
    type: "service",
    tier: 3,
    domain: "ml",
    mode: "live",
    capabilities: ["data_source", "cache", "event_bus"],
    status: "active",
    servesUi: null,
    coveragePct: 75,
  },
  {
    id: "ml-training-service",
    name: "ML Training Service",
    type: "batch-service",
    tier: 3,
    domain: "ml",
    mode: "batch",
    capabilities: ["data_source", "data_sink"],
    status: "active",
    servesUi: null,
    coveragePct: 35,
  },
  {
    id: "features-delta-one-service",
    name: "Delta One Features",
    type: "service",
    tier: 3,
    domain: "features",
    mode: "batch",
    capabilities: ["data_source", "data_sink", "event_bus"],
    status: "active",
    servesUi: null,
    coveragePct: 71,
  },
  {
    id: "features-volatility-service",
    name: "Volatility Features",
    type: "service",
    tier: 3,
    domain: "features",
    mode: "batch",
    capabilities: ["data_source", "data_sink", "event_bus"],
    status: "active",
    servesUi: null,
    coveragePct: 35,
  },
  {
    id: "features-onchain-service",
    name: "On-Chain Features",
    type: "service",
    tier: 3,
    domain: "features",
    mode: "batch",
    capabilities: ["data_source", "data_sink", "event_bus"],
    status: "active",
    servesUi: null,
    coveragePct: 39,
  },
  {
    id: "features-sports-service",
    name: "Sports Features",
    type: "service",
    tier: 3,
    domain: "features",
    mode: "batch",
    capabilities: ["data_source", "data_sink", "event_bus"],
    status: "scaffolded",
    servesUi: null,
    coveragePct: 87,
  },
  {
    id: "features-calendar-service",
    name: "Calendar Features",
    type: "service",
    tier: 3,
    domain: "features",
    mode: "batch",
    capabilities: ["data_source", "data_sink", "event_bus"],
    status: "active",
    servesUi: null,
    coveragePct: 72,
  },
  {
    id: "features-cross-instrument-service",
    name: "Cross-Instrument Features",
    type: "service",
    tier: 3,
    domain: "features",
    mode: "batch",
    capabilities: ["data_source", "data_sink", "event_bus"],
    status: "active",
    servesUi: null,
    coveragePct: 65,
  },
  {
    id: "features-multi-timeframe-service",
    name: "Multi-Timeframe Features",
    type: "service",
    tier: 3,
    domain: "features",
    mode: "batch",
    capabilities: ["data_source", "data_sink", "event_bus"],
    status: "active",
    servesUi: null,
    coveragePct: 57,
  },
  {
    id: "execution-results-api",
    name: "Execution Results API",
    type: "api-service",
    tier: 3,
    domain: "execution",
    mode: "live",
    capabilities: ["data_source", "event_bus", "cache"],
    status: "active",
    servesUi: [
      "trading-analytics-ui",
      "live-health-monitor-ui",
      "execution-analytics-ui",
    ],
    coveragePct: 66,
  },
  {
    id: "client-reporting-api",
    name: "Client Reporting API",
    type: "api-service",
    tier: 3,
    domain: "analytics",
    mode: "live",
    capabilities: ["data_source", "event_bus", "cache"],
    status: "active",
    servesUi: ["client-reporting-ui"],
    coveragePct: 18,
  },
  {
    id: "deployment-api",
    name: "Deployment API",
    type: "api-service",
    tier: 3,
    domain: "deployment",
    mode: "live",
    capabilities: ["event_bus", "cache"],
    status: "active",
    servesUi: ["deployment-ui"],
    coveragePct: 71,
  },
  {
    id: "batch-audit-api",
    name: "Batch Audit API",
    type: "api-service",
    tier: 3,
    domain: "analytics",
    mode: "live",
    capabilities: ["data_source", "event_bus"],
    status: "active",
    servesUi: ["batch-audit-ui", "logs-dashboard-ui"],
    coveragePct: null,
  },
  {
    id: "ml-inference-api",
    name: "ML Inference API",
    type: "api-service",
    tier: 3,
    domain: "ml",
    mode: "live",
    capabilities: ["data_source", "cache"],
    status: "active",
    servesUi: ["ml-training-ui"],
    coveragePct: null,
  },
  {
    id: "ml-training-api",
    name: "ML Training API",
    type: "api-service",
    tier: 3,
    domain: "ml",
    mode: "live",
    capabilities: ["data_source"],
    status: "active",
    servesUi: ["ml-training-ui"],
    coveragePct: null,
  },
  {
    id: "market-data-api",
    name: "Market Data API",
    type: "api-service",
    tier: 3,
    domain: "market-data",
    mode: "live",
    capabilities: ["data_source", "event_bus"],
    status: "active",
    servesUi: ["trading-analytics-ui", "batch-audit-ui"],
    coveragePct: 77,
  },
  {
    id: "trading-analytics-api",
    name: "Trading Analytics API",
    type: "api-service",
    tier: 3,
    domain: "execution",
    mode: "live",
    capabilities: ["data_source", "cache"],
    status: "active",
    servesUi: ["trading-analytics-ui"],
    coveragePct: null,
  },
];

export function getServicesByDomain(domain: string): Service[] {
  return SERVICES.filter((s) => s.domain === domain);
}

export function getServicesByType(type: Service["type"]): Service[] {
  return SERVICES.filter((s) => s.type === type);
}

// ---------------------------------------------------------------------------
// P&L attribution factors (UI config with colors)
// ---------------------------------------------------------------------------

export const PNL_FACTORS = [
  {
    id: "FUNDING",
    label: "Funding",
    description: "Funding rate payments (perps)",
    color: "#60a5fa",
  },
  {
    id: "CARRY",
    label: "Carry",
    description: "Interest rate differential",
    color: "#4ade80",
  },
  {
    id: "BASIS",
    label: "Basis",
    description: "Spot vs derivative basis change",
    color: "#a78bfa",
  },
  {
    id: "DELTA",
    label: "Delta",
    description: "Directional price movement",
    color: "#f472b6",
  },
  {
    id: "GAMMA",
    label: "Gamma",
    description: "Delta change (options)",
    color: "#fbbf24",
  },
  {
    id: "VEGA",
    label: "Vega",
    description: "Volatility change (options)",
    color: "#22d3ee",
  },
  {
    id: "THETA",
    label: "Theta",
    description: "Time decay (options)",
    color: "#fb923c",
  },
  {
    id: "SLIPPAGE",
    label: "Slippage",
    description: "Execution slippage vs expected",
    color: "#ef4444",
  },
  {
    id: "FEES",
    label: "Fees",
    description: "Trading and network fees",
    color: "#dc2626",
  },
  {
    id: "REBATES",
    label: "Rebates",
    description: "Maker rebates earned",
    color: "#22c55e",
  },
] as const;

export type PnLFactor = (typeof PNL_FACTORS)[number]["id"];

// ---------------------------------------------------------------------------
// Execution algorithms (UI config)
// ---------------------------------------------------------------------------

export const EXECUTION_ALGORITHMS = [
  {
    id: "TWAP",
    name: "Time-Weighted Average Price",
    description: "Splits order evenly over time period",
  },
  {
    id: "VWAP",
    name: "Volume-Weighted Average Price",
    description: "Tracks historical volume profile",
  },
  {
    id: "ICEBERG",
    name: "Iceberg",
    description: "Shows only small portion of order",
  },
  {
    id: "SNIPER",
    name: "Sniper",
    description: "Aggressive taker for quick execution",
  },
  {
    id: "POV",
    name: "Percentage of Volume",
    description: "Participates at target volume rate",
  },
  {
    id: "MAKER_ONLY",
    name: "Maker Only",
    description: "Post-only limit orders for rebates",
  },
  {
    id: "SMART_ROUTER",
    name: "Smart Router",
    description: "Routes across venues for best execution",
  },
] as const;

export type ExecutionAlgorithm = (typeof EXECUTION_ALGORITHMS)[number]["id"];

// ---------------------------------------------------------------------------
// Underlying assets (UI config)
// ---------------------------------------------------------------------------

export type UnderlyingType =
  | "CRYPTO"
  | "EQUITY"
  | "COMMODITY"
  | "FX"
  | "SPORTS_LEAGUE"
  | "PREDICTION_MARKET";

export interface Underlying {
  id: string;
  symbol: string;
  name: string;
  type: UnderlyingType;
  category?: string;
}

export const UNDERLYINGS: Underlying[] = [
  { id: "BTC", symbol: "BTC", name: "Bitcoin", type: "CRYPTO" },
  { id: "ETH", symbol: "ETH", name: "Ethereum", type: "CRYPTO" },
  { id: "SOL", symbol: "SOL", name: "Solana", type: "CRYPTO" },
  { id: "ARB", symbol: "ARB", name: "Arbitrum", type: "CRYPTO" },
  { id: "OP", symbol: "OP", name: "Optimism", type: "CRYPTO" },
  { id: "AVAX", symbol: "AVAX", name: "Avalanche", type: "CRYPTO" },
  { id: "MATIC", symbol: "MATIC", name: "Polygon", type: "CRYPTO" },
  { id: "LINK", symbol: "LINK", name: "Chainlink", type: "CRYPTO" },
  { id: "UNI", symbol: "UNI", name: "Uniswap", type: "CRYPTO" },
  { id: "AAVE", symbol: "AAVE", name: "Aave", type: "CRYPTO" },
  { id: "DOGE", symbol: "DOGE", name: "Dogecoin", type: "CRYPTO" },
  { id: "XRP", symbol: "XRP", name: "XRP", type: "CRYPTO" },
  {
    id: "USDT",
    symbol: "USDT",
    name: "Tether",
    type: "CRYPTO",
    category: "STABLECOIN",
  },
  {
    id: "USDC",
    symbol: "USDC",
    name: "USD Coin",
    type: "CRYPTO",
    category: "STABLECOIN",
  },
  {
    id: "DAI",
    symbol: "DAI",
    name: "Dai",
    type: "CRYPTO",
    category: "STABLECOIN",
  },
  { id: "SPY", symbol: "SPY", name: "S&P 500 ETF", type: "EQUITY" },
  { id: "QQQ", symbol: "QQQ", name: "Nasdaq 100 ETF", type: "EQUITY" },
  { id: "IWM", symbol: "IWM", name: "Russell 2000 ETF", type: "EQUITY" },
  { id: "DIA", symbol: "DIA", name: "Dow Jones ETF", type: "EQUITY" },
  { id: "GC", symbol: "GC", name: "Gold", type: "COMMODITY" },
  { id: "CL", symbol: "CL", name: "Crude Oil", type: "COMMODITY" },
  { id: "SI", symbol: "SI", name: "Silver", type: "COMMODITY" },
  { id: "NG", symbol: "NG", name: "Natural Gas", type: "COMMODITY" },
  { id: "EURUSD", symbol: "EUR/USD", name: "Euro/US Dollar", type: "FX" },
  {
    id: "GBPUSD",
    symbol: "GBP/USD",
    name: "British Pound/US Dollar",
    type: "FX",
  },
  {
    id: "USDJPY",
    symbol: "USD/JPY",
    name: "US Dollar/Japanese Yen",
    type: "FX",
  },
  {
    id: "NBA",
    symbol: "NBA",
    name: "NBA Basketball",
    type: "SPORTS_LEAGUE",
    category: "BASKETBALL",
  },
  {
    id: "NFL",
    symbol: "NFL",
    name: "NFL Football",
    type: "SPORTS_LEAGUE",
    category: "FOOTBALL",
  },
  {
    id: "MLB",
    symbol: "MLB",
    name: "MLB Baseball",
    type: "SPORTS_LEAGUE",
    category: "BASEBALL",
  },
  {
    id: "NHL",
    symbol: "NHL",
    name: "NHL Hockey",
    type: "SPORTS_LEAGUE",
    category: "HOCKEY",
  },
  {
    id: "EPL",
    symbol: "EPL",
    name: "English Premier League",
    type: "SPORTS_LEAGUE",
    category: "SOCCER",
  },
  {
    id: "UEFA_CL",
    symbol: "UCL",
    name: "UEFA Champions League",
    type: "SPORTS_LEAGUE",
    category: "SOCCER",
  },
  {
    id: "ATP",
    symbol: "ATP",
    name: "ATP Tennis",
    type: "SPORTS_LEAGUE",
    category: "TENNIS",
  },
  {
    id: "US_ELECTION",
    symbol: "ELECTION",
    name: "US Elections",
    type: "PREDICTION_MARKET",
    category: "POLITICS",
  },
  {
    id: "FED_RATES",
    symbol: "RATES",
    name: "Fed Rate Decisions",
    type: "PREDICTION_MARKET",
    category: "ECONOMICS",
  },
];

export function getUnderlyingsByType(type: UnderlyingType): Underlying[] {
  return UNDERLYINGS.filter((u) => u.type === type);
}

// ---------------------------------------------------------------------------
// Currency formatting
// ---------------------------------------------------------------------------

export function formatCurrency(value: number, decimals = 0): string {
  const absValue = Math.abs(value);
  if (absValue >= 1_000_000_000)
    return `${(value / 1_000_000_000).toFixed(decimals)}B`;
  if (absValue >= 1_000_000) return `${(value / 1_000_000).toFixed(decimals)}M`;
  if (absValue >= 1_000) return `${(value / 1_000).toFixed(decimals)}K`;
  return value.toFixed(decimals);
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}
