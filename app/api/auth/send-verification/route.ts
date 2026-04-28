/**
 * POST /api/auth/send-verification
 *
 * Generates a Firebase email-verification link via Admin SDK and sends it
 * through Resend from auth@mail.odum-research.com.
 *
 * Body: { email: string }
 *
 * The continueUrl points to /auth/verify-email so Firebase redirects the user
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
  const continueUrl = `${siteUrl}/auth/verify-email`;

  let link: string;
  try {
    link = await auth.generateEmailVerificationLink(email, { url: continueUrl });
  } catch (err) {
    console.error("[send-verification] generateEmailVerificationLink failed", err);
    return NextResponse.json({ error: "Could not generate verification link" }, { status: 500 });
  }

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
      <h2 style="margin-bottom:4px">Verify your Odum email</h2>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
      <p>Click the button below to verify <strong>${escapeHtml(email)}</strong> and activate your account.</p>
      <p style="margin:24px 0">
        <a href="${link}" style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:500;font-size:15px">
          Verify my email →
        </a>
      </p>
      <p style="color:#6b7280;font-size:13px">
        This link expires in 24 hours. If you didn't create an Odum account, you can safely ignore this email.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#9ca3af;font-size:12px">Odum Capital Ltd: FCA authorised · FRN 975797</p>
    </div>
  `;

  const result = await sendEmail({
    from: getSenderFor("auth"),
    to: email,
    subject: "Verify your Odum email address",
    html,
  });

  if (!result.ok) {
    return NextResponse.json({ error: "Email send failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sent: result.sent, reason: result.reason });
}
