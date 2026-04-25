/**
 * /api/v1/users/:id — read merged user; PUT updates user_profiles fields.
 *
 * Mirrors the legacy user-management-api routes. The merged read joins
 * Firebase Auth + user_profiles via listUsersWithProfiles, matching either
 * the profile.id OR the firebase_uid so admin pages with both shapes work.
 */
import { NextRequest, NextResponse } from "next/server";

import {
  getAccessTemplateById,
  logWorkflowRun,
  safeStartWorkflowExecutionStub,
  usersCollection,
  WORKFLOW_NAMES,
} from "@/lib/admin/server/collections";
import { listUsersWithProfiles, resolveUserUid } from "@/lib/admin/server/users-list";
import { getAdminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ uid: string }> }) {
  const { uid: id } = await ctx.params;
  try {
    const users = await listUsersWithProfiles();
    const user = users.find((u) => u.id === id || u.firebase_uid === id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ user });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ uid: string }> }) {
  const { uid: rawId } = await ctx.params;
  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  try {
    const id = await resolveUserUid(rawId);
    const profileRef = usersCollection().doc(id);
    const existing = await profileRef.get();
    if (!existing.exists) return NextResponse.json({ error: "User profile not found." }, { status: 404 });

    const prev = (existing.data() ?? {}) as Record<string, unknown>;
    const next: Record<string, unknown> = {
      ...prev,
      ...payload,
      last_modified: new Date().toISOString(),
    };
    if (payload["access_template_id"] !== undefined) {
      next["access_template"] = await getAccessTemplateById(payload["access_template_id"] as string | null);
    }
    await profileRef.set(next, { merge: true });

    if (payload["role"]) {
      const auth = getAdminAuth();
      if (auth) {
        try {
          const rec = await auth.getUser(id);
          await auth.setCustomUserClaims(id, { ...(rec.customClaims ?? {}), role: payload["role"] });
        } catch {
          /* role update is best-effort; profile.role is the SSOT */
        }
      }
    }

    // TODO Phase 4: wire google-auth-library + Workflows REST endpoint.
    const execution = safeStartWorkflowExecutionStub(WORKFLOW_NAMES.modify, {
      firebase_uid: id,
      updates: payload,
      access_template: next["access_template"] ?? null,
    });
    await logWorkflowRun({
      firebase_uid: id,
      run_type: "modify",
      workflow_name: WORKFLOW_NAMES.modify,
      execution_name: execution.name,
      status: execution.state,
      input: payload,
    });

    return NextResponse.json({
      user: { ...next, firebase_uid: id },
      workflow_execution: execution.name,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
