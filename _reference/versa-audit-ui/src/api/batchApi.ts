import { createApiClient, createClientConfig } from "@unified-admin/core";

const BATCH_API_URL =
  import.meta.env.VITE_BATCH_API_URL ?? "http://localhost:8080";

const client = createApiClient(createClientConfig(BATCH_API_URL));

export interface BatchJob {
  id: string;
  name: string;
  service: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  shardsTotal: number;
  shardsCompleted: number;
  shardsFailed: number;
  category: string;
  date?: string;
  error?: string | null;
}

export interface JobsResponse {
  jobs: BatchJob[];
  total: number;
}

export interface HealthResponse {
  status: string;
  mock?: boolean;
}

export async function fetchHealth(): Promise<HealthResponse> {
  return client.get<HealthResponse>("/health");
}

export async function fetchJobs(): Promise<JobsResponse> {
  return client.get<JobsResponse>("/batch/jobs");
}

export async function fetchJob(id: string): Promise<{ job: BatchJob }> {
  return client.get<{ job: BatchJob }>(`/batch/jobs/${id}`);
}
