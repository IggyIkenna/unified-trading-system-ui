/**
 * POST /api/strategy-review/revoke
 *
 * Admin-only. Sets `revokedAt: now` on a Strategy Review doc, identified by
 * either `{ token }` (magicToken match) or `{ id }` (Firestore doc ID). Once
 * revoked, the page handler renders a revoked-link error and `/api/.../verify`
 * returns 410.
 *
 * Auth: caller must be a platform admin (Firebase ID token validated via
 * Admin SDK). Mock mode (no Admin SDK wired) bypasses to support local dev.
 */

import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";

import { getAdminAuth } from "@/lib/firebase-admin";
import { isPlatformAdmin, verifyCaller } from "@/lib/admin/server/auth-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RevokeBody {
  readonly token?: unknown;
  readonly id?: unknown;
}

function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    const existing = admin.apps[0];
    if (existing) return existing;
  }
  return admin.initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

async function guardAdmin(req: NextRequest): Promise<NextResponse | null> {
  const auth = getAdminAuth();
  if (!auth) return null; // mock mode
  const caller = await verifyCaller(req);
  if (!caller) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const isAdmin = await isPlatformAdmin(caller.uid);
  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  const guard = await guardAdmin(req);
  if (guard) return guard;

  let body: RevokeBody;
  try {
    body = (await req.json()) as RevokeBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body", reason: "invalid_json" }, { status: 400 });
  }

  const token = typeof body.token === "string" && body.token.length > 0 ? body.token : null;
  const id = typeof body.id === "string" && body.id.length > 0 ? body.id : null;
  if (!token && !id) {
    return NextResponse.json(
      { ok: false, error: "Either `token` or `id` is required", reason: "missing_identifier" },
      { status: 400 },
    );
  }

  const app = getAdminApp();
  const db = admin.firestore(app);

  let docRef: admin.firestore.DocumentReference | null = null;
  try {
    if (id) {
      const ref = db.collection("strategy_reviews").doc(id);
      const snap = await ref.get();
      if (snap.exists) docRef = ref;
    } else if (token) {
      const snap = await db.collection("strategy_reviews").where("magicToken", "==", token).limit(1).get();
      if (!snap.empty) docRef = snap.docs[0]!.ref;
    }
  } catch (err) {
    console.error("[strategy-review/revoke] lookup failed", err);
    return NextResponse.json({ ok: false, error: "Firestore lookup failed", reason: "lookup_failed" }, { status: 500 });
  }

  if (!docRef) {
    return NextResponse.json({ ok: false, error: "Strategy review not found", reason: "not_found" }, { status: 404 });
  }

  try {
    await docRef.update({
      revokedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error("[strategy-review/revoke] update failed", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "unknown Firestore error",
        reason: "update_failed",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, id: docRef.id });
}
