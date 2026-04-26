/**
 * /api/demo-session/verify — token verification.
 *
 * Funnel Coherence plan Workstream H. Resolves a demo-session magic
 * token to its persona profile + surfaces-in-scope, returning whether
 * the token is valid (not expired, not revoked).
 *
 * Used by the /demo-session landing page and by middleware that gates
 * /services/* surfaces in demo/UAT mode.
 */

import { NextResponse } from "next/server";
import admin from "firebase-admin";

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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token || token.length < 16) {
    return NextResponse.json({ ok: false, error: "Missing or malformed token" }, { status: 400 });
  }

  try {
    const app = getAdminApp();
    const db = admin.firestore(app);
    const snap = await db.collection("demo_sessions").where("magicToken", "==", token).limit(1).get();
    if (snap.empty) {
      return NextResponse.json({ ok: false, state: "not-found" });
    }
    const docSnap = snap.docs[0]!;
    const data = docSnap.data();
    const expiresAt = isoFromTimestamp(data["expiresAt"]);
    const revokedAt = isoFromTimestamp(data["revokedAt"]);

    if (revokedAt) {
      return NextResponse.json({ ok: false, state: "revoked" });
    }
    if (expiresAt && Date.parse(expiresAt) < Date.now()) {
      return NextResponse.json({ ok: false, state: "expired" });
    }

    return NextResponse.json({
      ok: true,
      state: "valid",
      sessionId: docSnap.id,
      personaProfile: data["persona_profile"],
      surfacesInScope: Array.isArray(data["surfaces_in_scope"]) ? data["surfaces_in_scope"] : [],
      expiresAt,
    });
  } catch (err) {
    console.error("[demo-session/verify] failed", err);
    return NextResponse.json({ ok: false, state: "error" }, { status: 500 });
  }
}
