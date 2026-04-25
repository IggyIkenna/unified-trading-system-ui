/**
 * POST /api/v1/users/:id/microsoft365/account-action — STUB.
 * Body: { action: "enable" | "disable" | "delete" }
 *
 * TODO Phase 4: wire Microsoft Graph (real account enable/disable/delete).
 * For now we mirror the requested action into Firestore service state and
 * write an audit row, returning the legacy response shape.
 */
import { NextRequest, NextResponse } from "next/server";

import { isPlatformAdmin, verifyCaller } from "@/lib/admin/server/auth-context";
import { usersCollection, writeAuditEntry } from "@/lib/admin/server/collections";
import { resolveUserUid } from "@/lib/admin/server/users-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ uid: string }> }) {
  const { uid: rawId } = await ctx.params;
  const actor = await verifyCaller(req);
  if (!actor || !(await isPlatformAdmin(actor.uid))) {
    return NextResponse.json(
      { error: "Only platform admins can manage Microsoft 365 accounts." },
      { status: 403 },
    );
  }

  let payload: { action?: string } = {};
  try {
    payload = (await req.json()) as { action?: string };
  } catch {
    /* body optional */
  }
  const action = String(payload.action ?? "").toLowerCase();

  try {
    const id = await resolveUserUid(rawId);
    const profileRef = usersCollection().doc(id);
    const snap = await profileRef.get();
    if (!snap.exists) return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    const profile = (snap.data() ?? {}) as Record<string, unknown>;

    const now = new Date().toISOString();
    const nextServiceStatus =
      action === "delete" || action === "deactivate" ? "not_applicable" : "provisioned";
    const message = `Microsoft 365 account ${action} (stub — Phase 4 wires Graph).`;

    await profileRef.set(
      {
        services: {
          ...((profile["services"] as Record<string, string>) ?? {}),
          microsoft365: nextServiceStatus,
        },
        service_messages: {
          ...((profile["service_messages"] as Record<string, string>) ?? {}),
          microsoft365: message,
        },
        service_synced_at: {
          ...((profile["service_synced_at"] as Record<string, string>) ?? {}),
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
      message,
    });

    const updated = await profileRef.get();
    return NextResponse.json({
      action,
      message,
      user: { firebase_uid: id, ...((updated.data() ?? {}) as Record<string, unknown>) },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
