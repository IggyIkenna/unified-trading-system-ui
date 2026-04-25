/**
 * POST /api/v1/settings/change-password
 *
 * Bearer-token authenticated. Updates the caller's own password (or, when
 * caller is a platform admin, lets them rotate someone else's password —
 * useful for ops onboarding flows). Logs an audit entry either way.
 */
import { NextRequest, NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase-admin";
import { writeAuditEntry } from "@/lib/admin/server/collections";
import { isPlatformAdmin, verifyCaller } from "@/lib/admin/server/auth-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const caller = await verifyCaller(req);
  if (!caller) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  let payload: { uid?: string; newPassword?: string };
  try {
    payload = (await req.json()) as { uid?: string; newPassword?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const targetUid = payload.uid ?? caller.uid;
  const newPassword = payload.newPassword ?? "";
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }
  if (targetUid !== caller.uid) {
    const isAdmin = await isPlatformAdmin(caller.uid);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: cannot change another user's password." }, { status: 403 });
    }
  }
  const auth = getAdminAuth();
  if (!auth) return NextResponse.json({ error: "Auth backend unavailable." }, { status: 503 });
  try {
    await auth.updateUser(targetUid, { password: newPassword });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
  await writeAuditEntry({
    action: "password.changed",
    target_uid: targetUid,
    actor: caller.uid,
  });
  return NextResponse.json({ success: true });
}
