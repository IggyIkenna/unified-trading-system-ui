/**
 * POST /api/v1/users/:id/microsoft365/licenses/:operation — STUB.
 *  - operation: "assign" | "unassign"
 *  - body:      { licenses: string[] }
 *
 * TODO Phase 4: wire Microsoft Graph for real license assignment. For now
 * we update Firestore service state, write an audit entry, and return the
 * legacy shape so the admin UI keeps working.
 */
import { NextRequest, NextResponse } from "next/server";

import { isPlatformAdmin, verifyCaller } from "@/lib/admin/server/auth-context";
import { usersCollection, writeAuditEntry } from "@/lib/admin/server/collections";
import { resolveUserUid } from "@/lib/admin/server/users-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_OPS = ["assign", "unassign"] as const;

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ uid: string; operation: string }> },
) {
  const { uid: rawId, operation } = await ctx.params;
  const actor = await verifyCaller(req);
  if (!actor || !(await isPlatformAdmin(actor.uid))) {
    return NextResponse.json(
      { error: "Only platform admins can manage Microsoft 365 licenses." },
      { status: 403 },
    );
  }
  const op = operation.toLowerCase();
  if (!(ALLOWED_OPS as readonly string[]).includes(op)) {
    return NextResponse.json({ error: "operation must be assign or unassign." }, { status: 400 });
  }

  let payload: { licenses?: unknown } = {};
  try {
    payload = (await req.json()) as { licenses?: unknown };
  } catch {
    /* body required */
  }
  const licenses: string[] = Array.isArray(payload.licenses) ? (payload.licenses as string[]) : [];
  if (licenses.length === 0) {
    return NextResponse.json({ error: "licenses array is required." }, { status: 400 });
  }

  try {
    const id = await resolveUserUid(rawId);
    const profileRef = usersCollection().doc(id);
    const snap = await profileRef.get();
    if (!snap.exists) return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    const profile = (snap.data() ?? {}) as Record<string, unknown>;
    const now = new Date().toISOString();

    const message = `Microsoft 365 licenses ${op}ed (stub — Phase 4 wires Graph).`;
    await profileRef.set(
      {
        services: {
          ...((profile["services"] as Record<string, string>) ?? {}),
          microsoft365: "provisioned",
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
      action: `microsoft365.licenses_${op}`,
      actor: actor.uid,
      firebase_uid: id,
      licenses,
      message,
    });

    return NextResponse.json({
      operation: op,
      message,
      changed: licenses,
      licenses: [],
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
