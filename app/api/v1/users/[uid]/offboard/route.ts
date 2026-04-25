/**
 * POST /api/v1/users/:id/offboard — admin disables (or deletes) a user.
 *
 * Default: Auth.updateUser({disabled:true}) + profile.status="offboarded".
 * If body.actions.firebase === "delete" or OFFBOARD_DEFAULT_DEACTIVATE=false,
 * the user is removed from Auth instead. Provider deprovisioning is stubbed.
 */
import { NextRequest, NextResponse } from "next/server";

import { usersCollection, WORKFLOW_NAMES } from "@/lib/admin/server/collections";
import { resolveUserUid } from "@/lib/admin/server/users-list";
import { triggerWorkflow } from "@/lib/admin/server/integrations/workflow-trigger";
import { getAdminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface OffboardPayload {
  actions?: { firebase?: string };
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ uid: string }> }) {
  const { uid: rawId } = await ctx.params;
  let payload: OffboardPayload = {};
  try {
    payload = (await req.json()) as OffboardPayload;
  } catch {
    /* body is optional */
  }
  const actions = payload.actions ?? {};

  try {
    const id = await resolveUserUid(rawId);
    const auth = getAdminAuth();
    if (!auth) return NextResponse.json({ error: "Auth backend unavailable." }, { status: 503 });

    const profileSnap = await usersCollection().doc(id).get();
    const profile = (profileSnap.data() ?? {}) as Record<string, unknown>;
    const defaultDeactivate = String(process.env.OFFBOARD_DEFAULT_DEACTIVATE ?? "true") === "true";
    const doDelete =
      actions.firebase === "delete" || (!defaultDeactivate && actions.firebase !== "deactivate");

    if (doDelete) await auth.deleteUser(id);
    else await auth.updateUser(id, { disabled: true });

    await usersCollection().doc(id).set(
      { status: "offboarded", last_modified: new Date().toISOString() },
      { merge: true },
    );

    const wf = await triggerWorkflow(WORKFLOW_NAMES.offboard, "offboard", id, {
      firebase_uid: id,
      actions,
    });

    const revocation_steps = [
      {
        service: "firebase",
        label: `Firebase (${doDelete ? "delete" : "deactivate"})`,
        status: "success",
      },
    ];

    const userSnap = await usersCollection().doc(id).get();
    return NextResponse.json({
      user: { firebase_uid: id, ...((userSnap.data() ?? {}) as Record<string, unknown>) },
      revocation_steps,
      workflow_execution: wf.execution_name,
      workflow_state: wf.state,
      workflow_outcome: wf.outcome,
      workflow_error: wf.error,
      previous_profile: profile,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
