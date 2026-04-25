/**
 * GET  /api/v1/access-templates — list with assigned_user_count
 * POST /api/v1/access-templates — create new template
 */
import { NextRequest, NextResponse } from "next/server";

import {
  listTemplateAssignmentCounts,
  templatesCollection,
  validateAccessTemplatePayload,
  writeAuditEntry,
} from "@/lib/admin/server/collections";
import { verifyCaller } from "@/lib/admin/server/auth-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const counts = await listTemplateAssignmentCounts();
    const snap = await templatesCollection().orderBy("updated_at", "desc").get();
    const templates = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      assigned_user_count: counts[d.id] ?? 0,
    }));
    return NextResponse.json({ templates, total: templates.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const caller = await verifyCaller(req);
  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const errors = validateAccessTemplatePayload(payload, false);
  if (errors.length > 0) {
    return NextResponse.json({ error: "Validation failed.", details: errors }, { status: 400 });
  }
  const now = new Date().toISOString();
  const ref = await templatesCollection().add({
    name: String(payload.name).trim(),
    description: payload.description ?? "",
    aws_permission_sets: payload.aws_permission_sets ?? [],
    slack_channels: payload.slack_channels ?? [],
    github_teams: payload.github_teams ?? [],
    created_at: now,
    updated_at: now,
    created_by: caller?.uid ?? "system",
  });
  await writeAuditEntry({ action: "template.created", template_id: ref.id, actor: caller?.uid ?? "system" });
  const created = await ref.get();
  return NextResponse.json({ template: { id: ref.id, ...created.data() } }, { status: 201 });
}
