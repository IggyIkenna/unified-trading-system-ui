/**
 * GET /api/v1/apps/sync-history — list app_sync_history newest-first
 */
import { NextResponse } from "next/server";

import { appSyncHistoryCollection } from "@/lib/admin/server/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snap = await appSyncHistoryCollection().orderBy("started_at", "desc").limit(50).get();
    const runs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ runs, history: runs, total: runs.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
