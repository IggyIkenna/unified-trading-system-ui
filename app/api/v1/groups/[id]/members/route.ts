/**
 * POST /api/v1/groups/:id/members — add member {firebase_uid, email?, name?}
 */
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { groupsCollection, writeAuditEntry } from "@/lib/admin/server/collections";
import { verifyCaller } from "@/lib/admin/server/auth-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const caller = await verifyCaller(req);
  let payload: { firebase_uid?: string; email?: string; name?: string };
  try {
    payload = (await req.json()) as { firebase_uid?: string; email?: string; name?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!payload.firebase_uid) {
    return NextResponse.json({ error: "firebase_uid is required." }, { status: 400 });
  }
  const ref = groupsCollection().doc(id);
  const existing = await ref.get();
  if (!existing.exists) return NextResponse.json({ error: "Group not found" }, { status: 404 });
  const members = (existing.data()?.members ?? []) as { firebase_uid: string }[];
  if (members.some((m) => m.firebase_uid === payload.firebase_uid)) {
    return NextResponse.json({ error: "Member already in group", group_id: id }, { status: 409 });
  }
  const member = {
    firebase_uid: payload.firebase_uid,
    email: payload.email ?? null,
    name: payload.name ?? null,
    added_at: new Date().toISOString(),
    added_by: caller?.uid ?? "system",
  };
  await ref.update({ members: FieldValue.arrayUnion(member), updated_at: new Date().toISOString() });
  await writeAuditEntry({
    action: "group.member.added",
    group_id: id,
    firebase_uid: payload.firebase_uid,
    actor: caller?.uid ?? "system",
  });
  const updated = await ref.get();
  const data = updated.data() as { members?: unknown[] };
  return NextResponse.json({ group: { id: updated.id, ...data, member_count: (data.members ?? []).length } });
}
