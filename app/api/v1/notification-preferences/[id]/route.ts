/**
 * PUT    /api/v1/notification-preferences/:id  — update {enabled?, recipient_email?, description?}
 * DELETE /api/v1/notification-preferences/:id  — delete
 */
import { NextRequest, NextResponse } from "next/server";

import {
  notificationPreferencesCollection,
  writeAuditEntry,
} from "@/lib/admin/server/collections";
import { verifyCaller } from "@/lib/admin/server/auth-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const caller = await verifyCaller(req);
  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const ref = notificationPreferencesCollection().doc(id);
  const existing = await ref.get();
  if (!existing.exists) return NextResponse.json({ error: "Preference not found" }, { status: 404 });
  await ref.set({ ...payload, updated_at: new Date().toISOString() }, { merge: true });
  await writeAuditEntry({
    action: "notification.updated",
    preference_id: id,
    actor: caller?.uid ?? "system",
  });
  const updated = await ref.get();
  return NextResponse.json({ preference: { id: updated.id, ...updated.data() } });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const caller = await verifyCaller(req);
  const ref = notificationPreferencesCollection().doc(id);
  const existing = await ref.get();
  if (!existing.exists) return NextResponse.json({ error: "Preference not found" }, { status: 404 });
  await ref.delete();
  await writeAuditEntry({
    action: "notification.deleted",
    preference_id: id,
    actor: caller?.uid ?? "system",
  });
  return NextResponse.json({ deleted: true, id });
}
