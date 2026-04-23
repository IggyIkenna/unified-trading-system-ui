/**
 * POST /api/contact
 *
 * Receives contact form submissions and:
 *   1. Sends an email to info@odum-research.co.uk via Resend
 *   2. Returns 200 on success, 500 on failure
 *
 * The client-side contact form also writes to Firestore `contact_submissions`
 * directly, so submissions are captured even if this route is unreachable.
 *
 * Email provider: Resend (resend.com) — set RESEND_API_KEY in env.
 * Sending domain must be verified in Resend dashboard (odum-research.co.uk).
 */

import { NextResponse } from "next/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO_ADDRESS = "info@odum-research.co.uk";
const FROM_ADDRESS = "website@odum-research.co.uk";
const BCC_ADDRESS = "ikenna@odum-research.com";

export async function POST(request: Request) {
  let body: {
    name?: string;
    email?: string;
    company?: string;
    inquiry?: string;
    message?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email, company, inquiry, message } = body;

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!RESEND_API_KEY) {
    // No email provider configured — log and return success so the Firestore
    // capture is still the record of truth in development.
    console.warn("[contact] RESEND_API_KEY not set — email not sent");
    return NextResponse.json({ ok: true, sent: false, reason: "no_api_key" });
  }

  const emailHtml = `
    <h2>New contact form submission</h2>
    <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
      <tr><td style="padding:6px 12px;font-weight:bold;width:120px">Name</td><td style="padding:6px 12px">${escapeHtml(name)}</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:6px 12px;font-weight:bold">Email</td><td style="padding:6px 12px"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold">Company</td><td style="padding:6px 12px">${company ? escapeHtml(company) : "—"}</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:6px 12px;font-weight:bold">Inquiry</td><td style="padding:6px 12px">${inquiry ? escapeHtml(inquiry) : "—"}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold;vertical-align:top">Message</td><td style="padding:6px 12px;white-space:pre-wrap">${escapeHtml(message)}</td></tr>
    </table>
    <hr style="margin-top:24px">
    <p style="color:#888;font-size:12px">Sent via odum-research.com contact form</p>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [TO_ADDRESS],
      bcc: [BCC_ADDRESS],
      reply_to: email,
      subject: `[odum-research.com] ${inquiry ?? "Contact form"} — ${name}`,
      html: emailHtml,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[contact] Resend error", res.status, err);
    return NextResponse.json({ error: "Email send failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sent: true });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
