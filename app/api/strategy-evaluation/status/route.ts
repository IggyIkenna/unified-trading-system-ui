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
 */

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  try {
    const [{ collection, getDocs, query, where, limit, doc: firestoreDoc, updateDoc }, { getFirebaseDb }] =
      await Promise.all([import("firebase/firestore"), import("@/lib/auth/firebase-config")]);

    const db = getFirebaseDb();
    if (!db) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const snap = await getDocs(
      query(collection(db, "strategy_evaluations"), where("magicToken", "==", token), limit(1)),
    );
    if (snap.empty) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const docSnap = snap.docs[0];
    const data = docSnap.data();

    // First-time visit: flip emailVerified=true. Subsequent visits are no-ops.
    if (data.emailVerified !== true) {
      try {
        await updateDoc(firestoreDoc(db, "strategy_evaluations", docSnap.id), {
          emailVerified: true,
          emailVerifiedAt: new Date().toISOString(),
        });
      } catch {
        // Non-fatal — viewing should still work even if the update is denied
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
