/**
 * POST /api/v1/notifications/welcome — admin "send welcome / reset link" action.
 *
 * Generates a Firebase Auth password-reset link (Admin SDK) and emails it
 * via Resend. Used by ops to bootstrap a newly-onboarded user without
 * requiring them to remember a temporary password.
 */
import { NextRequest, NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase-admin";
import { writeAuditEntry } from "@/lib/admin/server/collections";
import { verifyCaller } from "@/lib/admin/server/auth-context";
import { sendEmail, getSenderFor } from "@/lib/email/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const caller = await verifyCaller(req);
  let payload: { email?: string };
  try {
    payload = (await req.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const email = payload.email?.trim();
  if (!email) return NextResponse.json({ error: "email is required." }, { status: 400 });
  const auth = getAdminAuth();
  if (!auth) return NextResponse.json({ error: "Auth backend unavailable." }, { status: 503 });

  let resetLink: string;
  try {
    resetLink = await auth.generatePasswordResetLink(email);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }

  let sentOk = false;
  try {
    const result = await sendEmail({
      to: email,
      from: getSenderFor("auth"),
      subject: "Welcome to Odum Research — set your password",
      html: `<p>Welcome aboard.</p><p>Click the link below to set your password and sign in:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
    });
    sentOk = result.ok && result.sent;
  } catch {
    sentOk = false;
  }

  await writeAuditEntry({
    action: "welcome.sent",
    email,
    sent_ok: sentOk,
    actor: caller?.uid ?? "system",
  });

  return NextResponse.json({
    success: sentOk,
    message: sentOk ? "Welcome email sent." : "Reset link generated; email delivery unavailable.",
    reset_link: resetLink,
  });
}
