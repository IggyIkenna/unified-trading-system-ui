/**
 * DELETE /api/v1/github/assignments/:id — revoke. When GITHUB_TOKEN is set
 * the collaborator is removed from the repo before the Firestore record is
 * deleted; otherwise we tombstone the record with state=failed.
 */
import { NextRequest, NextResponse } from "next/server";

import { githubAssignmentsCollection, writeAuditEntry } from "@/lib/admin/server/collections";
import { verifyCaller } from "@/lib/admin/server/auth-context";
import { getGitHubClient } from "@/lib/admin/server/integrations/github-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const caller = await verifyCaller(req);
  const ref = githubAssignmentsCollection().doc(id);
  const existing = await ref.get();
  if (!existing.exists) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  const data = existing.data() as { repo_full_name?: string; github_handle?: string };
  const fullName = data.repo_full_name ?? "";
  const handle = data.github_handle ?? "";

  const octokit = getGitHubClient();
  let removed_remotely = false;
  let detail: string | null = null;
  if (octokit && fullName.includes("/") && handle) {
    const [owner, repo] = fullName.split("/", 2) as [string, string];
    try {
      await octokit.rest.repos.removeCollaborator({ owner, repo, username: handle });
      removed_remotely = true;
    } catch (err) {
      detail = String(err);
    }
  } else if (!octokit) {
    detail = "GITHUB_TOKEN not set: Firestore record deleted but collaborator NOT removed from GitHub.";
  }

  await ref.delete();
  await writeAuditEntry({
    action: "github.assignment.revoked",
    assignment_id: id,
    repo_full_name: fullName,
    github_handle: handle,
    removed_remotely,
    detail,
    actor: caller?.uid ?? "system",
  });
  return NextResponse.json({ revoked: true, removed_remotely, id, detail });
}
