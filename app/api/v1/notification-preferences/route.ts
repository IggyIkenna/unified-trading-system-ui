/**
 * GET  /api/v1/notification-preferences      — list
 * POST /api/v1/notification-preferences      — create {event_type, recipient_email, enabled?}
 */
import { NextRequest, NextResponse } from "next/server";

import {
  notificationPreferencesCollection,
  writeAuditEntry,
} from "@/lib/admin/server/collections";
import { verifyCaller } from "@/lib/admin/server/auth-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await notificationPreferencesCollection().orderBy("event_type", "asc").get();
  const preferences = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ preferences, total: preferences.length });
}

interface PrefPayload {
  event_type?: string;
  recipient_email?: string;
  enabled?: boolean;
  description?: string;
}

export async function POST(req: NextRequest) {
  const caller = await verifyCaller(req);
  let payload: PrefPayload;
  try {
    payload = (await req.json()) as PrefPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!payload.event_type || !payload.recipient_email) {
    return NextResponse.json(
      { error: "event_type and recipient_email are required." },
      { status: 400 },
    );
  }
  const now = new Date().toISOString();
  const ref = await notificationPreferencesCollection().add({
    event_type: payload.event_type,
    recipient_email: payload.recipient_email,
    enabled: payload.enabled !== false,
    description: payload.description ?? "",
    created_at: now,
    updated_at: now,
    created_by: caller?.uid ?? "system",
  });
  await writeAuditEntry({
    action: "notification.created",
    preference_id: ref.id,
    actor: caller?.uid ?? "system",
  });
  const created = await ref.get();
  return NextResponse.json({ preference: { id: ref.id, ...created.data() } }, { status: 201 });
}
