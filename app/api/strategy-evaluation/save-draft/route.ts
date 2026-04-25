/**
 * POST /api/strategy-evaluation/save-draft
 *
 * In-progress form state, saved to Firestore so the user can resume across
 * devices / browsers. Keyed by a SHA-256 hash of the lowercased email so the
 * raw email never appears in the document ID.
 *
 * Body: { email: string, payload: Record<string, unknown> }
 *
 * Drafts live in `strategy_evaluation_drafts/{emailHash}`. One doc per email
 * (overwritten on each save). When the prospect actually submits — see
 * /api/strategy-evaluation/submit — we don't auto-delete the draft; admin can
 * pivot from email→draft history if useful.
 *
 * Always returns 200 with `{ ok: true }`. Never reveals whether a doc exists.
 */

import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import admin from "firebase-admin";

function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    const existing = admin.apps[0];
    if (existing) return existing;
  }
  return admin.initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

function emailHash(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 32);
}

export async function POST(request: Request) {
  let body: { email?: string; payload?: Record<string, unknown> };
  try {
    body = (await request.json()) as { email?: string; payload?: Record<string, unknown> };
  } catch {
    return NextResponse.json({ ok: true });
  }
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: true });
  }
  if (!body.payload || typeof body.payload !== "object") {
    return NextResponse.json({ ok: true });
  }

  try {
    const app = getAdminApp();
    const db = admin.firestore(app);
    const docId = emailHash(email);
    await db.collection("strategy_evaluation_drafts").doc(docId).set(
      {
        email: email.toLowerCase(),
        payload: body.payload,
        savedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: false },
    );
  } catch (err) {
    console.error("[strategy-evaluation/save-draft] failed", err);
  }

  return NextResponse.json({ ok: true });
}
