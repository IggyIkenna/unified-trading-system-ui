/**
 * PUT    /api/v1/access-templates/:id — partial update; cascade to assigned users
 * DELETE /api/v1/access-templates/:id — delete (refuse if in use → 409)
 */
import { NextRequest, NextResponse } from "next/server";

import { getAdminFirestore } from "@/lib/firebase-admin";
import {
  templatesCollection,
  usersCollection,
  validateAccessTemplatePayload,
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
  const errors = validateAccessTemplatePayload(payload, true);
  if (errors.length > 0) {
    return NextResponse.json({ error: "Validation failed.", details: errors }, { status: 400 });
  }
  const ref = templatesCollection().doc(id);
  const existing = await ref.get();
  if (!existing.exists) return NextResponse.json({ error: "Template not found." }, { status: 404 });
  const now = new Date().toISOString();
  await ref.set({ ...payload, updated_at: now }, { merge: true });
  const updated = await ref.get();
  const merged = { id: updated.id, ...updated.data() };

  // Cascade to assigned users so admin views reflect the new template fields immediately.
  const assignedSnap = await usersCollection().where("access_template_id", "==", id).get();
  if (!assignedSnap.empty) {
    const db = getAdminFirestore();
    if (db) {
      const batch = db.batch();
      for (const u of assignedSnap.docs) {
        batch.set(
          u.ref,
          { access_template: merged, last_modified: now },
          { merge: true },
        );
      }
      await batch.commit();
    }
  }
  await writeAuditEntry({
    action: "template.updated",
    template_id: id,
    cascaded_to_users: assignedSnap.size,
    actor: caller?.uid ?? "system",
  });
  return NextResponse.json({ template: merged });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const caller = await verifyCaller(req);
  const ref = templatesCollection().doc(id);
  const existing = await ref.get();
  if (!existing.exists) return NextResponse.json({ error: "Template not found." }, { status: 404 });
  const inUse = await usersCollection().where("access_template_id", "==", id).limit(1).get();
  if (!inUse.empty) {
    return NextResponse.json(
      { error: "Template is in use by one or more users and cannot be deleted." },
      { status: 409 },
    );
  }
  await ref.delete();
  await writeAuditEntry({ action: "template.deleted", template_id: id, actor: caller?.uid ?? "system" });
  return NextResponse.json({ deleted: true, id });
}
