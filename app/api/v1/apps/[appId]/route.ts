/**
 * GET /api/v1/apps/:appId — read one application
 * PUT /api/v1/apps/:appId — partial update
 */
import { NextRequest, NextResponse } from "next/server";

import { applicationsCollection, writeAuditEntry } from "@/lib/admin/server/collections";
import { verifyCaller } from "@/lib/admin/server/auth-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ appId: string }> }) {
  const { appId } = await ctx.params;
  const snap = await applicationsCollection().doc(appId).get();
  if (!snap.exists) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  return NextResponse.json({ application: { id: snap.id, ...snap.data() } });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ appId: string }> }) {
  const { appId } = await ctx.params;
  const caller = await verifyCaller(req);
  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const ref = applicationsCollection().doc(appId);
  const existing = await ref.get();
  if (!existing.exists) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  const next = { ...payload, updated_at: new Date().toISOString() };
  delete (next as Record<string, unknown>).id;
  delete (next as Record<string, unknown>).created_at;
  await ref.set(next, { merge: true });
  await writeAuditEntry({ action: "app.updated", app_id: appId, actor: caller?.uid ?? "system" });
  const updated = await ref.get();
  return NextResponse.json({ app: { id: updated.id, ...updated.data() } });
}
