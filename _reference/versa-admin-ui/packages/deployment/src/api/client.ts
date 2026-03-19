import type {
  Service,
  ServiceDimensionsResponse,
  VenuesResponse,
  CategoryVenuesResponse,
  StartDatesResponse,
  DependenciesResponse,
  Deployment,
  DeploymentRequest,
  CreateDeploymentResponse,
  HealthResponse,
  ChecklistResponse,
  ChecklistValidateResponse,
  ChecklistSummary,
  DataStatusResponse,
  MissingShardsResponse,
  ServiceStatus,
  ServicesOverview,
  DiscoverConfigsResponse,
  DeploymentEventStream,
  RollbackRequest,
  RollbackResponse,
  LiveHealthStatus,
} from "../types";

const API_BASE = "/api";

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

// Custom error for aborted requests
export class AbortError extends Error {
  constructor() {
    super("Request was cancelled");
    this.name = "AbortError";
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Unknown error" }));
      throw new ApiError(
        response.status,
        error.detail || `HTTP ${response.status}`,
      );
    }

    return response.json();
  } catch (err) {
    // Re-throw abort errors with our custom type
    if (err instanceof Error && err.name === "AbortError") {
      throw new AbortError();
    }
    throw err;
  }
}

// Health
export async function getHealth(): Promise<HealthResponse> {
  return fetchJson<HealthResponse>("/health");
}

// Services
export async function getServices(): Promise<{
  services: Service[];
  count: number;
}> {
  return fetchJson("/services");
}

export async function getServiceDimensions(
  serviceName: string,
): Promise<ServiceDimensionsResponse> {
  return fetchJson(`/services/${serviceName}/dimensions`);
}

export async function discoverConfigs(
  serviceName: string,
  cloudPath: string,
): Promise<DiscoverConfigsResponse> {
  const params = new URLSearchParams();
  params.set("cloud_path", cloudPath);
  return fetchJson(
    `/services/${serviceName}/discover-configs?${params.toString()}`,
  );
}

export interface ListDirectoriesResponse {
  service: string;
  cloud_path: string;
  directories: string[];
  count: number;
}

export async function listDirectories(
  serviceName: string,
  cloudPath: string,
): Promise<ListDirectoriesResponse> {
  const params = new URLSearchParams();
  params.set("cloud_path", cloudPath);
  return fetchJson(
    `/services/${serviceName}/list-directories?${params.toString()}`,
  );
}

export interface ConfigBucketsResponse {
  service: string;
  default_bucket: string | null;
  buckets: Array<{ name: string; path: string }>;
  message?: string;
}

export async function getConfigBuckets(
  serviceName: string,
): Promise<ConfigBucketsResponse> {
  return fetchJson(`/services/${serviceName}/config-buckets`);
}

// Config
export async function getVenues(): Promise<VenuesResponse> {
  return fetchJson("/config/venues");
}

export async function getVenuesByCategory(
  category: string,
): Promise<CategoryVenuesResponse> {
  return fetchJson(`/config/venues/${category}`);
}

export async function getStartDates(
  serviceName: string,
): Promise<StartDatesResponse> {
  return fetchJson(`/config/expected-start-dates/${serviceName}`);
}

export async function getDependencies(
  serviceName: string,
): Promise<DependenciesResponse> {
  return fetchJson(`/config/dependencies/${serviceName}`);
}

// Deployments
export async function getDeployments(filters?: {
  service?: string;
  status?: string;
  category?: string;
  limit?: number;
  forceRefresh?: boolean;
}): Promise<{ deployments: Deployment[]; count: number }> {
  const params = new URLSearchParams();
  if (filters?.service) params.set("service", filters.service);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.category) params.set("category", filters.category);
  if (filters?.limit) params.set("limit", filters.limit.toString());
  if (filters?.forceRefresh) params.set("force_refresh", "true");

  const query = params.toString();
  return fetchJson(`/deployments${query ? `?${query}` : ""}`);
}

export async function getDeployment(id: string): Promise<Deployment> {
  return fetchJson(`/deployments/${id}`);
}

export async function createDeployment(
  request: DeploymentRequest,
): Promise<CreateDeploymentResponse> {
  return fetchJson("/deployments", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export interface QuotaInfoResponse {
  service: string;
  compute: string;
  region: string;
  date_range?: { start: string; end: string };
  total_shards: number;
  effective_settings: {
    max_concurrent: number;
    date_granularity?: string | null;
    skip_dimensions?: string[];
  };
  required_quota: Record<string, unknown>;
  live_quota?: Record<string, unknown> | null;
  live_quota_error?: string | null;
  recommended_max_concurrent?: number | null;
}

export async function getDeploymentQuotaInfo(
  request: DeploymentRequest,
): Promise<QuotaInfoResponse> {
  return fetchJson("/deployments/quota-info", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// Deployment Actions
export interface CancelDeploymentResult {
  deployment_id: string;
  status: string;
  cancelled_shards: number;
  message: string;
}

export async function cancelDeployment(
  id: string,
): Promise<CancelDeploymentResult> {
  return fetchJson(`/deployments/${id}/cancel`, { method: "POST" });
}

export interface ResumeDeploymentResult {
  deployment_id: string;
  status: string;
  total_shards: number;
  completed: number;
  failed: number;
  message: string;
}

export async function resumeDeployment(
  id: string,
): Promise<ResumeDeploymentResult> {
  return fetchJson(`/deployments/${id}/resume`, { method: "POST" });
}

export interface VerifyCompletionResult {
  completed_with_errors: number;
  completed_with_warnings: number;
  completed_with_verification: number;
  completed: number;
}

export async function verifyDeploymentCompletion(
  id: string,
  options?: { force?: boolean },
): Promise<VerifyCompletionResult> {
  const params = new URLSearchParams();
  if (options?.force) params.set("force", "true");
  const query = params.toString();
  return fetchJson(
    `/deployments/${id}/verify-completion${query ? `?${query}` : ""}`,
    { method: "POST" },
  );
}

export interface RetryFailedResult {
  deployment_id: string;
  status?: string;
  shards_to_retry?: number;
  shards_retried?: number;
  dry_run?: boolean;
  message: string;
  shards?: Array<{
    shard_id: string;
    dimensions: Record<string, unknown>;
    error_message?: string;
    retries: number;
  }>;
}

export async function retryFailedShards(
  id: string,
  options?: { category?: string; dryRun?: boolean },
): Promise<RetryFailedResult> {
  const params = new URLSearchParams();
  if (options?.category) params.set("category", options.category);
  if (options?.dryRun) params.set("dry_run", "true");
  const query = params.toString();

  // Retry can take 30-60 seconds as it creates VMs - use AbortController with longer timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

  try {
    const response = await fetch(
      `${API_BASE}/deployments/${id}/retry-failed${query ? `?${query}` : ""}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Unknown error" }));
      throw new ApiError(
        response.status,
        error.detail || `HTTP ${response.status}`,
      );
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

// Single Shard Actions
export interface CancelShardResult {
  deployment_id: string;
  shard_id: string;
  status: string;
  message: string;
}

export async function cancelShard(
  deploymentId: string,
  shardId: string,
): Promise<CancelShardResult> {
  return fetchJson(`/deployments/${deploymentId}/shards/${shardId}/cancel`, {
    method: "POST",
  });
}

// Update deployment metadata (tag)
export interface UpdateDeploymentResult {
  deployment_id: string;
  tag: string | null;
  message: string;
}

export async function updateDeploymentTag(
  id: string,
  tag: string | null,
): Promise<UpdateDeploymentResult> {
  return fetchJson(`/deployments/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ tag }),
  });
}

export async function deleteDeployment(
  id: string,
): Promise<{ deployment_id: string; deleted: boolean; message: string }> {
  return fetchJson(`/deployments/${id}`, { method: "DELETE" });
}

export interface BulkDeleteResult {
  total_requested: number;
  deleted: number;
  failed: number;
  results: Array<{
    deployment_id: string;
    deleted: boolean;
    error?: string;
    message?: string;
  }>;
}

export async function bulkDeleteDeployments(
  deploymentIds: string[],
): Promise<BulkDeleteResult> {
  return fetchJson("/deployments/bulk-delete", {
    method: "POST",
    body: JSON.stringify({ deployment_ids: deploymentIds }),
  });
}

// Infrastructure Reporting
export interface DeploymentReport {
  deployment_id: string;
  service: string;
  compute_type: string;
  status: string;
  summary: {
    total_shards: number;
    succeeded: number;
    failed: number;
    total_retries: number;
    success_rate: number;
  };
  failure_breakdown: Record<string, number>;
  zone_usage: Record<string, number>;
  region_usage: Record<string, number>;
  failed_shards: Array<{
    shard_id: string;
    error?: string;
    category?: string;
    dimensions?: Record<string, unknown>;
  }>;
  infrastructure_issues: Array<{
    shard_id: string;
    zone?: string;
    region?: string;
    reason?: string;
    category?: string;
    attempt?: number;
  }>;
  retry_stats: {
    shards_with_retries: number;
    total_zone_switches: number;
    total_region_switches: number;
  };
}

export async function getDeploymentReport(
  id: string,
): Promise<DeploymentReport> {
  return fetchJson(`/deployments/${id}/report`);
}

export interface RerunCommands {
  deployment_id: string;
  service: string;
  compute_type: string;
  total_commands: number;
  commands: Array<{
    shard_id: string;
    status: string;
    error?: string;
    command: string;
    dimensions?: Record<string, unknown>;
  }>;
  combined_retry_command?: string;
}

export async function getRerunCommands(
  id: string,
  options?: { failedOnly?: boolean; shardId?: string },
): Promise<RerunCommands> {
  const params = new URLSearchParams();
  if (options?.failedOnly) params.set("failed_only", "true");
  if (options?.shardId) params.set("shard_id", options.shardId);
  const query = params.toString();
  return fetchJson(
    `/deployments/${id}/rerun-commands${query ? `?${query}` : ""}`,
  );
}

// Checklists
export async function getChecklist(
  serviceName: string,
): Promise<ChecklistResponse> {
  return fetchJson(`/checklists/${serviceName}/checklist`);
}

export async function validateChecklist(
  serviceName: string,
): Promise<ChecklistValidateResponse> {
  return fetchJson(`/checklists/${serviceName}/checklist/validate`);
}

export async function listChecklists(): Promise<{
  checklists: ChecklistSummary[];
  count: number;
}> {
  return fetchJson("/checklists");
}

// Data Status
export async function getDataStatus(params: {
  service: string;
  start_date: string;
  end_date: string;
  mode?: string;
  category?: string[];
  venue?: string[];
  show_missing?: boolean;
  check_venues?: boolean;
  check_data_types?: boolean;
  force_refresh?: boolean;
}): Promise<DataStatusResponse | VenueCheckResponse | DataTypeCheckResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("service", params.service);
  searchParams.set("start_date", params.start_date);
  searchParams.set("end_date", params.end_date);
  if (params.mode) {
    searchParams.set("mode", params.mode);
  }
  if (params.category) {
    params.category.forEach((c) => searchParams.append("category", c));
  }
  if (params.venue) {
    params.venue.forEach((v) => searchParams.append("venue", v));
  }
  if (params.show_missing) {
    searchParams.set("show_missing", "true");
  }
  if (params.check_venues) {
    searchParams.set("check_venues", "true");
  }
  if (params.check_data_types) {
    searchParams.set("check_data_types", "true");
  }
  if (params.force_refresh) {
    searchParams.set("force_refresh", "true");
  }
  return fetchJson(`/data-status?${searchParams.toString()}`);
}

// Turbo Data Status - much faster for large services (uses month-prefix queries)

// Data type completion status (nested within venue)
export interface TurboDataTypeStatus {
  dates_found: number;
  dates_expected: number;
  completion_pct: number;
  status?: "complete" | "partial" | "missing";
}

export interface TurboSubDimension {
  dates_found: number;
  dates_expected: number; // Legacy: category-level expected
  dates_expected_venue?: number; // NEW: venue-specific expected based on venue start
  dates_expected_category?: number; // NEW: category-level expected for reference
  venue_start_date?: string | null; // NEW: when venue data starts
  completion_pct: number;
  is_expected?: boolean;
  status?: "expected" | "bonus";
  // Dimension-weighted values (accounts for multiple expected data_types/folders per venue)
  _dim_weighted_found?: number;
  _dim_weighted_expected?: number;
  dates_found_count?: number; // Total found count
  dates_found_list?: string[]; // First 25 found dates (or all if <= 50)
  dates_found_list_tail?: string[]; // Last 25 found dates (if truncated)
  dates_found_truncated?: boolean; // True if found list was truncated
  dates_missing_count?: number; // Total missing count
  dates_missing_list?: string[]; // First 25 missing dates (or all if <= 50)
  dates_missing_list_tail?: string[]; // Last 25 missing dates (if truncated)
  dates_missing_truncated?: boolean; // True if list was truncated
  data_types?: Record<string, TurboDataTypeStatus>; // NEW: per-data-type breakdown
}

export interface TurboVenueSummary {
  expected_venues: string[];
  found_venues: string[];
  expected_but_missing: string[];
  unexpected_but_found: string[];
  expected_count: number;
  found_count: number;
  expected_coverage_pct: number;
}

export interface TurboCategoryStatus {
  category: string;
  bucket: string;
  prefixes_queried: number;
  dates_expected: number;
  dates_found: number;
  dates_missing: number;
  completion_pct: number;
  missing_dates: string[] | string;
  // Category-level dates lists (with truncation for UI display)
  dates_found_count?: number; // Total found count
  dates_found_list?: string[]; // First 25 found dates (or all if <= 50)
  dates_found_list_tail?: string[]; // Last 25 found dates (if truncated)
  dates_found_truncated?: boolean; // True if found list was truncated
  dates_missing_count?: number; // Total missing count
  dates_missing_list?: string[]; // First 25 missing dates (or all if <= 50)
  dates_missing_list_tail?: string[]; // Last 25 missing dates (if truncated)
  dates_missing_truncated?: boolean; // True if missing list was truncated
  // Per-date venue completeness (for instruments-service deploy missing)
  dates_fully_complete_list?: string[]; // Dates where ALL expected venues have data
  dates_partially_complete_list?: string[]; // Dates where SOME expected venues have data
  dates_fully_complete_count?: number;
  dates_partially_complete_count?: number;
  error?: string;
  bulk_service?: boolean; // True if this category is served by a bulk download service
  // Dimension-weighted category totals (accounts for data_types/folders per venue)
  venue_weighted?: boolean;
  venue_dates_found?: number;
  venue_dates_expected?: number;
  // Sub-dimensions (venue, data_type, feature_group, folder depending on service)
  venues?: { [name: string]: TurboSubDimension };
  data_types?: { [name: string]: TurboSubDimension };
  feature_groups?: { [name: string]: TurboSubDimension };
  folders?: { [name: string]: TurboSubDimension }; // Instrument type breakdown
  venue_summary?: TurboVenueSummary;
}

export interface TurboDataStatusResponse {
  service: string;
  date_range: {
    start: string;
    end: string;
    days: number;
  };
  mode: "turbo";
  first_day_of_month_only?: boolean; // True if only checking first day of each month (TARDIS free tier)
  sub_dimension?: string | null; // 'venue', 'data_type', 'feature_group', or null
  overall_completion_pct: number;
  overall_dates_found: number; // venue-weighted total
  overall_dates_expected: number; // venue-weighted expected
  // Category-level totals for reference (not venue-weighted)
  overall_dates_found_category?: number;
  overall_dates_expected_category?: number;
  total_missing?: number;
  unexpected_missing?: number;
  expected_missing?: number;
  categories: {
    [category: string]: TurboCategoryStatus;
  };
}

export async function getDataStatusTurbo(params: {
  service: string;
  start_date: string;
  end_date: string;
  mode?: "batch" | "live"; // batch vs live GCS paths
  category?: string[];
  venue?: string[]; // Filter by specific venues (reduces cloud storage scan scope)
  folder?: string[]; // Filter by folder/instrument type (spot, perpetuals, etc.)
  data_type?: string[]; // Filter by data type (trades, book_snapshot_5, etc.)
  include_sub_dimensions?: boolean;
  include_dates_list?: boolean; // Include actual dates found for deploy missing
  full_dates_list?: boolean; // Return complete date lists without truncation
  check_upstream_availability?: boolean; // Check upstream data exists before counting as "expected"
  first_day_of_month_only?: boolean; // Only check first day of each month (TARDIS free tier)
  freshness_date?: string; // Only count data as 'found' if blob updated on/after this datetime (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
  signal?: AbortSignal; // For cancelling the request
}): Promise<TurboDataStatusResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("service", params.service);
  searchParams.set("start_date", params.start_date);
  searchParams.set("end_date", params.end_date);
  if (params.mode) {
    searchParams.set("mode", params.mode);
  }
  if (params.category) {
    params.category.forEach((c) => searchParams.append("category", c));
  }
  if (params.venue) {
    params.venue.forEach((v) => searchParams.append("venue", v));
  }
  if (params.folder) {
    params.folder.forEach((f) => searchParams.append("folder", f));
  }
  if (params.data_type) {
    params.data_type.forEach((dt) => searchParams.append("data_type", dt));
  }
  if (params.include_sub_dimensions) {
    searchParams.set("include_sub_dimensions", "true");
  }
  if (params.include_dates_list) {
    searchParams.set("include_dates_list", "true");
  }
  if (params.full_dates_list) {
    searchParams.set("full_dates_list", "true");
  }
  if (params.check_upstream_availability) {
    searchParams.set("check_upstream_availability", "true");
  }
  if (params.first_day_of_month_only) {
    searchParams.set("first_day_of_month_only", "true");
  }
  if (params.freshness_date) {
    searchParams.set("freshness_date", params.freshness_date);
  }
  return fetchJson(`/data-status/turbo?${searchParams.toString()}`, {
    signal: params.signal,
  });
}

// Get available filters for a specific venue
export interface VenueFiltersResponse {
  category: string;
  venue: string;
  folders: string[];
  data_types: string[];
  instrument_types: string[];
  start_date?: string;
  error?: string;
}

export async function getVenueFilters(
  category: string,
  venue: string,
): Promise<VenueFiltersResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("category", category);
  searchParams.set("venue", venue);
  return fetchJson(`/data-status/venue-filters?${searchParams.toString()}`);
}

// List actual files in cloud storage (GCS or S3) for a fully-specified path
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
  /** ISO timestamp of the most recent blob update for this date (null if no files or error) */
  last_modified?: string | null;
  files: FileInfo[];
  error?: string;
}

export interface ListFilesResponse {
  service: string;
  bucket: string;
  category: string;
  venue: string;
  folder: string;
  data_type: string;
  timeframe: string | null;
  date_range: {
    start: string;
    end: string;
    total_days: number;
  };
  summary: {
    total_files: number;
    total_size_bytes: number;
    total_size_formatted: string;
    dates_with_data: number;
    dates_empty: number;
    completion_pct: number;
  };
  by_date: DateFileResult[];
  error?: string;
  suggestion?: string;
}

export async function listFiles(params: {
  service: string;
  category: string;
  venue: string;
  folder: string;
  data_type: string;
  start_date: string;
  end_date: string;
  timeframe?: string;
  signal?: AbortSignal;
}): Promise<ListFilesResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("service", params.service);
  searchParams.set("category", params.category);
  searchParams.set("venue", params.venue);
  searchParams.set("folder", params.folder);
  searchParams.set("data_type", params.data_type);
  searchParams.set("start_date", params.start_date);
  searchParams.set("end_date", params.end_date);
  if (params.timeframe) {
    searchParams.set("timeframe", params.timeframe);
  }
  return fetchJson(`/data-status/list-files?${searchParams.toString()}`, {
    signal: params.signal,
  });
}

// Services that require upstream availability check for accurate missing data
// These services depend on data from upstream services, so we can only count
// "missing" for dates where upstream data actually exists
export const UPSTREAM_CHECK_SERVICES = [
  "market-data-processing-service", // Depends on market-tick-data-handler (raw_tick_data)
  "features-delta-one-service", // Depends on market-data-processing-service (processed_candles)
];

// Services that support turbo mode (all services now supported)
export const TURBO_MODE_SERVICES = [
  "instruments-service",
  "market-tick-data-handler",
  "market-data-processing-service",
  "features-delta-one-service",
  "features-calendar-service",
  "features-onchain-service",
  "features-volatility-service",
];

// Services with sub-dimension breakdown support
export const TURBO_SUB_DIMENSION_SERVICES: { [service: string]: string } = {
  "instruments-service": "venue",
  "market-tick-data-handler": "data_type",
  "market-data-processing-service": "data_type",
  "features-delta-one-service": "feature_group",
  "features-calendar-service": "feature_group",
  "features-volatility-service": "feature_group",
  "features-onchain-service": "feature_group",
};

// Venue Check Response type (when check_venues=true)
export interface VenueCheckResponse {
  service: string;
  start_date: string;
  end_date: string;
  categories: {
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

// Data Type Check Response type (when check_data_types=true)
export interface DataTypeCheckResponse {
  service: string;
  start_date: string;
  end_date: string;
  overall_completion: number;
  overall_complete: number;
  overall_total: number;
  venues: {
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

export async function getMissingShards(params: {
  service: string;
  start_date: string;
  end_date: string;
  mode?: string;
  category?: string[];
  venue?: string[];
}): Promise<MissingShardsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("service", params.service);
  searchParams.set("start_date", params.start_date);
  searchParams.set("end_date", params.end_date);
  if (params.mode) {
    searchParams.set("mode", params.mode);
  }
  if (params.category) {
    params.category.forEach((c) => searchParams.append("category", c));
  }
  if (params.venue) {
    params.venue.forEach((v) => searchParams.append("venue", v));
  }
  return fetchJson(`/data-status/missing-shards?${searchParams.toString()}`);
}

// ============================================================================
// Execution Services Data Status
// ============================================================================

// Config-level day breakdown for execution services
export interface ExecutionConfigInfo {
  config_file: string;
  algo_name: string;
  result_strategy_id: string;
  has_results: boolean;
  result_dates: string[];
  // Day breakdown fields (when include_dates_list=true)
  dates_found_count?: number;
  dates_found_list?: string[];
  dates_found_list_tail?: string[];
  dates_found_truncated?: boolean;
  dates_missing_count?: number;
  dates_missing_list?: string[];
  dates_missing_list_tail?: string[];
  dates_missing_truncated?: boolean;
  completion_pct?: number;
}

export interface ExecutionTimeframeStatus {
  timeframe: string;
  total: number;
  with_results: number;
  completion_pct: number;
  missing_configs: Array<{ config_file: string; algo_name: string }>;
  configs: ExecutionConfigInfo[];
}

export interface ExecutionModeStatus {
  mode: string;
  total: number;
  with_results: number;
  completion_pct: number;
  timeframes: ExecutionTimeframeStatus[];
}

export interface ExecutionStrategyStatus {
  strategy: string;
  total: number;
  with_results: number;
  completion_pct: number;
  result_dates: string[];
  result_date_count: number;
  modes: ExecutionModeStatus[];
}

export interface ExecutionBreakdownItem {
  total: number;
  with_results: number;
  missing_count: number;
  completion_pct: number;
  missing_samples: string[];
}

export interface ExecutionDataStatusResponse {
  config_path: string;
  version: string;
  total_configs: number;
  configs_with_results: number;
  missing_count: number;
  completion_pct: number;
  strategy_count: number;
  strategies: ExecutionStrategyStatus[];
  breakdown_by_mode: Record<string, ExecutionBreakdownItem>;
  breakdown_by_timeframe: Record<string, ExecutionBreakdownItem>;
  breakdown_by_algo: Record<string, ExecutionBreakdownItem>;
  date_filter?: {
    start: string | null;
    end: string | null;
  };
  error?: string;
}

export async function getExecutionDataStatus(params: {
  config_path: string;
  start_date?: string;
  end_date?: string;
  include_dates_list?: boolean;
}): Promise<ExecutionDataStatusResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("config_path", params.config_path);
  if (params.start_date) searchParams.set("start_date", params.start_date);
  if (params.end_date) searchParams.set("end_date", params.end_date);
  if (params.include_dates_list) searchParams.set("include_dates_list", "true");
  return fetchJson(
    `/service-status/execution-services/data-status?${searchParams.toString()}`,
  );
}

// Execution Services Missing Shards
export interface ExecutionMissingShard {
  config_gcs: string; // Legacy; gs:// path
  config_path?: string; // Cloud-agnostic (gs:// or s3://)
  date: string;
  strategy: string;
  mode: string;
  timeframe: string;
  algo: string;
}

export interface ExecutionMissingShardsResponse {
  missing_shards: ExecutionMissingShard[];
  total_missing: number;
  total_configs: number;
  total_dates: number;
  breakdown: {
    by_strategy: Record<string, number>;
    by_mode: Record<string, number>;
    by_timeframe: Record<string, number>;
    by_algo: Record<string, number>;
    by_date: Record<string, number>;
  };
  filters: {
    config_path: string;
    start_date: string;
    end_date: string;
    strategy?: string | null;
    mode?: string | null;
    timeframe?: string | null;
    algo?: string | null;
  };
  error?: string;
}

export async function getExecutionMissingShards(params: {
  config_path: string;
  start_date: string;
  end_date: string;
  strategy?: string;
  mode?: string;
  timeframe?: string;
  algo?: string;
}): Promise<ExecutionMissingShardsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("config_path", params.config_path);
  searchParams.set("start_date", params.start_date);
  searchParams.set("end_date", params.end_date);
  if (params.strategy) searchParams.set("strategy", params.strategy);
  if (params.mode) searchParams.set("mode", params.mode);
  if (params.timeframe) searchParams.set("timeframe", params.timeframe);
  if (params.algo) searchParams.set("algo", params.algo);
  return fetchJson(
    `/service-status/execution-services/missing-shards?${searchParams.toString()}`,
    {
      method: "POST",
    },
  );
}

// Service Status (Temporal Audit Trail)
export async function getServiceStatus(
  serviceName: string,
): Promise<ServiceStatus> {
  return fetchJson(`/service-status/${serviceName}/status`);
}

export async function getServicesOverview(): Promise<ServicesOverview> {
  return fetchJson("/service-status/overview");
}

// Capabilities (API runtime info for UI display)
export interface CapabilitiesResponse {
  gcs_fuse: { active: boolean; env?: string; reason?: string };
}

export async function getCapabilities(): Promise<CapabilitiesResponse> {
  return fetchJson("/capabilities");
}

export interface ServiceCategoriesResponse {
  service: string;
  categories: string[];
}

export async function getServiceCategories(
  serviceName: string,
): Promise<ServiceCategoriesResponse> {
  return fetchJson(`/capabilities/service-categories/${serviceName}`);
}

// Cache Management
export interface ClearCacheResponse {
  status: string;
  cleared: number;
  message?: string;
  error?: string;
}

export async function clearCache(): Promise<ClearCacheResponse> {
  return fetchJson("/cache/clear", { method: "POST" });
}

// Clear only data status cache (doesn't affect deployment state cache)
export async function clearDataStatusCache(): Promise<{
  status: string;
  entries_cleared: number;
}> {
  return fetchJson("/data-status/turbo/cache/clear", { method: "POST" });
}

// Cloud Builds
export interface BuildInfo {
  build_id: string;
  status: string;
  create_time: string | null;
  finish_time: string | null;
  duration_seconds: number | null;
  commit_sha: string | null;
  branch: string | null;
  log_url: string | null;
}

export interface BuildTrigger {
  trigger_id: string;
  trigger_name: string;
  service: string;
  type?: "service" | "library" | "infrastructure"; // Distinguish service types
  github_repo: string | null;
  branch_pattern: string | null;
  disabled: boolean;
  status: string;
  last_build: BuildInfo | null;
}

export interface BuildTriggersResponse {
  triggers: BuildTrigger[];
  total: number;
  project: string;
  region: string;
}

export interface TriggerBuildResponse {
  success: boolean;
  build_id: string | null;
  log_url: string | null;
  message: string;
  service: string;
  branch: string;
}

export interface BuildHistoryResponse {
  service: string;
  trigger_name: string;
  builds: BuildInfo[];
  total: number;
}

export async function getCloudBuildTriggers(): Promise<BuildTriggersResponse> {
  return fetchJson("/cloud-builds/triggers");
}

export async function triggerCloudBuild(
  service: string,
  branch: string = "main",
): Promise<TriggerBuildResponse> {
  return fetchJson("/cloud-builds/trigger", {
    method: "POST",
    body: JSON.stringify({ service, branch }),
  });
}

export async function getCloudBuildHistory(
  service: string,
  limit: number = 10,
): Promise<BuildHistoryResponse> {
  return fetchJson(`/cloud-builds/history/${service}?limit=${limit}`);
}

// Instrument Search and Availability
export interface InstrumentSearchResult {
  instrument_key: string;
  venue: string;
  instrument_type: string;
  symbol?: string;
  base_currency?: string;
  quote_currency?: string;
  data_types?: string[] | string;
  available_from_datetime?: string;
  available_to_datetime?: string;
}

export interface InstrumentsListResponse {
  category: string;
  aggregated_file?: string;
  aggregated_date?: string;
  total_in_file: number;
  returned_count: number;
  search?: string;
  instruments: InstrumentSearchResult[];
  error?: string;
}

export interface InstrumentAvailabilityResponse {
  instrument_key: string;
  parsed: {
    venue: string;
    instrument_type: string;
    symbol: string;
    category: string;
    folder: string;
  };
  service: string;
  bucket: string;
  date_range: {
    start: string;
    end: string;
    total_dates: number;
    first_day_of_month_only: boolean;
  };
  availability_window?: {
    instrument_from?: string;
    instrument_to?: string;
    effective_start: string;
    effective_end: string;
    dates_in_window: number;
  };
  data_types_checked: string[];
  overall: {
    expected: number;
    found: number;
    missing: number;
    completion_pct: number;
  };
  by_data_type: Record<
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

export async function getInstrumentsList(params: {
  category: string;
  search?: string;
  limit?: number;
}): Promise<InstrumentsListResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("category", params.category);
  if (params.search) searchParams.set("search", params.search);
  if (params.limit) searchParams.set("limit", params.limit.toString());
  return fetchJson(`/data-status/instruments?${searchParams.toString()}`);
}

export async function getInstrumentAvailability(params: {
  instrument_key: string;
  start_date: string;
  end_date: string;
  data_type?: string;
  first_day_of_month_only?: boolean;
  service?: string;
  timeframe?: string;
  available_from?: string;
  available_to?: string;
}): Promise<InstrumentAvailabilityResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("instrument_key", params.instrument_key);
  searchParams.set("start_date", params.start_date);
  searchParams.set("end_date", params.end_date);
  if (params.data_type) searchParams.set("data_type", params.data_type);
  if (params.first_day_of_month_only)
    searchParams.set("first_day_of_month_only", "true");
  if (params.service) searchParams.set("service", params.service);
  if (params.timeframe) searchParams.set("timeframe", params.timeframe);
  if (params.available_from)
    searchParams.set("available_from", params.available_from);
  if (params.available_to)
    searchParams.set("available_to", params.available_to);
  return fetchJson(
    `/data-status/instrument-availability?${searchParams.toString()}`,
  );
}

// ── Event stream ─────────────────────────────────────────────────────────────

/**
 * Return the full shard event stream for a deployment.
 * Each event captures a lifecycle step (JOB_STARTED, VM_PREEMPTED, etc.)
 * with timestamp, message, and optional metadata.
 */
export async function getDeploymentEvents(
  deploymentId: string,
  shardId?: string,
): Promise<DeploymentEventStream> {
  const params = new URLSearchParams();
  if (shardId) params.set("shard_id", shardId);
  const query = params.toString();
  return fetchJson(
    `/deployments/${deploymentId}/events${query ? `?${query}` : ""}`,
  );
}

/**
 * Return VM-level infrastructure events for a deployment.
 * Filters to: VM_PREEMPTED, VM_DELETED, VM_QUOTA_EXHAUSTED, VM_ZONE_UNAVAILABLE,
 * VM_TIMEOUT, CONTAINER_OOM, CLOUD_RUN_REVISION_FAILED.
 */
export async function getDeploymentVmEvents(
  deploymentId: string,
): Promise<DeploymentEventStream> {
  return fetchJson(`/deployments/${deploymentId}/vm-events`);
}

// ── Live deployment ───────────────────────────────────────────────────────────

/**
 * Roll back a live Cloud Run Service to the previous (or specified) revision.
 * Only valid for deployments with deploy_mode="live".
 */
export async function rollbackLiveDeployment(
  deploymentId: string,
  request: RollbackRequest,
): Promise<RollbackResponse> {
  return fetchJson(`/deployments/${deploymentId}/rollback`, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Return the current health check status of a live Cloud Run Service.
 * Used by DeploymentDetails to show a live health badge.
 */
export async function getLiveDeploymentHealth(
  deploymentId: string,
  service: string,
  region: string,
): Promise<LiveHealthStatus> {
  const params = new URLSearchParams({ service, region });
  return fetchJson(
    `/deployments/${deploymentId}/live-health?${params.toString()}`,
  );
}

// ── User Management ──────────────────────────────────────────────────────────

export interface UsersListResponse {
  users: import("../types/userTypes").UserProfile[];
  count: number;
}

export interface UserResponse {
  user: import("../types/userTypes").UserProfile;
  message?: string;
}

export interface RolesListResponse {
  roles: import("../types/userTypes").RoleDefinition[];
  count: number;
}

export interface PermissionsListResponse {
  permissions: import("../types/userTypes").PermissionDefinition[];
  count: number;
}

export async function getUsers(): Promise<UsersListResponse> {
  return fetchJson("/user-management/users");
}

export async function getUser(userId: string): Promise<UserResponse> {
  return fetchJson(`/user-management/users/${userId}`);
}

export async function createUser(
  request: import("../types/userTypes").CreateUserRequest,
): Promise<UserResponse> {
  return fetchJson("/user-management/users", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function updateUser(
  userId: string,
  request: import("../types/userTypes").UpdateUserRequest,
): Promise<UserResponse> {
  return fetchJson(`/user-management/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(request),
  });
}

export async function deleteUser(
  userId: string,
): Promise<{ user_id: string; deactivated: boolean; message: string }> {
  return fetchJson(`/user-management/users/${userId}`, { method: "DELETE" });
}

export async function assignRole(
  userId: string,
  role: string,
): Promise<UserResponse> {
  return fetchJson(`/user-management/users/${userId}/role`, {
    method: "POST",
    body: JSON.stringify({ role }),
  });
}

export async function getRoles(): Promise<RolesListResponse> {
  return fetchJson("/user-management/roles");
}

export async function getPermissions(): Promise<PermissionsListResponse> {
  return fetchJson("/user-management/permissions");
}

export { ApiError };
