/**
 * GET /api/v1/audit-log?action=...&limit=...
 */
import { NextRequest, NextResponse } from "next/server";

import { auditLogCollection } from "@/lib/admin/server/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 500);
  let q = auditLogCollection().orderBy("timestamp", "desc");
  if (action) q = q.where("action", "==", action) as typeof q;
  const snap = await q.limit(limit).get();
  const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ entries, total: entries.length });
}
