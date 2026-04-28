/**
 * /api/demo-session/revoke — admin-only.
 *
 * Funnel Coherence plan Workstream H. Marks a demo-session as revoked
 * by setting revokedAt = now on the Firestore demo_sessions/{id} doc.
 * Subsequent /api/demo-session/verify calls return state: "revoked".
 *
 * Mirrors /api/strategy-review/revoke shape.
 */

import { NextResponse } from "next/server";
import admin from "firebase-admin";

import { getFirestoreFor } from "@/lib/admin/server/firestore-clients";

export const dynamic = "force-dynamic";

interface RevokePayload {
  id?: string;
}

export async function POST(request: Request) {
  let body: RevokePayload;
  try {
    body = (await request.json()) as RevokePayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
  }

  try {
    // Demo sessions live on UAT regardless of which env serves the
    // request (issue-link writes to UAT; revoke must update there).
    const db = getFirestoreFor("uat");
    const ref = db.collection("demo_sessions").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: "Demo session not found" }, { status: 404 });
    }
    await ref.update({
      revokedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[demo-session/revoke] failed", err);
    return NextResponse.json({ ok: false, error: "Persistence failed" }, { status: 500 });
  }
}
