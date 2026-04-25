/**
 * POST /api/v1/users/:id/reprovision — re-trigger onboarding workflow.
 *
 * STUB: workflow execution + provider provisioning are placeholders that
 * Phase 4 will wire to Google Workflows REST + real provider APIs.
 */
import { NextRequest, NextResponse } from "next/server";

import {
  logWorkflowRun,
  safeStartWorkflowExecutionStub,
  usersCollection,
  WORKFLOW_NAMES,
} from "@/lib/admin/server/collections";
import { resolveUserUid } from "@/lib/admin/server/users-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ uid: string }> }) {
  const { uid: rawId } = await ctx.params;
  try {
    const id = await resolveUserUid(rawId);
    const profileRef = usersCollection().doc(id);
    const snap = await profileRef.get();
    if (!snap.exists) return NextResponse.json({ error: "User profile not found." }, { status: 404 });

    const profile = snap.data() as Record<string, unknown>;
    // TODO Phase 4: wire google-auth-library + Workflows REST endpoint.
    const execution = safeStartWorkflowExecutionStub(WORKFLOW_NAMES.reprovision, {
      firebase_uid: id,
      profile,
      access_template: profile["access_template"] ?? null,
    });
    await logWorkflowRun({
      firebase_uid: id,
      run_type: "reprovision",
      workflow_name: WORKFLOW_NAMES.reprovision,
      execution_name: execution.name,
      status: execution.state,
      input: profile,
    });

    await profileRef.set({ last_modified: new Date().toISOString() }, { merge: true });

    return NextResponse.json({
      workflow_execution: execution.name,
      workflow_state: execution.state,
      workflow_error: execution.error ?? null,
      provisioning_steps: [],
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
