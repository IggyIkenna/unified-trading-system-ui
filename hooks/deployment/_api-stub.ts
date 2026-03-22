/**
 * API stub for deployment components.
 *
 * TODO: Wire each function to real API routes.
 * All functions return mock data or empty responses for now.
 */

import type {
  CategoryVenuesResponse,
  StartDatesResponse,
  Service,
  ServiceDimensionsResponse,
  DependenciesResponse,
  ChecklistResponse,
  ChecklistValidateResponse,
  ChecklistSummary,
  HealthResponse,
  EpicSummary,
  EpicDetail,
  ShardEvent,
  LiveHealthStatus,
  ServiceStatus,
} from "@/lib/types/deployment";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BuildEnvironment = "dev" | "staging" | "prod";

export interface BuildEntry {
  tag: string;
  display: string;
  is_v1: boolean;
}

export interface BuildTrigger {
  trigger_id: string;
  service: string;
  type: "service" | "library" | "infrastructure";
  disabled: boolean;
  github_repo?: string;
  branch_pattern?: string;
  last_build?: BuildInfo | null;
}

export interface BuildInfo {
  build_id: string;
  status: string;
  commit_sha?: string;
  branch?: string;
  create_time: string;
  duration_seconds?: number | null;
  log_url?: string;
}

export interface QuotaInfoResponse {
  service: string;
  quota_remaining: number;
  quota_limit: number;
  reset_at: string;
  required_quota?: number;
  live_quota?: {
    remaining: number;
    limit: number;
  };
  region?: string;
  recommended_max_concurrent?: number;
  compute?: string;
  total_shards?: number;
  effective_settings?: Record<string, unknown>;
  live_quota_error?: string;
}

export interface ExecutionMissingShardsResponse {
  service: string;
  missing_shards: Array<{
    shard_id: string;
    dimensions: Record<string, string>;
    config_path?: string;
    config_gcs?: string;
    date?: string;
  }>;
  total_missing: number;
  total_configs?: number;
  total_dates?: number;
  breakdown?: {
    by_strategy: Record<string, number>;
    by_mode: Record<string, number>;
    by_timeframe: Record<string, number>;
    by_algo: Record<string, number>;
    by_date: Record<string, number>;
  };
}

export interface DeploymentReport {
  deployment_id: string;
  service: string;
  status: string;
  total_shards: number;
  completed_shards: number;
  failed_shards: number;
  summary: {
    success_rate?: number;
    total_retries?: number;
    text?: string;
  };
  retry_stats?: {
    success_rate?: number;
    total_retries?: number;
    total_zone_switches?: number;
    total_region_switches?: number;
    by_attempt?: Record<string, number>;
  };
  failure_breakdown?: Record<string, number>;
  zone_usage?: Record<string, number>;
  infrastructure_issues?: Array<{
    type?: string;
    message?: string;
    count?: number;
    shard_id?: string;
    zone?: string;
    category?: string;
  }>;
}

export interface RerunCommands {
  deployment_id: string;
  commands: Array<{ shard_id: string; command: string }>;
  total_commands?: number;
  combined_retry_command?: string;
}

export interface VenueCheckResponse {
  service: string;
  venues: string[];
  missing: string[];
  start_date?: string;
  end_date?: string;
  categories?: {
    [category: string]: {
      dates_with_missing_venues: Array<{
        date: string;
        missing: string[];
        file_exists: boolean;
      }>;
      total_dates: number;
    };
  };
}

export interface DataTypeCheckResponse {
  service: string;
  data_types: string[];
  missing: string[];
  start_date?: string;
  end_date?: string;
  overall_completion?: number;
  overall_complete?: number;
  overall_total?: number;
  venues?: {
    [venue: string]: {
      completion_percent: number;
      complete: number;
      total: number;
      data_types: {
        [dataType: string]: {
          found: number;
          expected: number;
          completion_percent: number;
        };
      };
    };
  };
}

export interface TurboVenueData {
  dates_found?: number;
  dates_expected?: number;
  dates_expected_venue?: number;
  _dim_weighted_expected?: number;
  _dim_weighted_found?: number;
  completion_percent?: number;
  completion_pct?: number;
  complete?: number;
  total?: number;
  missing_dates?: string[];
  status?: string;
  venue_start_date?: string;
  dates_found_count?: number;
  dates_found_list?: string[];
  dates_found_list_tail?: string[];
  dates_found_truncated?: boolean;
  dates_missing_count?: number;
  dates_missing_list?: string[];
  dates_missing_list_tail?: string[];
  dates_missing_truncated?: boolean;
  data_types?: Record<string, { dates_found?: number; dates_expected?: number; completion_pct?: number; status?: string }>;
}

export interface TurboCategoryVenueSummary {
  expected_but_missing?: string[];
  unexpected_but_found?: string[];
  bonus?: string[];
  total_expected?: number;
  total_found?: number;
  expected_count?: number;
  expected_coverage_pct?: number;
}

export interface TurboCategoryData {
  dates_found?: number;
  dates_found_count?: number;
  dates_found_list?: string[];
  dates_found_list_tail?: string[];
  dates_found_truncated?: boolean;
  dates_expected?: number;
  dates_missing?: number;
  dates_missing_count?: number;
  dates_missing_list?: string[];
  dates_missing_list_tail?: string[];
  dates_missing_truncated?: boolean;
  dates_with_missing_venues?: number;
  total_dates?: number;
  completion_pct?: number;
  missing_dates?: string[];
  venue_dates_expected?: number;
  venue_dates_found?: number;
  venue_weighted?: boolean;
  venue_summary?: TurboCategoryVenueSummary;
  venues?: Record<string, TurboVenueData>;
  folders?: Record<string, { completion_pct?: number; dates_found?: number; dates_expected?: number }>;
  data_types?: string[];
  feature_groups?: string[];
  bulk_service?: boolean;
  error?: string;
}

export interface TurboDataStatusResponse {
  service: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  date_range?: { start: string; end: string; days?: number };
  mode?: "turbo";
  first_day_of_month_only?: boolean;
  sub_dimension?: string | null;
  overall_completion_pct?: number;
  overall_dates_found?: number;
  overall_dates_expected?: number;
  overall_dates_found_category?: number;
  overall_dates_expected_category?: number;
  total_missing?: number;
  unexpected_missing?: number;
  expected_missing?: number;
  categories: Record<string, TurboCategoryData>;
}

export interface FileInfo {
  name: string;
  full_path: string;
  size_bytes: number;
  updated: string | null;
}

export interface DateFileResult {
  date: string;
  prefix: string;
  file_count: number;
  total_size_bytes: number;
  last_modified?: string | null;
  files: FileInfo[];
  error?: string;
}

export interface ListFilesResponse {
  files: string[];
  total: number;
  error?: string;
  service?: string;
  bucket?: string;
  category?: string;
  venue?: string;
  folder?: string;
  data_type?: string;
  timeframe?: string | null;
  date_range?: {
    start: string;
    end: string;
    total_days: number;
  };
  summary?: {
    total_files: number;
    total_size_bytes: number;
    total_size_formatted: string;
    dates_with_data: number;
    dates_empty: number;
    completion_pct: number;
  };
  by_date?: DateFileResult[];
  suggestion?: string;
}

export interface InstrumentSearchResult {
  instrument_id?: string;
  instrument_key?: string;
  instrument_type?: string;
  name?: string;
  category?: string;
  venue?: string;
  symbol?: string;
  base_currency?: string;
  quote_currency?: string;
  data_types?: string[] | string;
  available_from_datetime?: string;
  available_to_datetime?: string;
}

export interface InstrumentSearchResponse {
  instruments: InstrumentSearchResult[];
  error?: string;
}

export interface InstrumentAvailabilityResponse {
  instrument_id?: string;
  instrument_key?: string;
  parsed?: {
    venue: string;
    instrument_type: string;
    symbol: string;
    category: string;
    folder: string;
  };
  service?: string;
  bucket?: string;
  available_dates?: string[];
  coverage_pct?: number;
  date_range?: {
    start: string;
    end: string;
    total_dates: number;
    first_day_of_month_only?: boolean;
  };
  availability_window?: {
    instrument_from?: string;
    instrument_to?: string;
    effective_start: string;
    effective_end: string;
    dates_in_window: number;
  };
  data_types_checked?: string[];
  overall?: {
    expected: number;
    found: number;
    missing: number;
    completion_pct: number;
  };
  by_data_type?: Record<
    string,
    {
      dates_found: number;
      dates_missing: number;
      completion_pct: number;
      dates_found_list: string[];
      dates_missing_list: string[];
    }
  >;
  timeframe?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const UPSTREAM_CHECK_SERVICES = [
  "instruments-service",
  "market-tick-data-service",
  "market-data-processing-service",
];

export const TURBO_MODE_SERVICES = [
  "market-tick-data-service",
  "market-data-processing-service",
];

export const TURBO_SUB_DIMENSION_SERVICES: Record<string, string> = {
  "market-tick-data-service": "venue",
  "market-data-processing-service": "venue",
};

// ---------------------------------------------------------------------------
// Stub functions — all return mock / empty data
// TODO: Wire to real API
// ---------------------------------------------------------------------------

export async function fetchBuilds(
  _service: string,
  _env: BuildEnvironment,
): Promise<BuildEntry[]> {
  // TODO: wire to real API
  return [];
}

export async function getCloudBuildTriggers(): Promise<{
  triggers: BuildTrigger[];
}> {
  // TODO: wire to real API
  return { triggers: [] };
}

export async function triggerCloudBuild(
  _service: string,
  _branch: string,
): Promise<{ success: boolean; message: string }> {
  // TODO: wire to real API
  return { success: false, message: "Not implemented — wire to real API" };
}

export async function getCloudBuildHistory(
  _service: string,
): Promise<{ builds: BuildInfo[] }> {
  // TODO: wire to real API
  return { builds: [] };
}

export async function listDirectories(
  _service: string,
  _path: string,
): Promise<{ directories: string[] }> {
  // TODO: wire to real API
  return { directories: [] };
}

export async function discoverConfigs(
  _service: string,
  _path: string,
): Promise<{ total_configs: number }> {
  // TODO: wire to real API
  return { total_configs: 0 };
}

export async function getConfigBuckets(
  _service: string,
): Promise<{
  buckets: Array<{ name: string; path: string }>;
  default_bucket?: string;
}> {
  // TODO: wire to real API
  return { buckets: [] };
}

export async function getDeploymentQuotaInfo(
  _params: unknown,
): Promise<QuotaInfoResponse> {
  // TODO: wire to real API
  return {
    service: "",
    quota_remaining: 100,
    quota_limit: 100,
    reset_at: new Date().toISOString(),
  };
}

export async function getExecutionMissingShards(
  _params: Record<string, string>,
): Promise<ExecutionMissingShardsResponse> {
  // TODO: wire to real API
  return { service: "", missing_shards: [], total_missing: 0 };
}

export async function cancelDeployment(
  _deploymentId: string,
): Promise<{ success: boolean; cancelled_shards?: number; message?: string }> {
  // TODO: wire to real API
  return { success: false };
}

export async function resumeDeployment(
  _deploymentId: string,
): Promise<{ success: boolean; message?: string }> {
  // TODO: wire to real API
  return { success: false };
}

export async function verifyDeploymentCompletion(
  _deploymentId: string,
  _options?: { force?: boolean },
): Promise<{ verified: boolean }> {
  // TODO: wire to real API
  return { verified: false };
}

export async function retryFailedShards(
  _deploymentId: string,
): Promise<{ retried: number; message?: string }> {
  // TODO: wire to real API
  return { retried: 0 };
}

export async function cancelShard(
  _deploymentId: string,
  _shardId?: string,
): Promise<{ success: boolean; message?: string }> {
  // TODO: wire to real API
  return { success: false };
}

export async function updateDeploymentTag(
  _deploymentId: string,
  _tag: string | null,
): Promise<{ success: boolean; message?: string }> {
  // TODO: wire to real API
  return { success: false };
}

export async function getDeploymentReport(
  _deploymentId: string,
): Promise<DeploymentReport> {
  // TODO: wire to real API
  return {
    deployment_id: _deploymentId,
    service: "",
    status: "unknown",
    total_shards: 0,
    completed_shards: 0,
    failed_shards: 0,
    summary: {},
  };
}

export async function getRerunCommands(
  _deploymentId: string,
  _options?: { failedOnly?: boolean },
): Promise<RerunCommands> {
  // TODO: wire to real API
  return { deployment_id: _deploymentId, commands: [] };
}

export async function getDeploymentEvents(
  _deploymentId: string,
): Promise<{ events: ShardEvent[] }> {
  // TODO: wire to real API
  return { events: [] };
}

export async function rollbackLiveDeployment(
  _deploymentId: string,
  _options?: { service: string; region: string },
): Promise<{ success: boolean }> {
  // TODO: wire to real API
  return { success: false };
}

export async function getLiveDeploymentHealth(
  _deploymentId: string,
  _service?: string,
  _region?: string,
): Promise<LiveHealthStatus | null> {
  // TODO: wire to real API
  return null;
}

export async function getDeployments(_params: {
  service: string;
  limit?: number;
  forceRefresh?: boolean;
}): Promise<{
  deployments: Array<{
    id: string;
    service: string;
    parameters?: Record<string, unknown>;
    status: string;
    created_at: string;
    total_shards: number;
    completed_shards: number;
  }>;
}> {
  // TODO: wire to real API
  return { deployments: [] };
}

export async function bulkDeleteDeployments(
  _ids: string[],
): Promise<{ deleted: number; failed: number }> {
  // TODO: wire to real API
  return { deleted: 0, failed: 0 };
}

// ---------------------------------------------------------------------------
// Functions used via `import * as api` in hooks
// ---------------------------------------------------------------------------

export async function getHealth(): Promise<HealthResponse> {
  // TODO: wire to real API
  return { status: "healthy", version: "0.0.0-stub", config_dir: "" };
}

export async function clearCache(): Promise<void> {
  // TODO: wire to real API
}

export async function getServices(): Promise<{
  services: Service[];
}> {
  // TODO: wire to real API
  return { services: [] };
}

export async function getServiceDimensions(
  _service: string,
): Promise<ServiceDimensionsResponse> {
  // TODO: wire to real API
  return { service: _service, dimensions: [], cli_args: {} };
}

export async function getDependencies(_service: string): Promise<DependenciesResponse> {
  // TODO: wire to real API
  return { service: _service, description: "", upstream: [], downstream_dependents: [], outputs: [], external_dependencies: [] };
}

export async function getChecklist(_service: string): Promise<ChecklistResponse> {
  // TODO: wire to real API
  return {
    service: _service,
    readiness_percent: 0,
    completed_items: 0,
    total_items: 0,
    partial_items: 0,
    pending_items: 0,
    not_applicable_items: 0,
    last_updated: "",
    blocking_items: [],
    categories: [],
  };
}

export async function validateChecklist(
  _service: string,
): Promise<ChecklistValidateResponse> {
  // TODO: wire to real API
  return {
    service: _service,
    ready: true,
    readiness_percent: 100,
    total_items: 0,
    completed_items: 0,
    blocking_items: [],
    warnings: [],
    can_proceed_with_acknowledgment: true,
  };
}

export async function listChecklists(): Promise<{
  checklists: ChecklistSummary[];
}> {
  // TODO: wire to real API
  return { checklists: [] };
}

export async function getEpics(): Promise<EpicSummary[]> {
  // TODO: wire to real API
  return [];
}

export async function getEpicDetail(_epicId: string): Promise<EpicDetail> {
  // TODO: wire to real API
  return {
    epic_id: _epicId,
    display_name: "",
    mvp_priority: 0,
    business_requirement_minimum: "",
    epic_pct: 0,
    total_required: 0,
    completed: 0,
    epic_complete: false,
    completion_criteria: {},
    blocking_repos: [],
    completed_repos: [],
    optional_repos_status: [],
  };
}

export async function getVenuesByCategory(
  _category: string,
): Promise<CategoryVenuesResponse> {
  // TODO: wire to real API
  return { category: _category, venues: [], data_types: [] };
}


export async function getStartDates(_service: string): Promise<StartDatesResponse> {
  // TODO: wire to real API
  return { service: _service, start_dates: {} };
}

export async function getServiceStatus(_service: string): Promise<ServiceStatus> {
  // TODO: wire to real API
  return {
    service: _service,
    health: "healthy",
    last_data_update: null,
    last_deployment: null,
    last_build: null,
    last_code_push: null,
    anomalies: [],
  };
}

export async function getServicesOverview(): Promise<{
  count: number;
  healthy: number;
  warnings: number;
  errors: number;
  services: Array<{
    service: string;
    health: string;
    last_data_update: string | null;
    last_deployment: string | null;
    last_build: string | null;
    anomaly_count: number;
  }>;
}> {
  // TODO: wire to real API
  return { count: 0, healthy: 0, warnings: 0, errors: 0, services: [] };
}

export async function getDataStatus(
  _params: Record<string, unknown>,
): Promise<TurboDataStatusResponse> {
  // TODO: wire to real API
  return { service: "", status: "unknown", categories: {} };
}

export async function getDataStatusTurbo(
  _params: Record<string, unknown>,
): Promise<TurboDataStatusResponse> {
  // TODO: wire to real API
  return { service: "", status: "unknown", categories: {} };
}

export async function clearDataStatusCache(): Promise<void> {
  // TODO: wire to real API
}

export async function listFiles(
  _params: Record<string, unknown>,
): Promise<ListFilesResponse> {
  // TODO: wire to real API
  return { files: [], total: 0 };
}

export async function getInstrumentsList(
  _params: Record<string, unknown>,
): Promise<InstrumentSearchResponse> {
  // TODO: wire to real API
  return { instruments: [] };
}

export async function getInstrumentAvailability(
  _params: Record<string, unknown>,
): Promise<InstrumentAvailabilityResponse> {
  // TODO: wire to real API
  return { instrument_id: "", available_dates: [], coverage_pct: 0 };
}

// Missing stub — added for build
export async function getServiceCategories(_service: string): Promise<{ categories: string[] }> {
  // TODO: wire to real API
  return { categories: ["CEFI", "DEFI", "TRADFI"] }
}

export async function getVenueFilters(_params: Record<string, string>): Promise<{ folders: string[]; data_types: string[] }> {
  // TODO: wire to real API
  return { folders: ["spot", "perpetuals", "futures"], data_types: ["ohlcv", "trades", "book_snapshot_5"] }
}

