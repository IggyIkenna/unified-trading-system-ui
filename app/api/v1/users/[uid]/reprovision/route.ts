/**
 * POST /api/v1/users/:uid/reprovision — re-trigger the reprovision workflow.
 *
 * Calls Google Workflows when GOOGLE_WORKFLOW_PROJECT is configured;
 * otherwise records a stub run so admin pages render without a backend.
 */
import { NextRequest, NextResponse } from "next/server";

import { usersCollection, WORKFLOW_NAMES } from "@/lib/admin/server/collections";
import { resolveUserUid } from "@/lib/admin/server/users-list";
import { triggerWorkflow } from "@/lib/admin/server/integrations/workflow-trigger";

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

    const result = await triggerWorkflow(WORKFLOW_NAMES.reprovision, "reprovision", id, {
      firebase_uid: id,
      profile,
      access_template: profile["access_template"] ?? null,
    });
    await profileRef.set({ last_modified: new Date().toISOString() }, { merge: true });
    return NextResponse.json({
      workflow_execution: result.execution_name,
      workflow_state: result.state,
      workflow_error: result.error,
      workflow_outcome: result.outcome,
      provisioning_steps: [],
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
