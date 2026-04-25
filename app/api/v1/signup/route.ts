/**
 * POST /api/v1/signup
 *
 * Native replacement for the legacy user-management-api /api/v1/signup. Wire
 * shape kept verbatim so [lib/api/signup-client.ts](../../../../lib/api/signup-client.ts)
 * needs no caller-side changes — only the URL switches from the external
 * Cloud Run service to this same-origin route.
 *
 * Steps (atomic-as-possible without a Firestore transaction across Auth):
 *   1. Validate payload (name / email / password ≥ 6 chars).
 *   2. Create or look up the Firebase Auth user (disabled until admin approves).
 *   3. Set the `client` custom-claim if newly created.
 *   4. Upsert the user_profiles record (status=pending_approval).
 *   5. Upsert the onboarding_requests record (one per firebase_uid).
 *   6. Write an audit_log entry.
 *   7. Best-effort: send applicant ack + admin fanout via Resend.
 *
 * The user can sign in only after an admin flips status from
 * pending_approval to active in the admin console.
 */
import { NextRequest, NextResponse } from "next/server";
import type { UserRecord } from "firebase-admin/auth";

import { getAdminAuth } from "@/lib/firebase-admin";
import {
  onboardingRequestsCollection,
  usersCollection,
  writeAuditEntry,
} from "@/lib/admin/server/collections";
import { getDefaultServicesForUser, notifyAdminsForEvent } from "@/lib/admin/server/service-defaults";
import { sendEmail, getSenderFor } from "@/lib/email/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SignupPayload {
  name?: string;
  email?: string;
  password?: string;
  company?: string | null;
  phone?: string | null;
  contact_channel?: string;
  contact_value?: string;
  service_type?: string;
  applicant_type?: string;
  selected_options?: string[];
  expected_aum?: string | null;
  entity_address?: string;
  questionnaire_response_id?: string;
  send_email_verification?: boolean;
}

export async function POST(req: NextRequest) {
  let payload: SignupPayload;
  try {
    payload = (await req.json()) as SignupPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { name, email, password } = payload;
  if (!email || !name || !password) {
    return NextResponse.json({ error: "name, email, and password are required." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const auth = getAdminAuth();
  if (!auth) {
    return NextResponse.json({ error: "Auth backend unavailable." }, { status: 503 });
  }

  let firebaseUser: UserRecord;
  let isExistingUser = false;
  try {
    firebaseUser = await auth.createUser({
      email,
      displayName: name,
      password,
      disabled: true,
    });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? "";
    const msg = String(err);
    if (code === "auth/email-already-exists" || msg.includes("email-already-exists") || msg.includes("already in use")) {
      try {
        firebaseUser = await auth.getUserByEmail(email);
        isExistingUser = true;
      } catch (lookupErr) {
        return NextResponse.json({ error: String(lookupErr) }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  if (!isExistingUser) {
    try {
      await auth.setCustomUserClaims(firebaseUser.uid, { role: "client", source: "self-signup" });
    } catch {
      /* claim-set is best-effort during signup; admin can fix later */
    }
  }

  const now = new Date().toISOString();
  const usersDoc = usersCollection().doc(firebaseUser.uid);
  const existingProfileSnap = await usersDoc.get();

  let profile: Record<string, unknown>;
  if (existingProfileSnap.exists) {
    profile = { id: firebaseUser.uid, ...(existingProfileSnap.data() as Record<string, unknown>) };
  } else {
    profile = {
      id: firebaseUser.uid,
      name,
      email,
      role: "client",
      status: "pending_approval",
      company: payload.company ?? null,
      phone: payload.phone ?? null,
      contact_channel: payload.contact_channel ?? null,
      contact_value: payload.contact_value ?? null,
      entity_address: payload.entity_address ?? null,
      provisioned_at: null,
      last_modified: now,
      created_at: now,
      services: getDefaultServicesForUser("client", "pending_approval"),
    };
    await usersDoc.set(profile);
  }

  const reqsCol = onboardingRequestsCollection();
  const existingReq = await reqsCol.where("firebase_uid", "==", firebaseUser.uid).limit(1).get();
  let reqId: string;
  if (!existingReq.empty) {
    const docRef = existingReq.docs[0]!.ref;
    await docRef.update({
      applicant_name: name,
      company: payload.company ?? null,
      phone: payload.phone ?? null,
      service_type: payload.service_type ?? "general",
      applicant_type: payload.applicant_type ?? null,
      selected_options: payload.selected_options ?? [],
      expected_aum: payload.expected_aum ?? null,
      entity_address: payload.entity_address ?? null,
      questionnaire_response_id: payload.questionnaire_response_id ?? null,
      updated_at: now,
    });
    reqId = docRef.id;
  } else {
    const newDoc = await reqsCol.add({
      firebase_uid: firebaseUser.uid,
      applicant_name: name,
      applicant_email: email,
      company: payload.company ?? null,
      phone: payload.phone ?? null,
      service_type: payload.service_type ?? "general",
      applicant_type: payload.applicant_type ?? null,
      selected_options: payload.selected_options ?? [],
      expected_aum: payload.expected_aum ?? null,
      entity_address: payload.entity_address ?? null,
      questionnaire_response_id: payload.questionnaire_response_id ?? null,
      status: "pending",
      reviewer_uid: null,
      review_note: "",
      created_at: now,
      updated_at: now,
    });
    reqId = newDoc.id;
  }

  await writeAuditEntry({
    action: "signup.submitted",
    firebase_uid: firebaseUser.uid,
    applicant_email: email,
    onboarding_request_id: reqId,
    actor: "self",
  });

  let emailVerificationPending = false;
  if (!isExistingUser && payload.send_email_verification) {
    try {
      // Generated link; we mail it via Resend rather than relying on Firebase's
      // built-in template (which is locked to the project's auth domain).
      const link = await auth.generateEmailVerificationLink(email);
      await sendEmail({
        to: email,
        from: getSenderFor("auth"),
        subject: "Verify your email — Odum Research",
        html: `<p>Hi ${name},</p><p>Please verify your email by clicking the link below:</p><p><a href="${link}">${link}</a></p><p>This link expires in 1 hour.</p>`,
      });
      emailVerificationPending = true;
    } catch {
      /* verification email is best-effort */
    }
  }

  // Applicant acknowledgement + admin fanout — both best-effort.
  try {
    await sendEmail({
      to: email,
      subject: "Application received — under review",
      html: `<p>Hi ${name},</p><p>Thank you for your application. Our team is reviewing your submission and you will receive an email once a decision has been made.</p><p>Your application reference: <strong>${reqId}</strong></p>`,
    });
  } catch {
    /* applicant ack is best-effort */
  }
  await notifyAdminsForEvent("signup_submitted", {
    subject: `New signup requires review: ${email}`,
    html: `<p>A new account application has been submitted:</p><ul><li><strong>Name:</strong> ${name}</li><li><strong>Email:</strong> ${email}</li><li><strong>Company:</strong> ${payload.company ?? "N/A"}</li><li><strong>Service:</strong> ${payload.service_type ?? "general"}</li></ul><p>Please review in the admin dashboard.</p>`,
  });

  return NextResponse.json(
    {
      user: { ...profile, firebase_uid: firebaseUser.uid },
      onboarding_request_id: reqId,
      questionnaire_response_id: payload.questionnaire_response_id ?? null,
      email_verification_pending: emailVerificationPending,
    },
    { status: 201 },
  );
}
