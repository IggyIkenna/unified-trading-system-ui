/**
 * POST /api/v1/groups/:id/bulk-assign — bulk attach a group to multiple apps
 *
 * Creates an app_entitlements record per app_id with subject_type=group,
 * subject_id=<group.group_id|doc.id>. Skips entitlements that already exist
 * for the same (app_id, subject_id) pair.
 */
import { NextRequest, NextResponse } from "next/server";

import {
  appEntitlementsCollection,
  groupsCollection,
  writeAuditEntry,
} from "@/lib/admin/server/collections";
import { verifyCaller } from "@/lib/admin/server/auth-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface BulkAssignPayload {
  apps?: { app_id: string; role: string; environments?: string[] }[];
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const caller = await verifyCaller(req);
  let payload: BulkAssignPayload;
  try {
    payload = (await req.json()) as BulkAssignPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const groupSnap = await groupsCollection().doc(id).get();
  if (!groupSnap.exists) return NextResponse.json({ error: "Group not found" }, { status: 404 });
  const groupId = (groupSnap.data()?.group_id as string | undefined) ?? id;

  const apps = payload.apps ?? [];
  let created = 0;
  let skipped = 0;
  for (const a of apps) {
    if (!a.app_id || !a.role) continue;
    const existing = await appEntitlementsCollection()
      .where("app_id", "==", a.app_id)
      .where("subject_type", "==", "group")
      .where("subject_id", "==", groupId)
      .limit(1)
      .get();
    if (!existing.empty) {
      skipped += 1;
      continue;
    }
    const now = new Date().toISOString();
    await appEntitlementsCollection().add({
      app_id: a.app_id,
      subject_type: "group",
      subject_id: groupId,
      role: a.role,
      environments: a.environments ?? [],
      capabilities: null,
      created_at: now,
      created_by: caller?.uid ?? "system",
    });
    created += 1;
  }
  await writeAuditEntry({
    action: "group.bulk_assigned",
    group_id: id,
    created,
    skipped,
    actor: caller?.uid ?? "system",
  });
  return NextResponse.json({ created, skipped, total_requested: apps.length });
}
