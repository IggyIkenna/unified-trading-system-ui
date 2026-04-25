/**
 * POST /api/v1/onboarding-requests/:id/reject
 *
 * Flips status=rejected on the onboarding_requests doc + user_profiles
 * status=rejected. Optionally hard-deletes the Firebase Auth user when
 * delete_user is true (e.g. spam). Emails the applicant + writes audit.
 */
import { NextRequest, NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase-admin";
import {
  onboardingRequestsCollection,
  usersCollection,
  writeAuditEntry,
} from "@/lib/admin/server/collections";
import { verifyCaller } from "@/lib/admin/server/auth-context";
import { sendEmail } from "@/lib/email/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RejectPayload {
  note?: string;
  delete_user?: boolean;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const caller = await verifyCaller(req);
  let payload: RejectPayload;
  try {
    payload = (await req.json()) as RejectPayload;
  } catch {
    payload = {};
  }
  const ref = onboardingRequestsCollection().doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  const reqData = snap.data() as {
    firebase_uid?: string;
    applicant_email?: string;
    applicant_name?: string;
  };
  const uid = reqData.firebase_uid;
  if (!uid) return NextResponse.json({ error: "Request missing firebase_uid" }, { status: 400 });

  const now = new Date().toISOString();
  const auth = getAdminAuth();

  if (payload.delete_user && auth) {
    try {
      await auth.deleteUser(uid);
    } catch {
      /* user may already be deleted */
    }
    await usersCollection().doc(uid).delete().catch(() => {});
  } else {
    if (auth) {
      try {
        await auth.updateUser(uid, { disabled: true });
      } catch {
        /* non-fatal */
      }
    }
    await usersCollection()
      .doc(uid)
      .set({ status: "rejected", rejected_at: now, last_modified: now }, { merge: true });
  }

  await ref.update({
    status: "rejected",
    reviewer_uid: caller?.uid ?? null,
    review_note: payload.note ?? "",
    updated_at: now,
  });

  await writeAuditEntry({
    action: "signup.rejected",
    onboarding_request_id: id,
    firebase_uid: uid,
    deleted_user: !!payload.delete_user,
    actor: caller?.uid ?? "system",
  });

  if (reqData.applicant_email && !payload.delete_user) {
    try {
      await sendEmail({
        to: reqData.applicant_email,
        subject: "Update on your Odum Research application",
        html: `<p>Hi ${reqData.applicant_name ?? ""},</p><p>We've reviewed your application and unfortunately it has not been approved at this time.</p>${payload.note ? `<p><em>${payload.note}</em></p>` : ""}`,
      });
    } catch {
      /* email best-effort */
    }
  }

  const updated = await ref.get();
  return NextResponse.json({ request: { id: updated.id, ...updated.data() } });
}
