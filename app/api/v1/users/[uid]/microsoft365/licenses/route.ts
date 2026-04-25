/**
 * GET /api/v1/users/:id/microsoft365/licenses — STUB.
 *
 * TODO Phase 4: wire Microsoft Graph for real license enumeration. For now
 * this returns ok=true with an empty licenses array so admin pages render.
 */
import { NextRequest, NextResponse } from "next/server";

import { isPlatformAdmin, verifyCaller } from "@/lib/admin/server/auth-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, _ctx: { params: Promise<{ uid: string }> }) {
  const actor = await verifyCaller(req);
  if (!actor || !(await isPlatformAdmin(actor.uid))) {
    return NextResponse.json(
      { error: "Only platform admins can manage Microsoft 365 licenses." },
      { status: 403 },
    );
  }
  return NextResponse.json({
    ok: true,
    licenses: [],
    message: "Microsoft 365 license listing not yet wired (Phase 4).",
  });
}
