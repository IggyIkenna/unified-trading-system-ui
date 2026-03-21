/**
 * AUTO-DERIVED from ui-reference-data.json (UAC-generated).
 *
 * This module re-exports typed constants so the rest of the UI can
 * import domain data without hand-maintaining venue lists, enum arrays,
 * or config schemas.
 *
 * Do NOT edit these exports by hand. Regenerate by copying the latest
 * ui-reference-data.json from unified-api-contracts/openapi/.
 */

import referenceData from "./ui-reference-data.json"

// ---------------------------------------------------------------------------
// Registries
// ---------------------------------------------------------------------------

/** venue → category ("cefi" | "tradfi" | "defi" | "sports") */
export const VENUE_CATEGORY_MAP = referenceData.registries.venue_category_map

/** venue → instrument type list */
export const INSTRUMENT_TYPES_BY_VENUE = referenceData.registries.instrument_types_by_venue

/** instrument type → storage folder name */
export const INSTRUMENT_TYPE_FOLDER_MAP = referenceData.registries.instrument_type_folder_map

/** CLOB (central-limit-order-book) venues */
export const CLOB_VENUES = referenceData.registries.clob_venues

/** DEX venues */
export const DEX_VENUES = referenceData.registries.dex_venues

/** Sports venues */
export const SPORTS_VENUES = referenceData.registries.sports_venues

/** Zero-alpha (yield-only, no directional alpha) venues */
export const ZERO_ALPHA_VENUES = referenceData.registries.zero_alpha_venues

/** Data-provider endpoint metadata */
export const ENDPOINT_REGISTRY = referenceData.registries.endpoint_registry

// ---------------------------------------------------------------------------
// UAC Enums
// ---------------------------------------------------------------------------

export const UAC_ENUMS = referenceData.uac_enums

export const ORDER_SIDES = referenceData.uac_enums.OrderSide
export const ORDER_TYPES = referenceData.uac_enums.OrderType
export const ORDER_STATUSES = referenceData.uac_enums.OrderStatus
export const TIME_IN_FORCE = referenceData.uac_enums.TimeInForce
export const EXECUTION_STATUSES = referenceData.uac_enums.ExecutionStatus
export const UAC_OPERATION_TYPES = referenceData.uac_enums.OperationType
export const UAC_INSTRUMENT_TYPES = referenceData.uac_enums.InstrumentType
export const INSTRUCTION_TYPES = referenceData.uac_enums.InstructionType
export const MARKET_STATES = referenceData.uac_enums.MarketState
export const SPORTS = referenceData.uac_enums.Sport
export const ODDS_FORMATS = referenceData.uac_enums.OddsFormat
export const ODDS_TYPES = referenceData.uac_enums.OddsType
export const BET_STATUSES = referenceData.uac_enums.BetStatus
export const BET_SIDES = referenceData.uac_enums.BetSide
export const UAC_OPTION_TYPES = referenceData.uac_enums.OptionType
export const UAC_FEE_TYPES = referenceData.uac_enums.FeeType
export const UAC_CLOUD_PROVIDERS = referenceData.uac_enums.CloudProvider
export const COMPUTE_TARGETS = referenceData.uac_enums.ComputeTarget
export const SCALING_MODES = referenceData.uac_enums.ScalingMode
export const UAC_VENUE_CATEGORIES = referenceData.uac_enums.VenueCategory
export const ALTERNATIVE_DATA_TYPES = referenceData.uac_enums.AlternativeDataType
export const RISK_TYPES = referenceData.uac_enums.RiskType
export const RISK_CATEGORIES = referenceData.uac_enums.RiskCategory
export const SIGNAL_SOURCES = referenceData.uac_enums.SignalSource
export const BOOKMAKER_CATEGORIES = referenceData.uac_enums.BookmakerCategory
export const MATCH_PERIODS = referenceData.uac_enums.MatchPeriod
export const OUTCOME_TYPES = referenceData.uac_enums.OutcomeType
export const UAC_MARKET_STATUSES = referenceData.uac_enums.MarketStatus
export const PREDICTION_MARKET_CATEGORIES = referenceData.uac_enums.PredictionMarketCategory

// ---------------------------------------------------------------------------
// UIC Enums
// ---------------------------------------------------------------------------

export const UIC_ENUMS = referenceData.uic_enums

export const ALERT_TYPES = referenceData.uic_enums.AlertType
export const ASSET_CLASSES = referenceData.uic_enums.AssetClass
export const BOOK_TYPES = referenceData.uic_enums.BookType
export const CLOUD_PROVIDERS = referenceData.uic_enums.CloudProvider
export const COMPUTE_TYPES = referenceData.uic_enums.ComputeType
export const CORRELATION_REGIMES = referenceData.uic_enums.CorrelationRegime
export const CUSTOM_RISK_EVALUATION_METHODS = referenceData.uic_enums.CustomRiskEvaluationMethod
export const DATA_MODES = referenceData.uic_enums.DataMode
export const DATA_SOURCE_CONSTRAINTS = referenceData.uic_enums.DataSourceConstraint
export const DATA_TYPES = referenceData.uic_enums.DataType
export const DEPLOYMENT_STATUSES = referenceData.uic_enums.DeploymentStatus
export const DURATION_BUCKETS = referenceData.uic_enums.DurationBucket
export const EMERGENCY_EXIT_TYPES = referenceData.uic_enums.EmergencyExitType
export const ERROR_CATEGORIES = referenceData.uic_enums.ErrorCategory
export const ERROR_RECOVERY_STRATEGIES = referenceData.uic_enums.ErrorRecoveryStrategy
export const ERROR_SEVERITIES = referenceData.uic_enums.ErrorSeverity
export const EVENT_SEVERITIES = referenceData.uic_enums.EventSeverity
export const EXECUTION_MODES = referenceData.uic_enums.ExecutionMode
export const EXECUTION_ORDER_TYPES = referenceData.uic_enums.ExecutionOrderType
export const EXECUTION_POSITION_TYPES = referenceData.uic_enums.ExecutionPositionType
export const FACTOR_TYPES = referenceData.uic_enums.FactorType
export const UIC_FEE_TYPES = referenceData.uic_enums.FeeType
export const GAS_COST_ACTIONS = referenceData.uic_enums.GasCostAction
export const INSTRUMENT_STATUSES = referenceData.uic_enums.InstrumentStatus
export const UIC_INSTRUMENT_TYPES = referenceData.uic_enums.InstrumentType
export const INTERNAL_PUBSUB_TOPICS = referenceData.uic_enums.InternalPubSubTopic
export const LEG_STATUSES = referenceData.uic_enums.LegStatus
export const LIFECYCLE_EVENT_TYPES = referenceData.uic_enums.LifecycleEventType
export const LOG_LEVELS = referenceData.uic_enums.LogLevel
export const MARGIN_TYPES = referenceData.uic_enums.MarginType
export const MARKET_CATEGORIES = referenceData.uic_enums.MarketCategory
export const UIC_MARKET_STATES = referenceData.uic_enums.MarketState
export const MATCHING_FEE_TYPES = referenceData.uic_enums.MatchingFeeType
export const MESSAGING_SCOPES = referenceData.uic_enums.MessagingScope
export const MESSAGING_TOPICS = referenceData.uic_enums.MessagingTopic
export const MOCK_SCENARIOS = referenceData.uic_enums.MockScenario
export const MODEL_TYPES = referenceData.uic_enums.ModelType
export const MULTI_LEG_EXECUTION_MODES = referenceData.uic_enums.MultiLegExecutionMode
export const OHLCV_SOURCES = referenceData.uic_enums.OHLCVSource
export const UIC_OPERATION_TYPES = referenceData.uic_enums.OperationType
export const UIC_OPTION_TYPES = referenceData.uic_enums.OptionType
export const UIC_ORDER_TYPES = referenceData.uic_enums.OrderType
export const PERMISSIONS = referenceData.uic_enums.Permission
export const PHASE_MODES = referenceData.uic_enums.PhaseMode
export const POSITION_SIDES = referenceData.uic_enums.PositionSide
export const PREDICTION_MARKET_USE_CASES = referenceData.uic_enums.PredictionMarketUseCase
export const REGIME_STATES = referenceData.uic_enums.RegimeState
export const RISK_AGGREGATION_LEVELS = referenceData.uic_enums.RiskAggregationLevel
export const RISK_STATUSES = referenceData.uic_enums.RiskStatus
export const RUNTIME_MODES = referenceData.uic_enums.RuntimeMode
export const SERVICE_EXECUTION_STATUSES = referenceData.uic_enums.ServiceExecutionStatus
export const SERVICE_MODES = referenceData.uic_enums.ServiceMode
export const SETTLEMENT_TYPES = referenceData.uic_enums.SettlementType
export const STRESS_SCENARIO_TYPES = referenceData.uic_enums.StressScenarioType
export const TARGET_TYPES = referenceData.uic_enums.TargetType
export const TESTING_STAGES = referenceData.uic_enums.TestingStage
export const TIMEFRAMES = referenceData.uic_enums.Timeframe
export const TRAINING_PHASES = referenceData.uic_enums.TrainingPhase
export const TRIGGER_EVENT_TYPES = referenceData.uic_enums.TriggerEventType
export const URGENCY_LEVELS = referenceData.uic_enums.UrgencyLevel
export const USER_ROLES = referenceData.uic_enums.UserRole
export const VM_EVENT_TYPES = referenceData.uic_enums.VMEventType
export const VAR_METHODS = referenceData.uic_enums.VaRMethod
export const UIC_VENUE_CATEGORIES = referenceData.uic_enums.VenueCategory

// ---------------------------------------------------------------------------
// Config Schemas
// ---------------------------------------------------------------------------

export const CONFIG_SCHEMAS = referenceData.config_schemas

// ---------------------------------------------------------------------------
// Operational Modes
// ---------------------------------------------------------------------------

export const OPERATIONAL_MODES = referenceData.operational_modes

// ---------------------------------------------------------------------------
// Service Port Registry
// ---------------------------------------------------------------------------

export const SERVICE_PORT_REGISTRY = referenceData.service_port_registry
