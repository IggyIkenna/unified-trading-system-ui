/**
 * POST /api/contact
 *
 * Receives contact form submissions and sends an email notification via Resend.
 * The client-side contact form also writes to Firestore `contact_submissions`
 * directly, so submissions are captured even if this route is unreachable.
 *
 * Email provider: Resend (resend.com) — set RESEND_API_KEY in env.
 * Sending domain mail.odum-research.com must be verified in Resend dashboard.
 * reply_to is set to the submitter's email so replies go directly to them.
 */

import { NextResponse } from "next/server";
import { sendEmail, getSenderFor, escapeHtml } from "@/lib/email/resend";

const TO_ADDRESS = "info@odum-research.com";
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

  const html = `
    <h2>New contact form submission</h2>
    <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
      <tr><td style="padding:6px 12px;font-weight:bold;width:120px">Name</td><td style="padding:6px 12px">${escapeHtml(name)}</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:6px 12px;font-weight:bold">Email</td><td style="padding:6px 12px"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold">Company</td><td style="padding:6px 12px">${company ? escapeHtml(company) : "-"}</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:6px 12px;font-weight:bold">Inquiry</td><td style="padding:6px 12px">${inquiry ? escapeHtml(inquiry) : "-"}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold;vertical-align:top">Message</td><td style="padding:6px 12px;white-space:pre-wrap">${escapeHtml(message)}</td></tr>
    </table>
    <hr style="margin-top:24px">
    <p style="color:#888;font-size:12px">Sent via odum-research.com contact form</p>
  `;

  const result = await sendEmail({
    from: getSenderFor("hello"),
    to: TO_ADDRESS,
    bcc: [BCC_ADDRESS],
    replyTo: email,
    subject: `[odum-research.com] ${inquiry ?? "Contact form"}: ${name}`,
    html,
  });

  if (!result.ok) {
    return NextResponse.json({ error: "Email send failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sent: result.sent, reason: result.reason });
}
