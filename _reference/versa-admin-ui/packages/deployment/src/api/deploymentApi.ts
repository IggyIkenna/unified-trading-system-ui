import type {
  ServiceStatus,
  DeployParams,
  DeployJob,
} from "../types/deploymentTypes";

const DEPLOYMENT_API =
  import.meta.env.VITE_DEPLOYMENT_API_URL ?? "http://localhost:8004";

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
