/**
 * POST /api/v1/apps/sync — trigger a registered-apps sync.
 *
 * STUB — Phase 4 will wire any external app-registry source. For now this
 * just appends an app_sync_history record so the admin sync-history page
 * has data to render and the admin UI's "Sync now" button gives feedback.
 */
import { NextRequest, NextResponse } from "next/server";

import {
  appSyncHistoryCollection,
  applicationsCollection,
  writeAuditEntry,
} from "@/lib/admin/server/collections";
import { verifyCaller } from "@/lib/admin/server/auth-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const caller = await verifyCaller(req);
  const now = new Date().toISOString();
  const appsSnap = await applicationsCollection().get();
  const ref = await appSyncHistoryCollection().add({
    started_at: now,
    completed_at: now,
    status: "noop",
    apps_processed: appsSnap.size,
    apps_created: 0,
    apps_updated: 0,
    triggered_by: caller?.uid ?? "system",
    note: "Native portal sync stub — no external registry wired yet (Phase 4).",
  });
  await writeAuditEntry({ action: "apps.sync", run_id: ref.id, actor: caller?.uid ?? "system" });
  return NextResponse.json({
    run_id: ref.id,
    apps_processed: appsSnap.size,
    apps_created: 0,
    apps_updated: 0,
    started_at: now,
    completed_at: now,
    status: "noop",
  });
}
