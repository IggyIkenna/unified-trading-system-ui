/**
 * GET /api/strategy-review/verify?token=...
 *
 * Public — looks up a Strategy Review by magic token. Returns:
 *   200 { valid: true, doc: { id, email, prospect_name, expiresAt, createdAt } }
 *     when the token is found, not revoked, and not expired.
 *   404 { valid: false, reason: "not_found" }   when no doc matches.
 *   410 { valid: false, reason: "revoked" }     when revokedAt is set.
 *   410 { valid: false, reason: "expired" }     when expiresAt < now.
 *   400 { valid: false, reason: "missing_token" | "invalid_token" }
 *
 * Used by client-side polling if the page wants to re-verify (e.g. after a
 * revoke event). The server `page.tsx` does its own Admin-SDK lookup —
 * this endpoint exists so the same logic is callable from the client without
 * exposing Admin-SDK credentials. Returned `doc` deliberately omits the
 * magicToken field.
 */

import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    const existing = admin.apps[0];
    if (existing) return existing;
  }
  return admin.initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

function isoFromTimestamp(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
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

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ valid: false, reason: "missing_token" }, { status: 400 });
  }
  if (token.length < 16) {
    return NextResponse.json({ valid: false, reason: "invalid_token" }, { status: 400 });
  }

  let snap;
  try {
    const app = getAdminApp();
    const db = admin.firestore(app);
    snap = await db.collection("strategy_reviews").where("magicToken", "==", token).limit(1).get();
  } catch (err) {
    console.error("[strategy-review/verify] Firestore read failed", err);
    return NextResponse.json({ valid: false, reason: "lookup_failed" }, { status: 500 });
  }

  if (snap.empty) {
    return NextResponse.json({ valid: false, reason: "not_found" }, { status: 404 });
  }

  const docSnap = snap.docs[0]!;
  const data = docSnap.data();
  const revokedAt = isoFromTimestamp(data["revokedAt"]);
  const expiresAt = isoFromTimestamp(data["expiresAt"]);
  const createdAt = isoFromTimestamp(data["createdAt"]);

  if (revokedAt) {
    return NextResponse.json({ valid: false, reason: "revoked" }, { status: 410 });
  }
  if (expiresAt && Date.parse(expiresAt) < Date.now()) {
    return NextResponse.json({ valid: false, reason: "expired" }, { status: 410 });
  }

  // Construct response payload without ever assigning `undefined` to a field
  // (per memory feedback_firestore_undefined_rejection — applies to outputs
  // too where downstream consumers may relay this to Firestore).
  const doc: Record<string, unknown> = {
    id: docSnap.id,
    email: typeof data["email"] === "string" ? data["email"] : "",
    prospect_name: typeof data["prospect_name"] === "string" ? data["prospect_name"] : "",
  };
  const evaluation_id = data["evaluation_id"];
  if (typeof evaluation_id === "string" && evaluation_id.length > 0) {
    doc.evaluation_id = evaluation_id;
  }
  if (createdAt) doc.createdAt = createdAt;
  if (expiresAt) doc.expiresAt = expiresAt;

  return NextResponse.json({ valid: true, doc });
}
