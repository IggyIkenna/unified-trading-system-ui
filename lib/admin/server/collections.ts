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
