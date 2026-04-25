/**
 * GET /api/v1/users/:id/workflows — list the most-recent 20 workflow_runs
 * for this user. Mirrors listUserWorkflowRuns from the legacy server.
 */
import { NextRequest, NextResponse } from "next/server";

import { workflowsCollection } from "@/lib/admin/server/collections";
import { resolveUserUid } from "@/lib/admin/server/users-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface WorkflowRun {
  id: string;
  created_at?: string;
  [key: string]: unknown;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ uid: string }> }) {
  const { uid: id } = await ctx.params;
  try {
    const firebaseUid = await resolveUserUid(id);
    const snap = await workflowsCollection().where("firebase_uid", "==", firebaseUid).limit(50).get();
    const runs: WorkflowRun[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));
    runs.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    const sliced = runs.slice(0, 20);
    return NextResponse.json({ runs: sliced, total: sliced.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
