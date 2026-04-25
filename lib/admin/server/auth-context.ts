/**
 * Server-only auth context helpers for /api/v1/* admin routes.
 *
 * The client SDK attaches the user's Firebase ID token as `Authorization:
 * Bearer <jwt>`; the Admin SDK verifies it and the route reads role /
 * capabilities from Firestore. There's no separate session cookie — the
 * token IS the session, and it's short-lived (1h) so revocation is fast.
 */
import "server-only";
import type { NextRequest } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";

import { getAdminAuth } from "@/lib/firebase-admin";
import {
  appEntitlementsCollection,
  groupsCollection,
  resolveCapabilities,
  ROLE_RANK,
  type Role,
  usersCollection,
} from "./collections";

export interface VerifiedCaller {
  readonly uid: string;
  readonly email: string | null;
  readonly token: DecodedIdToken;
}

/**
 * Read the bearer token from the request, verify it via Admin SDK, return
 * the caller. Returns null on any failure — callers respond 401.
 */
export async function verifyCaller(req: NextRequest): Promise<VerifiedCaller | null> {
  const auth = getAdminAuth();
  if (!auth) return null;
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  try {
    const decoded = await auth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email ?? null, token: decoded };
  } catch {
    return null;
  }
}

export interface EffectiveAccess {
  readonly authorized: boolean;
  readonly role: Role | null;
  readonly capabilities: string[];
  readonly source: "direct" | "group" | "none";
  readonly environments: string[];
  readonly user_status: string;
}

/**
 * Compute effective access for (uid, app_id, env). Pure read against
 * user_groups + app_entitlements + app_capabilities + user_profiles —
 * exactly the algorithm the legacy /authorize used.
 */
export async function computeEffectiveAccess(
  uid: string,
  appId: string,
  env: string | null,
): Promise<EffectiveAccess> {
  const groupsSnap = await groupsCollection().get();
  const userGroupIds: string[] = [];
  for (const docSnap of groupsSnap.docs) {
    const data = docSnap.data() as { members?: { firebase_uid?: string }[]; group_id?: string };
    const isMember = (data.members ?? []).some((m) => m.firebase_uid === uid);
    if (isMember) userGroupIds.push(data.group_id ?? docSnap.id);
  }

  const entSnap = await appEntitlementsCollection().where("app_id", "==", appId).get();

  let bestRole: Role | null = null;
  let bestRank = 0;
  let bestSource: EffectiveAccess["source"] = "none";
  let bestCapabilities: string[] | null = null;
  let bestEnvironments: string[] = [];

  for (const docSnap of entSnap.docs) {
    const ent = docSnap.data() as {
      subject_type?: string;
      subject_id?: string;
      role?: string;
      environments?: string[];
      capabilities?: string[];
    };
    const isDirect = ent.subject_type === "user" && ent.subject_id === uid;
    const isGroup = ent.subject_type === "group" && !!ent.subject_id && userGroupIds.includes(ent.subject_id);
    if (!isDirect && !isGroup) continue;
    if (env && ent.environments && ent.environments.length > 0 && !ent.environments.includes(env)) continue;
    const role = ent.role as Role | undefined;
    const rank = role ? ROLE_RANK[role] ?? 0 : 0;
    if (rank > bestRank && role) {
      bestRank = rank;
      bestRole = role;
      bestSource = isDirect ? "direct" : "group";
      bestCapabilities = ent.capabilities ?? null;
      bestEnvironments = ent.environments ?? [];
    }
  }

  const profileSnap = await usersCollection().doc(uid).get();
  const userStatus =
    (profileSnap.exists && (profileSnap.data() as { status?: string } | undefined)?.status) || "unknown";

  if (!bestRole) {
    return {
      authorized: false,
      role: null,
      capabilities: [],
      source: "none",
      environments: [],
      user_status: userStatus,
    };
  }

  const capabilities = await resolveCapabilities(appId, bestRole, bestCapabilities);
  return {
    authorized: true,
    role: bestRole,
    capabilities,
    source: bestSource,
    environments: bestEnvironments,
    user_status: userStatus,
  };
}
