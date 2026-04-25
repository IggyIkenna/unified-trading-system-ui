/**
 * GET /api/v1/apps — list applications + counts
 */
import { NextResponse } from "next/server";

import { applicationsCollection } from "@/lib/admin/server/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snap = await applicationsCollection().orderBy("name", "asc").get();
    const applications = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ applications, total: applications.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
