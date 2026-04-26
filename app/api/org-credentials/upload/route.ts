/**
 * Credential request submit — METADATA ONLY.
 *
 * Funnel Coherence plan Workstream D4. This endpoint captures the
 * intent-to-connect record so admin can coordinate the actual secret
 * handover through an approved secure credential path (Secret Manager).
 *
 * Stored in Firestore at org_credentials/{orgId}/requests/{reqId} with:
 *   venue, accountType, intendedScope, contactNote, status: "pending_review",
 *   createdBy, createdAt.
 *
 * What this route MUST NOT do:
 *   - accept raw API keys or secrets in the payload
 *   - persist anything secret-shaped (no `api_key`, `secret`, `private_key`,
 *     `password`)
 *   - flip the org.has_uploaded_keys flag (that flips on admin approval +
 *     verified Secret Manager reference, not on raw form submit)
 */

import { NextResponse } from "next/server";
import admin from "firebase-admin";

export const dynamic = "force-dynamic";

interface CredentialRequestPayload {
  venue?: string;
  accountType?: string;
  intendedScope?: string;
  contactNote?: string;
}

const ALLOWED_VENUES = new Set(["binance", "bybit", "okx", "deribit", "coinbase", "kraken", "ig", "ibkr", "other"]);

const ALLOWED_SCOPES = new Set(["read-only", "execute-read"]);

const ALLOWED_ACCOUNT_TYPES = new Set(["spot", "perp", "futures", "options", "margin", "other"]);

function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    const existing = admin.apps[0];
    if (existing) return existing;
  }
  return admin.initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

function rejectIfSecretShaped(payload: Record<string, unknown>): string | null {
  const banned = ["apiKey", "api_key", "secret", "privateKey", "private_key", "password", "token"];
  for (const key of banned) {
    if (key in payload) {
      return `Field '${key}' is not accepted on this endpoint. Raw secrets are handled separately.`;
    }
  }
  return null;
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!raw || typeof raw !== "object") {
    return NextResponse.json({ ok: false, error: "Body must be an object" }, { status: 400 });
  }

  const body = raw as Record<string, unknown>;

  // Hard reject anything secret-shaped.
  const banReason = rejectIfSecretShaped(body);
  if (banReason) {
    return NextResponse.json({ ok: false, error: banReason }, { status: 400 });
  }

  const payload: CredentialRequestPayload = {
    venue: typeof body.venue === "string" ? body.venue : undefined,
    accountType: typeof body.accountType === "string" ? body.accountType : undefined,
    intendedScope: typeof body.intendedScope === "string" ? body.intendedScope : undefined,
    contactNote: typeof body.contactNote === "string" ? body.contactNote : undefined,
  };

  if (!payload.venue || !ALLOWED_VENUES.has(payload.venue)) {
    return NextResponse.json({ ok: false, error: "Invalid or missing venue" }, { status: 400 });
  }
  if (!payload.accountType || !ALLOWED_ACCOUNT_TYPES.has(payload.accountType)) {
    return NextResponse.json({ ok: false, error: "Invalid or missing accountType" }, { status: 400 });
  }
  if (!payload.intendedScope || !ALLOWED_SCOPES.has(payload.intendedScope)) {
    return NextResponse.json({ ok: false, error: "Invalid or missing intendedScope" }, { status: 400 });
  }

  // org_id resolution: in production this would come from the authenticated
  // user's session / token claims. For the MVP we accept an X-Org-Id header
  // OR fall back to "unknown-org" — admin will reconcile from contactNote.
  const orgId = request.headers.get("x-org-id") ?? "unknown-org";
  const createdBy = request.headers.get("x-user-id") ?? "anonymous";

  try {
    const app = getAdminApp();
    const db = admin.firestore(app);
    const ref = db.collection("org_credentials").doc(orgId).collection("requests").doc();
    await ref.set({
      orgId,
      venue: payload.venue,
      accountType: payload.accountType,
      intendedScope: payload.intendedScope,
      contactNote: payload.contactNote ?? "",
      status: "pending_review",
      createdBy,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, requestId: ref.id, status: "pending_review" });
  } catch (err) {
    console.error("[org-credentials/upload] persist failed", err);
    return NextResponse.json({ ok: false, error: "Persistence failed" }, { status: 500 });
  }
}
