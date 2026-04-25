/**
 * POST /api/v1/github/discover — repository discovery STUB.
 *
 * TODO Phase 4: instantiate Octokit with the GitHub App or PAT (read from
 * Secret Manager via UnifiedCloudConfig), enumerate organisation repos,
 * upsert into github_repos. For now this is a noop that returns the
 * current Firestore inventory unchanged so the admin UI's "Refresh" button
 * gives feedback without the network round-trip.
 */
import { NextResponse } from "next/server";

import { githubReposCollection } from "@/lib/admin/server/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const snap = await githubReposCollection().get();
  return NextResponse.json({
    discovered: 0,
    updated: 0,
    total_in_store: snap.size,
    note: "Native discovery stub — Phase 4 wires real Octokit walk.",
  });
}
