/**
 * DELETE /api/v1/apps/:appId/entitlements/:entId — revoke
 */
import { NextRequest, NextResponse } from "next/server";

import { appEntitlementsCollection, writeAuditEntry } from "@/lib/admin/server/collections";
import { verifyCaller } from "@/lib/admin/server/auth-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ appId: string; entId: string }> }) {
  const { appId, entId } = await ctx.params;
  const caller = await verifyCaller(req);
  const ref = appEntitlementsCollection().doc(entId);
  const existing = await ref.get();
  if (!existing.exists) return NextResponse.json({ error: "Entitlement not found" }, { status: 404 });
  const data = existing.data() as { app_id?: string; subject_type?: string; subject_id?: string };
  if (data.app_id !== appId) {
    return NextResponse.json({ error: "Entitlement does not belong to this app" }, { status: 400 });
  }
  await ref.delete();
  await writeAuditEntry({
    action: "entitlement.revoked",
    app_id: appId,
    entitlement_id: entId,
    subject_type: data.subject_type,
    subject_id: data.subject_id,
    actor: caller?.uid ?? "system",
  });
  return NextResponse.json({ revoked: true, id: entId });
}
