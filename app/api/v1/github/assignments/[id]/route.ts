/**
 * DELETE /api/v1/github/assignments/:id — revoke
 *
 * TODO Phase 4: Octokit `removeCollaborator` before deleting Firestore doc.
 */
import { NextRequest, NextResponse } from "next/server";

import {
  githubAssignmentsCollection,
  writeAuditEntry,
} from "@/lib/admin/server/collections";
import { verifyCaller } from "@/lib/admin/server/auth-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const caller = await verifyCaller(req);
  const ref = githubAssignmentsCollection().doc(id);
  const existing = await ref.get();
  if (!existing.exists) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  const data = existing.data() as { repo_full_name?: string; github_handle?: string };
  await ref.delete();
  await writeAuditEntry({
    action: "github.assignment.revoked",
    assignment_id: id,
    repo_full_name: data.repo_full_name ?? null,
    github_handle: data.github_handle ?? null,
    actor: caller?.uid ?? "system",
  });
  return NextResponse.json({ revoked: true, id });
}
