/**
 * POST /api/v1/users/:id/offboard — admin disables (or deletes) a user.
 *
 * Default: Auth.updateUser({disabled:true}) + profile.status="offboarded".
 * If body.actions.firebase === "delete" or OFFBOARD_DEFAULT_DEACTIVATE=false,
 * the user is removed from Auth instead. Provider deprovisioning is stubbed.
 */
import { NextRequest, NextResponse } from "next/server";

import {
  logWorkflowRun,
  safeStartWorkflowExecutionStub,
  usersCollection,
  WORKFLOW_NAMES,
} from "@/lib/admin/server/collections";
import { resolveUserUid } from "@/lib/admin/server/users-list";
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

    // TODO Phase 4: wire Google Workflows + real provider deprovisioning
    // (revoke Slack/M365/GitHub/GCP/AWS access).
    const execution = safeStartWorkflowExecutionStub(WORKFLOW_NAMES.offboard, {
      firebase_uid: id,
      actions,
    });
    await logWorkflowRun({
      firebase_uid: id,
      run_type: "offboard",
      workflow_name: WORKFLOW_NAMES.offboard,
      execution_name: execution.name,
      status: execution.state,
      input: actions,
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
      workflow_execution: execution.name,
      previous_profile: profile,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
