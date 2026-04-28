/**
 * POST /api/v1/users/:uid/microsoft365/account-action
 * Body: { action: "enable" | "disable" | "delete" }
 *
 * Calls Microsoft Graph PATCH /users/{upn} (accountEnabled) or DELETE
 * /users/{upn} when the action is delete. Mirrors the resulting service
 * state into Firestore. Falls back gracefully when MS_GRAPH_* are unset
 * — the Firestore mirror still happens, the actual Graph call is skipped
 * with detail in the audit entry.
 */
import { NextRequest, NextResponse } from "next/server";

import { isPlatformAdmin, verifyCaller } from "@/lib/admin/server/auth-context";
import { usersCollection, writeAuditEntry } from "@/lib/admin/server/collections";
import { getGraphClient } from "@/lib/admin/server/integrations/graph-client";
import { resolveUserUid } from "@/lib/admin/server/users-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ uid: string }> }) {
  const { uid: rawId } = await ctx.params;
  const actor = await verifyCaller(req);
  if (!actor || !(await isPlatformAdmin(actor.uid))) {
    return NextResponse.json({ error: "Only platform admins can manage Microsoft 365 accounts." }, { status: 403 });
  }

  let payload: { action?: string } = {};
  try {
    payload = (await req.json()) as { action?: string };
  } catch {
    /* body optional */
  }
  const action = String(payload.action ?? "").toLowerCase();
  if (!["enable", "disable", "delete"].includes(action)) {
    return NextResponse.json({ error: "action must be enable|disable|delete" }, { status: 400 });
  }

  const id = await resolveUserUid(rawId);
  const profileRef = usersCollection().doc(id);
  const snap = await profileRef.get();
  if (!snap.exists) return NextResponse.json({ error: "User profile not found." }, { status: 404 });
  const profile = (snap.data() ?? {}) as Record<string, unknown>;
  const upn = profile.microsoft_upn as string | undefined;

  const graph = getGraphClient();
  let graph_outcome: "applied" | "skipped" | "failed" = "skipped";
  let detail: string | null = null;

  if (graph && upn) {
    try {
      if (action === "delete") {
        await graph.api(`/users/${encodeURIComponent(upn)}`).delete();
      } else {
        await graph.api(`/users/${encodeURIComponent(upn)}`).update({ accountEnabled: action === "enable" });
      }
      graph_outcome = "applied";
    } catch (err) {
      graph_outcome = "failed";
      detail = String(err);
    }
  } else if (!graph) {
    detail = "MS_GRAPH_* secrets not set: Firestore mirror only.";
  } else if (!upn) {
    detail = "User has no microsoft_upn: issue a work email first.";
  }

  const now = new Date().toISOString();
  const nextServiceStatus = action === "delete" || action === "disable" ? "not_applicable" : "provisioned";
  await profileRef.set(
    {
      services: {
        ...((profile.services as Record<string, string>) ?? {}),
        microsoft365: nextServiceStatus,
      },
      service_messages: {
        ...((profile.service_messages as Record<string, string>) ?? {}),
        microsoft365: detail ?? `M365 account ${action} applied`,
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
    action: `microsoft365.account_${action}`,
    actor: actor.uid,
    firebase_uid: id,
    upn: upn ?? null,
    graph_outcome,
    detail,
  });

  const updated = await profileRef.get();
  return NextResponse.json(
    {
      action,
      graph_outcome,
      detail,
      user: { firebase_uid: id, ...((updated.data() ?? {}) as Record<string, unknown>) },
    },
    { status: graph_outcome === "failed" ? 502 : 200 },
  );
}
