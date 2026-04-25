/**
 * POST /api/v1/users/:id/issue-work-email — STUB.
 *
 * Phase 4 will wire Microsoft Graph (real M365 work-email assignment).
 * For now we store the requested local_part (or derive one from the
 * profile) into microsoft_upn and flip services.microsoft365 to
 * "provisioned" in Firestore — admin UI flows render correctly.
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
  const localPart = String(payload.local_part ?? "").trim().toLowerCase();
  if (localPart && !/^[a-z0-9._-]+$/.test(localPart)) {
    return NextResponse.json(
      { error: "local_part may only contain lowercase letters, numbers, dot, underscore, and hyphen." },
      { status: 400 },
    );
  }

  try {
    const id = await resolveUserUid(rawId);
    const profileRef = usersCollection().doc(id);
    const snap = await profileRef.get();
    if (!snap.exists) return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    const profile = (snap.data() ?? {}) as Record<string, unknown>;

    // TODO Phase 4: wire Microsoft Graph (real M365 work-email creation).
    const domain = process.env.M365_DEFAULT_DOMAIN ?? "odum-research.com";
    const derived = localPart || String(profile["email"] ?? "").split("@")[0] || id;
    const upn = `${derived}@${domain}`;
    const previousUpn = profile["microsoft_upn"] ?? null;
    const now = new Date().toISOString();

    await profileRef.set(
      {
        microsoft_upn: upn,
        services: { ...((profile["services"] as Record<string, string>) ?? {}), microsoft365: "provisioned" },
        service_messages: {
          ...((profile["service_messages"] as Record<string, string>) ?? {}),
          microsoft365: "Microsoft 365 account provisioned (stub).",
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
      action: "microsoft365.work_email_issued",
      actor: actor.uid,
      firebase_uid: id,
      previous_upn: previousUpn,
      new_upn: upn,
      created: true,
      message: "stub — phase 4 will wire Graph",
    });

    const updated = await profileRef.get();
    return NextResponse.json({
      upn,
      created: true,
      message: "Microsoft 365 account provisioned (stub — Phase 4 wires real Graph).",
      user: { firebase_uid: id, ...((updated.data() ?? {}) as Record<string, unknown>) },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
