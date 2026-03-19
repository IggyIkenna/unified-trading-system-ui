export type ServiceHealth = "HEALTHY" | "DEGRADED" | "UNHEALTHY" | "UNKNOWN";
export type DeployJobStatus =
  | "QUEUED"
  | "RUNNING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED";

export interface ServiceStatus {
  service_id: string;
  name: string;
  environment: string;
  current_version: string;
  health: ServiceHealth;
  last_deployed_at: string;
  replicas_ready: number;
  replicas_total: number;
}

export interface DeployParams {
  service_id: string;
  version: string;
  environment: string;
  reason?: string;
}

export interface DeployJob {
  job_id: string;
  service_id: string;
  service_name: string;
  version: string;
  environment: string;
  status: DeployJobStatus;
  triggered_at: string;
  completed_at: string | null;
  logs_url: string | null;
  triggered_by: string;
}
