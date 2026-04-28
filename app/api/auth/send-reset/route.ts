/**
 * POST /api/auth/send-reset
 *
 * Generates a Firebase password-reset link via Admin SDK and sends it
 * through Resend from auth@mail.odum-research.com.
 *
 * Body: { email: string }
 *
 * The continueUrl points to /auth/reset-password so Firebase redirects the user
 * to our branded handler page after they click the link.
 */

import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { sendEmail, getSenderFor, escapeHtml } from "@/lib/email/resend";

export async function POST(request: Request) {
  let body: { email?: string };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email } = body;
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const auth = getAdminAuth();
  if (!auth) {
    return NextResponse.json({ ok: true, sent: false, reason: "no_admin_sdk" });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.odum-research.com";
  const continueUrl = `${siteUrl}/auth/reset-password`;

  let link: string;
  try {
    link = await auth.generatePasswordResetLink(email, { url: continueUrl });
  } catch (err) {
    console.error("[send-reset] generatePasswordResetLink failed", err);
    return NextResponse.json({ error: "Could not generate reset link" }, { status: 500 });
  }

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
      <h2 style="margin-bottom:4px">Reset your Odum password</h2>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
      <p>We received a request to reset the password for <strong>${escapeHtml(email)}</strong>.</p>
      <p style="margin:24px 0">
        <a href="${link}" style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:500;font-size:15px">
          Reset my password →
        </a>
      </p>
      <p style="color:#6b7280;font-size:13px">
        This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email: your password has not changed.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#9ca3af;font-size:12px">Odum Capital Ltd: FCA authorised · FRN 975797</p>
    </div>
  `;

  const result = await sendEmail({
    from: getSenderFor("auth"),
    to: email,
    subject: "Reset your Odum password",
    html,
  });

  if (!result.ok) {
    return NextResponse.json({ error: "Email send failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sent: result.sent, reason: result.reason });
}
