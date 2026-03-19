import type {
  ServiceStatus,
  DeployParams,
  DeployJob,
} from "../types/deploymentTypes";

export interface BuildEntry {
  tag: string;
  display: string;
  version: string;
  branch: string;
  is_v1: boolean;
}

export type BuildEnvironment = "dev" | "staging" | "prod";

const DEPLOYMENT_API = import.meta.env.VITE_DEPLOYMENT_API_URL ?? "";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown error");
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchServices(): Promise<ServiceStatus[]> {
  const response = await fetch(`${DEPLOYMENT_API}/api/v1/services`);
  return handleResponse<ServiceStatus[]>(response);
}

export async function triggerDeploy(params: DeployParams): Promise<DeployJob> {
  const response = await fetch(`${DEPLOYMENT_API}/api/v1/deployments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return handleResponse<DeployJob>(response);
}

export async function fetchDeploymentHistory(
  serviceId?: string,
): Promise<DeployJob[]> {
  const query = serviceId ? `?service_id=${serviceId}` : "";
  const response = await fetch(`${DEPLOYMENT_API}/api/v1/deployments${query}`);
  return handleResponse<DeployJob[]>(response);
}

export async function rollbackDeployment(jobId: string): Promise<DeployJob> {
  const response = await fetch(
    `${DEPLOYMENT_API}/api/v1/deployments/${jobId}/rollback`,
    {
      method: "POST",
    },
  );
  return handleResponse<DeployJob>(response);
}

export async function fetchBuilds(
  service: string,
  env: BuildEnvironment,
): Promise<BuildEntry[]> {
  const response = await fetch(
    `${DEPLOYMENT_API}/api/builds/${encodeURIComponent(service)}?env=${env}`,
  );
  return handleResponse<BuildEntry[]>(response);
}

export async function deployBuild(
  service: string,
  imageTag: string,
  environment: BuildEnvironment,
): Promise<{
  status: string;
  service: string;
  image_tag: string;
  environment: string;
}> {
  const response = await fetch(
    `${DEPLOYMENT_API}/api/deployments/${encodeURIComponent(service)}/deploy`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_tag: imageTag, environment }),
    },
  );
  return handleResponse<{
    status: string;
    service: string;
    image_tag: string;
    environment: string;
  }>(response);
}
