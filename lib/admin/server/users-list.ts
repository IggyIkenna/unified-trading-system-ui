/**
 * Server-only helper that joins Firebase Auth users with their Firestore
 * `user_profiles` records and produces the merged shape the admin UI
 * expects. Mirrors `listUsersWithProfiles` from the legacy
 * user-management-api so admin pages keep rendering identical columns.
 */
import "server-only";
import type { UserRecord } from "firebase-admin/auth";

import { getAdminAuth } from "@/lib/firebase-admin";
import { usersCollection } from "./collections";
import { getDefaultServicesForUser, type ServiceState } from "./service-defaults";

export interface MergedUser {
  id: string;
  firebase_uid: string;
  name: string;
  email: string;
  role: string;
  github_handle?: string;
  microsoft_upn?: string;
  slack_handle?: string;
  gcp_email?: string;
  product_slugs: string[];
  access_template_id: string | null;
  access_template: Record<string, unknown> | null;
  service_messages: Record<string, string>;
  service_synced_at: Record<string, string>;
  workflow_failure_reason: string | null;
  status: "active" | "pending_approval" | "rejected" | "offboarded";
  provisioned_at: string | null;
  last_modified: string | null;
  services: {
    github: ServiceState | string;
    slack: ServiceState | string;
    microsoft365: ServiceState | string;
    gcp: ServiceState | string;
    aws: ServiceState | string;
    portal: ServiceState | string;
  };
}

interface ProfileShape {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  github_handle?: string;
  microsoft_upn?: string;
  slack_handle?: string;
  gcp_email?: string;
  product_slugs?: string[];
  access_template_id?: string | null;
  access_template?: Record<string, unknown> | null;
  service_messages?: Record<string, string>;
  service_synced_at?: Record<string, string>;
  workflow_failure_reason?: string | null;
  provisioned_at?: string | null;
  last_modified?: string | null;
  services?: Partial<MergedUser["services"]>;
}

function pickStatus(profileStatus: string | undefined, disabled: boolean): MergedUser["status"] {
  if (profileStatus === "pending_approval") return "pending_approval";
  if (profileStatus === "rejected") return "rejected";
  if (disabled) return "offboarded";
  return "active";
}

function normalize(observed: string | undefined, fallback: ServiceState): ServiceState | string {
  return observed ?? fallback;
}

function mergeOne(authUser: UserRecord, profile: ProfileShape): MergedUser {
  const role = profile.role ?? authUser.customClaims?.role ?? "client";
  const status = pickStatus(profile.status, !!authUser.disabled);
  const defaults = getDefaultServicesForUser(role, status);
  return {
    id: profile.id ?? authUser.uid,
    firebase_uid: authUser.uid,
    name: authUser.displayName ?? profile.name ?? authUser.email ?? authUser.uid,
    email: authUser.email ?? profile.email ?? "",
    role: role as string,
    github_handle: profile.github_handle,
    microsoft_upn: profile.microsoft_upn,
    slack_handle: profile.slack_handle,
    gcp_email: profile.gcp_email,
    product_slugs: profile.product_slugs ?? [],
    access_template_id: profile.access_template_id ?? null,
    access_template: profile.access_template ?? null,
    service_messages: profile.service_messages ?? {},
    service_synced_at: profile.service_synced_at ?? {},
    workflow_failure_reason: profile.workflow_failure_reason ?? null,
    status,
    provisioned_at: profile.provisioned_at ?? authUser.metadata.creationTime ?? null,
    last_modified: profile.last_modified ?? authUser.metadata.lastRefreshTime ?? null,
    services: {
      github: normalize(profile.services?.github as string | undefined, defaults.github),
      slack: normalize(profile.services?.slack as string | undefined, defaults.slack),
      microsoft365: normalize(profile.services?.microsoft365 as string | undefined, defaults.microsoft365),
      gcp: normalize(profile.services?.gcp as string | undefined, defaults.gcp),
      aws: normalize(profile.services?.aws as string | undefined, defaults.aws),
      portal: normalize(profile.services?.portal as string | undefined, defaults.portal),
    },
  };
}

export async function listUsersWithProfiles(): Promise<MergedUser[]> {
  const auth = getAdminAuth();
  if (!auth) throw new Error("Auth backend unavailable.");
  const [authList, profilesSnap] = await Promise.all([
    auth.listUsers(1000),
    usersCollection().get(),
  ]);
  const profileMap = new Map<string, ProfileShape>();
  for (const docSnap of profilesSnap.docs) {
    profileMap.set(docSnap.id, docSnap.data() as ProfileShape);
  }
  return authList.users.map((u) => mergeOne(u, profileMap.get(u.uid) ?? {}));
}

export async function resolveUserUid(inputId: string): Promise<string> {
  const direct = await usersCollection().doc(inputId).get();
  if (direct.exists) return inputId;
  const q = await usersCollection().where("id", "==", inputId).limit(1).get();
  if (!q.empty) return q.docs[0]!.id;
  return inputId;
}
