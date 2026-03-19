/**
 * Client for unified-trading-deployment-v2 Cloud Run API
 *
 * This client enables execution-services to trigger mass cloud deployments
 * and check data status through the centralized deployment orchestrator.
 */

// Deployment API base URL - Cloud Run service
const DEPLOYMENT_API_URL =
  import.meta.env.VITE_DEPLOYMENT_API_URL ||
  "https://deployment-dashboard-1060025368044.asia-northeast1.run.app";

// Types matching unified-trading-deployment-v2 API
export interface DeployRequest {
  service: "execution-services";
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  cloud_config_path: string; // gs://bucket/path/to/configs/
  compute?: "cloud_run" | "vm";
  machine_type?: string;
  force?: boolean; // true = overwrite existing results (equivalent to --force)
  deploy_missing_only?: boolean; // true = deploy only missing config×date shards
  dry_run?: boolean; // must be false for real deployment
  filter_categories?: string[];
}

export interface ShardInfo {
  shard_id: string;
  dimensions: Record<string, string>;
  cli_args: string[];
  status?: "pending" | "running" | "completed" | "failed";
}

export interface DeploymentResponse {
  deployment_id: string;
  service: string;
  status: "pending" | "running" | "completed" | "failed" | "partial";
  total_shards: number;
  completed_shards: number;
  failed_shards: number;
  running_shards: number;
  pending_shards: number;
  shards: ShardInfo[];
  created_at: string;
  updated_at?: string;
  error?: string;
}

export interface DataStatusRequest {
  config_path: string; // gs://bucket/path/to/configs/
  start_date?: string;
  end_date?: string;
  include_dates_list?: boolean; // Include day breakdown per config
}

// Missing Shards types
export interface ExecutionMissingShard {
  config_gcs: string;
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

export interface ExecutionMissingShardsRequest {
  config_path: string;
  start_date: string;
  end_date: string;
  strategy?: string;
  mode?: string;
  timeframe?: string;
  algo?: string;
}

export interface ConfigStatusInfo {
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

export interface TimeframeStatus {
  timeframe: string;
  total: number;
  with_results: number;
  completion_pct: number;
  missing_configs: Array<{ config_file: string; algo_name: string }>;
  configs: ConfigStatusInfo[];
}

export interface ModeStatus {
  mode: string;
  total: number;
  with_results: number;
  completion_pct: number;
  timeframes: TimeframeStatus[];
}

export interface StrategyStatus {
  strategy: string;
  total: number;
  with_results: number;
  completion_pct: number;
  result_dates: string[];
  result_date_count: number;
  modes: ModeStatus[];
}

export interface BreakdownItem {
  total: number;
  with_results: number;
  missing_count: number;
  completion_pct: number;
  missing_samples: string[];
}

export interface DataStatusResponse {
  config_path: string;
  version: string;
  total_configs: number;
  configs_with_results: number;
  missing_count: number;
  completion_pct: number;
  strategy_count: number;
  strategies: StrategyStatus[];
  breakdown_by_mode: Record<string, BreakdownItem>;
  breakdown_by_timeframe: Record<string, BreakdownItem>;
  breakdown_by_algo: Record<string, BreakdownItem>;
  date_filter?: {
    start: string | null;
    end: string | null;
  };
  error?: string;
}

class DeploymentClient {
  private baseUrl: string;

  constructor(baseUrl: string = DEPLOYMENT_API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Create a new deployment (mass cloud deploy)
   */
  async createDeployment(request: DeployRequest): Promise<DeploymentResponse> {
    const response = await fetch(`${this.baseUrl}/api/deployments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get deployment status by ID
   */
  async getDeployment(deploymentId: string): Promise<DeploymentResponse> {
    const response = await fetch(
      `${this.baseUrl}/api/deployments/${deploymentId}`,
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get data status for execution-services configs
   * This checks which configs have existing results in GCS
   */
  async getDataStatus(request: DataStatusRequest): Promise<DataStatusResponse> {
    const params = new URLSearchParams({
      config_path: request.config_path,
    });

    if (request.start_date) {
      params.append("start_date", request.start_date);
    }
    if (request.end_date) {
      params.append("end_date", request.end_date);
    }
    if (request.include_dates_list) {
      params.append("include_dates_list", "true");
    }

    const response = await fetch(
      `${this.baseUrl}/api/service-status/execution-services/data-status?${params}`,
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get missing shards for execution-services
   * Returns config×date combinations that need to be deployed
   */
  async getExecutionMissingShards(
    request: ExecutionMissingShardsRequest,
  ): Promise<ExecutionMissingShardsResponse> {
    const params = new URLSearchParams({
      config_path: request.config_path,
      start_date: request.start_date,
      end_date: request.end_date,
    });

    if (request.strategy) {
      params.append("strategy", request.strategy);
    }
    if (request.mode) {
      params.append("mode", request.mode);
    }
    if (request.timeframe) {
      params.append("timeframe", request.timeframe);
    }
    if (request.algo) {
      params.append("algo", request.algo);
    }

    const response = await fetch(
      `${this.baseUrl}/api/service-status/execution-services/missing-shards?${params}`,
      { method: "POST" },
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * List available config directories for execution-services
   */
  async listConfigDirectories(parentPath: string): Promise<string[]> {
    const params = new URLSearchParams({
      path: parentPath,
    });

    const response = await fetch(
      `${this.baseUrl}/api/services/execution-services/list-directories?${params}`,
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.directories || [];
  }

  /**
   * Discover configs in a GCS path
   */
  async discoverConfigs(
    path: string,
  ): Promise<{ count: number; configs: string[] }> {
    const params = new URLSearchParams({
      cloud_config_path: path,
    });

    const response = await fetch(
      `${this.baseUrl}/api/services/execution-services/discover-configs?${params}`,
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get default config buckets for execution-services
   */
  async getConfigBuckets(): Promise<{
    default_bucket: string;
    buckets: Array<{ name: string; path: string }>;
  }> {
    const response = await fetch(
      `${this.baseUrl}/api/services/execution-services/config-buckets`,
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<{ status: string; version: string }> {
    const response = await fetch(`${this.baseUrl}/api/health`);

    if (!response.ok) {
      throw new Error(`Deployment API unhealthy: HTTP ${response.status}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const deploymentClient = new DeploymentClient();

// Export class for custom instances
export { DeploymentClient };
