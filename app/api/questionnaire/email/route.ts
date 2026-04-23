/**
 * POST /api/questionnaire/email
 *
 * Sends a questionnaire submission acknowledgement to the submitter (if email
 * provided) and an internal notification to info@odum-research.com.
 *
 * Called client-side after a successful Firestore write. Fire-and-forget:
 * email failure does not block the questionnaire submission success UX.
 */

import { NextResponse } from "next/server";
import { sendEmail, getSenderFor, escapeHtml } from "@/lib/email/resend";

const INTERNAL_ADDRESS = "info@odum-research.com";

const SERVICE_FAMILY_LABELS: Record<string, string> = {
  DART: "DART — Data Analytics, Research & Trading",
  RegUmbrella: "Regulatory Umbrella",
  combo: "DART + Regulatory Umbrella",
  Signals: "Odum Signals",
};

export async function POST(request: Request) {
  let body: {
    email?: string;
    firmName?: string;
    serviceFamily?: string;
    submissionId?: string;
    categories?: string[];
    fundStructure?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, firmName, serviceFamily, submissionId, categories, fundStructure } = body;
  const serviceName =
    SERVICE_FAMILY_LABELS[serviceFamily ?? ""] ?? serviceFamily ?? "Odum Platform";
  const displayName = firmName || email || "prospect";

  const sends: Promise<unknown>[] = [];

  // User acknowledgement (only when email is known)
  if (email) {
    const ackHtml = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
        <h2 style="margin-bottom:4px">Thanks for your questionnaire</h2>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
        <p>We've received your responses for <strong>${escapeHtml(serviceName)}</strong>${firmName ? ` (${escapeHtml(firmName)})` : ""}.</p>
        <p>
          A member of our team will review your answers and be in touch to discuss
          your strategy path and next steps.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#6b7280;font-size:13px">
          Questions? Reply to this email or contact us at
          <a href="mailto:info@odum-research.com" style="color:#111">info@odum-research.com</a>.
        </p>
        <p style="color:#9ca3af;font-size:12px">Odum Capital Ltd — FCA authorised · FRN 975797</p>
      </div>
    `;

    sends.push(
      sendEmail({
        from: getSenderFor("hello"),
        to: email,
        replyTo: INTERNAL_ADDRESS,
        subject: "Thanks for your questionnaire — Odum",
        html: ackHtml,
      }),
    );
  }

  // Internal notification
  const rows = [
    ["Firm", firmName || "—"],
    ["Email", email || "—"],
    ["Service family", serviceName],
    ["Categories", (categories ?? []).join(", ") || "—"],
    ["Fund structure", fundStructure || "—"],
    ["Submission ID", submissionId || "—"],
  ]
    .map(
      ([k, v], i) =>
        `<tr${i % 2 === 1 ? ' style="background:#f9f9f9"' : ""}><td style="padding:6px 12px;font-weight:bold;width:160px">${k}</td><td style="padding:6px 12px">${escapeHtml(String(v))}</td></tr>`,
    )
    .join("");

  const internalHtml = `
    <h2>New questionnaire submission</h2>
    <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
      ${rows}
    </table>
    <hr style="margin-top:24px">
    <p style="color:#888;font-size:12px">Sent via odum-research.com/questionnaire</p>
  `;

  sends.push(
    sendEmail({
      from: getSenderFor("hello"),
      to: INTERNAL_ADDRESS,
      replyTo: email,
      subject: `New questionnaire — ${displayName} (${serviceName})`,
      html: internalHtml,
    }),
  );

  await Promise.allSettled(sends);

  return NextResponse.json({ ok: true });
}
