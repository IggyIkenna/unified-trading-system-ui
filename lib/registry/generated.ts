/**
 * AUTO-DERIVED from ui-reference-data.json.
 *
 * JSON is produced by unified-trading-pm/scripts/openapi/generate_ui_reference_data.py
 * (default output: unified-api-contracts/openapi/ui-reference-data.json).
 * Full pipeline index: unified-trading-pm/docs/ui-alignment-ssot.md
 *
 * This module re-exports typed constants so the rest of the UI can
 * import domain data without hand-maintaining venue lists, enum arrays,
 * or config schemas.
 *
 * Do NOT edit existing export mappings by hand when only JSON *values* change —
 * copy a fresh ui-reference-data.json (see PM ui-alignment-ssot.md). If the
 * generator adds new sections or keys the UI must expose, add exports here.
 *
 * NOTE: Some keys may be absent from older JSON versions. All accessors
 * use safe fallbacks to prevent runtime crashes.
 */

import referenceData from "./ui-reference-data.json";

const data = referenceData as Record<string, unknown>;

// ---------------------------------------------------------------------------
// Registries (may not exist in current JSON version)
// ---------------------------------------------------------------------------

const registries = (data.registries ?? {}) as Record<string, unknown>;

export const VENUE_CATEGORY_MAP = (registries.venue_category_map ??
  {}) as Record<string, string>;
export const INSTRUMENT_TYPES_BY_VENUE =
  (registries.instrument_types_by_venue ?? {}) as Record<string, string[]>;
export const INSTRUMENT_TYPE_FOLDER_MAP =
  (registries.instrument_type_folder_map ?? {}) as Record<string, string>;
export const CLOB_VENUES = (registries.clob_venues ?? []) as string[];
export const DEX_VENUES = (registries.dex_venues ?? []) as string[];
export const SPORTS_VENUES = (registries.sports_venues ?? []) as string[];
export const ZERO_ALPHA_VENUES = (registries.zero_alpha_venues ??
  []) as string[];
export const ENDPOINT_REGISTRY = (registries.endpoint_registry ?? {}) as Record<
  string,
  unknown
>;

// ---------------------------------------------------------------------------
// UAC Enums (may not exist in current JSON version)
// ---------------------------------------------------------------------------

const uacEnums = (data.uac_enums ?? {}) as Record<string, string[]>;

export const UAC_ENUMS = uacEnums;
export const ORDER_SIDES = uacEnums.OrderSide ?? [];
export const ORDER_TYPES = uacEnums.OrderType ?? [];
export const ORDER_STATUSES = uacEnums.OrderStatus ?? [];
export const TIME_IN_FORCE = uacEnums.TimeInForce ?? [];
export const EXECUTION_STATUSES = uacEnums.ExecutionStatus ?? [];
export const UAC_OPERATION_TYPES = uacEnums.OperationType ?? [];
export const UAC_INSTRUMENT_TYPES = uacEnums.InstrumentType ?? [];
export const INSTRUCTION_TYPES = uacEnums.InstructionType ?? [];
export const MARKET_STATES = uacEnums.MarketState ?? [];
export const SPORTS = uacEnums.Sport ?? [];
export const ODDS_FORMATS = uacEnums.OddsFormat ?? [];
export const ODDS_TYPES = uacEnums.OddsType ?? [];
export const BET_STATUSES = uacEnums.BetStatus ?? [];
export const BET_SIDES = uacEnums.BetSide ?? [];
export const UAC_OPTION_TYPES = uacEnums.OptionType ?? [];
export const UAC_FEE_TYPES = uacEnums.FeeType ?? [];
export const UAC_CLOUD_PROVIDERS = uacEnums.CloudProvider ?? [];
export const COMPUTE_TARGETS = uacEnums.ComputeTarget ?? [];
export const SCALING_MODES = uacEnums.ScalingMode ?? [];
export const UAC_VENUE_CATEGORIES = uacEnums.VenueCategory ?? [];
export const ALTERNATIVE_DATA_TYPES = uacEnums.AlternativeDataType ?? [];
export const RISK_TYPES = uacEnums.RiskType ?? [];
export const RISK_CATEGORIES = uacEnums.RiskCategory ?? [];
export const SIGNAL_SOURCES = uacEnums.SignalSource ?? [];
export const BOOKMAKER_CATEGORIES = uacEnums.BookmakerCategory ?? [];
export const MATCH_PERIODS = uacEnums.MatchPeriod ?? [];
export const OUTCOME_TYPES = uacEnums.OutcomeType ?? [];
export const UAC_MARKET_STATUSES = uacEnums.MarketStatus ?? [];
export const PREDICTION_MARKET_CATEGORIES =
  uacEnums.PredictionMarketCategory ?? [];

// ---------------------------------------------------------------------------
// UIC Enums (may not exist in current JSON version)
// ---------------------------------------------------------------------------

const uicEnums = (data.uic_enums ?? {}) as Record<string, string[]>;

export const UIC_ENUMS = uicEnums;
export const ALERT_TYPES = uicEnums.AlertType ?? [];
export const ASSET_CLASSES = uicEnums.AssetClass ?? [];
export const BOOK_TYPES = uicEnums.BookType ?? [];
export const CLOUD_PROVIDERS = uicEnums.CloudProvider ?? [];
export const COMPUTE_TYPES = uicEnums.ComputeType ?? [];
export const CORRELATION_REGIMES = uicEnums.CorrelationRegime ?? [];
export const CUSTOM_RISK_EVALUATION_METHODS =
  uicEnums.CustomRiskEvaluationMethod ?? [];
export const DATA_MODES = uicEnums.DataMode ?? [];
export const DATA_SOURCE_CONSTRAINTS = uicEnums.DataSourceConstraint ?? [];
export const DATA_TYPES = uicEnums.DataType ?? [];
export const DEPLOYMENT_STATUSES = uicEnums.DeploymentStatus ?? [];
export const DURATION_BUCKETS = uicEnums.DurationBucket ?? [];
export const EMERGENCY_EXIT_TYPES = uicEnums.EmergencyExitType ?? [];
export const ERROR_CATEGORIES = uicEnums.ErrorCategory ?? [];
export const ERROR_RECOVERY_STRATEGIES = uicEnums.ErrorRecoveryStrategy ?? [];
export const ERROR_SEVERITIES = uicEnums.ErrorSeverity ?? [];
export const EVENT_SEVERITIES = uicEnums.EventSeverity ?? [];
export const EXECUTION_MODES = uicEnums.ExecutionMode ?? [];
export const EXECUTION_ORDER_TYPES = uicEnums.ExecutionOrderType ?? [];
export const EXECUTION_POSITION_TYPES = uicEnums.ExecutionPositionType ?? [];
export const FACTOR_TYPES = uicEnums.FactorType ?? [];
export const UIC_FEE_TYPES = uicEnums.FeeType ?? [];
export const GAS_COST_ACTIONS = uicEnums.GasCostAction ?? [];
export const INSTRUMENT_STATUSES = uicEnums.InstrumentStatus ?? [];
export const UIC_INSTRUMENT_TYPES = uicEnums.InstrumentType ?? [];
export const INTERNAL_PUBSUB_TOPICS = uicEnums.InternalPubSubTopic ?? [];
export const LEG_STATUSES = uicEnums.LegStatus ?? [];
export const LIFECYCLE_EVENT_TYPES = uicEnums.LifecycleEventType ?? [];
export const LOG_LEVELS = uicEnums.LogLevel ?? [];
export const MARGIN_TYPES = uicEnums.MarginType ?? [];
export const MARKET_CATEGORIES = uicEnums.MarketCategory ?? [];
export const UIC_MARKET_STATES = uicEnums.MarketState ?? [];
export const MATCHING_FEE_TYPES = uicEnums.MatchingFeeType ?? [];
export const MESSAGING_SCOPES = uicEnums.MessagingScope ?? [];
export const MESSAGING_TOPICS = uicEnums.MessagingTopic ?? [];
export const MOCK_SCENARIOS = uicEnums.MockScenario ?? [];
export const MODEL_TYPES = uicEnums.ModelType ?? [];
export const MULTI_LEG_EXECUTION_MODES = uicEnums.MultiLegExecutionMode ?? [];
export const OHLCV_SOURCES = uicEnums.OHLCVSource ?? [];
export const UIC_OPERATION_TYPES = uicEnums.OperationType ?? [];
export const UIC_OPTION_TYPES = uicEnums.OptionType ?? [];
export const UIC_ORDER_TYPES = uicEnums.OrderType ?? [];
export const PERMISSIONS = uicEnums.Permission ?? [];
export const PHASE_MODES = uicEnums.PhaseMode ?? [];
export const POSITION_SIDES = uicEnums.PositionSide ?? [];
export const PREDICTION_MARKET_USE_CASES =
  uicEnums.PredictionMarketUseCase ?? [];
export const REGIME_STATES = uicEnums.RegimeState ?? [];
export const RISK_AGGREGATION_LEVELS = uicEnums.RiskAggregationLevel ?? [];
export const RISK_STATUSES = uicEnums.RiskStatus ?? [];
export const RUNTIME_MODES = uicEnums.RuntimeMode ?? [];
export const SERVICE_EXECUTION_STATUSES = uicEnums.ServiceExecutionStatus ?? [];
export const SERVICE_MODES = uicEnums.ServiceMode ?? [];
export const SETTLEMENT_TYPES = uicEnums.SettlementType ?? [];
export const STRESS_SCENARIO_TYPES = uicEnums.StressScenarioType ?? [];
export const TARGET_TYPES = uicEnums.TargetType ?? [];
export const TESTING_STAGES = uicEnums.TestingStage ?? [];
export const TIMEFRAMES = uicEnums.Timeframe ?? [];
export const TRAINING_PHASES = uicEnums.TrainingPhase ?? [];
export const TRIGGER_EVENT_TYPES = uicEnums.TriggerEventType ?? [];
export const URGENCY_LEVELS = uicEnums.UrgencyLevel ?? [];
export const USER_ROLES = uicEnums.UserRole ?? [];
export const VM_EVENT_TYPES = uicEnums.VMEventType ?? [];
export const VAR_METHODS = uicEnums.VaRMethod ?? [];
export const UIC_VENUE_CATEGORIES = uicEnums.VenueCategory ?? [];

// ---------------------------------------------------------------------------
// Config Schemas
// ---------------------------------------------------------------------------

export const CONFIG_SCHEMAS = (data.config_schemas ?? {}) as Record<
  string,
  unknown
>;

// ---------------------------------------------------------------------------
// Operational Modes
// ---------------------------------------------------------------------------

export const OPERATIONAL_MODES = (data.operational_modes ?? {}) as Record<
  string,
  unknown
>;

// ---------------------------------------------------------------------------
// Service Port Registry
// ---------------------------------------------------------------------------

export const SERVICE_PORT_REGISTRY = (data.service_port_registry ??
  {}) as Record<string, unknown>;

// ---------------------------------------------------------------------------
// Deployment Enums (from UIC via schema sync pipeline)
// ---------------------------------------------------------------------------

const deploymentEnums = ((data.deployment_enums as Record<string, unknown>)
  ?.entries ?? {}) as Record<string, string[]>;

export const DEPLOYMENT_CLUSTERS = deploymentEnums.DeploymentCluster ?? [];
export const DEPLOYMENT_TIERS = deploymentEnums.DeploymentTier ?? [];
export const DEPLOYMENT_OPERATION_MODES =
  deploymentEnums.DeploymentOperationMode ?? [];
// DEPLOYMENT_STATUSES already exported from uicEnums above (line 88)
