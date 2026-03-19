/**
 * UI Reference Data
 * 
 * Consolidated reference data from the unified trading system:
 * - 128 venues across CeFi, TradFi, DeFi, and Sports
 * - 86 enums (29 UAC + 57 UIC) with all dropdown values
 * - Venue categories, instrument types, endpoint registry
 * - Service port registry
 * 
 * This data powers all UI dropdowns, filters, and validation.
 */

// =============================================================================
// VENUE REGISTRY
// =============================================================================

// Added "onchain_perps" and "prediction" categories
export const VENUE_CATEGORIES = {
  cefi: "CeFi",
  tradfi: "TradFi", 
  defi: "DeFi",
  onchain_perps: "On-Chain Perps",
  sports: "Sports",
  prediction: "Prediction",
} as const

export type VenueCategory = keyof typeof VENUE_CATEGORIES

export const VENUE_CATEGORY_MAP: Record<string, VenueCategory> = {
  // CeFi Venues
  "BINANCE": "cefi",
  "BINANCE-SPOT": "cefi",
  "BINANCE-FUTURES": "cefi",
  "OKX": "cefi",
  "OKX-SPOT": "cefi",
  "OKX-FUTURES": "cefi",
  "BYBIT": "cefi",
  "BYBIT-SPOT": "cefi",
  "BYBIT-FUTURES": "cefi",
  "COINBASE-SPOT": "cefi",
  "HYPERLIQUID": "cefi",
  "DERIBIT": "cefi",
  "ASTER": "cefi",
  "UPBIT": "cefi",
  // TradFi Venues
  "NASDAQ": "tradfi",
  "NYSE": "tradfi",
  "CME": "tradfi",
  "CBOT": "tradfi",
  "NYMEX": "tradfi",
  "COMEX": "tradfi",
  "ICE": "tradfi",
  "CBOE": "tradfi",
  "XNAS": "tradfi",
  "XNYS": "tradfi",
  // DeFi Venues
  "UNISWAPV2-ETH": "defi",
  "UNISWAPV3-ETH": "defi",
  "UNISWAPV4-ETH": "defi",
  "CURVE-ETH": "defi",
  "AERODROME-BASE": "defi",
  "AAVE_V3": "defi",
  "AAVE_V3_ETH": "defi",
  "MORPHO-ETHEREUM": "defi",
  "EULER-PLASMA": "defi",
  "FLUID-PLASMA": "defi",
  "AAVE-PLASMA": "defi",
  "LIDO": "defi",
  "ETHERFI": "defi",
  "ETHENA": "defi",
  // Sports Venues
  "OPTICODDS": "sports",
  "ODDSJAM": "sports",
  "FANDUEL": "sports",
  "KALSHI": "sports",
  "FLIFF": "sports",
  "PLAYUP": "sports",
  "UNIBET": "sports",
  "FANATICS": "sports",
  "BET365": "sports",
  "BETFAIR": "sports",
  "PINNACLE": "sports",
  "DRAFTKINGS": "sports",
  "BETMGM": "sports",
  "CAESARS": "sports",
  "POLYMARKET": "sports",
  "SMARKETS": "sports",
  "MATCHBOOK": "sports",
  "BETDAQ": "sports",
}

// Grouped venue lists
export const CLOB_VENUES = [
  "ASTER", "BINANCE-FUTURES", "BINANCE-SPOT", "BYBIT", "BYBIT-FUTURES",
  "BYBIT-SPOT", "CBOE", "CME", "COINBASE-SPOT", "DERIBIT", "HYPERLIQUID",
  "ICE", "NASDAQ", "NYSE", "OKX", "OKX-FUTURES", "OKX-SPOT", "UPBIT"
] as const

export const DEX_VENUES = [
  "AERODROME-BASE", "CURVE-ETH", "UNISWAPV2-ETH", "UNISWAPV3-ETH", "UNISWAPV4-ETH"
] as const

export const ZERO_ALPHA_VENUES = [
  "AAVE-PLASMA", "AAVE_V3", "AAVE_V3_ETH", "ETHENA", "ETHERFI",
  "EULER-PLASMA", "FLUID-PLASMA", "LIDO", "MORPHO-ETHEREUM"
] as const

// All 90 sports venues from real system ui-reference-data.json
export const SPORTS_VENUES = [
  // Original 22
  "BET365", "BETFAIR", "BETMGM", "CAESARS", "DRAFTKINGS", "FANDUEL",
  "KALSHI", "MATCHBOOK", "PINNACLE", "POLYMARKET", "SMARKETS", "BETDAQ",
  "OPTICODDS", "ODDSJAM", "FLIFF", "PLAYUP", "UNIBET", "FANATICS",
  "BOVADA", "PADDYPOWER", "WILLIAMHILL", "LADBROKES",
  // Additional 68 from real system
  "MRGREEN", "TABTOUCH", "API_FOOTBALL", "FOOTYSTATS", "LOWVIG", "CASUMO",
  "BET888SPORT", "METABET", "SKYBET", "GROSVENOR", "MYBOOKIEAG", "BETCLIC",
  "VIRGINBET", "PMU", "BETOPENLY", "CODERE", "SOCCER_FOOTBALL_INFO",
  "BOYLESPORTS", "DRAFTKINGS_PICK6", "COOLBET", "TIPICO", "BETUS",
  "BETR_DFS", "SUPRABETS", "SBOBET", "SHARPAPI", "REBET", "NETBET",
  "ESPNBET", "BETRIGHT", "POINTSBET", "PROPHETX", "BALLYBET", "ATG",
  "UNDERSTAT", "CORAL", "GTBETS", "SVENSKASPEL", "ONEXBET", "OPEN_METEO",
  "BETSSON", "BETRIVERS", "HARDROCKBET", "NORDICBET", "PARIONSSPORT",
  "BETONLINEAG", "BETFRED", "MARATHONBET", "PRIZEPICKS", "TRANSFERMARKT",
  "NEDS", "BETANYSPORTS", "UNDERDOG", "WINAMAX", "BETVICTOR", "TAB",
  "ODDS_ENGINE", "BETWAY", "LEOVEGAS", "EVERYGAME", "BETPARX",
  "LIVESCOREBET", "SPORTSBET_AU", "BWIN", "NOVIG", "DABBLE", "BETR_AU",
  "ODDS_API",
] as const

// =============================================================================
// INSTRUMENT TYPES
// =============================================================================

// SPOT renamed to SPOT_ASSET per spec
export const INSTRUMENT_TYPES = [
  "SPOT_ASSET", "SPOT_PAIR", "PERPETUAL", "PERP", "FUTURE", "OPTION",
  "INDEX", "BOND", "EQUITY", "ETF", "COMMODITY", "CURRENCY", "CDS",
  "POOL", "LENDING", "STAKING", "LST", "A_TOKEN", "YIELD_BEARING", "DEBT_TOKEN",
  "PREDICTION_MARKET", "EXCHANGE_ODDS", "FIXED_ODDS", "PROP"
] as const

export type InstrumentType = (typeof INSTRUMENT_TYPES)[number]

export const INSTRUMENT_TYPES_BY_VENUE: Record<string, InstrumentType[]> = {
  "BINANCE-SPOT": ["SPOT_ASSET"],
  "BINANCE-FUTURES": ["PERPETUAL", "FUTURE"],
  "OKX": ["SPOT_ASSET", "PERPETUAL", "OPTION", "FUTURE"],
  "OKX-SPOT": ["SPOT_ASSET"],
  "OKX-FUTURES": ["PERPETUAL", "OPTION", "FUTURE"],
  "BYBIT": ["SPOT_ASSET", "PERPETUAL", "FUTURE"],
  "BYBIT-SPOT": ["SPOT_ASSET"],
  "BYBIT-FUTURES": ["PERPETUAL", "FUTURE"],
  "DERIBIT": ["PERPETUAL", "OPTION", "FUTURE"],
  "HYPERLIQUID": ["PERPETUAL"],
  "NASDAQ": ["INDEX", "ETF", "EQUITY"],
  "NYSE": ["INDEX", "ETF", "EQUITY"],
  "CME": ["INDEX", "OPTION", "BOND", "FUTURE"],
  "CBOE": ["INDEX", "OPTION", "ETF", "EQUITY"],
  "UNISWAPV3-ETH": ["POOL"],
  "AAVE_V3": ["LENDING"],
  "LIDO": ["STAKING"],
  "BETFAIR": ["EXCHANGE_ODDS"],
  "KALSHI": ["PREDICTION_MARKET"],
  "FANDUEL": ["FIXED_ODDS"],
  "PRIZEPICKS": ["PROP"],
}

// =============================================================================
// ORDER & EXECUTION ENUMS
// =============================================================================

export const ORDER_SIDES = ["buy", "sell"] as const
export type OrderSide = (typeof ORDER_SIDES)[number]

export const ORDER_TYPES = [
  "market", "limit", "stop", "stop_limit", "trailing_stop", "twap", "vwap"
] as const
export type OrderType = (typeof ORDER_TYPES)[number]

export const ORDER_STATUSES = [
  "pending", "open", "partially_filled", "filled", "cancelled", "rejected", "expired"
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const TIME_IN_FORCE = ["GTC", "IOC", "FOK", "GTD", "POST_ONLY"] as const
export type TimeInForce = (typeof TIME_IN_FORCE)[number]

export const EXECUTION_STATUSES = [
  "pending", "submitted", "partial", "completed", "failed", "cancelled", "timeout"
] as const
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number]

export const EXECUTION_MODES = ["AGGRESSIVE", "PASSIVE", "NEUTRAL", "TWAP", "VWAP"] as const
export type ExecutionMode = (typeof EXECUTION_MODES)[number]

export const OPERATION_TYPES = [
  "BUY", "SELL", "SWAP", "LEND", "BORROW", "REPAY", "WITHDRAW",
  "DEPOSIT", "REBALANCE", "ADD_LIQUIDITY", "REMOVE_LIQUIDITY", "COLLECT_FEES"
] as const
export type OperationType = (typeof OPERATION_TYPES)[number]

export const INSTRUCTION_TYPES = [
  "TRADE", "SWAP", "ZERO_ALPHA", "PREDICTION_BET", "SPORTS_BET",
  "SPORTS_EXCHANGE_ORDER", "FUTURES_ROLL", "OPTIONS_COMBO",
  "ADD_LIQUIDITY", "REMOVE_LIQUIDITY", "COLLECT_FEES"
] as const
export type InstructionType = (typeof INSTRUCTION_TYPES)[number]

// =============================================================================
// MARKET & POSITION ENUMS
// =============================================================================

export const MARKET_STATES = [
  "normal", "halted", "auction", "pre_market", "post_market", "closed"
] as const
export type MarketState = (typeof MARKET_STATES)[number]

export const POSITION_SIDES = ["LONG", "SHORT", "FLAT"] as const
export type PositionSide = (typeof POSITION_SIDES)[number]

export const MARGIN_TYPES = ["linear", "inverse", "quanto"] as const
export type MarginType = (typeof MARGIN_TYPES)[number]

// =============================================================================
// RISK ENUMS
// =============================================================================

export const RISK_TYPES = [
  "delta", "vega", "theta", "rho", "funding", "basis", "carry", "fx",
  "liquidity", "gamma", "volga", "vanna", "slide", "duration", "convexity",
  "spread", "concentration", "venue_protocol", "correlation", "edge_decay",
  "market_suspension", "protocol_risk", "impermanent_loss"
] as const
export type RiskType = (typeof RISK_TYPES)[number]

export const RISK_CATEGORIES = [
  "first_order", "second_order", "structural", "operational", "domain_specific"
] as const
export type RiskCategory = (typeof RISK_CATEGORIES)[number]

export const RISK_STATUSES = ["OK", "WARNING", "CRITICAL"] as const
export type RiskStatus = (typeof RISK_STATUSES)[number]

export const RISK_AGGREGATION_LEVELS = [
  "company", "client", "account", "strategy", "underlying", "instrument"
] as const
export type RiskAggregationLevel = (typeof RISK_AGGREGATION_LEVELS)[number]

export const ALERT_TYPES = [
  "PRE_TRADE_REJECTION", "RISK_WARNING", "RISK_CRITICAL", "EXPOSURE_BREACH",
  "MARGIN_WARNING", "LIQUIDATION_RISK", "DRAWDOWN_LIMIT", "CONCENTRATION_LIMIT"
] as const
export type AlertType = (typeof ALERT_TYPES)[number]

// =============================================================================
// SPORTS BETTING ENUMS
// =============================================================================

export const SPORTS = [
  "FOOTBALL", "BASKETBALL", "BASEBALL", "HOCKEY", "TENNIS", "CRICKET",
  "RUGBY", "GOLF", "MMA", "BOXING", "MOTORSPORT", "AMERICAN_FOOTBALL",
  "HANDBALL", "VOLLEYBALL", "TABLE_TENNIS", "DARTS", "SNOOKER", "ESPORTS", "SOCCER"
] as const
export type Sport = (typeof SPORTS)[number]

export const ODDS_FORMATS = ["decimal", "american", "fractional"] as const
export type OddsFormat = (typeof ODDS_FORMATS)[number]

export const ODDS_TYPES = [
  "h2h", "over_under", "asian_handicap", "both_teams_score", "correct_score",
  "outright", "half_time_result", "first_half_over_under", "corners", "cards",
  "player_props", "draw_no_bet", "double_chance", "goal_scorer"
] as const
export type OddsType = (typeof ODDS_TYPES)[number]

export const BET_STATUSES = [
  "pending", "placed", "partially_matched", "matched", "settled_win",
  "settled_loss", "settled_void", "cancelled", "rejected"
] as const
export type BetStatus = (typeof BET_STATUSES)[number]

export const BET_SIDES = ["back", "lay"] as const
export type BetSide = (typeof BET_SIDES)[number]

export const MATCH_PERIODS = [
  "pre_match", "1H", "HT", "2H", "ET1", "ET2", "PEN", "FT", "abandoned", "postponed"
] as const
export type MatchPeriod = (typeof MATCH_PERIODS)[number]

// =============================================================================
// ML & MODEL ENUMS
// =============================================================================

export const MODEL_TYPES = [
  "lightgbm", "xgboost", "random_forest", "neural_net", "linear", "ensemble"
] as const
export type ModelType = (typeof MODEL_TYPES)[number]

export const TARGET_TYPES = [
  "direction", "return", "volatility", "regime", "spread", "signal",
  "swing_high", "swing_low", "cross_venue_spread"
] as const
export type TargetType = (typeof TARGET_TYPES)[number]

export const REGIME_STATES = [
  "HIGH_VOL_TRENDING", "LOW_VOL_MEAN_REVERTING", "CRISIS",
  "TRENDING", "MEAN_REVERTING", "VOLATILE", "UNKNOWN"
] as const
export type RegimeState = (typeof REGIME_STATES)[number]

export const FACTOR_TYPES = [
  "momentum", "value", "quality", "size", "volatility", "carry",
  "liquidity", "macro", "crypto_beta", "defi_yield", "sentiment", "technical"
] as const
export type FactorType = (typeof FACTOR_TYPES)[number]

// =============================================================================
// ASSET CLASSES
// =============================================================================

export const ASSET_CLASSES = [
  "crypto", "equity", "fx", "commodity", "fixed_income"
] as const
export type AssetClass = (typeof ASSET_CLASSES)[number]

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  crypto: "Crypto",
  equity: "Equity",
  fx: "FX",
  commodity: "Commodity",
  fixed_income: "Fixed Income",
}

// =============================================================================
// OPERATIONAL MODES
// =============================================================================

export const CLOUD_PROVIDERS = ["gcp", "aws", "local"] as const
export type CloudProvider = (typeof CLOUD_PROVIDERS)[number]

export const COMPUTE_TYPES = ["cloud_run", "vm", "batch", "ec2"] as const
export type ComputeType = (typeof COMPUTE_TYPES)[number]

export const DATA_MODES = ["mock", "real"] as const
export type DataMode = (typeof DATA_MODES)[number]

export const RUNTIME_MODES = ["live", "batch"] as const
export type RuntimeMode = (typeof RUNTIME_MODES)[number]

// Correct 6-stage testing progression (BATCH_REAL removed - does not exist)
export const TESTING_STAGES = ["MOCK", "HISTORICAL", "LIVE_MOCK", "LIVE_TESTNET", "STAGING", "LIVE_REAL"] as const
export type TestingStage = (typeof TESTING_STAGES)[number]

export const PHASE_MODES = ["phase1", "phase2", "phase3"] as const
export type PhaseMode = (typeof PHASE_MODES)[number]

export const DEPLOYMENT_STATUSES = [
  "pending", "running", "completed", "failed", "cancelled", "timed_out"
] as const
export type DeploymentStatus = (typeof DEPLOYMENT_STATUSES)[number]

// =============================================================================
// DATA TYPES & SOURCES
// =============================================================================

export const DATA_TYPES = [
  "trades", "book_snapshot_5", "derivative_ticker", "liquidations",
  "ohlcv_1m", "ohlcv_15m", "ohlcv_24h", "tbbo", "swaps", "rate_indices",
  "oracle_prices", "options_chain", "futures_chain",
  "sports_arbitrage", "sports_odds_snapshot", "sports_odds_movement"
] as const
export type DataType = (typeof DATA_TYPES)[number]

export const BOOK_TYPES = ["L1_MBP", "L2_MBP", "AMM", "ALPHA_ZERO"] as const
export type BookType = (typeof BOOK_TYPES)[number]

export const ACCESS_MODES = [
  "rest_polling", "streaming_websocket", "batch_file", "graphql"
] as const
export type AccessMode = (typeof ACCESS_MODES)[number]

// =============================================================================
// ERROR & LIFECYCLE ENUMS
// =============================================================================

export const ERROR_CATEGORIES = [
  "rate_limit", "authentication", "authorization", "not_found", "validation",
  "validation_error", "timeout", "network", "server_error", "data_quality",
  "dependency", "unknown", "infrastructure", "application", "data",
  "execution", "compliance", "configuration"
] as const
export type ErrorCategory = (typeof ERROR_CATEGORIES)[number]

export const ERROR_SEVERITIES = ["low", "medium", "high", "critical"] as const
export type ErrorSeverity = (typeof ERROR_SEVERITIES)[number]

export const ERROR_RECOVERY_STRATEGIES = [
  "retry", "retry_with_backoff", "fallback", "fail_fast", "skip", "alert", "dead_letter"
] as const
export type ErrorRecoveryStrategy = (typeof ERROR_RECOVERY_STRATEGIES)[number]

// Added SIT and Agent events
export const LIFECYCLE_EVENT_TYPES = [
  "STARTED", "VALIDATION_STARTED", "VALIDATION_COMPLETED",
  "DATA_INGESTION_STARTED", "DATA_INGESTION_COMPLETED",
  "PROCESSING_STARTED", "PROCESSING_COMPLETED", "STOPPED", "FAILED",
  "DATA_BROADCAST", "PERSISTENCE_STARTED", "PERSISTENCE_COMPLETED",
  "AUTH_SUCCESS", "AUTH_FAILURE", "CONFIG_CHANGED", "SECRET_ACCESSED",
  "DATA_READY", "PREDICTIONS_READY", "STRATEGY_SIGNALS_READY",
  "QG_PASSED", "QG_FAILED", "DEPLOYMENT_STARTED", "DEPLOYMENT_COMPLETED",
  "DEPLOYMENT_FAILED", "DEPLOYMENT_ROLLED_BACK", "WORKFLOW_TRIGGERED",
  "VERSION_BUMPED", "CASCADE_DISPATCHED",
  // SIT events
  "SIT_STARTED", "SIT_PASSED", "SIT_FAILED",
  // Agent events
  "AGENT_INVESTIGATION_TRIGGERED", "AGENT_INVESTIGATION_COMPLETED",
  "AGENT_FIX_APPLIED", "AGENT_FIX_FAILED"
] as const
export type LifecycleEventType = (typeof LIFECYCLE_EVENT_TYPES)[number]

export const LOG_LEVELS = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] as const
export type LogLevel = (typeof LOG_LEVELS)[number]

// =============================================================================
// NEW ENUMS (from spec 2.7)
// =============================================================================

export const DURATION_BUCKETS = ["OVERNIGHT", "1W", "1M", "3M", "6M", "1Y", "2Y+"] as const
export type DurationBucket = (typeof DURATION_BUCKETS)[number]

export const EMERGENCY_EXIT_TYPES = [
  "STOP_NEW_ONLY", "FAST_UNWIND", "SLOW_UNWIND", "DELTA_HEDGE",
  "DELEVERAGE_SEQUENCE", "ATOMIC_UNWIND", "MARKET_CLOSE",
  "HEDGE_CROSS_VENUE", "HYBRID_UNWIND"
] as const
export type EmergencyExitType = (typeof EMERGENCY_EXIT_TYPES)[number]

export const STRESS_SCENARIO_TYPES = ["GFC_2008", "COVID_2020", "CRYPTO_BLACK_THURSDAY_2020"] as const
export type StressScenarioType = (typeof STRESS_SCENARIO_TYPES)[number]

export const VAR_METHODS = ["HISTORICAL", "PARAMETRIC", "MONTE_CARLO", "FILTERED_HISTORICAL"] as const
export type VarMethod = (typeof VAR_METHODS)[number]

export const URGENCY_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number]

// =============================================================================
// VENUE ACCESS MODES (spec 2.8)
// =============================================================================

export const VENUE_ACCESS_MODES: Record<string, string> = {
  POLYMARKET: "streaming_websocket",
  DATABENTO: "streaming_websocket",
  IBKR: "streaming_websocket",
  TARDIS: "batch_file",
  BARCHART: "batch_file",
  THEGRAPH: "graphql",
  // all others default to "rest_polling"
}

export function getVenueAccessMode(venue: string): string {
  return VENUE_ACCESS_MODES[venue] || "rest_polling"
}

// =============================================================================
// PERMISSIONS
// =============================================================================

export const PERMISSIONS = [
  "trade:view", "trade:execute", "trade:cancel",
  "position:view", "position:close",
  "market_data:view", "market_data:subscribe",
  "deploy:view", "deploy:trigger", "deploy:rollback",
  "config:view", "config:edit",
  "user:view", "user:manage", "user:role_assign",
  "audit:view", "audit:export",
  "risk:view", "risk:override",
  "system:health_view", "system:admin"
] as const
export type Permission = (typeof PERMISSIONS)[number]

// =============================================================================
// PUBSUB TOPICS
// =============================================================================

export const INTERNAL_PUBSUB_TOPICS = [
  "fill-events-{venue}", "order-requests", "execution-results",
  "position-updates", "positions", "risk-alerts", "margin-warnings",
  "market-ticks", "order-book-updates", "derivative-tickers",
  "liquidations", "feature-updates", "strategy-signals", "ml-predictions",
  "service-lifecycle-events", "health-alerts", "circuit-breaker-events",
  "aggregated-positions", "portfolio-views", "risk-group-updates", "eod-settlement"
] as const
export type InternalPubSubTopic = (typeof INTERNAL_PUBSUB_TOPICS)[number]

// =============================================================================
// SERVICE PORT REGISTRY
// =============================================================================

// CORRECT SERVICE_PORTS from real system - removed fabricated services
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
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getVenuesByCategory(category: VenueCategory): string[] {
  return Object.entries(VENUE_CATEGORY_MAP)
    .filter(([, cat]) => cat === category)
    .map(([venue]) => venue)
}

export function getVenueCategory(venue: string): VenueCategory | undefined {
  return VENUE_CATEGORY_MAP[venue]
}

export function getInstrumentTypesForVenue(venue: string): InstrumentType[] {
  return INSTRUMENT_TYPES_BY_VENUE[venue] || []
}

export function isExchangeVenue(venue: string): boolean {
  return CLOB_VENUES.includes(venue as typeof CLOB_VENUES[number]) ||
         DEX_VENUES.includes(venue as typeof DEX_VENUES[number])
}

export function isSportsVenue(venue: string): boolean {
  return SPORTS_VENUES.includes(venue as typeof SPORTS_VENUES[number]) ||
         VENUE_CATEGORY_MAP[venue] === "sports"
}

export function isZeroAlphaVenue(venue: string): boolean {
  return ZERO_ALPHA_VENUES.includes(venue as typeof ZERO_ALPHA_VENUES[number])
}

// Status color helpers
export function getRiskStatusColor(status: RiskStatus): string {
  switch (status) {
    case "OK": return "var(--status-live)"
    case "WARNING": return "var(--status-warning)"
    case "CRITICAL": return "var(--status-critical)"
    default: return "var(--muted-foreground)"
  }
}

export function getOrderStatusColor(status: OrderStatus): string {
  switch (status) {
    case "filled": return "var(--status-live)"
    case "partially_filled": return "var(--status-warning)"
    case "open":
    case "pending": return "var(--status-running)"
    case "cancelled":
    case "expired": return "var(--status-idle)"
    case "rejected": return "var(--status-critical)"
    default: return "var(--muted-foreground)"
  }
}

export function getBetStatusColor(status: BetStatus): string {
  switch (status) {
    case "settled_win": return "var(--pnl-positive)"
    case "settled_loss": return "var(--pnl-negative)"
    case "matched": return "var(--status-live)"
    case "partially_matched": return "var(--status-warning)"
    case "pending":
    case "placed": return "var(--status-running)"
    case "cancelled":
    case "settled_void": return "var(--status-idle)"
    case "rejected": return "var(--status-critical)"
    default: return "var(--muted-foreground)"
  }
}

export function getDeploymentStatusColor(status: DeploymentStatus): string {
  switch (status) {
    case "completed": return "var(--status-live)"
    case "running": return "var(--status-running)"
    case "pending": return "var(--status-idle)"
    case "failed":
    case "timed_out": return "var(--status-critical)"
    case "cancelled": return "var(--status-warning)"
    default: return "var(--muted-foreground)"
  }
}

export function getVenueCategoryColor(category: VenueCategory): string {
  switch (category) {
    case "cefi": return "var(--surface-trading)"
    case "tradfi": return "var(--surface-markets)"
    case "defi": return "var(--surface-config)"
    case "sports": return "var(--surface-strategy)"
    default: return "var(--muted-foreground)"
  }
}

// =============================================================================
// STRATEGY ARCHETYPES - Primary navigation mode for strategies
// =============================================================================

// 9 archetypes total (added OPTIONS)
export const STRATEGY_ARCHETYPES = [
  { id: "ARBITRAGE", label: "Arbitrage", description: "Cross-venue price discrepancy exploitation", color: "#4ade80" },
  { id: "MARKET_MAKING", label: "Market Making", description: "Continuous quoting and spread capture", color: "#60a5fa" },
  { id: "DIRECTIONAL", label: "Directional", description: "Trend-following and ML-based predictions", color: "#f472b6" },
  { id: "YIELD", label: "Yield", description: "Lending, staking, and LP provision", color: "#fbbf24" },
  { id: "BASIS_TRADE", label: "Basis Trade", description: "Spot vs derivative funding rate capture", color: "#22d3ee" },
  { id: "MOMENTUM", label: "Momentum", description: "Trend continuation strategies", color: "#a78bfa" },
  { id: "MEAN_REVERSION", label: "Mean Reversion", description: "Statistical reversion to mean", color: "#fb923c" },
  { id: "STATISTICAL_ARB", label: "Statistical Arb", description: "Pairs and basket trading", color: "#2dd4bf" },
  { id: "OPTIONS", label: "Options", description: "Options market making and delta hedging", color: "#ec4899" },
] as const

export type StrategyArchetype = (typeof STRATEGY_ARCHETYPES)[number]["id"]

// =============================================================================
// STRATEGY TYPES - Secondary grouping after archetype
// =============================================================================

export const STRATEGY_TYPES = [
  { id: "CEFI_MOMENTUM", label: "CeFi Momentum", archetype: "MOMENTUM", domain: "cefi" },
  { id: "CEFI_ARBITRAGE", label: "CeFi Arbitrage", archetype: "ARBITRAGE", domain: "cefi" },
  { id: "CEFI_MARKET_MAKING", label: "CeFi Market Making", archetype: "MARKET_MAKING", domain: "cefi" },
  { id: "CEFI_BASIS", label: "CeFi Basis Trade", archetype: "BASIS_TRADE", domain: "cefi" },
  { id: "DEFI_LENDING", label: "DeFi Lending", archetype: "YIELD", domain: "defi" },
  { id: "DEFI_LP", label: "DeFi LP Provision", archetype: "YIELD", domain: "defi" },
  { id: "DEFI_STAKING", label: "DeFi Staking", archetype: "YIELD", domain: "defi" },
  { id: "DEFI_ARB", label: "DeFi Arbitrage", archetype: "ARBITRAGE", domain: "defi" },
  { id: "TRADFI_MOMENTUM", label: "TradFi Momentum", archetype: "MOMENTUM", domain: "tradfi" },
  { id: "TRADFI_STAT_ARB", label: "TradFi Stat Arb", archetype: "STATISTICAL_ARB", domain: "tradfi" },
  { id: "SPORTS_VALUE", label: "Sports Value Betting", archetype: "DIRECTIONAL", domain: "sports" },
  { id: "SPORTS_ARB", label: "Sports Arbitrage", archetype: "ARBITRAGE", domain: "sports" },
] as const

export type StrategyType = (typeof STRATEGY_TYPES)[number]["id"]

// =============================================================================
// DATA FLOWS - Live vs Batch parallel hierarchies from system-topology.json
// =============================================================================

export interface DataFlow {
  id: string
  domain: string
  mode: "live" | "batch"
  service: string | null
  dataSource: "gcs" | "pubsub" | "gcp-api"
  api: string | null
  ui: string | string[]
  note?: string
}

export const DATA_FLOWS: DataFlow[] = [
  // Client Reporting - Parallel live/batch
  { id: "client-reporting", domain: "client-reporting", mode: "batch", service: "pnl-attribution-service", dataSource: "gcs", api: "client-reporting-api", ui: "client-reporting-ui" },
  { id: "client-reporting-live", domain: "client-reporting", mode: "live", service: "pnl-attribution-service", dataSource: "pubsub", api: "client-reporting-api", ui: "client-reporting-ui" },
  
  // Execution - Parallel live/batch
  { id: "execution-results", domain: "execution", mode: "batch", service: "execution-service", dataSource: "gcs", api: "execution-results-api", ui: "execution-analytics-ui" },
  { id: "execution-results-live", domain: "execution", mode: "live", service: "execution-service", dataSource: "pubsub", api: "execution-results-api", ui: ["execution-analytics-ui", "trading-analytics-ui", "live-health-monitor-ui"] },
  
  // Market Data - Parallel live/batch
  { id: "market-data", domain: "market-data", mode: "batch", service: "market-data-processing-service", dataSource: "gcs", api: "market-data-api", ui: ["trading-analytics-ui", "batch-audit-ui"] },
  { id: "market-data-live", domain: "market-data", mode: "live", service: "market-data-processing-service", dataSource: "pubsub", api: "market-data-api", ui: ["trading-analytics-ui", "batch-audit-ui"] },
  
  // Batch Audit / Reconciliation
  { id: "batch-audit", domain: "batch-audit", mode: "batch", service: "batch-live-reconciliation-service", dataSource: "gcs", api: "batch-audit-api", ui: ["batch-audit-ui", "logs-dashboard-ui"] },
  
  // ML - Parallel live/batch
  { id: "ml-inference", domain: "ml", mode: "batch", service: "ml-inference-service", dataSource: "gcs", api: "ml-inference-api", ui: "ml-training-ui" },
  { id: "ml-inference-live", domain: "ml", mode: "live", service: "ml-inference-service", dataSource: "pubsub", api: "ml-inference-api", ui: "ml-training-ui" },
  { id: "ml-training", domain: "ml", mode: "batch", service: "ml-training-service", dataSource: "gcs", api: "ml-training-api", ui: "ml-training-ui" },
  
  // Trading Analytics - Parallel live/batch
  { id: "trading-analytics", domain: "execution", mode: "batch", service: "execution-service", dataSource: "gcs", api: "trading-analytics-api", ui: "trading-analytics-ui" },
  { id: "trading-analytics-live", domain: "execution", mode: "live", service: "execution-service", dataSource: "pubsub", api: "trading-analytics-api", ui: "trading-analytics-ui" },
  
  // Deployment (live only)
  { id: "deployment", domain: "deployment", mode: "live", service: "deployment-service", dataSource: "gcp-api", api: "deployment-api", ui: ["deployment-ui", "execution-analytics-ui"] },
  
  // Strategy - Parallel live/batch
  { id: "strategy-direct", domain: "strategy", mode: "batch", service: "strategy-service", dataSource: "gcs", api: null, ui: "strategy-ui", note: "Direct service call, no API layer" },
  { id: "strategy-direct-live", domain: "strategy", mode: "live", service: "strategy-service", dataSource: "pubsub", api: null, ui: "strategy-ui" },
  
  // Settlement - Parallel live/batch
  { id: "settlement", domain: "settlement", mode: "batch", service: "position-balance-monitor-service", dataSource: "gcs", api: "settlement-api", ui: "settlement-ui" },
  { id: "settlement-live", domain: "settlement", mode: "live", service: "position-balance-monitor-service", dataSource: "pubsub", api: "settlement-api", ui: "settlement-ui" },
  
  // Alerting (live only)
  { id: "alerting", domain: "observability", mode: "live", service: "alerting-service", dataSource: "pubsub", api: null, ui: "live-health-monitor-ui", note: "Alerts tab, SSE stream" },
]

export function getDataFlowsByDomain(domain: string): DataFlow[] {
  return DATA_FLOWS.filter(f => f.domain === domain)
}

export function getDataFlowsByMode(mode: "live" | "batch"): DataFlow[] {
  return DATA_FLOWS.filter(f => f.mode === mode)
}

// =============================================================================
// SERVICES - From system-topology.json workspace.repositories
// =============================================================================

export interface Service {
  id: string
  name: string
  type: "api-service" | "service" | "batch-service" | "ui" | "library" | "infrastructure"
  tier: number
  domain: string
  mode: "live" | "batch" | null
  capabilities: string[]
  status: "active" | "scaffolded" | "deprecated"
  servesUi: string[] | null
  coveragePct: number | null
}

// SERVICES with CORRECTED coverage percentages from real system
export const SERVICES: Service[] = [
  // Core Services - coverage corrected per spec 2.2
  { id: "execution-service", name: "Execution Service", type: "service", tier: 3, domain: "execution", mode: "live", capabilities: ["event_bus", "cache", "config_store"], status: "active", servesUi: null, coveragePct: 26 },
  { id: "strategy-service", name: "Strategy Service", type: "service", tier: 3, domain: "strategy", mode: "live", capabilities: ["event_bus", "cache", "data_source"], status: "active", servesUi: null, coveragePct: 68 },
  { id: "pnl-attribution-service", name: "P&L Attribution Service", type: "batch-service", tier: 3, domain: "analytics", mode: "batch", capabilities: ["data_source", "data_sink", "event_bus"], status: "active", servesUi: null, coveragePct: 46 }, // was 72
  { id: "market-data-processing-service", name: "Market Data Processing", type: "service", tier: 3, domain: "market-data", mode: "live", capabilities: ["data_source", "data_sink", "event_bus"], status: "active", servesUi: null, coveragePct: 39 }, // was 65
  { id: "deployment-service", name: "Deployment Service", type: "infrastructure", tier: 3, domain: "deployment", mode: null, capabilities: [], status: "active", servesUi: null, coveragePct: 81 },
  { id: "alerting-service", name: "Alerting Service", type: "service", tier: 3, domain: "observability", mode: "live", capabilities: ["data_source", "data_sink", "event_bus", "cache"], status: "active", servesUi: null, coveragePct: 87 },
  { id: "batch-live-reconciliation-service", name: "Batch-Live Reconciliation", type: "batch-service", tier: 3, domain: "analytics", mode: "batch", capabilities: ["data_source", "data_sink", "event_bus"], status: "active", servesUi: null, coveragePct: null },
  { id: "position-balance-monitor-service", name: "Position Balance Monitor", type: "service", tier: 3, domain: "settlement", mode: "live", capabilities: ["data_source", "event_bus"], status: "active", servesUi: null, coveragePct: 77 }, // was 52
  
  // ML Services - coverage corrected per spec 2.2
  { id: "ml-inference-service", name: "ML Inference Service", type: "service", tier: 3, domain: "ml", mode: "live", capabilities: ["data_source", "cache", "event_bus"], status: "active", servesUi: null, coveragePct: 75 }, // was 71
  { id: "ml-training-service", name: "ML Training Service", type: "batch-service", tier: 3, domain: "ml", mode: "batch", capabilities: ["data_source", "data_sink"], status: "active", servesUi: null, coveragePct: 35 }, // was 65
  
  // Feature Services
  { id: "features-delta-one-service", name: "Delta One Features", type: "service", tier: 3, domain: "features", mode: "batch", capabilities: ["data_source", "data_sink", "event_bus"], status: "active", servesUi: null, coveragePct: 71 },
  { id: "features-volatility-service", name: "Volatility Features", type: "service", tier: 3, domain: "features", mode: "batch", capabilities: ["data_source", "data_sink", "event_bus"], status: "active", servesUi: null, coveragePct: 35 },
  { id: "features-onchain-service", name: "On-Chain Features", type: "service", tier: 3, domain: "features", mode: "batch", capabilities: ["data_source", "data_sink", "event_bus"], status: "active", servesUi: null, coveragePct: 39 },
  { id: "features-sports-service", name: "Sports Features", type: "service", tier: 3, domain: "features", mode: "batch", capabilities: ["data_source", "data_sink", "event_bus"], status: "scaffolded", servesUi: null, coveragePct: 87 },
  { id: "features-calendar-service", name: "Calendar Features", type: "service", tier: 3, domain: "features", mode: "batch", capabilities: ["data_source", "data_sink", "event_bus"], status: "active", servesUi: null, coveragePct: 72 },
  { id: "features-cross-instrument-service", name: "Cross-Instrument Features", type: "service", tier: 3, domain: "features", mode: "batch", capabilities: ["data_source", "data_sink", "event_bus"], status: "active", servesUi: null, coveragePct: 65 },
  { id: "features-multi-timeframe-service", name: "Multi-Timeframe Features", type: "service", tier: 3, domain: "features", mode: "batch", capabilities: ["data_source", "data_sink", "event_bus"], status: "active", servesUi: null, coveragePct: 57 },
  
  // APIs - coverage corrected per spec 2.2
  { id: "execution-results-api", name: "Execution Results API", type: "api-service", tier: 3, domain: "execution", mode: "live", capabilities: ["data_source", "event_bus", "cache"], status: "active", servesUi: ["trading-analytics-ui", "live-health-monitor-ui", "execution-analytics-ui"], coveragePct: 66 },
  { id: "client-reporting-api", name: "Client Reporting API", type: "api-service", tier: 3, domain: "analytics", mode: "live", capabilities: ["data_source", "event_bus", "cache"], status: "active", servesUi: ["client-reporting-ui"], coveragePct: 18 },
  { id: "deployment-api", name: "Deployment API", type: "api-service", tier: 3, domain: "deployment", mode: "live", capabilities: ["event_bus", "cache"], status: "active", servesUi: ["deployment-ui"], coveragePct: 71 },
  { id: "batch-audit-api", name: "Batch Audit API", type: "api-service", tier: 3, domain: "analytics", mode: "live", capabilities: ["data_source", "event_bus"], status: "active", servesUi: ["batch-audit-ui", "logs-dashboard-ui"], coveragePct: null },
  { id: "ml-inference-api", name: "ML Inference API", type: "api-service", tier: 3, domain: "ml", mode: "live", capabilities: ["data_source", "cache"], status: "active", servesUi: ["ml-training-ui"], coveragePct: null }, // was 64 (no data)
  { id: "ml-training-api", name: "ML Training API", type: "api-service", tier: 3, domain: "ml", mode: "live", capabilities: ["data_source"], status: "active", servesUi: ["ml-training-ui"], coveragePct: null }, // was 58 (no data)
  { id: "market-data-api", name: "Market Data API", type: "api-service", tier: 3, domain: "market-data", mode: "live", capabilities: ["data_source", "event_bus"], status: "active", servesUi: ["trading-analytics-ui", "batch-audit-ui"], coveragePct: 77 }, // was 62
  { id: "trading-analytics-api", name: "Trading Analytics API", type: "api-service", tier: 3, domain: "execution", mode: "live", capabilities: ["data_source", "cache"], status: "active", servesUi: ["trading-analytics-ui"], coveragePct: null }, // was 55 (no data)
]

export function getServicesByDomain(domain: string): Service[] {
  return SERVICES.filter(s => s.domain === domain)
}

export function getServicesByType(type: Service["type"]): Service[] {
  return SERVICES.filter(s => s.type === type)
}

// =============================================================================
// P&L ATTRIBUTION FACTORS
// =============================================================================

export const PNL_FACTORS = [
  { id: "FUNDING", label: "Funding", description: "Funding rate payments (perps)", color: "#60a5fa" },
  { id: "CARRY", label: "Carry", description: "Interest rate differential", color: "#4ade80" },
  { id: "BASIS", label: "Basis", description: "Spot vs derivative basis change", color: "#a78bfa" },
  { id: "DELTA", label: "Delta", description: "Directional price movement", color: "#f472b6" },
  { id: "GAMMA", label: "Gamma", description: "Delta change (options)", color: "#fbbf24" },
  { id: "VEGA", label: "Vega", description: "Volatility change (options)", color: "#22d3ee" },
  { id: "THETA", label: "Theta", description: "Time decay (options)", color: "#fb923c" },
  { id: "SLIPPAGE", label: "Slippage", description: "Execution slippage vs expected", color: "#ef4444" },
  { id: "FEES", label: "Fees", description: "Trading and network fees", color: "#dc2626" },
  { id: "REBATES", label: "Rebates", description: "Maker rebates earned", color: "#22c55e" },
] as const

export type PnLFactor = (typeof PNL_FACTORS)[number]["id"]

// =============================================================================
// EXECUTION ALGORITHMS
// =============================================================================

export const EXECUTION_ALGORITHMS = [
  { id: "TWAP", name: "Time-Weighted Average Price", description: "Splits order evenly over time period" },
  { id: "VWAP", name: "Volume-Weighted Average Price", description: "Tracks historical volume profile" },
  { id: "ICEBERG", name: "Iceberg", description: "Shows only small portion of order" },
  { id: "SNIPER", name: "Sniper", description: "Aggressive taker for quick execution" },
  { id: "POV", name: "Percentage of Volume", description: "Participates at target volume rate" },
  { id: "MAKER_ONLY", name: "Maker Only", description: "Post-only limit orders for rebates" },
  { id: "SMART_ROUTER", name: "Smart Router", description: "Routes across venues for best execution" },
] as const

export type ExecutionAlgorithm = (typeof EXECUTION_ALGORITHMS)[number]["id"]

// =============================================================================
// UNDERLYING ASSETS
// =============================================================================

export type UnderlyingType = "CRYPTO" | "EQUITY" | "COMMODITY" | "FX" | "SPORTS_LEAGUE" | "PREDICTION_MARKET"

export interface Underlying {
  id: string
  symbol: string
  name: string
  type: UnderlyingType
  category?: string
}

export const UNDERLYINGS: Underlying[] = [
  // Crypto - Major
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
  
  // Stablecoins
  { id: "USDT", symbol: "USDT", name: "Tether", type: "CRYPTO", category: "STABLECOIN" },
  { id: "USDC", symbol: "USDC", name: "USD Coin", type: "CRYPTO", category: "STABLECOIN" },
  { id: "DAI", symbol: "DAI", name: "Dai", type: "CRYPTO", category: "STABLECOIN" },
  
  // Equity Indices & ETFs
  { id: "SPY", symbol: "SPY", name: "S&P 500 ETF", type: "EQUITY" },
  { id: "QQQ", symbol: "QQQ", name: "Nasdaq 100 ETF", type: "EQUITY" },
  { id: "IWM", symbol: "IWM", name: "Russell 2000 ETF", type: "EQUITY" },
  { id: "DIA", symbol: "DIA", name: "Dow Jones ETF", type: "EQUITY" },
  
  // Commodities
  { id: "GC", symbol: "GC", name: "Gold", type: "COMMODITY" },
  { id: "CL", symbol: "CL", name: "Crude Oil", type: "COMMODITY" },
  { id: "SI", symbol: "SI", name: "Silver", type: "COMMODITY" },
  { id: "NG", symbol: "NG", name: "Natural Gas", type: "COMMODITY" },
  
  // FX
  { id: "EURUSD", symbol: "EUR/USD", name: "Euro/US Dollar", type: "FX" },
  { id: "GBPUSD", symbol: "GBP/USD", name: "British Pound/US Dollar", type: "FX" },
  { id: "USDJPY", symbol: "USD/JPY", name: "US Dollar/Japanese Yen", type: "FX" },
  
  // Sports Leagues
  { id: "NBA", symbol: "NBA", name: "NBA Basketball", type: "SPORTS_LEAGUE", category: "BASKETBALL" },
  { id: "NFL", symbol: "NFL", name: "NFL Football", type: "SPORTS_LEAGUE", category: "FOOTBALL" },
  { id: "MLB", symbol: "MLB", name: "MLB Baseball", type: "SPORTS_LEAGUE", category: "BASEBALL" },
  { id: "NHL", symbol: "NHL", name: "NHL Hockey", type: "SPORTS_LEAGUE", category: "HOCKEY" },
  { id: "EPL", symbol: "EPL", name: "English Premier League", type: "SPORTS_LEAGUE", category: "SOCCER" },
  { id: "UEFA_CL", symbol: "UCL", name: "UEFA Champions League", type: "SPORTS_LEAGUE", category: "SOCCER" },
  { id: "ATP", symbol: "ATP", name: "ATP Tennis", type: "SPORTS_LEAGUE", category: "TENNIS" },
  
  // Prediction Markets
  { id: "US_ELECTION", symbol: "ELECTION", name: "US Elections", type: "PREDICTION_MARKET", category: "POLITICS" },
  { id: "FED_RATES", symbol: "RATES", name: "Fed Rate Decisions", type: "PREDICTION_MARKET", category: "ECONOMICS" },
]

export function getUnderlyingsByType(type: UnderlyingType): Underlying[] {
  return UNDERLYINGS.filter(u => u.type === type)
}

// =============================================================================
// CURRENCY FORMATTING
// =============================================================================

export function formatCurrency(value: number, decimals = 0): string {
  const absValue = Math.abs(value)
  if (absValue >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(decimals)}B`
  if (absValue >= 1_000_000) return `${(value / 1_000_000).toFixed(decimals)}M`
  if (absValue >= 1_000) return `${(value / 1_000).toFixed(decimals)}K`
  return value.toFixed(decimals)
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`
}
