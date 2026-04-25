// Service types
export interface Service {
  name: string;
  description: string;
  dimensions: string[];
  docker_image: string;
  cloud_run_job_name: string;
}

export interface ServiceDimension {
  name: string;
  type:
  | "fixed"
  | "hierarchical"
  | "date_range"
  | "gcs_dynamic"
  | "monthly_rolling";
  description: string;
  values?: string[];
  values_by_parent?: Record<string, string[]>;
  parent?: string;
  granularity?: "daily" | "weekly";
}

export interface ServiceDimensionsResponse {
  service: string;
  dimensions: ServiceDimension[];
  cli_args: Record<string, string | null>;
}

// Venue types
export interface VenueCategory {
  description: string;
  venues: string[];
  data_types: string[];
  venue_to_tardis?: Record<string, string | string[]>;
  venue_to_databento?: Record<string, string>;
  venue_to_provider?: Record<string, string>;
}

export interface VenuesResponse {
  categories: Record<string, VenueCategory>;
}

export interface CategoryVenuesResponse {
  category: string;
  venues: string[];
  data_types: string[];
}

// Start dates
export interface CategoryStartDates {
  category_start: string;
  venues?: Record<string, string>;
  data_type_start_dates?: Record<string, Record<string, string | null>>;
}

export interface StartDatesResponse {
  service: string;
  start_dates: Record<string, CategoryStartDates>;
}

// Dependencies
export interface UpstreamDependency {
  service: string;
  required: boolean;
  description: string;
  check: {
    bucket_template: string;
    path_template: string;
  };
}

export interface ServiceOutput {
  name: string;
  bucket_template: string;
  path_template: string;
  required_dimensions: string[];
}

export interface DagEdge {
  from: string;
  to: string;
  required: boolean;
}

export interface DagData {
  nodes: string[];
  edges: DagEdge[];
  execution_order: string[];
}

export interface DependenciesResponse {
  service: string;
  description: string;
  upstream: UpstreamDependency[];
  outputs: ServiceOutput[];
  external_dependencies: string[];
  downstream_dependents: string[];
  dag?: DagData;
}

// Deployment types
export type DeploymentStatus =
  | "pending"
  | "running"
  | "completed"
  | "completed_pending_delete"
  | "completed_with_errors"
  | "completed_with_warnings"
  | "clean"
  | "failed"
  | "cancelled"
  | "partial";

export interface Deployment {
  id: string;
  service: string;
  status: DeploymentStatus;
  created_at: string;
  updated_at: string;
  total_shards: number;
  completed_shards: number;
  failed_shards: number;
  parameters: DeploymentRequest;
}

export interface DeploymentLogAnalysisEntry {
  shard_id: string;
  message: string;
  timestamp?: string;
  severity: string;
}

export interface DeploymentLogAnalysis {
  errors: DeploymentLogAnalysisEntry[];
  warnings: DeploymentLogAnalysisEntry[];
  error_count: number;
  warning_count: number;
  has_stack_traces: boolean;
}

export interface DeploymentRetryStats {
  total_retries: number;
  succeeded_after_retry: number;
  failed_after_retry: number;
}

export interface DeploymentShardDetail {
  shard_id: string;
  status: string;
  job_id?: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  dimensions?: Record<string, unknown>;
  retries?: number;
}

// Response from GET /api/deployments/{deployment_id}
export interface DeploymentStatusResponse {
  deployment_id: string;
  service: string;
  status: string;
  status_detail?: string;
  compute_type: string;
  created_at?: string;

  total_shards: number;
  completed_shards: number;
  failed_shards: number;
  running_shards: number;
  pending_shards: number;
  progress_percentage: number;
  shard_counts: Record<string, number>;

  // Completed breakdown (nullable until verification runs)
  completed_with_verification?: number | null;
  completed_with_warnings?: number | null;
  completed_with_errors?: number | null;
  completed?: number | null;

  shards?: DeploymentShardDetail[];
  shards_by_category?: Record<string, DeploymentShardDetail[]>;

  region?: string;
  zone?: string;
  tag?: string | null;

  docker_image?: string;
  image_tag?: string;
  image_digest?: string;
  image_short_digest?: string;
  image_all_tags?: string[];

  error_message?: string;
  log_analysis?: DeploymentLogAnalysis | null;
  retry_stats?: DeploymentRetryStats;
}

// Response from POST /api/deployments (create deployment)
export interface ShardPreviewInfo {
  shard_id: string;
  dimensions: Record<string, string | number>;
  cli_args: string[];
}

// Grouped shards for display
export interface GroupedShards {
  [category: string]: {
    [date: string]: ShardPreviewInfo[];
  };
}

export interface CreateDeploymentResponse {
  dry_run: boolean;
  service: string;
  total_shards: number;
  message: string;
  cli_command: string;
  // Dry run only
  shards?: ShardPreviewInfo[];
  shards_truncated?: boolean;
  summary?: Record<string, unknown>;
  // Live deployment only
  deployment_id?: string;
  status?: string;
  compute_mode?: string;
  started_at?: string;
}

export interface DeploymentRequest {
  service: string;
  mode?: "batch" | "live";
  compute?: "cloud_run" | "vm";
  start_date?: string; // Optional for 'none' granularity (defaults to 2020-01-01)
  end_date?: string; // Optional for 'none' granularity (defaults to yesterday)
  category?: string[];
  venue?: string[];
  folder?: string[]; // Filter by folder/instrument type (spot, perpetuals, etc.)
  data_type?: string[]; // Filter by data type (trades, book_snapshot_5, etc.)
  feature_group?: string[];
  timeframe?: string[];
  instrument?: string[];
  target_type?: string[];
  domain?: string;
  force?: boolean;
  dry_run?: boolean;
  skip_existing?: boolean; // Skip shards where data already exists in cloud storage (for deploy missing)
  log_level?: "DEBUG" | "INFO" | "WARNING" | "ERROR";
  max_workers?: number; // Max workers inside the container
  max_threads?: number; // Max parallel API calls for launching shards
  region?: string; // Cloud region for compute (GCP Cloud Run / VM or AWS)
  vm_zone?: string; // Zone for VM deployments (derived from region)
  extra_args?: string; // Additional CLI args to pass to service
  cloud_config_path?: string; // Cloud storage path for dynamic config discovery (gs://... or s3://...)
  cloud_provider?: "gcp" | "aws"; // Inferred from path or from API CLOUD_PROVIDER
  tag?: string; // Human-readable deployment description
  skip_venue_sharding?: boolean; // Skip venue as sharding dimension - process all venues per job
  skip_feature_group_sharding?: boolean; // Skip feature_group as sharding dimension
  date_granularity?: "daily" | "weekly" | "monthly" | "none"; // Override date granularity (runtime override)
  max_concurrent?: number; // Max simultaneously running jobs/VMs (rolling concurrency, default 2000, max 2500)
  exclude_dates?: Record<string, string[] | Record<string, string[]>>; // Dates to exclude: category-level {cat: [dates]} or venue-level {cat: {venue: [dates]}}
  include_all_shards?: boolean; // Include all shards in dry run response (not just first 50)
  deploy_missing_only?: boolean; // Use backend to calculate missing shards (more accurate than exclude_dates)
  first_day_of_month_only?: boolean; // Only deploy first day of each month (TARDIS free tier)
  // Live mode fields
  image_tag?: string; // Docker image tag for live mode deployments
  traffic_split_pct?: number; // Canary traffic split (0–100, default 10)
  health_gate_timeout_s?: number; // Health poll timeout before rollback (default 300)
  rollback_on_fail?: boolean; // Auto-rollback if health gate fails (default true)
}

// Cloud config discovery response
export interface DiscoverConfigsResponse {
  service: string;
  cloud_path: string;
  total_configs: number;
  sample: string[];
  truncated: boolean;
}

// Region config (from GET /api/config/region)
export interface RegionConfigResponse {
  gcs_region?: string;
  storage_region?: string; // Cloud-agnostic alias (same as gcs_region for GCP)
  cloud_provider?: "gcp" | "aws";
  zones?: string[];
  enforce_single_region?: boolean;
}

// Health
export interface HealthResponse {
  status: string;
  version: string;
  config_dir: string;
  cloud_provider?: string;
  mock_mode?: boolean;
  gcs_fuse?: { active: boolean; env?: string; reason?: string };
}

// Checklist types
export interface ChecklistItem {
  id: string;
  description: string;
  status: "done" | "partial" | "pending" | "n/a";
  notes: string;
  verified_date: string | null;
  blocking: boolean;
}

export interface ChecklistCategory {
  name: string;
  display_name: string;
  percent: number;
  total_items: number;
  completed_items: number;
  items: ChecklistItem[];
}

export interface ChecklistResponse {
  service: string;
  last_updated: string;
  readiness_percent: number;
  total_items: number;
  completed_items: number;
  partial_items: number;
  pending_items: number;
  not_applicable_items: number;
  categories: ChecklistCategory[];
  blocking_items: Array<{
    id: string;
    description: string;
    category: string;
    notes: string;
  }>;
}

export interface ChecklistValidateResponse {
  service: string;
  ready: boolean;
  readiness_percent: number;
  total_items: number;
  completed_items: number;
  blocking_items: Array<{
    id: string;
    description: string;
    category: string;
    notes: string;
  }>;
  warnings: string[];
  can_proceed_with_acknowledgment: boolean;
}

export interface ChecklistSummary {
  service: string;
  readiness_percent: number;
  total_items: number;
  completed_items: number;
  pending_items: number;
  blocking_count: number;
  last_updated: string;
  error?: string;
}

// Data Status types
export interface VenueStatus {
  completion_percent: number;
  complete: number;
  total: number;
  excluded: number;
  missing_dates: string[];
  oldest_update: string | null;
  newest_update: string | null;
}

// Data type completion status
export interface DataTypeStatus {
  dates_found: number;
  dates_expected: number;
  completion_pct: number;
  status?: "complete" | "partial" | "missing";
}

// Turbo mode venue status with venue-specific expected dates
export interface TurboVenueStatus {
  dates_found: number;
  dates_expected_venue: number; // venue-specific expected based on venue start date
  dates_expected_category: number; // category-level expected for reference
  venue_start_date: string | null; // when venue data starts
  completion_pct: number;
  is_expected: boolean;
  status: "expected" | "bonus";
  data_types?: Record<string, DataTypeStatus>; // per-data-type breakdown
}

export interface CategoryStatus {
  expected_start: string | null;
  excluded_days: number;
  venues: Record<string, VenueStatus>;
}

export interface DataStatusResponse {
  service: string;
  start_date: string;
  end_date: string;
  overall_completion: number;
  overall_complete: number;
  overall_total: number;
  overall_excluded: number;
  categories: Record<string, CategoryStatus>;
}

export interface MissingShard {
  category: string;
  venue: string;
  missing_count: number;
  completion_percent: number;
}

export interface MissingShardsResponse {
  service: string;
  start_date: string;
  end_date: string;
  overall_completion: number;
  missing_shards: MissingShard[];
  total_missing: number;
}

// Service Status (Temporal Audit Trail)
export interface ServiceStatusAnomaly {
  type: string;
  severity: "info" | "warning" | "error";
  message: string;
}

export interface ServiceStatusDataDetail {
  by_category?: Record<string, { timestamp?: string }>;
  [key: string]: unknown;
}

export interface ServiceStatusDeploymentDetail {
  deployment_id?: string;
  status?: string;
  compute_type?: string;
  used_force?: boolean;
  tag?: string | null;
  total_shards?: number;
  completed_shards?: number;
  failed_shards?: number;
  [key: string]: unknown;
}

export interface ServiceStatusBuildDetail {
  error?: string;
  status?: string;
  commit_sha?: string;
  duration_seconds?: number;
  [key: string]: unknown;
}

export interface ServiceStatusCodeDetail {
  error?: string;
  commit_sha?: string;
  message?: string;
  author?: string;
  [key: string]: unknown;
}

export interface ServiceStatusChecklistStatus {
  percent: number;
  completed: number;
  total: number;
}

export interface ServiceStatusDataCoverage {
  percent: number;
  gaps: number;
}

export interface ServiceStatus {
  service: string;
  health: "healthy" | "warning" | "error" | "build_failed";
  last_data_update: string | null;
  last_deployment: string | null;
  last_build: string | null;
  last_code_push: string | null;
  anomalies: ServiceStatusAnomaly[];
  api?: {
    gcs_fuse?: { active: boolean; reason?: string };
  };
  details?: {
    data?: ServiceStatusDataDetail;
    deployment?: ServiceStatusDeploymentDetail;
    build?: ServiceStatusBuildDetail;
    code?: ServiceStatusCodeDetail;
  };
  checklist_status?: ServiceStatusChecklistStatus;
  data_coverage?: ServiceStatusDataCoverage;
}

export interface ServicesOverview {
  services: Array<{
    service: string;
    health: string;
    last_data_update: string | null;
    last_deployment: string | null;
    last_build: string | null;
    anomaly_count: number;
  }>;
  count: number;
  healthy: number;
  warnings: number;
  errors: number;
}

// ── VM Event lifecycle types ──────────────────────────────────────────────────

/** Mirrors deployment-service VMEventType StrEnum. */
export type VMEventType =
  // VM infrastructure events
  | "VM_PREEMPTED"
  | "VM_DELETED"
  | "VM_QUOTA_EXHAUSTED"
  | "VM_ZONE_UNAVAILABLE"
  | "VM_TIMEOUT"
  | "CONTAINER_OOM"
  // Cloud Run events
  | "CLOUD_RUN_REVISION_FAILED"
  // Job lifecycle events
  | "JOB_RETRY"
  | "JOB_STARTED"
  | "JOB_COMPLETED"
  | "JOB_FAILED"
  | "JOB_CANCELLED"
  // Live deployment events
  | "LIVE_HEALTH_CHECK_PASSED"
  | "LIVE_HEALTH_CHECK_FAILED"
  | "LIVE_ROLLBACK_EXECUTED";

/** VM event types subset — displayed as coloured badges in DeploymentDetails. */
export const VM_EVENT_TYPES: ReadonlySet<VMEventType> = new Set<VMEventType>([
  "VM_PREEMPTED",
  "VM_DELETED",
  "VM_QUOTA_EXHAUSTED",
  "VM_ZONE_UNAVAILABLE",
  "VM_TIMEOUT",
  "CONTAINER_OOM",
  "CLOUD_RUN_REVISION_FAILED",
]);

export interface ShardEvent {
  deployment_id: string;
  shard_id: string;
  event_type: VMEventType;
  message: string;
  timestamp: string; // ISO-8601
  metadata: Record<string, string>;
}

export interface DeploymentEventStream {
  deployment_id: string;
  events: ShardEvent[];
  count: number;
}

// ── Live deployment types ─────────────────────────────────────────────────────

export interface LiveDeploymentRequest {
  service: string;
  image_tag: string;
  traffic_split_pct?: number; // 0–100, default 10
  health_gate_timeout_s?: number; // default 300
  rollback_on_fail?: boolean; // default true
  region?: string;
  dry_run?: boolean;
}

export type LiveDeploymentStatus =
  | "dry_run"
  | "started"
  | "healthy"
  | "failed"
  | "rolled_back";

export interface RollbackRequest {
  service: string;
  region: string;
  target_revision?: string;
}

export interface RollbackResponse {
  deployment_id: string;
  service: string;
  image_tag: string;
  status: LiveDeploymentStatus;
  events: ShardEvent[];
  error?: string | null;
}

export interface LiveHealthStatus {
  deployment_id: string;
  service: string;
  healthy: boolean;
  checked_at: string; // ISO-8601
  status_code?: number;
}

// Epic readiness types
export interface EpicBranchStatus {
  reached: boolean;
  qg_passed: boolean;
  quickmerged: boolean;
}

export interface EpicAssetClassData {
  historical_available: boolean;
  live_available: boolean;
  mock_available: boolean;
  testnet_available: boolean;
  historical_start_date: string | null;
}

export interface EpicRepoStatus {
  repo: string;
  arch_tier: string | null;
  asset_group: string;
  cr_current: string | null;
  cr_required: string;
  br_current: string | null;
  br_required: string;
  main_quickmerged: boolean;
  branch_status?: Record<string, EpicBranchStatus>;
  data?: EpicAssetClassData;
  feature_groups?: string[];
  ml_models?: string[];
  venue_deps?: string[];
  blocking_reason?: string;
}

export interface EpicOptionalRepo {
  repo: string;
  asset_group: string;
  note: string;
  yaml_present: boolean;
}

export interface EpicSummary {
  epic_id: string;
  display_name: string;
  mvp_priority: number;
  epic_pct: number;
  total_required: number;
  completed: number;
  epic_complete: boolean;
  blocking_count: number;
  business_requirement_minimum: string;
}

export interface EpicDetail {
  epic_id: string;
  display_name: string;
  mvp_priority: number;
  business_requirement_minimum: string;
  epic_pct: number;
  total_required: number;
  completed: number;
  epic_complete: boolean;
  completion_criteria: Record<string, string>;
  blocking_repos: EpicRepoStatus[];
  completed_repos: string[];
  optional_repos_status: EpicOptionalRepo[];
}
