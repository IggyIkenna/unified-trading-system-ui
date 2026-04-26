/**
 * /api/demo-session/issue-link — admin-only.
 *
 * Funnel Coherence plan Workstream H. Mints a per-prospect demo-session
 * magic-link token after Strategy Review has landed. The token unlocks
 * selected /services/* surfaces in demo/UAT mode (mock data, scoped
 * entitlements, no production credentials, no destructive actions).
 *
 * Mirrors /api/strategy-review/issue-link in shape; uses the
 * randomBytes(32) magic-token pattern from strategy-evaluation. Token is
 * written to Firestore demo_sessions/{sessionId} with persona profile,
 * surfaces in scope, expiry (default 30 days), createdBy, createdAt.
 */

import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import admin from "firebase-admin";

export const dynamic = "force-dynamic";

const VALID_PERSONA_PROFILES = new Set([
  "im-allocator",
  "dart-signals-in",
  "dart-full",
  "odum-signals-counterparty",
  "investor-lp",
  "admin",
]);

interface IssueLinkPayload {
  prospect_email?: string;
  prospect_name?: string;
  evaluation_id?: string;
  review_id?: string;
  persona_profile?: string;
  surfaces_in_scope?: string[];
  expires_in_days?: number;
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

export async function POST(request: Request) {
  let body: IssueLinkPayload;
  try {
    body = (await request.json()) as IssueLinkPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof body.prospect_email === "string" ? body.prospect_email.trim().toLowerCase() : "";
  const personaProfile = typeof body.persona_profile === "string" ? body.persona_profile : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Invalid prospect_email" }, { status: 400 });
  }
  if (!VALID_PERSONA_PROFILES.has(personaProfile)) {
    return NextResponse.json(
      { ok: false, error: `persona_profile must be one of: ${[...VALID_PERSONA_PROFILES].join(", ")}` },
      { status: 400 },
    );
  }

  const expiresInDays =
    typeof body.expires_in_days === "number" && body.expires_in_days > 0 && body.expires_in_days <= 90
      ? body.expires_in_days
      : 30;

  const magicToken = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

  const issuedBy = request.headers.get("x-user-id") ?? "admin";

  try {
    const app = getAdminApp();
    const db = admin.firestore(app);
    const ref = db.collection("demo_sessions").doc();
    await ref.set({
      prospect_email: email,
      prospect_name: typeof body.prospect_name === "string" ? body.prospect_name : "",
      evaluation_id: typeof body.evaluation_id === "string" ? body.evaluation_id : null,
      review_id: typeof body.review_id === "string" ? body.review_id : null,
      persona_profile: personaProfile,
      surfaces_in_scope: Array.isArray(body.surfaces_in_scope) ? body.surfaces_in_scope : [],
      magicToken,
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      revokedAt: null,
      issuedBy,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://odum-research.com";
    const link = `${baseUrl}/demo-session?token=${magicToken}`;
    return NextResponse.json({
      ok: true,
      sessionId: ref.id,
      magicToken,
      link,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error("[demo-session/issue-link] persist failed", err);
    return NextResponse.json({ ok: false, error: "Persistence failed" }, { status: 500 });
  }
}
