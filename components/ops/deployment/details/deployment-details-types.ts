export interface ExecutionAttempt {
  attempt: number;
  zone?: string;
  region?: string;
  started_at?: string;
  ended_at?: string;
  status: string;
  failure_reason?: string;
  failure_category?: string;
  job_id?: string;
}

export interface ShardDetail {
  shard_id: string;
  status: string;
  job_id?: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  dimensions?: Record<string, unknown>;
  retries?: number;
  args?: string[];
  execution_history?: ExecutionAttempt[];
  final_zone?: string;
  final_region?: string;
  zone_switches?: number;
  region_switches?: number;
  failure_category?: string;
}

export interface LogAnalysisEntry {
  shard_id: string;
  message: string;
  timestamp?: string;
  severity: string;
}

export interface LogAnalysis {
  errors: LogAnalysisEntry[];
  warnings: LogAnalysisEntry[];
  error_count: number;
  warning_count: number;
  has_stack_traces: boolean;
}

export interface DeploymentStatusData {
  deployment_id: string;
  service: string;
  status: string;
  status_detail?: string; // "clean" | "completed_with_warnings" | "completed_with_errors"
  compute_type: string;
  created_at?: string;
  updated_at?: string;
  total_shards: number;
  completed_shards: number;
  completed_with_verification?: number | null;
  completed_with_warnings?: number | null;
  completed_with_errors?: number | null;
  completed?: number | null;
  shard_classifications?: Record<string, string>;
  classification_counts?: Record<string, number>;
  failed_shards: number;
  running_shards: number;
  pending_shards: number;
  progress_percentage: number;
  shard_counts: Record<string, number>;
  has_force?: boolean;
  gcs_fuse_active?: boolean;
  gcs_fuse_reason?: string;
  shards?: ShardDetail[];
  shards_by_category?: Record<string, ShardDetail[]>;
  region?: string;
  zone?: string;
  tag?: string | null;
  docker_image?: string;
  image_tag?: string; // Tag from config (usually 'latest')
  image_digest?: string; // Full sha256 digest
  image_short_digest?: string; // First 12 chars of digest
  image_all_tags?: string[]; // All tags pointing to this digest
  error_message?: string;
  log_analysis?: LogAnalysis | null;
  deploy_mode?: "batch" | "live";
  service_url?: string;
  retry_stats?: {
    total_retries: number;
    succeeded_after_retry: number;
    failed_after_retry: number;
  };
}

export interface LogEntry {
  timestamp: string;
  severity: string;
  message: string;
  execution_name?: string;
  shard?: string;
  logger?: string;
}

// Classification filter keys (from the new shard outcome classification system)
// Defined at module level to avoid recreation on every render
export const CLASSIFICATION_FILTERS = [
  "VERIFIED",
  "EXPECTED_SKIP",
  "DATA_STALE",
  "DATA_MISSING",
  "UNVERIFIED",
  "COMPLETED_WITH_ERRORS",
  "COMPLETED_WITH_WARNINGS",
  "INFRA_FAILURE",
  "TIMEOUT_FAILURE",
  "CODE_FAILURE",
  "VM_DIED",
  "NEVER_RAN",
  "CANCELLED",
  "STILL_RUNNING",
] as const;
