/**
 * POST /api/v1/users/quota-check — return seat-quota summary for a role.
 * Used by the admin onboarding form before creating a Firebase user.
 */
import { NextRequest, NextResponse } from "next/server";

import { computeQuotaCheck } from "@/lib/admin/server/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let payload: { role?: string } = {};
  try {
    payload = (await req.json()) as { role?: string };
  } catch {
    /* body optional */
  }
  try {
    const result = await computeQuotaCheck(payload.role ?? "client");
    return NextResponse.json({ quota: result });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
