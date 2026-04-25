/**
 * Google Workflows Executions REST client.
 *
 * Used by /api/v1/users/:uid/{onboard,offboard,reprovision,issue-work-email}
 * to trigger long-running provisioning workflows. Uses Application Default
 * Credentials on Cloud Run + ADC locally (`gcloud auth application-default
 * login`). The Workflows REST API is documented at:
 *   https://cloud.google.com/workflows/docs/reference/executions/rest
 *
 * Required env (server-only):
 *   GOOGLE_WORKFLOW_PROJECT — GCP project id
 *   GOOGLE_WORKFLOW_LOCATION — e.g. europe-west4
 *
 * The workflow names themselves come from `WORKFLOW_NAMES` in
 * `@/lib/admin/server/collections` (already env-overridable).
 */
import "server-only";
import { GoogleAuth } from "google-auth-library";

let _auth: GoogleAuth | null = null;

function getAuth(): GoogleAuth {
  if (_auth) return _auth;
  _auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  return _auth;
}

export interface WorkflowsConfig {
  project: string;
  location: string;
}

export function getWorkflowsConfig(): WorkflowsConfig | null {
  const project = process.env.GOOGLE_WORKFLOW_PROJECT;
  if (!project) return null;
  const location = process.env.GOOGLE_WORKFLOW_LOCATION ?? "europe-west4";
  return { project, location };
}

export interface WorkflowExecution {
  name: string;
  state: "ACTIVE" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "STATE_UNSPECIFIED" | "DISABLED" | string;
  argument?: string;
  result?: string;
  error?: { context?: string; payload?: string };
  startTime?: string;
  endTime?: string;
}

/**
 * Trigger a Workflow execution.
 * Returns the freshly-created execution metadata (with `name`).
 */
export async function startWorkflowExecution(
  workflowName: string,
  argument: unknown,
): Promise<WorkflowExecution | null> {
  const cfg = getWorkflowsConfig();
  if (!cfg) return null;
  const auth = getAuth();
  const url =
    `https://workflowexecutions.googleapis.com/v1/projects/${cfg.project}` +
    `/locations/${cfg.location}/workflows/${workflowName}/executions`;
  const client = await auth.getClient();
  const res = await client.request<WorkflowExecution>({
    url,
    method: "POST",
    data: { argument: JSON.stringify(argument ?? {}) },
  });
  return res.data;
}

/** Read execution status by full execution name (`projects/.../executions/...`). */
export async function getWorkflowExecution(executionName: string): Promise<WorkflowExecution | null> {
  if (!executionName.startsWith("projects/")) return null;
  const auth = getAuth();
  const url = `https://workflowexecutions.googleapis.com/v1/${executionName}`;
  const client = await auth.getClient();
  const res = await client.request<WorkflowExecution>({ url, method: "GET" });
  return res.data;
}
