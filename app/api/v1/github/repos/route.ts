/**
 * GET /api/v1/github/repos — list github_repos from Firestore.
 */
import { NextResponse } from "next/server";

import { githubReposCollection } from "@/lib/admin/server/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await githubReposCollection().orderBy("full_name", "asc").get();
  const repos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ repos, total: repos.length });
}
