/**
 * GET /api/admin/submissions?collection=questionnaires|strategy_evaluations
 *
 * Admin-only. Reads the requested collection from BOTH Firebase projects
 * (`odum-staging` for UAT data, `central-element-323112` for prod data),
 * tags each row with its source environment, merges, sorts by
 * `submittedAt` desc, and returns a single combined list. Lets the
 * /admin/questionnaires + /admin/strategy-evaluations pages show
 * cross-environment results in one table.
 *
 * Auth: same belt-and-suspenders pattern as /api/strategy-review/issue-link
 *  - In production the Firebase Admin SDK is wired up; we verify the
 *    caller's ID token and require platform-admin role.
 *  - In mock mode (no Admin SDK available) the guard is a no-op so local
 *    dev works without a token.
 *
 * Per-environment failure isolation: if one project's read fails (network
 * / IAM / Firestore unavailable) the other still returns. The `errors`
 * array on the response carries which env(s) failed and why.
 */

import { NextRequest, NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase-admin";
import { isPlatformAdmin, verifyCaller } from "@/lib/admin/server/auth-context";
import { getFirestoreFor, PROJECT_KEYS, projectIdFor, type ProjectKey } from "@/lib/admin/server/firestore-clients";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_COLLECTIONS = new Set(["questionnaires", "strategy_evaluations"] as const);
type CollectionName = "questionnaires" | "strategy_evaluations";

interface SubmissionRow {
  readonly id: string;
  readonly env: ProjectKey;
  readonly projectId: string;
  readonly submittedAt: string | null;
  readonly data: Record<string, unknown>;
}

interface SubmissionsResponse {
  readonly ok: boolean;
  readonly collection: CollectionName;
  readonly rows: readonly SubmissionRow[];
  readonly errors: readonly { env: ProjectKey; reason: string }[];
}

async function guardAdmin(req: NextRequest): Promise<NextResponse | null> {
  const auth = getAdminAuth();
  if (!auth) {
    // Mock mode: permit so local dev works without a real Firebase Admin
    // SDK. Production deploys always have Admin SDK available + the
    // verifyCaller path engaged.
    return null;
  }
  const caller = await verifyCaller(req);
  if (!caller) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const isAdmin = await isPlatformAdmin(caller.uid);
  if (!isAdmin) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  return null;
}

/**
 * Convert a Firestore Timestamp / Date / string into an ISO string. Returns
 * null when the value is missing or unrecognised so the client can sort
 * with NULL-last semantics.
 */
function isoFromTimestamp(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value !== null && "toDate" in value) {
    try {
      const fn = (value as { toDate: () => Date }).toDate;
      if (typeof fn === "function") return fn.call(value).toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

async function fetchEnv(
  env: ProjectKey,
  collection: CollectionName,
): Promise<{ rows: SubmissionRow[]; error: { env: ProjectKey; reason: string } | null }> {
  try {
    const db = getFirestoreFor(env);
    // No orderBy() because not every doc has submittedAt populated; sort
    // client-side after the merge so missing-field rows still surface.
    const snap = await db.collection(collection).get();
    const rows: SubmissionRow[] = snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        env,
        projectId: projectIdFor(env),
        submittedAt: isoFromTimestamp(data["submittedAt"]),
        data,
      };
    });
    return { rows, error: null };
  } catch (err) {
    const reason = err instanceof Error ? err.message : "unknown";
    console.error(`[/api/admin/submissions] fetch failed for ${env}/${collection}:`, err);
    return { rows: [], error: { env, reason } };
  }
}

export async function GET(req: NextRequest) {
  const guard = await guardAdmin(req);
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const collectionRaw = searchParams.get("collection") ?? "";
  if (!VALID_COLLECTIONS.has(collectionRaw as CollectionName)) {
    return NextResponse.json(
      {
        ok: false,
        error: `collection must be one of: ${[...VALID_COLLECTIONS].join(", ")}`,
      },
      { status: 400 },
    );
  }
  const collection = collectionRaw as CollectionName;

  const results = await Promise.all(PROJECT_KEYS.map((env) => fetchEnv(env, collection)));
  const rows: SubmissionRow[] = [];
  const errors: { env: ProjectKey; reason: string }[] = [];
  for (const r of results) {
    rows.push(...r.rows);
    if (r.error) errors.push(r.error);
  }
  // Sort newest-first, NULL submittedAt to the end.
  rows.sort((a, b) => {
    if (a.submittedAt && b.submittedAt) return b.submittedAt.localeCompare(a.submittedAt);
    if (a.submittedAt) return -1;
    if (b.submittedAt) return 1;
    return 0;
  });

  const body: SubmissionsResponse = {
    ok: true,
    collection,
    rows,
    errors,
  };
  return NextResponse.json(body);
}
