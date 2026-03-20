/**
 * API stub for deployment components.
 *
 * TODO: Wire each function to MSW handlers / real API routes.
 * All functions return mock data or empty responses for now.
 */

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
}

export interface ExecutionMissingShardsResponse {
  service: string;
  missing_shards: Array<{
    shard_id: string;
    dimensions: Record<string, string>;
  }>;
  total_missing: number;
}

export interface DeploymentReport {
  deployment_id: string;
  service: string;
  status: string;
  total_shards: number;
  completed_shards: number;
  failed_shards: number;
  summary: string;
}

export interface RerunCommands {
  deployment_id: string;
  commands: string[];
}

export interface VenueCheckResponse {
  service: string;
  venues: string[];
  missing: string[];
}

export interface DataTypeCheckResponse {
  service: string;
  data_types: string[];
  missing: string[];
}

export interface TurboDataStatusResponse {
  service: string;
  status: string;
  categories: Record<string, unknown>;
}

export interface ListFilesResponse {
  files: string[];
  total: number;
}

export interface InstrumentSearchResult {
  instrument_id: string;
  name: string;
  category: string;
  venue: string;
}

export interface InstrumentAvailabilityResponse {
  instrument_id: string;
  available_dates: string[];
  coverage_pct: number;
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
// TODO: Wire to MSW handler
// ---------------------------------------------------------------------------

export async function fetchBuilds(
  _service: string,
  _env: BuildEnvironment,
): Promise<BuildEntry[]> {
  // TODO: wire to MSW handler
  return [];
}

export async function getCloudBuildTriggers(): Promise<{
  triggers: BuildTrigger[];
}> {
  // TODO: wire to MSW handler
  return { triggers: [] };
}

export async function triggerCloudBuild(
  _service: string,
  _branch: string,
): Promise<{ success: boolean; message: string }> {
  // TODO: wire to MSW handler
  return { success: false, message: "Not implemented — wire to MSW handler" };
}

export async function getCloudBuildHistory(
  _service: string,
): Promise<{ builds: BuildInfo[] }> {
  // TODO: wire to MSW handler
  return { builds: [] };
}

export async function listDirectories(
  _service: string,
  _path: string,
): Promise<{ directories: string[] }> {
  // TODO: wire to MSW handler
  return { directories: [] };
}

export async function discoverConfigs(
  _service: string,
  _path: string,
): Promise<{ total_configs: number }> {
  // TODO: wire to MSW handler
  return { total_configs: 0 };
}

export async function getConfigBuckets(
  _service: string,
): Promise<{
  buckets: Array<{ name: string; path: string }>;
  default_bucket?: string;
}> {
  // TODO: wire to MSW handler
  return { buckets: [] };
}

export async function getDeploymentQuotaInfo(
  _service: string,
): Promise<QuotaInfoResponse> {
  // TODO: wire to MSW handler
  return {
    service: _service,
    quota_remaining: 100,
    quota_limit: 100,
    reset_at: new Date().toISOString(),
  };
}

export async function getExecutionMissingShards(
  _service: string,
): Promise<ExecutionMissingShardsResponse> {
  // TODO: wire to MSW handler
  return { service: _service, missing_shards: [], total_missing: 0 };
}

export async function cancelDeployment(
  _deploymentId: string,
): Promise<{ success: boolean }> {
  // TODO: wire to MSW handler
  return { success: false };
}

export async function resumeDeployment(
  _deploymentId: string,
): Promise<{ success: boolean }> {
  // TODO: wire to MSW handler
  return { success: false };
}

export async function verifyDeploymentCompletion(
  _deploymentId: string,
): Promise<{ verified: boolean }> {
  // TODO: wire to MSW handler
  return { verified: false };
}

export async function retryFailedShards(
  _deploymentId: string,
): Promise<{ retried: number }> {
  // TODO: wire to MSW handler
  return { retried: 0 };
}

export async function cancelShard(
  _deploymentId: string,
  _shardId?: string,
): Promise<{ success: boolean }> {
  // TODO: wire to MSW handler
  return { success: false };
}

export async function updateDeploymentTag(
  _deploymentId: string,
  _tag: string | null,
): Promise<{ success: boolean }> {
  // TODO: wire to MSW handler
  return { success: false };
}

export async function getDeploymentReport(
  _deploymentId: string,
): Promise<DeploymentReport> {
  // TODO: wire to MSW handler
  return {
    deployment_id: _deploymentId,
    service: "",
    status: "unknown",
    total_shards: 0,
    completed_shards: 0,
    failed_shards: 0,
    summary: "",
  };
}

export async function getRerunCommands(
  _deploymentId: string,
): Promise<RerunCommands> {
  // TODO: wire to MSW handler
  return { deployment_id: _deploymentId, commands: [] };
}

export async function getDeploymentEvents(
  _deploymentId: string,
): Promise<{ events: unknown[] }> {
  // TODO: wire to MSW handler
  return { events: [] };
}

export async function rollbackLiveDeployment(
  _deploymentId: string,
): Promise<{ success: boolean }> {
  // TODO: wire to MSW handler
  return { success: false };
}

export async function getLiveDeploymentHealth(
  _deploymentId: string,
): Promise<unknown> {
  // TODO: wire to MSW handler
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
  // TODO: wire to MSW handler
  return { deployments: [] };
}

export async function bulkDeleteDeployments(
  _ids: string[],
): Promise<{ deleted: number; failed: number }> {
  // TODO: wire to MSW handler
  return { deleted: 0, failed: 0 };
}

// ---------------------------------------------------------------------------
// Functions used via `import * as api` in hooks
// ---------------------------------------------------------------------------

export async function getHealth(): Promise<{
  status: string;
  version: string;
  cloud_provider?: string;
  mock_mode?: boolean;
  gcs_fuse?: { active: boolean; reason: string };
}> {
  // TODO: wire to MSW handler
  return { status: "healthy", version: "0.0.0-stub" };
}

export async function clearCache(): Promise<void> {
  // TODO: wire to MSW handler
}

export async function getServices(): Promise<{
  services: Array<{ name: string; description: string }>;
}> {
  // TODO: wire to MSW handler
  return { services: [] };
}

export async function getServiceDimensions(
  _service: string,
): Promise<{
  dimensions: Array<{
    name: string;
    type: string;
    description: string;
    values?: string[];
    granularity?: string;
    parent?: string;
  }>;
  cli_args?: Record<string, string>;
}> {
  // TODO: wire to MSW handler
  return { dimensions: [] };
}

export async function getDependencies(_service: string): Promise<{
  description?: string;
  upstream: Array<{
    service: string;
    required: boolean;
    description: string;
  }>;
  downstream_dependents: string[];
  outputs: Array<{ name: string; bucket_template: string }>;
  dag?: {
    nodes: string[];
    edges: Array<{ from: string; to: string; required?: boolean }>;
  };
}> {
  // TODO: wire to MSW handler
  return { upstream: [], downstream_dependents: [], outputs: [] };
}

export async function getChecklist(_service: string): Promise<{
  readiness_percent: number;
  completed_items: number;
  total_items: number;
  partial_items: number;
  pending_items: number;
  not_applicable_items: number;
  last_updated: string;
  blocking_items: Array<{
    id: string;
    description: string;
    category: string;
    notes?: string;
  }>;
  categories: Array<{
    name: string;
    display_name: string;
    completed_items: number;
    total_items: number;
    percent: number;
    items: Array<{
      id: string;
      description: string;
      status: string;
      blocking?: boolean;
      notes?: string;
      verified_date?: string;
    }>;
  }>;
}> {
  // TODO: wire to MSW handler
  return {
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
): Promise<{
  valid: boolean;
  errors: string[];
}> {
  // TODO: wire to MSW handler
  return { valid: true, errors: [] };
}

export async function listChecklists(): Promise<{
  checklists: Array<{
    service: string;
    readiness_percent: number;
    completed_items: number;
    total_items: number;
  }>;
}> {
  // TODO: wire to MSW handler
  return { checklists: [] };
}

export async function getEpics(): Promise<
  Array<{
    epic_id: string;
    display_name: string;
    epic_pct: number;
    epic_complete: boolean;
    mvp_priority: number;
    completed: number;
    total_required: number;
    blocking_count: number;
  }>
> {
  // TODO: wire to MSW handler
  return [];
}

export async function getEpicDetail(_epicId: string): Promise<{
  epic_id: string;
  blocking_repos: Array<{
    repo: string;
    asset_class: string;
    cr_current: string | null;
    cr_required: string;
    br_current: string | null;
    br_required: string;
    main_quickmerged: boolean;
    blocking_reason?: string;
    data?: {
      historical_available?: boolean;
      historical_start_date?: string;
      live_available?: boolean;
      mock_available?: boolean;
      testnet_available?: boolean;
    };
  }>;
  completed_repos: string[];
  optional_repos_status: Array<{
    repo: string;
    asset_class: string;
    yaml_present: boolean;
    note?: string;
  }>;
}> {
  // TODO: wire to MSW handler
  return {
    epic_id: _epicId,
    blocking_repos: [],
    completed_repos: [],
    optional_repos_status: [],
  };
}

export async function getVenuesByCategory(
  _category: string,
): Promise<{ venues: string[] }> {
  // TODO: wire to MSW handler
  return { venues: [] };
}

export async function getStartDates(_service: string): Promise<{
  start_dates: Record<
    string,
    { category_start?: string; venues?: Record<string, string> }
  >;
}> {
  // TODO: wire to MSW handler
  return { start_dates: {} };
}

export async function getServiceStatus(_service: string): Promise<{
  health: string;
  last_data_update: string | null;
  last_deployment: string | null;
  last_build: string | null;
  last_code_push: string | null;
  anomalies: Array<{ type: string; severity: string; message: string }>;
  details?: {
    data?: { by_category?: Record<string, { timestamp?: string }> };
    deployment?: {
      deployment_id?: string;
      status?: string;
      compute_type?: string;
      used_force?: boolean;
      total_shards?: number;
      completed_shards?: number;
      failed_shards?: number;
      tag?: string;
    };
    build?: {
      status?: string;
      commit_sha?: string;
      duration_seconds?: number;
      error?: boolean;
    };
    code?: { commit_sha?: string; message?: string; author?: string; error?: boolean };
  };
  api?: { gcs_fuse?: { active: boolean } };
  checklist_status?: { percent: number; completed: number; total: number };
  data_coverage?: { percent: number; gaps: number };
}> {
  // TODO: wire to MSW handler
  return {
    health: "unknown",
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
  // TODO: wire to MSW handler
  return { count: 0, healthy: 0, warnings: 0, errors: 0, services: [] };
}

export async function getDataStatus(
  _params: Record<string, unknown>,
): Promise<unknown> {
  // TODO: wire to MSW handler
  return {};
}

export async function getDataStatusTurbo(
  _params: Record<string, unknown>,
): Promise<TurboDataStatusResponse> {
  // TODO: wire to MSW handler
  return { service: "", status: "unknown", categories: {} };
}

export async function clearDataStatusCache(): Promise<void> {
  // TODO: wire to MSW handler
}

export async function listFiles(
  _params: Record<string, unknown>,
): Promise<ListFilesResponse> {
  // TODO: wire to MSW handler
  return { files: [], total: 0 };
}

export async function getInstrumentsList(
  _params: Record<string, unknown>,
): Promise<InstrumentSearchResult[]> {
  // TODO: wire to MSW handler
  return [];
}

export async function getInstrumentAvailability(
  _params: Record<string, unknown>,
): Promise<InstrumentAvailabilityResponse> {
  // TODO: wire to MSW handler
  return { instrument_id: "", available_dates: [], coverage_pct: 0 };
}

// Missing stub — added for build
export async function getServiceCategories(_service: string): Promise<{ categories: string[] }> {
  // TODO: wire to MSW handler
  return { categories: ["CEFI", "DEFI", "TRADFI"] }
}

export async function getVenueFilters(_params: Record<string, string>): Promise<{ folders: string[]; data_types: string[] }> {
  // TODO: wire to MSW handler
  return { folders: ["spot", "perpetuals", "futures"], data_types: ["ohlcv", "trades", "book_snapshot_5"] }
}

