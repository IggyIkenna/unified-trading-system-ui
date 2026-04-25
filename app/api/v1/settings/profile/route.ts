/**
 * PUT /api/v1/settings/profile — caller updates their own displayName.
 *
 * Bearer-token authenticated. Updates Firebase Auth displayName and the
 * mirrored user_profiles.name. Refuses if the caller's uid doesn't match
 * the body uid (no impersonation via this endpoint).
 */
import { NextRequest, NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase-admin";
import { usersCollection, writeAuditEntry } from "@/lib/admin/server/collections";
import { verifyCaller } from "@/lib/admin/server/auth-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  const caller = await verifyCaller(req);
  if (!caller) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  let payload: { uid?: string; displayName?: string };
  try {
    payload = (await req.json()) as { uid?: string; displayName?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!payload.uid || payload.uid !== caller.uid) {
    return NextResponse.json({ error: "uid must match caller" }, { status: 403 });
  }
  if (!payload.displayName || !payload.displayName.trim()) {
    return NextResponse.json({ error: "displayName is required." }, { status: 400 });
  }
  const auth = getAdminAuth();
  if (!auth) return NextResponse.json({ error: "Auth backend unavailable." }, { status: 503 });
  await auth.updateUser(caller.uid, { displayName: payload.displayName.trim() });
  await usersCollection()
    .doc(caller.uid)
    .set({ name: payload.displayName.trim(), last_modified: new Date().toISOString() }, { merge: true });
  await writeAuditEntry({ action: "profile.updated", actor: caller.uid });
  return NextResponse.json({
    user: { firebase_uid: caller.uid, email: caller.email ?? "", displayName: payload.displayName.trim() },
  });
}
