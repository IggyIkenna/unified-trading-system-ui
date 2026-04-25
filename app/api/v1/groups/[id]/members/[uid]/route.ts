/**
 * DELETE /api/v1/groups/:id/members/:uid — remove member
 */
import { NextRequest, NextResponse } from "next/server";

import { groupsCollection, writeAuditEntry } from "@/lib/admin/server/collections";
import { verifyCaller } from "@/lib/admin/server/auth-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string; uid: string }> }) {
  const { id, uid } = await ctx.params;
  const caller = await verifyCaller(req);
  const ref = groupsCollection().doc(id);
  const existing = await ref.get();
  if (!existing.exists) return NextResponse.json({ error: "Group not found" }, { status: 404 });
  const members = ((existing.data()?.members ?? []) as { firebase_uid: string }[]).filter(
    (m) => m.firebase_uid !== uid,
  );
  await ref.update({ members, updated_at: new Date().toISOString() });
  await writeAuditEntry({
    action: "group.member.removed",
    group_id: id,
    firebase_uid: uid,
    actor: caller?.uid ?? "system",
  });
  const updated = await ref.get();
  const data = updated.data() as { members?: unknown[] };
  return NextResponse.json({ group: { id: updated.id, ...data, member_count: (data.members ?? []).length } });
}
