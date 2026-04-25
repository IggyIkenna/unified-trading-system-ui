/**
 * GET    /api/v1/groups/:id  — read one group
 * PUT    /api/v1/groups/:id  — update {name?, description?}
 * DELETE /api/v1/groups/:id  — delete group
 */
import { NextRequest, NextResponse } from "next/server";

import { groupsCollection, writeAuditEntry } from "@/lib/admin/server/collections";
import { verifyCaller } from "@/lib/admin/server/auth-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const snap = await groupsCollection().doc(id).get();
  if (!snap.exists) return NextResponse.json({ error: "Group not found" }, { status: 404 });
  const data = snap.data() as { members?: unknown[] };
  return NextResponse.json({ group: { id: snap.id, ...data, member_count: (data.members ?? []).length } });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const caller = await verifyCaller(req);
  let payload: { name?: string; description?: string };
  try {
    payload = (await req.json()) as { name?: string; description?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const ref = groupsCollection().doc(id);
  const existing = await ref.get();
  if (!existing.exists) return NextResponse.json({ error: "Group not found" }, { status: 404 });
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.name !== undefined) updates.name = payload.name.trim();
  if (payload.description !== undefined) updates.description = payload.description;
  await ref.set(updates, { merge: true });
  await writeAuditEntry({ action: "group.updated", group_id: id, actor: caller?.uid ?? "system" });
  const updated = await ref.get();
  const data = updated.data() as { members?: unknown[] };
  return NextResponse.json({ group: { id: updated.id, ...data, member_count: (data.members ?? []).length } });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const caller = await verifyCaller(req);
  const ref = groupsCollection().doc(id);
  const existing = await ref.get();
  if (!existing.exists) return NextResponse.json({ error: "Group not found" }, { status: 404 });
  await ref.delete();
  await writeAuditEntry({ action: "group.deleted", group_id: id, actor: caller?.uid ?? "system" });
  return NextResponse.json({ deleted: true, id });
}
