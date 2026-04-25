/**
 * Server-only Firestore collection helpers — Admin SDK side.
 *
 * Mirrors the collection layout that user-management-api exposed: same
 * collection names so existing Firestore data carries over verbatim.
 * The portal's native /api/v1/* routes are the only callers of these
 * helpers; client code never touches Admin SDK directly.
 */
import "server-only";
import type { CollectionReference, Firestore } from "firebase-admin/firestore";

import { getAdminFirestore } from "@/lib/firebase-admin";

function db(): Firestore {
  const f = getAdminFirestore();
  if (!f) {
    throw new Error(
      "Firebase Admin SDK unavailable — set NEXT_PUBLIC_FIREBASE_PROJECT_ID and run with ADC, or set FIREBASE_ADMIN_CREDENTIAL.",
    );
  }
  return f;
}

export const COLLECTIONS = {
  users: "user_profiles",
  templates: "access_templates",
  workflows: "workflow_runs",
  healthChecks: "health_check_runs",
  applications: "applications",
  appSyncHistory: "app_sync_history",
  appEntitlements: "app_entitlements",
  groups: "user_groups",
  auditLog: "audit_log",
  appCapabilities: "app_capabilities",
  onboardingRequests: "onboarding_requests",
  userDocuments: "user_documents",
  notificationPreferences: "notification_preferences",
  githubRepos: "github_repos",
  githubAssignments: "github_repo_assignments",
} as const;

export function usersCollection(): CollectionReference {
  return db().collection(COLLECTIONS.users);
}
export function templatesCollection(): CollectionReference {
  return db().collection(COLLECTIONS.templates);
}
export function workflowsCollection(): CollectionReference {
  return db().collection(COLLECTIONS.workflows);
}
export function healthChecksCollection(): CollectionReference {
  return db().collection(COLLECTIONS.healthChecks);
}
export function applicationsCollection(): CollectionReference {
  return db().collection(COLLECTIONS.applications);
}
export function appSyncHistoryCollection(): CollectionReference {
  return db().collection(COLLECTIONS.appSyncHistory);
}
export function appEntitlementsCollection(): CollectionReference {
  return db().collection(COLLECTIONS.appEntitlements);
}
export function groupsCollection(): CollectionReference {
  return db().collection(COLLECTIONS.groups);
}
export function auditLogCollection(): CollectionReference {
  return db().collection(COLLECTIONS.auditLog);
}
export function appCapabilitiesCollection(): CollectionReference {
  return db().collection(COLLECTIONS.appCapabilities);
}
export function onboardingRequestsCollection(): CollectionReference {
  return db().collection(COLLECTIONS.onboardingRequests);
}
export function userDocumentsCollection(): CollectionReference {
  return db().collection(COLLECTIONS.userDocuments);
}
export function notificationPreferencesCollection(): CollectionReference {
  return db().collection(COLLECTIONS.notificationPreferences);
}
export function githubReposCollection(): CollectionReference {
  return db().collection(COLLECTIONS.githubRepos);
}
export function githubAssignmentsCollection(): CollectionReference {
  return db().collection(COLLECTIONS.githubAssignments);
}

export async function writeAuditEntry(entry: Record<string, unknown>): Promise<void> {
  const now = new Date().toISOString();
  await auditLogCollection().add({ ...entry, timestamp: now });
}

/** Append a workflow_runs record. Mirrors the legacy logWorkflowRun shape. */
export async function logWorkflowRun(run: Record<string, unknown>): Promise<void> {
  const now = new Date().toISOString();
  await workflowsCollection().add({ ...run, created_at: now, updated_at: now });
}

/**
 * STUB workflow-execution start — used for onboard/modify/offboard/reprovision.
 * Phase 4 will swap in the real Google Workflows API call. For now we just
 * generate a synthetic execution name so admin pages render fine.
 *
 * TODO Phase 4: wire google-auth-library + Workflows REST endpoint.
 */
export function safeStartWorkflowExecutionStub(workflowName: string, _argument: unknown): {
  name: string;
  state: string;
  argument?: string;
  error?: string;
} {
  return {
    name: `disabled/${workflowName}/${Date.now()}`,
    state: "DISABLED",
    argument: JSON.stringify(_argument ?? null),
  };
}

/** Workflow-name registry mirroring legacy WORKFLOW_NAMES env defaults. */
export const WORKFLOW_NAMES = {
  onboard: process.env.GOOGLE_WORKFLOW_ONBOARD ?? "um-onboard-user",
  modify: process.env.GOOGLE_WORKFLOW_MODIFY ?? "um-modify-user",
  offboard: process.env.GOOGLE_WORKFLOW_OFFBOARD ?? "um-offboard-user",
  reprovision: process.env.GOOGLE_WORKFLOW_REPROVISION ?? "um-reprovision-user",
  quota: process.env.GOOGLE_WORKFLOW_QUOTA ?? "um-quota-check",
} as const;

/** Resolve an access template by id; returns null if missing. */
export async function getAccessTemplateById(
  templateId: string | null | undefined,
): Promise<Record<string, unknown> | null> {
  if (!templateId) return null;
  const doc = await templatesCollection().doc(templateId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as Record<string, unknown>) };
}

/** Counts of users assigned to each access template (for list page). */
export async function listTemplateAssignmentCounts(): Promise<Record<string, number>> {
  const snap = await usersCollection().get();
  const counts: Record<string, number> = {};
  for (const docSnap of snap.docs) {
    const data = docSnap.data() as { access_template_id?: string } | undefined;
    const tid = data?.access_template_id;
    if (!tid) continue;
    counts[tid] = (counts[tid] ?? 0) + 1;
  }
  return counts;
}

/**
 * Validate access-template payload. Returns array of errors (empty = valid).
 * Mirrors validateAccessTemplatePayload from the legacy server.
 */
export function validateAccessTemplatePayload(
  payload: Record<string, unknown> | undefined,
  isPartial: boolean,
): string[] {
  const errors: string[] = [];
  const has = (k: string) => Object.prototype.hasOwnProperty.call(payload ?? {}, k);
  if (!isPartial || has("name")) {
    const name = (payload?.["name"] as string | undefined) ?? "";
    if (!name.trim()) errors.push("name is required.");
  }
  if (has("slack_channels")) {
    const arr = payload?.["slack_channels"];
    if (!Array.isArray(arr)) errors.push("slack_channels must be an array.");
    else
      for (const c of arr) if (!/^[CGD][A-Z0-9]{8,}$/.test(String(c))) errors.push(`Invalid Slack channel ID: ${String(c)}`);
  }
  if (has("github_teams")) {
    const arr = payload?.["github_teams"];
    if (!Array.isArray(arr)) errors.push("github_teams must be an array.");
    else
      for (const s of arr) if (!/^[a-z0-9][a-z0-9_-]*$/.test(String(s))) errors.push(`Invalid GitHub team slug: ${String(s)}`);
  }
  if (has("aws_permission_sets")) {
    const arr = payload?.["aws_permission_sets"];
    if (!Array.isArray(arr)) errors.push("aws_permission_sets must be an array.");
    else
      for (const v of arr)
        if (!/^[A-Za-z0-9:_./-]+$/.test(String(v))) errors.push(`Invalid AWS permission set value: ${String(v)}`);
  }
  return errors;
}

/**
 * Compute seat-quota check (slack + microsoft365) using current
 * listUsersWithProfiles snapshot. Used by the onboarding form to surface
 * "QUOTA_EXCEEDED" before creating the Firebase user.
 */
export async function computeQuotaCheck(role: string): Promise<{
  ok: boolean;
  checks: { service: string; used: number; limit: number; available: number }[];
  message?: string;
}> {
  const { listUsersWithProfiles } = await import("./users-list");
  const users = await listUsersWithProfiles();
  const active = users.filter((u) => u.status === "active");
  const slackUsed = active.filter((u) => u.services.slack === "provisioned").length;
  const m365Used = active.filter((u) => u.services.microsoft365 === "provisioned").length;
  const slackLimit = Number(process.env.SLACK_SEAT_LIMIT ?? 0);
  const m365Limit = Number(process.env.M365_LICENSE_LIMIT ?? 0);
  const checks = [
    { service: "slack", used: slackUsed, limit: slackLimit, available: Math.max(slackLimit - slackUsed, 0) },
    { service: "microsoft365", used: m365Used, limit: m365Limit, available: Math.max(m365Limit - m365Used, 0) },
  ];
  const slackOk = role === "shareholder" || slackLimit === 0 || (checks[0]?.available ?? 0) > 0;
  const needsM365 = role === "admin" || role === "accounting" || role === "operations" || role === "collaborator";
  const m365Ok = !needsM365 || m365Limit === 0 || (checks[1]?.available ?? 0) > 0;
  return {
    ok: slackOk && m365Ok,
    checks,
    message: slackOk && m365Ok ? undefined : "Provisioning blocked: required service quota is exhausted.",
  };
}

export type Role = "viewer" | "editor" | "admin" | "owner";
export const ROLE_RANK: Record<Role, number> = { viewer: 1, editor: 2, admin: 3, owner: 4 };

/**
 * Resolve effective capabilities for an (app_id, role) pair. Honours an
 * explicit per-entitlement capability list, otherwise reads role_presets
 * from app_capabilities/{app_id}; falls back to ["*"] for admin/owner so
 * locked-down apps still get a sensible default.
 */
export async function resolveCapabilities(
  appId: string,
  role: Role,
  explicitCapabilities: string[] | null | undefined,
): Promise<string[]> {
  if (explicitCapabilities && explicitCapabilities.length > 0) {
    return explicitCapabilities;
  }
  const capDoc = await appCapabilitiesCollection().doc(appId).get();
  if (!capDoc.exists) {
    if (role === "admin" || role === "owner") return ["*"];
    return [];
  }
  const data = capDoc.data() as { role_presets?: Record<string, string[]> } | undefined;
  const presets = data?.role_presets ?? {};
  return presets[role] ?? [];
}
