/**
 * GET  /api/v1/github/assignments?firebase_uid=...  — list assignments
 * POST /api/v1/github/assignments                   — create + actually
 *      add the GitHub collaborator via Octokit. Falls back to a Firestore-
 *      only "pending" record when GITHUB_TOKEN is unset.
 */
import { NextRequest, NextResponse } from "next/server";

import {
  githubAssignmentsCollection,
  writeAuditEntry,
} from "@/lib/admin/server/collections";
import { verifyCaller } from "@/lib/admin/server/auth-context";
import { getGitHubClient, roleToGhPermission } from "@/lib/admin/server/integrations/github-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const uid = url.searchParams.get("firebase_uid");
  let q = githubAssignmentsCollection().orderBy("created_at", "desc");
  if (uid) q = q.where("firebase_uid", "==", uid) as typeof q;
  const snap = await q.limit(500).get();
  const assignments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ assignments, total: assignments.length });
}

interface AssignPayload {
  firebase_uid?: string;
  github_handle?: string;
  repo_full_name?: string;
  role?: "read" | "triage" | "write" | "maintain" | "admin";
}

export async function POST(req: NextRequest) {
  const caller = await verifyCaller(req);
  let payload: AssignPayload;
  try {
    payload = (await req.json()) as AssignPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!payload.firebase_uid || !payload.github_handle || !payload.repo_full_name || !payload.role) {
    return NextResponse.json(
      { error: "firebase_uid, github_handle, repo_full_name, and role are required." },
      { status: 400 },
    );
  }
  if (!payload.repo_full_name.includes("/")) {
    return NextResponse.json({ error: "repo_full_name must be 'owner/repo'." }, { status: 400 });
  }
  const [owner, repo] = payload.repo_full_name.split("/", 2) as [string, string];
  const now = new Date().toISOString();
  const octokit = getGitHubClient();
  let state: "pending" | "active" | "failed" = "pending";
  let detail: string | null = null;
  if (octokit) {
    try {
      await octokit.rest.repos.addCollaborator({
        owner,
        repo,
        username: payload.github_handle,
        permission: roleToGhPermission(payload.role),
      });
      state = "active";
    } catch (err) {
      state = "failed";
      detail = String(err);
    }
  } else {
    detail = "GITHUB_TOKEN not set — assignment recorded but not applied.";
  }
  const ref = await githubAssignmentsCollection().add({
    firebase_uid: payload.firebase_uid,
    github_handle: payload.github_handle,
    repo_full_name: payload.repo_full_name,
    role: payload.role,
    state,
    detail,
    created_at: now,
    updated_at: now,
    created_by: caller?.uid ?? "system",
  });
  await writeAuditEntry({
    action: "github.assignment.created",
    assignment_id: ref.id,
    repo_full_name: payload.repo_full_name,
    state,
    actor: caller?.uid ?? "system",
  });
  const created = await ref.get();
  return NextResponse.json(
    { assignment: { id: ref.id, ...created.data() } },
    { status: state === "failed" ? 502 : 201 },
  );
}
