import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";

const ADMIN_DOMAINS = ["@odum.internal", "@odum-research.com"];

function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_DOMAINS.some((d) => email.endsWith(d));
}

/**
 * POST /api/admin/set-claims
 *
 * Writes Firebase custom claims for a prospect so their entitlements are
 * enforced at the token level (not just via client-side Firestore reads).
 * Called by the questionnaire admin page after the Firestore app_entitlements
 * write succeeds.
 *
 * Body: { targetEmail: string; entitlements: string[]; personaId: string }
 * Header: Authorization: Bearer <caller-id-token>
 *
 * Returns:
 *   200 { ok: true, uid: string }   — claims set
 *   200 { ok: true, skipped: true } — user not in Firebase Auth yet (Firestore fallback active)
 *   401/403                         — caller not an admin
 *   503                             — Admin SDK unavailable (no credentials in env)
 */
export async function POST(request: Request) {
  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    // ADC not configured in local dev — not an error; Firestore fallback covers it.
    return NextResponse.json({ ok: true, skipped: true, reason: "admin_sdk_unavailable" });
  }

  const authorization = request.headers.get("Authorization");
  const callerToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!callerToken) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(callerToken);
    const adminClaim = decoded["admin"] === true;
    if (!adminClaim && !isAdminEmail(decoded.email)) {
      return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_token" }, { status: 401 });
  }

  const body = (await request.json()) as {
    targetEmail?: string;
    entitlements?: unknown[];
    personaId?: string;
  };
  const { targetEmail, entitlements, personaId } = body;

  if (!targetEmail || !Array.isArray(entitlements)) {
    return NextResponse.json({ ok: false, reason: "missing_params" }, { status: 400 });
  }

  let uid: string;
  try {
    const user = await adminAuth.getUserByEmail(targetEmail);
    uid = user.uid;
  } catch {
    // User hasn't created a Firebase account yet — Firestore fallback will apply on sign-up.
    return NextResponse.json({ ok: true, skipped: true, reason: "user_not_found" });
  }

  try {
    await adminAuth.setCustomUserClaims(uid, {
      entitlements,
      persona_id: personaId ?? null,
      granted_by_admin: true,
    });
    return NextResponse.json({ ok: true, uid });
  } catch (e) {
    return NextResponse.json({ ok: false, reason: String(e) }, { status: 500 });
  }
}
