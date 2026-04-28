/**
 * POST /api/v1/users/:uid/issue-work-email
 *
 * Creates (or recovers, when already provisioned) a Microsoft 365 user with
 * upn = {local_part}@{MS_GRAPH_DEFAULT_DOMAIN}, persists the upn into the
 * Firestore user_profiles record, flips services.microsoft365 to
 * "provisioned", and writes an audit entry. Falls back to Firestore-only
 * mirror when MS_GRAPH_* are unset.
 *
 * Body: { local_part?: string } — optional; defaults to the local part of
 * the profile email when omitted.
 */
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

import { isPlatformAdmin, verifyCaller } from "@/lib/admin/server/auth-context";
import { usersCollection, writeAuditEntry } from "@/lib/admin/server/collections";
import { getGraphClient, getGraphDefaultDomain } from "@/lib/admin/server/integrations/graph-client";
import { resolveUserUid } from "@/lib/admin/server/users-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function generateTempPassword(): string {
  // 18 chars, mixed bytes; admin can rotate via /api/v1/settings/change-password.
  return randomBytes(13).toString("base64").replace(/[+/=]/g, "x").slice(0, 18) + "Aa1!";
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ uid: string }> }) {
  const { uid: rawId } = await ctx.params;
  const actor = await verifyCaller(req);
  if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!(await isPlatformAdmin(actor.uid))) {
    return NextResponse.json({ error: "Only platform admins can issue work email." }, { status: 403 });
  }
  let payload: { local_part?: string } = {};
  try {
    payload = (await req.json()) as { local_part?: string };
  } catch {
    /* body optional */
  }
  const localPart = String(payload.local_part ?? "")
    .trim()
    .toLowerCase();
  if (localPart && !/^[a-z0-9._-]+$/.test(localPart)) {
    return NextResponse.json(
      { error: "local_part may only contain lowercase letters, numbers, dot, underscore, and hyphen." },
      { status: 400 },
    );
  }

  const id = await resolveUserUid(rawId);
  const profileRef = usersCollection().doc(id);
  const snap = await profileRef.get();
  if (!snap.exists) return NextResponse.json({ error: "User profile not found." }, { status: 404 });
  const profile = (snap.data() ?? {}) as Record<string, unknown>;

  const domain = getGraphDefaultDomain();
  const derived = localPart || String(profile.email ?? "").split("@")[0] || id;
  const upn = `${derived}@${domain}`;
  const previousUpn = (profile.microsoft_upn as string | null | undefined) ?? null;
  const displayName = (profile.name as string | undefined) ?? derived;

  const graph = getGraphClient();
  let graph_outcome: "applied" | "skipped" | "exists" | "failed" = "skipped";
  let detail: string | null = null;
  let temp_password: string | null = null;

  if (graph) {
    try {
      // Check if user already exists.
      try {
        await graph.api(`/users/${encodeURIComponent(upn)}`).get();
        graph_outcome = "exists";
      } catch (err) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status !== 404) throw err;
      }
      if (graph_outcome === "skipped") {
        temp_password = generateTempPassword();
        await graph.api("/users").post({
          accountEnabled: true,
          displayName,
          mailNickname: derived,
          userPrincipalName: upn,
          passwordProfile: {
            forceChangePasswordNextSignIn: true,
            password: temp_password,
          },
        });
        graph_outcome = "applied";
      }
    } catch (err) {
      graph_outcome = "failed";
      detail = String(err);
    }
  } else {
    detail = "MS_GRAPH_* secrets not set: Firestore mirror only.";
  }

  const now = new Date().toISOString();
  await profileRef.set(
    {
      microsoft_upn: upn,
      services: {
        ...((profile.services as Record<string, string>) ?? {}),
        microsoft365: graph_outcome === "applied" || graph_outcome === "exists" ? "provisioned" : "pending",
      },
      service_messages: {
        ...((profile.service_messages as Record<string, string>) ?? {}),
        microsoft365: detail ?? `M365 account ${graph_outcome} for ${upn}`,
      },
      service_synced_at: {
        ...((profile.service_synced_at as Record<string, string>) ?? {}),
        microsoft365: now,
      },
      last_modified: now,
    },
    { merge: true },
  );

  await writeAuditEntry({
    action: "microsoft365.work_email_issued",
    actor: actor.uid,
    firebase_uid: id,
    previous_upn: previousUpn,
    new_upn: upn,
    graph_outcome,
    detail,
  });

  const updated = await profileRef.get();
  return NextResponse.json(
    {
      upn,
      graph_outcome,
      detail,
      // Temp password returned ONCE in the response so the admin can hand it
      // off out-of-band. We don't store it in Firestore.
      temp_password: graph_outcome === "applied" ? temp_password : null,
      user: { firebase_uid: id, ...((updated.data() ?? {}) as Record<string, unknown>) },
    },
    { status: graph_outcome === "failed" ? 502 : 200 },
  );
}
