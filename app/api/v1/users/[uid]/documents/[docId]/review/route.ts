/**
 * PUT /api/v1/users/:uid/documents/:docId/review — admin sets review_status.
 * Body: { status: "approved" | "rejected" | "pending"; note?: string }
 */
import { NextRequest, NextResponse } from "next/server";

import { isPlatformAdmin, verifyCaller } from "@/lib/admin/server/auth-context";
import { userDocumentsCollection, writeAuditEntry } from "@/lib/admin/server/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["approved", "rejected", "pending"] as const;
type ReviewStatus = (typeof ALLOWED_STATUSES)[number];

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ uid: string; docId: string }> },
) {
  const { uid, docId } = await ctx.params;
  const actor = await verifyCaller(req);
  if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!(await isPlatformAdmin(actor.uid))) {
    return NextResponse.json({ error: "Only admins can review documents." }, { status: 403 });
  }

  let payload: { status?: string; note?: string } = {};
  try {
    payload = (await req.json()) as { status?: string; note?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const status = payload.status as ReviewStatus | undefined;
  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: "status must be approved, rejected, or pending." },
      { status: 400 },
    );
  }

  try {
    const ref = userDocumentsCollection().doc(docId);
    const doc = await ref.get();
    if (!doc.exists) return NextResponse.json({ error: "Document not found." }, { status: 404 });
    const data = doc.data() as { firebase_uid?: string };
    if (data.firebase_uid !== uid) {
      return NextResponse.json({ error: "Document does not belong to this user." }, { status: 404 });
    }

    await ref.set(
      {
        review_status: status,
        review_note: payload.note ?? "",
        reviewed_by: actor.uid,
        updated_at: new Date().toISOString(),
      },
      { merge: true },
    );
    await writeAuditEntry({
      action: `document.${status}`,
      firebase_uid: uid,
      document_id: docId,
      actor: actor.uid,
    });

    const updated = await ref.get();
    return NextResponse.json({
      document: { id: updated.id, ...(updated.data() as Record<string, unknown>) },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
