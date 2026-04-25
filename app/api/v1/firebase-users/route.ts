/**
 * GET /api/v1/firebase-users — raw Firebase Auth user list (Admin SDK).
 */
import { NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = getAdminAuth();
  if (!auth) return NextResponse.json({ error: "Auth backend unavailable." }, { status: 503 });
  try {
    const list = await auth.listUsers(1000);
    const users = list.users.map((u) => ({
      uid: u.uid,
      email: u.email ?? "",
      display_name: u.displayName ?? "",
      disabled: u.disabled,
      custom_claims: u.customClaims ?? {},
      created_at: u.metadata.creationTime ?? null,
      last_sign_in: u.metadata.lastSignInTime ?? null,
    }));
    return NextResponse.json({ users, total: users.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
