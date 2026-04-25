/**
 * POST /api/v1/apps/capabilities/seed — bootstrap capability presets.
 *
 * Native baseline: ensures every existing application doc has a paired
 * app_capabilities/{appId} record with at least the {viewer, editor, admin,
 * owner} role-preset map populated. Doesn't override existing entries.
 */
import { NextRequest, NextResponse } from "next/server";

import {
  appCapabilitiesCollection,
  applicationsCollection,
  writeAuditEntry,
} from "@/lib/admin/server/collections";
import { verifyCaller } from "@/lib/admin/server/auth-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_PRESETS: Record<string, string[]> = {
  viewer: [],
  editor: [],
  admin: ["*"],
  owner: ["*"],
};

export async function POST(req: NextRequest) {
  const caller = await verifyCaller(req);
  const appsSnap = await applicationsCollection().get();
  let created = 0;
  let updated = 0;
  for (const appDoc of appsSnap.docs) {
    const ref = appCapabilitiesCollection().doc(appDoc.id);
    const existing = await ref.get();
    const now = new Date().toISOString();
    if (!existing.exists) {
      await ref.set({
        app_id: appDoc.id,
        capabilities: [],
        role_presets: { ...DEFAULT_PRESETS },
        created_at: now,
        updated_at: now,
        seeded_by: caller?.uid ?? "system",
      });
      created += 1;
    } else {
      const data = existing.data() as { role_presets?: Record<string, string[]> };
      const merged: Record<string, string[]> = { ...DEFAULT_PRESETS, ...(data.role_presets ?? {}) };
      await ref.set({ role_presets: merged, updated_at: now }, { merge: true });
      updated += 1;
    }
  }
  await writeAuditEntry({
    action: "capabilities.seeded",
    created,
    updated,
    actor: caller?.uid ?? "system",
  });
  return NextResponse.json({ created, updated, synced_at: new Date().toISOString() });
}
