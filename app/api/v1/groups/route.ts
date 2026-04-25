/**
 * GET  /api/v1/groups        — list user_groups + member counts
 * POST /api/v1/groups        — create group {name, description}
 */
import { NextRequest, NextResponse } from "next/server";

import { groupsCollection, writeAuditEntry } from "@/lib/admin/server/collections";
import { verifyCaller } from "@/lib/admin/server/auth-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snap = await groupsCollection().orderBy("name", "asc").get();
    const groups = snap.docs.map((d) => {
      const data = d.data() as { members?: unknown[] };
      return { id: d.id, ...data, member_count: (data.members ?? []).length };
    });
    return NextResponse.json({ groups, total: groups.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const caller = await verifyCaller(req);
  let payload: { name?: string; description?: string };
  try {
    payload = (await req.json()) as { name?: string; description?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const name = payload.name?.trim();
  if (!name) return NextResponse.json({ error: "name is required." }, { status: 400 });
  const now = new Date().toISOString();
  const ref = await groupsCollection().add({
    name,
    description: payload.description ?? "",
    members: [],
    created_at: now,
    updated_at: now,
    created_by: caller?.uid ?? "system",
  });
  await writeAuditEntry({ action: "group.created", group_id: ref.id, actor: caller?.uid ?? "system" });
  const created = await ref.get();
  return NextResponse.json({ group: { id: ref.id, ...created.data(), member_count: 0 } }, { status: 201 });
}
