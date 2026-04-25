/**
 * POST /api/v1/onboarding-requests/:id/approve
 *
 * Flips status=approved on the onboarding_requests doc, sets the user_profiles
 * status=active, enables the Firebase Auth account, optionally writes app
 * grants into app_entitlements, sends the applicant a "you're approved"
 * email via Resend, and writes an audit_log entry.
 */
import { NextRequest, NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase-admin";
import {
  appEntitlementsCollection,
  onboardingRequestsCollection,
  usersCollection,
  writeAuditEntry,
} from "@/lib/admin/server/collections";
import { verifyCaller } from "@/lib/admin/server/auth-context";
import { getDefaultServicesForUser } from "@/lib/admin/server/service-defaults";
import { sendEmail } from "@/lib/email/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ApprovePayload {
  note?: string;
  role?: string;
  app_grants?: { app_id: string; role: string; environments?: string[] }[];
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const caller = await verifyCaller(req);
  let payload: ApprovePayload;
  try {
    payload = (await req.json()) as ApprovePayload;
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
  const role = payload.role ?? "client";

  const auth = getAdminAuth();
  if (auth) {
    try {
      await auth.updateUser(uid, { disabled: false });
    } catch {
      /* user may already be enabled — non-fatal */
    }
  }

  await usersCollection()
    .doc(uid)
    .set(
      {
        status: "active",
        role,
        services: getDefaultServicesForUser(role, "active"),
        approved_at: now,
        last_modified: now,
      },
      { merge: true },
    );

  await ref.update({
    status: "approved",
    reviewer_uid: caller?.uid ?? null,
    review_note: payload.note ?? "",
    updated_at: now,
  });

  const grantedApps: string[] = [];
  for (const g of payload.app_grants ?? []) {
    if (!g.app_id || !g.role) continue;
    const existing = await appEntitlementsCollection()
      .where("app_id", "==", g.app_id)
      .where("subject_type", "==", "user")
      .where("subject_id", "==", uid)
      .limit(1)
      .get();
    if (existing.empty) {
      await appEntitlementsCollection().add({
        app_id: g.app_id,
        subject_type: "user",
        subject_id: uid,
        role: g.role,
        environments: g.environments ?? [],
        capabilities: null,
        created_at: now,
        created_by: caller?.uid ?? "system",
      });
    }
    grantedApps.push(g.app_id);
  }

  await writeAuditEntry({
    action: "signup.approved",
    onboarding_request_id: id,
    firebase_uid: uid,
    role,
    granted_apps: grantedApps,
    actor: caller?.uid ?? "system",
  });

  if (reqData.applicant_email) {
    try {
      await sendEmail({
        to: reqData.applicant_email,
        subject: "Your Odum Research account is now active",
        html: `<p>Hi ${reqData.applicant_name ?? ""},</p><p>Your account has been approved and you can now sign in.</p>${payload.note ? `<p><em>${payload.note}</em></p>` : ""}`,
      });
    } catch {
      /* email is best-effort */
    }
  }

  const updated = await ref.get();
  return NextResponse.json({
    request: { id: updated.id, ...updated.data() },
    user_status: "active",
    granted_apps: grantedApps,
  });
}
