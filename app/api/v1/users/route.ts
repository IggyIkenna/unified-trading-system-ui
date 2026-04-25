/**
 * GET /api/v1/users — admin list of all users (Firebase Auth ⨝ user_profiles).
 */
import { NextResponse } from "next/server";

import { listUsersWithProfiles } from "@/lib/admin/server/users-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await listUsersWithProfiles();
    return NextResponse.json({ users, total: users.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
