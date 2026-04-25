/**
 * GET /api/v1/apps/:appId/audit-log — entries scoped to an application.
 */
import { NextRequest, NextResponse } from "next/server";

import { auditLogCollection } from "@/lib/admin/server/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ appId: string }> }) {
  const { appId } = await ctx.params;
  const snap = await auditLogCollection()
    .where("app_id", "==", appId)
    .orderBy("timestamp", "desc")
    .limit(200)
    .get();
  const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ entries, total: entries.length });
}
