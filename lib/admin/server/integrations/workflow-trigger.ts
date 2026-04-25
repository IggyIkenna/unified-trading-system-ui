/**
 * Shared workflow-trigger helper used by /api/v1/users/* mutation routes
 * (onboard / offboard / reprovision). Wraps the Google Workflows REST
 * client + falls back to the legacy "DISABLED" stub shape when the
 * Workflows config isn't available.
 *
 * Each call writes a workflow_runs record so the admin
 * /api/v1/users/:uid/workflows page can render history regardless of
 * whether Workflows is wired or not.
 */
import "server-only";

import { logWorkflowRun, safeStartWorkflowExecutionStub } from "@/lib/admin/server/collections";
import { startWorkflowExecution, type WorkflowExecution } from "./workflows-client";

export interface TriggerOutcome {
  execution_name: string;
  state: string;
  error: string | null;
  outcome: "applied" | "skipped" | "failed";
}

export async function triggerWorkflow(
  workflowName: string,
  runType: string,
  firebaseUid: string,
  argument: Record<string, unknown>,
): Promise<TriggerOutcome> {
  let outcome: "applied" | "skipped" | "failed" = "skipped";
  let execution: WorkflowExecution | null = null;
  let error: string | null = null;
  try {
    execution = await startWorkflowExecution(workflowName, argument);
    outcome = execution ? "applied" : "skipped";
  } catch (err) {
    outcome = "failed";
    error = String(err);
  }
  if (!execution) {
    const stub = safeStartWorkflowExecutionStub(workflowName, argument);
    execution = { name: stub.name, state: stub.state, argument: stub.argument };
  }
  await logWorkflowRun({
    firebase_uid: firebaseUid,
    run_type: runType,
    workflow_name: workflowName,
    execution_name: execution.name,
    status: execution.state,
    input: argument,
    outcome,
    error,
  });
  return {
    execution_name: execution.name,
    state: execution.state,
    error,
    outcome,
  };
}
