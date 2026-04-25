/**
 * GET /api/strategy-evaluation/status?token=...
 *
 * Token-gated read of a strategy-evaluation submission. The token is generated
 * server-side at submit time, emailed to the user, and acts as both:
 *   - email-verification proof (first visit flips emailVerified=true)
 *   - access handle for the status page (no separate auth needed)
 *
 * Returns the submission as-is (filenames, urls of uploaded docs, sections A-P).
 * Returns 404 if the token doesn't match anything — never reveals existence.
 *
 * Uses the Firebase Admin SDK because Firestore security rules deny anonymous
 * reads on `strategy_evaluations/*` (only anonymous CREATE is allowed). Admin
 * SDK runs with the Cloud Run service account, bypassing rules.
 */

import { NextResponse } from "next/server";
import admin from "firebase-admin";

function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    const existing = admin.apps[0];
    if (existing) return existing;
  }
  // ADC: works on Cloud Run via the runtime service account; locally requires
  // `gcloud auth application-default login`.
  return admin.initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  try {
    const app = getAdminApp();
    const db = admin.firestore(app);

    const snap = await db.collection("strategy_evaluations").where("magicToken", "==", token).limit(1).get();

    if (snap.empty) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const docSnap = snap.docs[0];
    const data = docSnap.data();

    // First-time visit: flip emailVerified=true. Subsequent visits are no-ops.
    if (data.emailVerified !== true) {
      try {
        await docSnap.ref.update({
          emailVerified: true,
          emailVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (err) {
        // Non-fatal — viewing should still work even if the update fails
        console.error("[strategy-evaluation/status] emailVerified update failed", err);
      }
    }

    // Strip the magic token from the response — the user already has it in their URL.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { magicToken: _t, ...rest } = data;
    const submittedAt =
      data.submittedAt && typeof data.submittedAt.toDate === "function"
        ? data.submittedAt.toDate().toISOString()
        : data.submittedAt;

    return NextResponse.json({
      id: docSnap.id,
      ...rest,
      submittedAt,
    });
  } catch (err) {
    console.error("[strategy-evaluation/status] read failed", err);
    return NextResponse.json({ error: "Read failed" }, { status: 500 });
  }
}
