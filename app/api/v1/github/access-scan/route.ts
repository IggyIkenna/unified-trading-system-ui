/**
 * GET /api/v1/github/access-scan?github_handle=...
 *
 * Walks the configured org's repos and reports the handle's actual
 * collaborator permission per repo. Falls back to an empty scan when
 * GITHUB_TOKEN is not configured.
 */
import { NextRequest, NextResponse } from "next/server";

import { githubReposCollection } from "@/lib/admin/server/collections";
import { getGitHubClient } from "@/lib/admin/server/integrations/github-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RepoPermission {
  full_name: string;
  permission: "admin" | "maintain" | "write" | "triage" | "read" | "none" | string;
  has_access: boolean;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const handle = url.searchParams.get("github_handle")?.trim() ?? "";
  if (!handle) return NextResponse.json({ error: "github_handle is required" }, { status: 400 });

  const octokit = getGitHubClient();
  if (!octokit) {
    return NextResponse.json({
      github_handle: handle,
      scanned_at: new Date().toISOString(),
      repos: [],
      note: "GITHUB_TOKEN not set — scan skipped.",
    });
  }

  // Use the cached github_repos inventory from the latest discover.
  const reposSnap = await githubReposCollection().get();
  const repos: RepoPermission[] = [];
  for (const r of reposSnap.docs) {
    const data = r.data() as { full_name?: string; owner?: string; name?: string };
    const fullName = data.full_name ?? "";
    if (!fullName.includes("/")) continue;
    const [owner, repo] = fullName.split("/", 2) as [string, string];
    try {
      const res = await octokit.rest.repos.getCollaboratorPermissionLevel({ owner, repo, username: handle });
      const perm = res.data.permission ?? "none";
      repos.push({ full_name: fullName, permission: perm, has_access: perm !== "none" });
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 404) {
        repos.push({ full_name: fullName, permission: "none", has_access: false });
      }
      // Other errors (rate limit, auth) — just skip the repo to keep the scan partial-tolerant.
    }
  }

  return NextResponse.json({
    github_handle: handle,
    scanned_at: new Date().toISOString(),
    repos,
    total_repos: reposSnap.size,
    accessible_count: repos.filter((r) => r.has_access).length,
  });
}
