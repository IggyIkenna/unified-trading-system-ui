/**
 * GET  /api/v1/apps/:appId/entitlements — list grants for an app
 * POST /api/v1/apps/:appId/entitlements — grant {subject_type, subject_id, role, environments?, capabilities?}
 */
import { NextRequest, NextResponse } from "next/server";

import {
  appEntitlementsCollection,
  writeAuditEntry,
} from "@/lib/admin/server/collections";
import { verifyCaller } from "@/lib/admin/server/auth-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ appId: string }> }) {
  const { appId } = await ctx.params;
  const snap = await appEntitlementsCollection().where("app_id", "==", appId).get();
  const entitlements = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ entitlements, total: entitlements.length });
}

interface GrantPayload {
  subject_type?: "user" | "group";
  subject_id?: string;
  role?: string;
  environments?: string[];
  capabilities?: string[];
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ appId: string }> }) {
  const { appId } = await ctx.params;
  const caller = await verifyCaller(req);
  let payload: GrantPayload;
  try {
    payload = (await req.json()) as GrantPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!payload.subject_type || !payload.subject_id || !payload.role) {
    return NextResponse.json(
      { error: "subject_type, subject_id, and role are required." },
      { status: 400 },
    );
  }
  const existing = await appEntitlementsCollection()
    .where("app_id", "==", appId)
    .where("subject_type", "==", payload.subject_type)
    .where("subject_id", "==", payload.subject_id)
    .limit(1)
    .get();
  if (!existing.empty) {
    return NextResponse.json(
      { error: "Entitlement already exists for this subject.", id: existing.docs[0]!.id },
      { status: 409 },
    );
  }
  const now = new Date().toISOString();
  const ref = await appEntitlementsCollection().add({
    app_id: appId,
    subject_type: payload.subject_type,
    subject_id: payload.subject_id,
    role: payload.role,
    environments: payload.environments ?? [],
    capabilities: payload.capabilities ?? null,
    created_at: now,
    created_by: caller?.uid ?? "system",
  });
  await writeAuditEntry({
    action: "entitlement.granted",
    app_id: appId,
    subject_type: payload.subject_type,
    subject_id: payload.subject_id,
    role: payload.role,
    actor: caller?.uid ?? "system",
  });
  const created = await ref.get();
  return NextResponse.json({ entitlement: { id: ref.id, ...created.data() } }, { status: 201 });
}
