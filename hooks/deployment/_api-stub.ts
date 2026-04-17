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
import { isMockDataMode } from "@/lib/runtime/data-mode";

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
  data_types?: Record<
    string,
    {
      dates_found?: number;
      dates_expected?: number;
      completion_pct?: number;
      status?: string;
    }
  >;
  leagues?: Record<
    string,
    {
      dates_found?: number;
      dates_expected?: number;
      dates_missing?: number;
      completion_pct?: number;
    }
  >;
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
  defi_sub_dimensions?: Record<
    string,
    {
      dates_found?: number;
      dates_expected?: number;
      dates_missing?: number;
      completion_pct?: number;
      venues?: string[];
      venue_count?: number;
    }
  >;
  sub_dimension_label?: string;
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

export const TURBO_MODE_SERVICES = ["market-tick-data-service", "market-data-processing-service"];

export const TURBO_SUB_DIMENSION_SERVICES: Record<string, string> = {
  "market-tick-data-service": "venue",
  "market-data-processing-service": "venue",
};

// ---------------------------------------------------------------------------
// Deploy-missing response type
// ---------------------------------------------------------------------------

export interface DeployMissingResponse {
  missing_analysis: {
    service: string;
    total_missing: number;
    missing_by_date: Record<string, number>;
    missing_by_venue: Record<string, number>;
    missing_by_category: Record<string, number>;
    summary: {
      total_days_checked: number;
      days_with_missing: number;
      completion_rate: number;
    };
  };
  deployment?: {
    deployment_id: string;
    status: string;
    total_shards: number;
    cli_command: string;
  };
  dry_run: boolean;
  mock?: boolean;
}

// ---------------------------------------------------------------------------
// Deploy-missing — calls POST /api/deployments/deploy-missing
// ---------------------------------------------------------------------------

export async function deployMissing(params: {
  service: string;
  start_date: string;
  end_date: string;
  region?: string;
  categories?: string[];
  venues?: string[];
  folders?: string[];
  data_types?: string[];
  force?: boolean;
  dry_run?: boolean;
  skip_existing?: boolean;
  exclude_dates?: Record<string, string[] | Record<string, string[]>>;
  date_granularity?: "daily" | "weekly" | "monthly" | "none";
  deploy_missing_only?: boolean;
  first_day_of_month_only?: boolean;
  mode?: "batch" | "live";
  tag?: string;
}): Promise<DeployMissingResponse> {
  const response = await fetch("/api/deployments/deploy-missing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Deploy-missing failed (${response.status}): ${errorBody || response.statusText}`);
  }

  return response.json() as Promise<DeployMissingResponse>;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

const DEMO_TOKEN_KEY = "portal_token";
const DATA_QUERY_SERVICE_ALIASES: Record<string, string> = {
  "market-tick-data-service": "market-tick-data-handler",
};

type RawInstrumentAvailabilityResponse = {
  error?: string;
  venue?: string;
  instrument_type?: string;
  instrument?: string;
  date_range?: { start?: string; end?: string; total_dates?: number };
  effective_range?: { start?: string; end?: string };
  data_types?: string[];
  daily_availability?: Record<string, Record<string, boolean>>;
};

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem(DEMO_TOKEN_KEY);
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function buildQuery(params: Record<string, unknown>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const entry of value) {
        query.append(key, String(entry));
      }
      continue;
    }
    query.append(key, String(value));
  }
  return query.toString();
}

function normalizeDataQueryService(service?: string): string | undefined {
  if (!service) return service;
  return DATA_QUERY_SERVICE_ALIASES[service] ?? service;
}

function toUpperValues(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.toUpperCase()))).sort();
}

function normalizeInstrumentList(
  payload: InstrumentSearchResponse | { instruments?: string[]; error?: string },
  params: Record<string, unknown>,
): InstrumentSearchResponse {
  const rawInstruments = Array.isArray(payload.instruments) ? payload.instruments : [];
  const venue = typeof params.venue === "string" ? params.venue : undefined;
  const instrumentType = typeof params.instrument_type === "string" ? params.instrument_type : undefined;
  const search = typeof params.search === "string" ? params.search.trim().toLowerCase() : "";

  const instruments = rawInstruments
    .map((entry) => {
      if (typeof entry === "string") {
        return {
          instrument_key: entry,
          instrument_id: entry,
          symbol: entry,
          venue,
          instrument_type: instrumentType,
        } satisfies InstrumentSearchResult;
      }
      return entry;
    })
    .filter((instrument) => {
      if (!search) return true;
      const searchKey = `${instrument.instrument_key ?? ""} ${instrument.symbol ?? ""}`.toLowerCase();
      return searchKey.includes(search);
    });

  return {
    instruments,
    error: payload.error,
  };
}

function normalizeInstrumentAvailability(
  payload: InstrumentAvailabilityResponse | RawInstrumentAvailabilityResponse,
): InstrumentAvailabilityResponse {
  if (payload.error) {
    return { error: payload.error };
  }

  if ("overall" in payload || "by_data_type" in payload) {
    return payload as InstrumentAvailabilityResponse;
  }

  const typed = payload as RawInstrumentAvailabilityResponse;
  const dataTypes = typed.data_types ?? [];
  const dailyAvailability = typed.daily_availability ?? {};
  const dates = Object.keys(dailyAvailability).sort();

  const byDataType: NonNullable<InstrumentAvailabilityResponse["by_data_type"]> = {};
  for (const dataType of dataTypes) {
    const datesFoundList: string[] = [];
    const datesMissingList: string[] = [];
    for (const date of dates) {
      if (dailyAvailability[date]?.[dataType]) {
        datesFoundList.push(date);
      } else {
        datesMissingList.push(date);
      }
    }
    const expected = datesFoundList.length + datesMissingList.length;
    byDataType[dataType] = {
      dates_found: datesFoundList.length,
      dates_missing: datesMissingList.length,
      completion_pct: expected > 0 ? (datesFoundList.length / expected) * 100 : 0,
      dates_found_list: datesFoundList,
      dates_missing_list: datesMissingList,
    };
  }

  const overallExpected = Object.values(byDataType).reduce(
    (sum, stats) => sum + stats.dates_found + stats.dates_missing,
    0,
  );
  const overallFound = Object.values(byDataType).reduce((sum, stats) => sum + stats.dates_found, 0);
  const effectiveStart = typed.effective_range?.start ?? typed.date_range?.start ?? "";
  const effectiveEnd = typed.effective_range?.end ?? typed.date_range?.end ?? "";

  return {
    parsed: {
      venue: typed.venue ?? "",
      instrument_type: typed.instrument_type ?? "",
      symbol: typed.instrument ?? "",
      category: "",
      folder: typed.instrument_type ?? "",
    },
    date_range: {
      start: typed.date_range?.start ?? effectiveStart,
      end: typed.date_range?.end ?? effectiveEnd,
      total_dates: typed.date_range?.total_dates ?? dates.length,
    },
    availability_window:
      effectiveStart && effectiveEnd
        ? { effective_start: effectiveStart, effective_end: effectiveEnd, dates_in_window: dates.length }
        : undefined,
    overall: {
      expected: overallExpected,
      found: overallFound,
      missing: Math.max(overallExpected - overallFound, 0),
      completion_pct: overallExpected > 0 ? (overallFound / overallExpected) * 100 : 0,
    },
    by_data_type: byDataType,
  };
}

async function requestJson<T>(path: string, options?: RequestInit, mockFallback?: () => T): Promise<T> {
  try {
    const headers: HeadersInit = {
      ...getAuthHeader(),
      ...(options?.headers ?? {}),
    };
    if (options?.body && !("Content-Type" in (headers as Record<string, string>))) {
      (headers as Record<string, string>)["Content-Type"] = "application/json";
    }

    const response = await fetch(path, {
      ...options,
      headers,
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`${response.status} ${response.statusText}${body ? `: ${body}` : ""}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    if (isMockDataMode() && mockFallback) {
      return mockFallback();
    }
    throw error;
  }
}

export async function fetchBuilds(service: string, env: BuildEnvironment): Promise<BuildEntry[]> {
  return requestJson<{ builds?: BuildEntry[] } | BuildEntry[]>(
    `/api/builds/${encodeURIComponent(service)}?env=${encodeURIComponent(env)}`,
    undefined,
    () => [],
  ).then((payload) => (Array.isArray(payload) ? payload : (payload.builds ?? [])));
}

export async function getCloudBuildTriggers(): Promise<{
  triggers: BuildTrigger[];
}> {
  return requestJson<{ triggers: BuildTrigger[] }>("/api/cloud-builds/triggers", undefined, () => ({ triggers: [] }));
}

export async function triggerCloudBuild(
  service: string,
  branch: string,
): Promise<{ success: boolean; message: string }> {
  return requestJson<{ success: boolean; message: string }>(
    "/api/cloud-builds/trigger",
    {
      method: "POST",
      body: JSON.stringify({ service, branch }),
    },
    () => ({ success: false, message: "Mock mode: trigger endpoint unavailable" }),
  );
}

export async function getCloudBuildHistory(service: string): Promise<{ builds: BuildInfo[] }> {
  return requestJson<{ builds: BuildInfo[] }>(
    `/api/cloud-builds/history/${encodeURIComponent(service)}`,
    undefined,
    () => ({ builds: [] }),
  );
}

export async function listDirectories(service: string, path: string): Promise<{ directories: string[] }> {
  return requestJson<{ directories: string[] }>(
    `/api/services/${encodeURIComponent(service)}/list-directories?path=${encodeURIComponent(path)}`,
    undefined,
    () => ({ directories: [] }),
  );
}

export async function discoverConfigs(service: string, path: string): Promise<{ total_configs: number }> {
  return requestJson<{ total_configs: number }>(
    `/api/services/${encodeURIComponent(service)}/discover-configs?path=${encodeURIComponent(path)}`,
    undefined,
    () => ({ total_configs: 0 }),
  );
}

export async function getConfigBuckets(service: string): Promise<{
  buckets: Array<{ name: string; path: string }>;
  default_bucket?: string;
}> {
  return requestJson<{
    buckets: Array<{ name: string; path: string }>;
    default_bucket?: string;
  }>(`/api/services/${encodeURIComponent(service)}/config-buckets`, undefined, () => ({ buckets: [] }));
}

export async function getDeploymentQuotaInfo(params: Record<string, unknown>): Promise<QuotaInfoResponse> {
  const query = buildQuery(params);
  return requestJson<QuotaInfoResponse>(`/api/deployments/quota-info${query ? `?${query}` : ""}`, undefined, () => ({
    service: String(params.service ?? ""),
    quota_remaining: 100,
    quota_limit: 100,
    reset_at: new Date().toISOString(),
  }));
}

export async function getExecutionMissingShards(
  params: Record<string, string>,
): Promise<ExecutionMissingShardsResponse> {
  const query = buildQuery(params);
  return requestJson<ExecutionMissingShardsResponse>(
    `/api/service-status/execution-services/missing-shards${query ? `?${query}` : ""}`,
    undefined,
    () => ({ service: params.service ?? "execution-services", missing_shards: [], total_missing: 0 }),
  );
}

export async function cancelDeployment(
  deploymentId: string,
): Promise<{ success: boolean; cancelled_shards?: number; message?: string }> {
  return requestJson<{ success: boolean; cancelled_shards?: number; message?: string }>(
    `/api/deployments/${encodeURIComponent(deploymentId)}/cancel`,
    { method: "POST" },
    () => ({ success: false, message: "Mock mode: cancel endpoint unavailable" }),
  );
}

export async function resumeDeployment(deploymentId: string): Promise<{ success: boolean; message?: string }> {
  return requestJson<{ success: boolean; message?: string }>(
    `/api/deployments/${encodeURIComponent(deploymentId)}/resume`,
    { method: "POST" },
    () => ({ success: false, message: "Mock mode: resume endpoint unavailable" }),
  );
}

export async function verifyDeploymentCompletion(
  deploymentId: string,
  options?: { force?: boolean },
): Promise<{ verified: boolean }> {
  const query = buildQuery(options ?? {});
  return requestJson<{ verified: boolean }>(
    `/api/deployments/${encodeURIComponent(deploymentId)}/verify-completion${query ? `?${query}` : ""}`,
    { method: "POST" },
    () => ({ verified: false }),
  );
}

export async function retryFailedShards(deploymentId: string): Promise<{ retried: number; message?: string }> {
  return requestJson<{ retried: number; message?: string }>(
    `/api/deployments/${encodeURIComponent(deploymentId)}/retry-failed`,
    { method: "POST" },
    () => ({ retried: 0 }),
  );
}

export async function cancelShard(
  deploymentId: string,
  shardId?: string,
): Promise<{ success: boolean; message?: string }> {
  if (!shardId) {
    return { success: false, message: "shardId is required" };
  }
  return requestJson<{ success: boolean; message?: string }>(
    `/api/deployments/${encodeURIComponent(deploymentId)}/shards/${encodeURIComponent(shardId)}/cancel`,
    { method: "POST" },
    () => ({ success: false, message: "Mock mode: shard cancel endpoint unavailable" }),
  );
}

export async function updateDeploymentTag(
  deploymentId: string,
  tag: string | null,
): Promise<{ success: boolean; message?: string }> {
  return requestJson<{ success: boolean; message?: string }>(
    `/api/deployments/${encodeURIComponent(deploymentId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ tag }),
    },
    () => ({ success: false, message: "Mock mode: deployment update endpoint unavailable" }),
  );
}

export async function getDeploymentReport(deploymentId: string): Promise<DeploymentReport> {
  return requestJson<DeploymentReport>(
    `/api/deployments/${encodeURIComponent(deploymentId)}/report`,
    undefined,
    () => ({
      deployment_id: deploymentId,
      service: "",
      status: "unknown",
      total_shards: 0,
      completed_shards: 0,
      failed_shards: 0,
      summary: {},
    }),
  );
}

export async function getRerunCommands(
  deploymentId: string,
  options?: { failedOnly?: boolean },
): Promise<RerunCommands> {
  const query = buildQuery({ failed_only: options?.failedOnly });
  return requestJson<RerunCommands>(
    `/api/deployments/${encodeURIComponent(deploymentId)}/rerun-commands${query ? `?${query}` : ""}`,
    undefined,
    () => ({ deployment_id: deploymentId, commands: [] }),
  );
}

export async function getDeploymentEvents(deploymentId: string): Promise<{ events: ShardEvent[] }> {
  return requestJson<{ events: ShardEvent[] }>(
    `/api/deployments/${encodeURIComponent(deploymentId)}/events`,
    undefined,
    () => ({ events: [] }),
  );
}

export async function rollbackLiveDeployment(
  deploymentId: string,
  options?: { service: string; region: string },
): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(
    `/api/deployments/${encodeURIComponent(deploymentId)}/rollback`,
    {
      method: "POST",
      body: JSON.stringify(options ?? {}),
    },
    () => ({ success: false }),
  );
}

export async function getLiveDeploymentHealth(
  deploymentId: string,
  service?: string,
  region?: string,
): Promise<LiveHealthStatus | null> {
  const query = buildQuery({ service, region });
  return requestJson<LiveHealthStatus | null>(
    `/api/deployments/${encodeURIComponent(deploymentId)}/live-health${query ? `?${query}` : ""}`,
    undefined,
    () => null,
  );
}

export async function getDeployments(params: { service: string; limit?: number; forceRefresh?: boolean }): Promise<{
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
  const query = buildQuery({
    service: params.service,
    limit: params.limit,
    force_refresh: params.forceRefresh,
  });
  return requestJson<{
    deployments: Array<{
      id: string;
      service: string;
      parameters?: Record<string, unknown>;
      status: string;
      created_at: string;
      total_shards: number;
      completed_shards: number;
    }>;
  }>(`/api/deployments${query ? `?${query}` : ""}`, undefined, () => ({ deployments: [] }));
}

export async function bulkDeleteDeployments(ids: string[]): Promise<{ deleted: number; failed: number }> {
  return requestJson<{ deleted: number; failed: number }>(
    "/api/deployments/bulk-delete",
    {
      method: "POST",
      body: JSON.stringify({ deployment_ids: ids }),
    },
    () => ({ deleted: 0, failed: 0 }),
  );
}

// ---------------------------------------------------------------------------
// Functions used via `import * as api` in hooks
// ---------------------------------------------------------------------------

export async function getHealth(): Promise<HealthResponse> {
  return requestJson<HealthResponse>("/api/health", undefined, () => ({
    status: "healthy",
    version: "0.0.0-mock",
    config_dir: "",
    mock_mode: true,
  }));
}

export async function clearCache(): Promise<void> {
  await requestJson<{ ok?: boolean }>("/api/cache/clear", { method: "POST" }, () => ({ ok: true }));
}

export async function getServices(): Promise<{
  services: Service[];
}> {
  return requestJson<{ services: Service[] }>("/api/services", undefined, () => ({ services: [] }));
}

export async function getServiceDimensions(service: string): Promise<ServiceDimensionsResponse> {
  return requestJson<ServiceDimensionsResponse>(
    `/api/services/${encodeURIComponent(service)}/dimensions`,
    undefined,
    () => ({ service, dimensions: [], cli_args: {} }),
  );
}

export async function getDependencies(service: string): Promise<DependenciesResponse> {
  return requestJson<DependenciesResponse>(
    `/api/config/dependencies/${encodeURIComponent(service)}`,
    undefined,
    () => ({
      service,
      description: "",
      upstream: [],
      downstream_dependents: [],
      outputs: [],
      external_dependencies: [],
    }),
  );
}

export async function getChecklist(service: string): Promise<ChecklistResponse> {
  return requestJson<ChecklistResponse>(`/api/checklists/${encodeURIComponent(service)}/checklist`, undefined, () => ({
    service,
    readiness_percent: 0,
    completed_items: 0,
    total_items: 0,
    partial_items: 0,
    pending_items: 0,
    not_applicable_items: 0,
    last_updated: "",
    blocking_items: [],
    categories: [],
  }));
}

export async function validateChecklist(service: string): Promise<ChecklistValidateResponse> {
  return requestJson<ChecklistValidateResponse>(
    `/api/checklists/${encodeURIComponent(service)}/checklist/validate`,
    undefined,
    () => ({
      service,
      ready: true,
      readiness_percent: 100,
      total_items: 0,
      completed_items: 0,
      blocking_items: [],
      warnings: [],
      can_proceed_with_acknowledgment: true,
    }),
  );
}

export async function listChecklists(): Promise<{
  checklists: ChecklistSummary[];
}> {
  return requestJson<{ checklists: ChecklistSummary[] }>("/api/checklists", undefined, () => ({ checklists: [] }));
}

export async function getEpics(): Promise<EpicSummary[]> {
  return requestJson<EpicSummary[]>("/api/epics", undefined, () => []);
}

export async function getEpicDetail(epicId: string): Promise<EpicDetail> {
  return requestJson<EpicDetail>(`/api/epics/${encodeURIComponent(epicId)}`, undefined, () => ({
    epic_id: epicId,
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
  }));
}

export async function getVenuesByCategory(category: string): Promise<CategoryVenuesResponse> {
  const response = await requestJson<CategoryVenuesResponse>(
    `/api/config/venues/${encodeURIComponent(category.toLowerCase())}`,
    undefined,
    () => ({ category, venues: [], data_types: [] }),
  );
  return {
    ...response,
    venues: toUpperValues(response.venues ?? []),
  };
}

export async function getStartDates(service: string): Promise<StartDatesResponse> {
  return requestJson<StartDatesResponse>(
    `/api/config/expected-start-dates/${encodeURIComponent(service)}`,
    undefined,
    () => ({ service, start_dates: {} }),
  );
}

export async function getServiceStatus(service: string): Promise<ServiceStatus> {
  return requestJson<ServiceStatus>(`/api/service-status/${encodeURIComponent(service)}/status`, undefined, () => ({
    service,
    health: "healthy",
    last_data_update: null,
    last_deployment: null,
    last_build: null,
    last_code_push: null,
    anomalies: [],
  }));
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
  return requestJson<{
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
  }>("/api/service-status/overview", undefined, () => ({ count: 0, healthy: 0, warnings: 0, errors: 0, services: [] }));
}

export async function getDataStatus(params: Record<string, unknown>): Promise<TurboDataStatusResponse> {
  const query = buildQuery({
    ...params,
    service: normalizeDataQueryService(typeof params.service === "string" ? params.service : undefined),
  });
  return requestJson<TurboDataStatusResponse>(`/api/data-status${query ? `?${query}` : ""}`, undefined, () => ({
    service: String(params.service ?? ""),
    status: "unknown",
    categories: {},
  }));
}

export async function getDataStatusTurbo(params: Record<string, unknown>): Promise<TurboDataStatusResponse> {
  const query = buildQuery({
    ...params,
    service: normalizeDataQueryService(typeof params.service === "string" ? params.service : undefined),
  });
  return requestJson<TurboDataStatusResponse>(`/api/data-status/turbo${query ? `?${query}` : ""}`, undefined, () => ({
    service: String(params.service ?? ""),
    status: "unknown",
    categories: {},
  }));
}

export async function clearDataStatusCache(): Promise<void> {
  try {
    await requestJson<{ ok?: boolean }>("/api/data-status/turbo/cache/clear", { method: "POST" }, () => ({ ok: true }));
  } catch {
    await requestJson<{ ok?: boolean }>("/api/data-status/turbo/clear", { method: "POST" }, () => ({ ok: true }));
  }
}

export async function listFiles(params: Record<string, unknown>): Promise<ListFilesResponse> {
  const query = buildQuery({
    ...params,
    service: normalizeDataQueryService(typeof params.service === "string" ? params.service : undefined),
  });
  return requestJson<ListFilesResponse>(`/api/data-status/list-files${query ? `?${query}` : ""}`, undefined, () => ({
    files: [],
    total: 0,
  }));
}

export async function getInstrumentsList(params: Record<string, unknown>): Promise<InstrumentSearchResponse> {
  const query = buildQuery({
    category: params.category,
    venue: params.venue,
    instrument_type: params.instrument_type,
    limit: params.limit ?? 500,
  });
  const payload = await requestJson<InstrumentSearchResponse | { instruments?: string[]; error?: string }>(
    `/api/data-status/instruments${query ? `?${query}` : ""}`,
    undefined,
    () => ({ instruments: [] }),
  );
  return normalizeInstrumentList(payload, params);
}

export async function getInstrumentAvailability(
  params: Record<string, unknown>,
): Promise<InstrumentAvailabilityResponse> {
  const query = buildQuery({
    venue: params.venue,
    instrument_type: params.instrument_type,
    instrument: params.instrument,
    start_date: params.start_date,
    end_date: params.end_date,
    data_type: params.data_type,
    available_from: params.available_from,
    available_to: params.available_to,
  });
  const payload = await requestJson<InstrumentAvailabilityResponse | RawInstrumentAvailabilityResponse>(
    `/api/data-status/instrument-availability${query ? `?${query}` : ""}`,
    undefined,
    () => ({
      venue: String(params.venue ?? ""),
      instrument_type: String(params.instrument_type ?? ""),
      instrument: String(params.instrument ?? ""),
    }),
  );
  return normalizeInstrumentAvailability(payload);
}

export async function getServiceCategories(service: string): Promise<{ categories: string[] }> {
  return requestJson<{ categories: string[] }>(
    `/api/capabilities/service-categories/${encodeURIComponent(service)}`,
    undefined,
    () => ({ categories: ["CEFI", "DEFI", "TRADFI"] }),
  );
}

export async function getVenueFilters(
  params: Record<string, string>,
): Promise<{ folders: string[]; data_types: string[] }> {
  const effectiveService = normalizeDataQueryService(params.service);
  const query = buildQuery({ ...params, service: effectiveService });
  return requestJson<{ folders: string[]; data_types: string[] }>(
    `/api/data-status/venue-filters${query ? `?${query}` : ""}`,
    undefined,
    () => ({ folders: [], data_types: [] }),
  );
}
