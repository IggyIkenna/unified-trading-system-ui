/**
 * POST /api/strategy-evaluation/email
 *
 * Sends an acknowledgement to the submitter and an internal intake notification.
 * Fire-and-forget from the client — email failure does not block the submission UX.
 */

import { NextResponse } from "next/server";
import { sendEmail, getSenderFor, escapeHtml } from "@/lib/email/resend";

const INTERNAL_ADDRESS = "info@odum-research.com";

const PATH_LABELS: Record<string, string> = {
  A: "Path A: DART Full / incubation and rebuild",
  B: "Path B: DART Signals-In",
  C: "Path C: Regulatory Umbrella / read-only",
};

export async function POST(request: Request) {
  let body: {
    email?: string;
    strategyName?: string;
    leadResearcher?: string;
    commercialPath?: string;
    submissionId?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, strategyName, leadResearcher, commercialPath, submissionId } = body;
  const pathLabel = PATH_LABELS[commercialPath ?? ""] ?? commercialPath ?? "Unknown path";
  const displayName = leadResearcher || email || "prospect";

  const sends: Promise<unknown>[] = [];

  if (email) {
    const ackHtml = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
        <h2 style="margin-bottom:4px">Strategy Evaluation Pack received</h2>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
        <p>Thank you${leadResearcher ? `, ${escapeHtml(leadResearcher)}` : ""}: we've received your evaluation pack${strategyName ? ` for <strong>${escapeHtml(strategyName)}</strong>` : ""}.</p>
        <p>You've indicated <strong>${escapeHtml(pathLabel)}</strong> as your primary commercial interest.</p>
        <p>
          A member of our team will review your submission and be in touch to discuss
          architectural fit, next steps, and any follow-up questions.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#6b7280;font-size:13px">
          Questions in the meantime? Reply to this email or reach us at
          <a href="mailto:info@odum-research.com" style="color:#111">info@odum-research.com</a>.
        </p>
        <p style="color:#9ca3af;font-size:12px">Odum Capital Ltd: FCA authorised · FRN 975797</p>
      </div>
    `;

    sends.push(
      sendEmail({
        from: getSenderFor("hello"),
        to: email,
        replyTo: INTERNAL_ADDRESS,
        subject: `Strategy Evaluation Pack received${strategyName ? `: ${strategyName}` : ""}: Odum`,
        html: ackHtml,
      }),
    );
  }

  const rows = [
    ["Strategy", strategyName || "n/a"],
    ["Lead researcher", leadResearcher || "n/a"],
    ["Email", email || "n/a"],
    ["Commercial path", pathLabel],
    ["Submission ID", submissionId || "n/a"],
  ]
    .map(
      ([k, v], i) =>
        `<tr${i % 2 === 1 ? ' style="background:#f9f9f9"' : ""}><td style="padding:6px 12px;font-weight:bold;width:160px">${k}</td><td style="padding:6px 12px">${escapeHtml(String(v))}</td></tr>`,
    )
    .join("");

  sends.push(
    sendEmail({
      from: getSenderFor("hello"),
      to: INTERNAL_ADDRESS,
      replyTo: email,
      subject: `Strategy Evaluation: ${displayName}${strategyName ? ` / ${strategyName}` : ""} (${commercialPath ?? "?"})`,
      html: `
        <h2>New strategy evaluation submission</h2>
        <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
          ${rows}
        </table>
        <hr style="margin-top:24px">
        <p style="color:#888;font-size:12px">Sent via odum-research.com/strategy-evaluation</p>
      `,
    }),
  );

  await Promise.allSettled(sends);
  return NextResponse.json({ ok: true });
}
