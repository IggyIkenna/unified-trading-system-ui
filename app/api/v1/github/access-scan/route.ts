/**
 * GET /api/v1/github/access-scan?github_handle=...
 *
 * STUB — Phase 4 will run an Octokit walk over org repos and report the
 * handle's actual permission level for each one. For now returns an empty
 * scan that the admin UI handles gracefully.
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const handle = url.searchParams.get("github_handle") ?? "";
  return NextResponse.json({
    github_handle: handle,
    scanned_at: new Date().toISOString(),
    repos: [],
    note: "Native access-scan stub — Phase 4 wires Octokit per-repo permission read.",
  });
}
