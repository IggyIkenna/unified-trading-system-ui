/**
 * GET /api/v1/authorize?app_id=...&uid=...&env=...
 *
 * Replacement for the legacy user-management-api `/api/v1/authorize`. Reads
 * user_groups + app_entitlements + app_capabilities + user_profiles via
 * Admin SDK and computes the same effective-access result the legacy API
 * returned, with identical wire shape so existing callers don't change.
 *
 * Wire compatibility: kept verbatim. Same query params, same response keys
 * (`authorized`, `role`, `capabilities`, `source`, `environments`,
 * `user_status`), same fail-soft behaviour (returns `authorized:false` on
 * any error rather than HTTP 500) so the portal's enrichment flow degrades
 * gracefully when Firestore is unreachable.
 */
import { NextRequest, NextResponse } from "next/server";

import { computeEffectiveAccess } from "@/lib/admin/server/auth-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const appId = url.searchParams.get("app_id") ?? "";
  const uid = url.searchParams.get("uid") ?? "";
  const env = url.searchParams.get("env");

  if (!appId || !uid) {
    return NextResponse.json(
      { error: "app_id and uid are required query parameters." },
      { status: 400 },
    );
  }

  try {
    const access = await computeEffectiveAccess(uid, appId, env);
    return NextResponse.json(access);
  } catch (error) {
    return NextResponse.json({
      authorized: false,
      role: null,
      capabilities: [],
      source: "none",
      environments: [],
      error: String(error),
    });
  }
}
