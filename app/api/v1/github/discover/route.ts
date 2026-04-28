/**
 * POST /api/v1/github/discover — walk the configured GitHub org and upsert
 * repos into github_repos. Falls back to a noop when GITHUB_TOKEN is unset.
 */
import { NextResponse } from "next/server";

import { githubReposCollection, writeAuditEntry } from "@/lib/admin/server/collections";
import { verifyCaller } from "@/lib/admin/server/auth-context";
import { getGitHubClient, getGitHubOrg } from "@/lib/admin/server/integrations/github-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const caller = await verifyCaller(req as never);
  const octokit = getGitHubClient();
  if (!octokit) {
    const snap = await githubReposCollection().get();
    return NextResponse.json({
      discovered: 0,
      updated: 0,
      total_in_store: snap.size,
      note: "GITHUB_TOKEN not set: discovery skipped. Set the secret to enable real walk.",
    });
  }
  const org = getGitHubOrg();
  let discovered = 0;
  let updated = 0;
  try {
    const iterator = octokit.paginate.iterator(octokit.rest.repos.listForOrg, {
      org,
      per_page: 100,
      type: "all",
    });
    for await (const page of iterator) {
      for (const r of page.data) {
        const ref = githubReposCollection().doc(String(r.id));
        const existed = (await ref.get()).exists;
        await ref.set(
          {
            id: r.id,
            full_name: r.full_name,
            name: r.name,
            owner: r.owner?.login ?? org,
            private: r.private,
            archived: r.archived,
            description: r.description ?? null,
            html_url: r.html_url,
            updated_at: r.updated_at ?? null,
            synced_at: new Date().toISOString(),
          },
          { merge: true },
        );
        if (existed) updated += 1;
        else discovered += 1;
      }
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
  await writeAuditEntry({
    action: "github.discover",
    org,
    discovered,
    updated,
    actor: caller?.uid ?? "system",
  });
  const snap = await githubReposCollection().get();
  return NextResponse.json({ discovered, updated, total_in_store: snap.size, org });
}
