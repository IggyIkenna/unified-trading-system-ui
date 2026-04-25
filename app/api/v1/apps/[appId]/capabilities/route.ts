/**
 * GET /api/v1/apps/:appId/capabilities — read app_capabilities/{appId}
 * PUT /api/v1/apps/:appId/capabilities — set { capabilities, role_presets }
 */
import { NextRequest, NextResponse } from "next/server";

import { appCapabilitiesCollection, writeAuditEntry } from "@/lib/admin/server/collections";
import { verifyCaller } from "@/lib/admin/server/auth-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ appId: string }> }) {
  const { appId } = await ctx.params;
  const snap = await appCapabilitiesCollection().doc(appId).get();
  if (!snap.exists) {
    return NextResponse.json({
      definition: { app_id: appId, capabilities: [], role_presets: {} },
    });
  }
  return NextResponse.json({ definition: { app_id: appId, ...snap.data() } });
}

interface CapabilitiesPayload {
  capabilities?: { key: string; label?: string; description?: string }[];
  role_presets?: Record<string, string[]>;
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ appId: string }> }) {
  const { appId } = await ctx.params;
  const caller = await verifyCaller(req);
  let payload: CapabilitiesPayload;
  try {
    payload = (await req.json()) as CapabilitiesPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const ref = appCapabilitiesCollection().doc(appId);
  await ref.set(
    {
      app_id: appId,
      capabilities: payload.capabilities ?? [],
      role_presets: payload.role_presets ?? {},
      updated_at: new Date().toISOString(),
      updated_by: caller?.uid ?? "system",
    },
    { merge: true },
  );
  await writeAuditEntry({ action: "capabilities.updated", app_id: appId, actor: caller?.uid ?? "system" });
  const updated = await ref.get();
  return NextResponse.json({ definition: { app_id: appId, ...updated.data() } });
}
