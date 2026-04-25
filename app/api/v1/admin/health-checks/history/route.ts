/**
 * GET /api/v1/admin/health-checks/history — newest-first health_check_runs.
 */
import { NextResponse } from "next/server";

import { healthChecksCollection } from "@/lib/admin/server/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await healthChecksCollection().orderBy("started_at", "desc").limit(50).get();
  const runs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ runs, total: runs.length });
}
