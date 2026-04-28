/**
 * GET /api/v1/users/:uid/microsoft365/licenses — list assigned M365 licenses
 * for the user identified by their work email (microsoft_upn). Falls back
 * gracefully when MS_GRAPH_* secrets are unset.
 */
import { NextRequest, NextResponse } from "next/server";

import { usersCollection } from "@/lib/admin/server/collections";
import { isPlatformAdmin, verifyCaller } from "@/lib/admin/server/auth-context";
import { getGraphClient } from "@/lib/admin/server/integrations/graph-client";
import { resolveUserUid } from "@/lib/admin/server/users-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LicenseDetail {
  skuId: string;
  skuPartNumber?: string;
  servicePlans?: { servicePlanId: string; servicePlanName?: string; provisioningStatus?: string }[];
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ uid: string }> }) {
  const actor = await verifyCaller(req);
  if (!actor || !(await isPlatformAdmin(actor.uid))) {
    return NextResponse.json({ error: "Only platform admins can manage Microsoft 365 licenses." }, { status: 403 });
  }
  const { uid: rawId } = await ctx.params;
  const id = await resolveUserUid(rawId);
  const profile = await usersCollection().doc(id).get();
  if (!profile.exists) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const upn = (profile.data() as { microsoft_upn?: string } | undefined)?.microsoft_upn;
  if (!upn) {
    return NextResponse.json({
      ok: true,
      licenses: [],
      message: "User has no microsoft_upn set: issue a work email first.",
    });
  }
  const graph = getGraphClient();
  if (!graph) {
    return NextResponse.json({
      ok: false,
      licenses: [],
      message: "MS_GRAPH_* secrets not configured.",
    });
  }
  try {
    const res = (await graph.api(`/users/${encodeURIComponent(upn)}/licenseDetails`).get()) as {
      value: LicenseDetail[];
    };
    return NextResponse.json({ ok: true, upn, licenses: res.value ?? [] });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 502 });
  }
}
