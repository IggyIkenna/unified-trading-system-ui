/**
 * GET /api/v1/admin/stats — admin dashboard rollup.
 *
 * Returns counts for users / apps / groups / entitlements + the 10 most
 * recent audit-log entries. Cheap-enough to compute on demand for an admin
 * audience; if it grows we can cache via revalidate or a Firestore counter.
 */
import { NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase-admin";
import {
  appCapabilitiesCollection,
  appEntitlementsCollection,
  applicationsCollection,
  auditLogCollection,
  groupsCollection,
  usersCollection,
} from "@/lib/admin/server/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [authList, profilesSnap, appsSnap, capsSnap, groupsSnap, entSnap, auditSnap] = await Promise.all([
      getAdminAuth()?.listUsers(1000) ?? Promise.resolve({ users: [] as { disabled?: boolean }[] }),
      usersCollection().get(),
      applicationsCollection().get(),
      appCapabilitiesCollection().get(),
      groupsCollection().get(),
      appEntitlementsCollection().get(),
      auditLogCollection().orderBy("timestamp", "desc").limit(10).get(),
    ]);

    const totalAuthUsers = authList.users.length;
    const disabled = authList.users.filter((u) => u.disabled).length;
    const active = totalAuthUsers - disabled;

    let totalGroupMembers = 0;
    for (const g of groupsSnap.docs) {
      const data = g.data() as { members?: unknown[] };
      totalGroupMembers += (data.members ?? []).length;
    }

    const stats = {
      users: {
        total: totalAuthUsers || profilesSnap.size,
        active,
        disabled,
      },
      apps: { total: appsSnap.size, with_capabilities: capsSnap.size },
      groups: { total: groupsSnap.size, total_members: totalGroupMembers },
      entitlements: { total: entSnap.size },
      recent_audit: auditSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })),
    };
    return NextResponse.json(stats);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
