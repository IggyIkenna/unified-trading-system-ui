// ─── Data Provision Service — Type Definitions ────────────────────────────────
// These types mirror the internal deployment-ui DataStatusTab sharding model.
// They define the shape of all data service mock data and component props.

// ─── Organisation hierarchy (data service = org only, no client sub-level) ────

export type OrgMode = "admin" | "client" | "demo";

export type CloudProvider = "gcp" | "aws" | "both";

export interface DataOrg {
  id: string;
  name: string;
  mode: OrgMode;
  cloudPreference: CloudProvider;
  linkedCloudAccount?: string; // "aws:123456789012" | "gcp:my-project-id"
  planTier: DataPlanTier;
  monthlySpend: number; // USD cents
}

// ─── Sharding dimensions (match internal: asset_group/venue/folder/data_type/date) ─

export type DataAssetGroup = "cefi" | "tradfi" | "defi" | "onchain_perps" | "prediction_market" | "sports";

export const DATA_ASSET_GROUP_LABELS: Record<DataAssetGroup, string> = {
  cefi: "Crypto CeFi",
  tradfi: "TradFi",
  defi: "DeFi",
  onchain_perps: "Onchain Perps",
  prediction_market: "Predictions",
  sports: "Sports",
};

/**
 * Maps each data asset group to the entitlement required to access it.
 * Internal/admin users (entitlements: ["*"]) bypass this check entirely.
 * "data-basic" grants cefi only; "data-pro" grants cefi + tradfi + defi + onchain_perps.
 * sports and prediction_market require explicit future entitlements (currently internal-only).
 */
export const ASSET_GROUP_ENTITLEMENT_MAP: Record<DataAssetGroup, "data-basic" | "data-pro" | "internal-only"> = {
  cefi: "data-basic",
  tradfi: "data-pro",
  defi: "data-pro",
  onchain_perps: "data-pro",
  prediction_market: "internal-only",
  sports: "internal-only",
};

export const VENUES_BY_ASSET_GROUP: Record<DataAssetGroup, string[]> = {
  cefi: ["binance", "bybit", "coinbase", "okx", "deribit", "upbit"],
  tradfi: ["databento", "tardis", "yahoo_finance", "fred", "ibkr", "ecb", "ofr", "openbb"],
  defi: [
    "uniswap_v3",
    "uniswap_v4",
    "aave_v3",
    "curve",
    "balancer",
    "lido",
    "morpho",
    "ethena",
    "euler",
    "fluid",
    "etherfi",
    "defillama",
  ],
  onchain_perps: ["hyperliquid"],
  prediction_market: ["polymarket", "kalshi"],
  sports: ["api_football", "footystats"],
};

export type DataFolder =
  | "spot"
  | "perpetuals"
  | "options"
  | "futures"
  | "equity"
  | "rates"
  | "pool_state"
  | "lending"
  | "swaps"
  | "staking"
  | "odds"
  | "predictions"
  | "game_events"
  | "fixtures";

export const FOLDERS_BY_ASSET_GROUP: Record<DataAssetGroup, DataFolder[]> = {
  cefi: ["spot", "perpetuals", "options", "futures"],
  tradfi: ["equity", "futures", "options", "rates"],
  defi: ["pool_state", "lending", "swaps", "staking"],
  onchain_perps: ["perpetuals"],
  prediction_market: ["odds", "predictions"],
  sports: ["fixtures", "odds", "game_events"],
};

export type DataType =
  | "ohlcv"
  | "trades"
  | "book_snapshot_5"
  | "book_snapshot_25"
  | "liquidations"
  | "funding_rates"
  | "open_interest"
  | "greeks"
  | "iv_surface"
  | "pool_state"
  | "lending_rates"
  | "price_feeds"
  | "swap_events"
  | "staking_yields"
  | "odds"
  | "game_events"
  | "settlement_prices"
  | "tick";

export type ProcessedTimeframe = "15s" | "1m" | "5m" | "15m" | "1h" | "4h" | "24h";

// ─── Access models ────────────────────────────────────────────────────────────

// in_system: data stays in Odum cloud, cheaper (no egress)
// download:  data exported to client's cloud bucket, more expensive
export type AccessMode = "in_system" | "download";

export interface AccessPricing {
  mode: AccessMode;
  pricePerGb: number; // USD
  description: string;
  crossCloudSurcharge?: number; // extra $/GB if cloud differs from storage
}

export const PRICING_MODELS: Record<AccessMode, AccessPricing> = {
  in_system: {
    mode: "in_system",
    pricePerGb: 0.5,
    description: "Query via our API. Data stays in Odum cloud. Best value.",
  },
  download: {
    mode: "download",
    pricePerGb: 2.5,
    description: "Export to your own S3/GCS bucket. You own the copy.",
    crossCloudSurcharge: 0.08,
  },
};

// ─── Plan tiers ───────────────────────────────────────────────────────────────

export type DataPlanTier = "starter" | "professional" | "institutional" | "enterprise";

export interface DataPlan {
  tier: DataPlanTier;
  name: string;
  monthlyPrice: number;
  queryLimitGb: number;
  assetGroups: DataAssetGroup[];
  historyYears: number;
  features: string[];
}

export const DATA_PLANS: DataPlan[] = [
  {
    tier: "starter",
    name: "Starter",
    monthlyPrice: 250,
    queryLimitGb: 100,
    assetGroups: ["cefi"],
    historyYears: 2,
    features: ["1 category", "OHLCV + trades", "API access", "Email support"],
  },
  {
    tier: "professional",
    name: "Professional",
    monthlyPrice: 1499,
    queryLimitGb: 500,
    assetGroups: ["cefi", "tradfi"],
    historyYears: 4,
    features: ["2 categories", "All data types", "API + WebSocket", "Priority support"],
  },
  {
    tier: "institutional",
    name: "Institutional",
    monthlyPrice: 3999,
    queryLimitGb: 2000,
    assetGroups: ["cefi", "tradfi", "defi", "onchain_perps"],
    historyYears: 6,
    features: ["4 categories", "All data types", "Egress included 500GB/mo", "Dedicated support"],
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    monthlyPrice: 0, // custom
    queryLimitGb: -1, // unlimited
    assetGroups: ["cefi", "tradfi", "defi", "onchain_perps", "prediction_market", "sports"],
    historyYears: 6,
    features: ["All categories", "Custom instruments", "Unlimited egress", "SLA + white-glove"],
  },
];

// ─── Instrument registry ──────────────────────────────────────────────────────

export interface InstrumentEntry {
  instrumentKey: string; // "{venue}:{folder}:{symbol}"
  venue: string;
  assetGroup: DataAssetGroup;
  folder: DataFolder;
  symbol: string;
  baseCurrency?: string;
  quoteCurrency?: string;
  dataTypes: DataType[];
  availableFrom: string; // ISO date
  availableTo?: string; // null = still active
}

// ─── Catalogue / availability ─────────────────────────────────────────────────

export interface CatalogueEntry {
  instrument: InstrumentEntry;
  cloud: CloudProvider;
  totalDates: number;
  datesWithData: number;
  freshnessPct: number; // 0-100
  lastUpdated: string; // ISO date
  sizeGb: number;
  gcpCompleteness: number; // 0-100
  awsCompleteness: number; // 0-100
}

// Freshness cell for heatmap: keyed by ISO date string
export type FreshnessStatus = "complete" | "partial" | "missing" | "not_expected" | "stale";

export interface DateFreshnessMap {
  [isoDate: string]: FreshnessStatus;
}

// ─── Subscriptions & access ───────────────────────────────────────────────────

export interface DataSubscription {
  id: string;
  orgId: string;
  label: string;
  shardFilters: {
    assetGroups: DataAssetGroup[];
    /** @deprecated — mirror of `assetGroups` for older callsites; keep in sync or omit. */
    categories?: DataAssetGroup[];
    venues: string[];
    folders: DataFolder[];
    dataTypes: DataType[];
    dateFrom: string;
    dateTo: string;
  };
  accessMode: AccessMode;
  cloudTarget: CloudProvider;
  status: "active" | "trial" | "pending" | "expired";
  createdAt: string;
  expiresAt?: string;
  monthlyCostCents: number;
  gbUsedThisMonth: number;
  gbLimitThisMonth: number;
}

// ─── Query log ────────────────────────────────────────────────────────────────

export interface DataQueryLog {
  id: string;
  orgId: string;
  instrumentKey: string;
  assetGroup: DataAssetGroup;
  venue: string;
  folder: DataFolder;
  dataType: DataType;
  dateFrom: string;
  dateTo: string;
  accessMode: AccessMode;
  cloud: CloudProvider;
  queriedAt: string;
  rowsReturned?: number;
  gbTransferred: number;
  costCents: number;
  status: "completed" | "cached" | "failed" | "paywall_blocked";
}

// ─── Shard-level availability response ───────────────────────────────────────

export interface ShardAvailability {
  assetGroup: DataAssetGroup;
  venue: string;
  folder: DataFolder;
  dataType: DataType;
  dateRange: { start: string; end: string };
  datesChecked: number;
  datesFound: number;
  datesMissing: number;
  completionPct: number;
  lastFreshnessDate?: string;
  byDate?: DateFreshnessMap;
  gcpCompletionPct: number;
  awsCompletionPct: number;
}

// ─── ETL Pipeline Types (Internal) ───────────────────────────────────────────

export type ETLStage =
  | "ingest" // Raw data pulled from source
  | "validate" // Schema validation & quality checks
  | "normalise" // Transform to unified schema
  | "enrich" // Add derived fields, signals
  | "store_gcp" // Write to GCP storage
  | "store_aws" // Replicate to AWS storage
  | "index"; // Index for query performance

export type ETLStatus = "healthy" | "degraded" | "failed" | "pending" | "disabled";

export interface ETLPipelineConfig {
  id: string;
  assetGroup: DataAssetGroup;
  venue: string;
  folder: DataFolder;
  dataTypes: DataType[];
  schedule: "realtime" | "1m" | "5m" | "15m" | "1h" | "daily";
  enabled: boolean;
  priority: "critical" | "high" | "normal" | "low";
}

export interface ETLStageStatus {
  stage: ETLStage;
  status: ETLStatus;
  lastRun: string; // ISO datetime
  lastSuccess?: string;
  lastError?: string;
  recordsProcessed?: number;
  latencyMs?: number;
  errorCount24h: number;
}

export interface ETLPipelineStatus {
  config: ETLPipelineConfig;
  stages: ETLStageStatus[];
  overallStatus: ETLStatus;
  lastFullSync: string;
  nextScheduledRun?: string;
  dataLagMinutes: number;
  alerts: ETLAlert[];
}

export interface ETLAlert {
  id: string;
  pipelineId: string;
  stage: ETLStage;
  severity: "critical" | "warning" | "info";
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

// ─── Instrument Coverage Tracking ────────────────────────────────────────────

export interface InstrumentCoverage {
  venue: string;
  assetGroup: DataAssetGroup;
  folder: DataFolder;
  totalInstruments: number;
  activeInstruments: number;
  instrumentsWithData: number;
  dataTypes: {
    type: DataType;
    instrumentsCovered: number;
    oldestDate: string;
    newestDate: string;
    totalRecords: number;
    sizeGb: number;
  }[];
  lastUpdated: string;
}

export interface VenueCoverage {
  venue: string;
  assetGroup: DataAssetGroup;
  label: string;
  dataSource: "exchange_api" | "vendor" | "scraper" | "onchain";
  status: "active" | "maintenance" | "deprecated";
  folders: DataFolder[];
  instrumentCount: number;
  oldestData: string;
  newestData: string;
  dailyVolume: number; // records per day
  etlPipelineId: string;
  lastHealthCheck: string;
  healthStatus: ETLStatus;
}

// ─── Data Gap Tracking ───────────────────────────────────────────────────────

export interface DataGap {
  id: string;
  assetGroup: DataAssetGroup;
  venue: string;
  folder: DataFolder;
  dataType: DataType;
  instrument?: string; // specific instrument or null for venue-wide
  gapStart: string;
  gapEnd: string;
  daysAffected: number;
  severity: "critical" | "high" | "medium" | "low";
  cause?: string;
  status: "open" | "backfilling" | "resolved" | "wont_fix";
  createdAt: string;
  resolvedAt?: string;
}

// ─── Pipeline Stage Status (Acquire Overview) ────────────────────────────────

export type PipelineStage = "instruments" | "raw" | "processing" | "events";

export interface PipelineStageSummary {
  stage: PipelineStage;
  label: string;
  totalShards: number;
  completedShards: number;
  inProgressShards: number;
  failedShards: number;
  completionPct: number;
  lastUpdated: string;
  byAssetGroup: {
    assetGroup: DataAssetGroup;
    totalShards: number;
    completedShards: number;
    completionPct: number;
  }[];
}

// ─── Job Tracking ─────────────────────────────────────────────────────────────

export type JobType = "download" | "process" | "backfill" | "reprocess";
export type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface JobInfo {
  id: string;
  type: JobType;
  status: JobStatus;
  assetGroup: DataAssetGroup;
  venue: string;
  dateRange: { start: string; end: string };
  shardsTotal: number;
  shardsCompleted: number;
  progressPct: number;
  startedAt: string;
  completedAt?: string;
  estimatedCompletionAt?: string;
  durationMs?: number;
  errorMessage?: string;
  workersActive: number;
  workersMax: number;
  forceFlag: boolean;
}

export interface JobHistoryEntry {
  jobType: JobType;
  assetGroup: DataAssetGroup;
  venue: string;
  avgDurationMs: number;
  p50DurationMs: number;
  p90DurationMs: number;
  successRate: number;
  lastRunAt: string;
  runCount: number;
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export type AlertType =
  | "new_instruments"
  | "download_failed"
  | "data_stale"
  | "gap_detected"
  | "job_completed"
  | "venue_added";

export interface AlertItem {
  id: string;
  type: AlertType;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  venue?: string;
  assetGroup?: DataAssetGroup;
  actionHref?: string;
}

// ─── Corporate Actions (TradFi) ───────────────────────────────────────────────

export type CorporateActionType =
  | "split"
  | "reverse_split"
  | "symbol_change"
  | "delisting"
  | "spinoff"
  | "dividend"
  | "earnings"
  | "merger";

export type DividendFrequency = "quarterly" | "semi_annual" | "annual" | "special" | "monthly";
export type EarningsReportTime = "bmo" | "amc" | "during";

export interface CorporateAction {
  id: string;
  venue: string;
  symbol: string;
  newSymbol?: string;
  actionType: CorporateActionType;
  effectiveDate: string; // dividends: ex-date; splits: effective date; earnings: report date
  ratio?: number; // splits: e.g., 4 for 4:1 split; spinoff/merger: share ratio
  description: string;
  dataAdjusted: boolean;

  // Lifecycle dates — shared by dividends/splits/earnings where applicable.
  declarationDate?: string; // announcement date
  recordDate?: string; // dividends/splits
  payDate?: string; // dividends only

  // Dividend-only
  amount?: number; // cash amount per share
  currency?: string; // e.g., "USD"
  frequency?: DividendFrequency;
  yieldPct?: number; // annualized, as percent (e.g., 2.35)

  // Earnings-only
  fiscalPeriod?: string; // e.g., "Q4 FY2025"
  reportTime?: EarningsReportTime;
  actualEps?: number | null;
  estimatedEps?: number | null;
  actualRevenue?: number | null; // in reporting currency (usually USD)
  estimatedRevenue?: number | null;
  surprisePct?: number | null; // ((actual - est) / |est|) * 100

  // Spinoff / merger / delisting context
  parentSymbol?: string;
  targetSymbol?: string;
  reason?: string;
}

// ─── Economic Events (from features-calendar-service) ─────────────────────────

export type EconomicEventImportance = "high" | "medium" | "low";

export type EconomicEventType = "fomc" | "nfp" | "cpi" | "gdp" | "pce" | "initial_claims" | "election" | "other_macro";

export interface EconomicEvent {
  id: string;
  eventType: EconomicEventType;
  label: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM UTC
  importance: EconomicEventImportance;
  country: string;
  forecast?: number | null;
  actual?: number | null;
  previous?: number | null;
  unit?: string;
  surprise?: number | null; // (actual - forecast) / |forecast| — null before release
  description: string;
  source?: string; // e.g., "BLS", "BEA", "Federal Reserve", "U. of Michigan"
  period?: string; // e.g., "Oct 2025", "Q3 2025"
}

// ─── Market Structure Events ───────────────────────────────────────────────────

export type MarketStructureEventType =
  | "options_expiry"
  | "futures_expiry"
  | "halving"
  | "network_upgrade"
  | "exchange_halt"
  | "liquidity_event";

export interface MarketStructureEvent {
  id: string;
  eventType: MarketStructureEventType;
  label: string;
  date: string;
  time?: string;
  venue?: string;
  asset?: string;
  description: string;
  importance: EconomicEventImportance;
  // Options/futures expiry
  impactedSymbols?: string[];
  openInterest?: number; // contracts
  notionalUsd?: number; // notional value of expiring OI / liquidity event
  // Halving / network upgrade
  blockHeight?: number;
  networkVersion?: string;
  // Exchange halt
  haltReason?: string;
  resumedAt?: string; // ISO timestamp when trading resumed (null while halted)
}

// ─── Calendar / Holiday Events ─────────────────────────────────────────────────

export interface CalendarHoliday {
  id: string;
  date: string;
  label: string;
  region: string; // "US" | "UK" | "EU" | "JP" | "global"
  affectedVenues: string[];
  isPartialClose: boolean;
  closeTime?: string; // UTC if partial
}

// ─── Deploy Request ───────────────────────────────────────────────────────────

export interface DeployRequest {
  stage: PipelineStage;
  assetGroups: DataAssetGroup[];
  venues: string[];
  dateRange: { start: string; end: string };
  workerCount: number;
  forceRedownload: boolean;
}

// ─── Coverage Matrix ──────────────────────────────────────────────────────────

export type CoverageStatus = "complete" | "partial" | "missing" | "not_applicable" | "in_progress";

export interface CoverageCell {
  status: CoverageStatus;
  completionPct?: number;
  detail?: string;
}

export interface CoverageRow {
  venue: string;
  assetGroup: DataAssetGroup;
  date: string;
  instruments: CoverageCell;
  rawData: CoverageCell;
  processing: CoverageCell;
  features: CoverageCell; // read-only, from Build pipeline
}

// ─── Processing Timeframe Status ─────────────────────────────────────────────

export type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

export interface TimeframeStatus {
  timeframe: Timeframe;
  venue: string;
  assetGroup: DataAssetGroup;
  completionPct: number;
  totalDays: number;
  completedDays: number;
  pendingDays: number;
  lastProcessedDate: string;
}
