/**
 * POST /api/strategy-evaluation/submit
 *
 * Persists a Strategy Evaluation Form submission to Firestore and sends:
 *   - An acknowledgement to the submitter (if email provided)
 *   - An internal notification to info@odum-research.com
 *
 * Body: the full strategy evaluation form payload (sections A-P).
 */

import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { sendEmail, getSenderFor, escapeHtml } from "@/lib/email/resend";

const INTERNAL_ADDRESS = "info@odum-research.com";

const PATH_LABELS: Record<string, string> = {
  A: "Path A — DART Full / incubation and rebuild",
  B: "Path B — DART Signals-In / client signals, Odum execution",
  C: "Path C — Regulatory Umbrella / read-only API integration",
};

function getSiteUrl(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  // Fallback to request origin (covers Cloud Run URL access)
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email : undefined;
  const strategyName = typeof body.strategyName === "string" ? body.strategyName : "Unnamed Strategy";
  const leadResearcher = typeof body.leadResearcher === "string" ? body.leadResearcher : undefined;
  const commercialPath = typeof body.commercialPath === "string" ? body.commercialPath : undefined;
  const pathLabel = PATH_LABELS[commercialPath ?? ""] ?? commercialPath ?? "—";

  // Generate a magic token: doubles as email-verification proof and
  // a stable handle for the status page (`/strategy-evaluation/status?token=...`).
  const magicToken = randomBytes(32).toString("hex");
  const statusUrl = `${getSiteUrl(request)}/strategy-evaluation/status?token=${magicToken}`;

  // Persist to Firestore
  let submissionId: string | undefined;
  try {
    const [{ addDoc, collection, serverTimestamp }, { getFirebaseDb }] = await Promise.all([
      import("firebase/firestore"),
      import("@/lib/auth/firebase-config"),
    ]);
    const db = getFirebaseDb();
    if (db) {
      const docRef = await addDoc(collection(db, "strategy_evaluations"), {
        ...body,
        magicToken,
        emailVerified: false,
        submittedAt: serverTimestamp(),
      });
      submissionId = docRef.id;
    }
  } catch (err) {
    console.error("[strategy-evaluation] Firestore write failed", err);
  }

  const sends: Promise<unknown>[] = [];

  // Acknowledgement to submitter
  if (email) {
    const ackHtml = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
        <h2 style="margin-bottom:4px">Your strategy evaluation has been received</h2>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
        <p>Thank you${leadResearcher ? `, ${escapeHtml(leadResearcher)}` : ""} — we've received your evaluation of <strong>${escapeHtml(strategyName)}</strong>.</p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin:16px 0">
          <p style="margin:0 0 6px"><strong>Strategy:</strong> ${escapeHtml(strategyName)}</p>
          <p style="margin:0"><strong>Commercial path:</strong> ${escapeHtml(pathLabel)}</p>
        </div>
        <p>
          Click below to confirm your email address and view your submission.
          From there you can download your uploaded documents and edit / resubmit
          if anything needs to change:
        </p>
        <p style="text-align:center;margin:24px 0">
          <a href="${statusUrl}"
             style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600">
            Confirm email and view submission
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${statusUrl}" style="color:#111;word-break:break-all">${statusUrl}</a>
        </p>
        <p>
          Our team will review the evaluation carefully and be in touch within
          <strong>3 business days</strong> to discuss fit, next steps, and any
          clarifying questions.
        </p>
        <p style="color:#6b7280;font-size:13px">
          Questions in the meantime? Reply to this email or reach us at
          <a href="mailto:info@odum-research.com" style="color:#111">info@odum-research.com</a>.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:12px">Odum Capital Ltd — FCA authorised · FRN 975797</p>
      </div>
    `;

    sends.push(
      sendEmail({
        from: getSenderFor("hello"),
        to: email,
        replyTo: INTERNAL_ADDRESS,
        subject: `Your strategy evaluation has been received — Odum`,
        html: ackHtml,
      }),
    );
  }

  // Internal notification
  const metrics = [
    ["Strategy", strategyName],
    ["Lead researcher", leadResearcher || "—"],
    ["Email", email || "—"],
    ["Commercial path", pathLabel],
    ["Asset groups", Array.isArray(body.assetGroups) ? (body.assetGroups as string[]).join(", ") : "—"],
    ["Strategy family", typeof body.strategyFamily === "string" ? body.strategyFamily : "—"],
    ["Sharpe ratio", typeof body.sharpeRatio === "string" ? body.sharpeRatio : "—"],
    ["Max drawdown", typeof body.maxDrawdown === "string" ? body.maxDrawdown : "—"],
    ["Submission ID", submissionId || "—"],
  ]
    .map(
      ([k, v], i) =>
        `<tr${i % 2 === 1 ? ' style="background:#f9f9f9"' : ""}><td style="padding:6px 12px;font-weight:bold;width:180px">${k}</td><td style="padding:6px 12px">${escapeHtml(String(v))}</td></tr>`,
    )
    .join("");

  const internalHtml = `
    <h2>New strategy evaluation — ${escapeHtml(strategyName)}</h2>
    <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
      ${metrics}
    </table>
    <hr style="margin-top:24px">
    <p style="color:#888;font-size:12px">Submitted via odum-research.com/strategy-evaluation</p>
  `;

  sends.push(
    sendEmail({
      from: getSenderFor("hello"),
      to: INTERNAL_ADDRESS,
      replyTo: email,
      subject: `New strategy evaluation — ${strategyName} (${pathLabel})`,
      html: internalHtml,
    }),
  );

  await Promise.allSettled(sends);

  return NextResponse.json({ ok: true, submissionId });
}
