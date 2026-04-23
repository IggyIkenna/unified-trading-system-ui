/**
 * POST /api/onboarding/confirm-email
 *
 * Sends a welcome confirmation email after a prospect creates their Odum account
 * via the sign-up wizard (investment management or regulatory umbrella path).
 *
 * Sends to:  the prospect's email address
 * BCC:       ikenna@odum-research.com (operator copy)
 * From:      onboarding@mail.odum-research.com
 *
 * Sending domain mail.odum-research.com must be verified in Resend dashboard.
 *
 * If RESEND_API_KEY is absent (local dev) the route returns 200 with
 * sent=false so the wizard's UX is unaffected — the account has already
 * been created in Firebase.
 */

import { NextResponse } from "next/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS = "onboarding@mail.odum-research.com";
const BCC_ADDRESS = "ikenna@odum-research.com";
const PLATFORM_URL = "https://app.odum-research.com";

const SERVICE_NAMES: Record<string, string> = {
  investment: "Investment Management",
  regulatory: "Regulatory Umbrella",
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  let body: {
    email?: string;
    name?: string;
    company?: string;
    serviceType?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, name, company, serviceType } = body;
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  if (!RESEND_API_KEY) {
    console.warn("[confirm-email] RESEND_API_KEY not set — skipping email send");
    return NextResponse.json({ ok: true, sent: false, reason: "no_api_key" });
  }

  const displayName = name ?? email;
  const serviceName = SERVICE_NAMES[serviceType ?? ""] ?? "Odum Platform";
  const companyLine = company ? `<p style="margin:0 0 8px">Firm: <strong>${escapeHtml(company)}</strong></p>` : "";

  const emailHtml = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
      <h2 style="margin-bottom:4px">Welcome to Odum</h2>
      <p style="color:#555;margin-top:0">Your account is confirmed.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
      <p>Hi ${escapeHtml(displayName)},</p>
      <p>
        Your account has been created for <strong>${serviceName}</strong>.
        You can log in to the platform using the email address you registered with:
      </p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin:16px 0">
        <p style="margin:0 0 8px"><strong>Email (username):</strong> ${escapeHtml(email)}</p>
        ${companyLine}
        <p style="margin:0;color:#6b7280;font-size:13px">
          Your password was set during registration and is stored securely.
          Odum never sees or stores your password in plain text.
        </p>
      </div>
      <p>
        A member of our team will review your application and be in touch shortly
        to discuss next steps for your ${escapeHtml(serviceName)} mandate.
      </p>
      <p>In the meantime, you're welcome to explore the platform:</p>
      <p>
        <a href="${PLATFORM_URL}" style="display:inline-block;background:#111;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:500">
          Log in to Odum →
        </a>
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#6b7280;font-size:13px">
        If you have questions, reply to this email or contact us at
        <a href="mailto:info@odum-research.co.uk" style="color:#111">info@odum-research.co.uk</a>.
      </p>
      <p style="color:#9ca3af;font-size:12px">Odum Capital Ltd — FCA authorised · FRN 975797</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [email],
      bcc: [BCC_ADDRESS],
      subject: `Your Odum account is confirmed — ${serviceName}`,
      html: emailHtml,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[confirm-email] Resend error", res.status, err);
    return NextResponse.json({ error: "Email send failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sent: true });
}
