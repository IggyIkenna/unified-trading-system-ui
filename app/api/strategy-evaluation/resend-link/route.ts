/**
 * POST /api/strategy-evaluation/resend-link
 *
 * "I think I already submitted — please send me the access link."
 *
 * Body: { email: string }
 *
 * Always returns 200 with `{ ok: true }` so callers can't enumerate which
 * emails have submissions. If a submission exists for the email, we look up
 * the most recent doc, re-send the magic-link email to that address.
 *
 * Uses the Firebase Admin SDK (Cloud Run service account) — Firestore rules
 * deny anonymous reads so the client SDK can't be used here.
 */

import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { sendEmail, getSenderFor, escapeHtml } from "@/lib/email/resend";

const INTERNAL_ADDRESS = "info@odum-research.com";

const PATH_LABELS: Record<string, string> = {
  A: "Path A — DART Full",
  B: "Path B — DART Signals-In",
  C: "Path C — Regulatory Umbrella",
  D: "Path D — Odum Signals",
};

function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    const existing = admin.apps[0];
    if (existing) return existing;
  }
  return admin.initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

function getSiteUrl(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ ok: true });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: true });
  }

  try {
    const app = getAdminApp();
    const db = admin.firestore(app);
    // Most-recent doc for this email. Note: case-insensitive comparison handled
    // by lowercasing both sides — submissions store the original casing as-is,
    // so we need an extra filter pass below.
    const snap = await db.collection("strategy_evaluations").orderBy("submittedAt", "desc").limit(50).get();

    const matching = snap.docs.find((d) => {
      const e = d.data().email;
      return typeof e === "string" && e.trim().toLowerCase() === email;
    });

    if (!matching) {
      return NextResponse.json({ ok: true });
    }

    const data = matching.data();
    const token = typeof data.magicToken === "string" ? data.magicToken : null;
    if (!token) {
      return NextResponse.json({ ok: true });
    }

    const statusUrl = `${getSiteUrl(request)}/strategy-evaluation/status?token=${token}`;
    const strategyName = typeof data.strategyName === "string" ? data.strategyName : "your submission";
    const pathLabel = PATH_LABELS[typeof data.commercialPath === "string" ? data.commercialPath : ""] ?? "";

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
        <h2 style="margin-bottom:4px">Your access link</h2>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
        <p>You asked us to resend the access link for your strategy evaluation.</p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin:16px 0">
          <p style="margin:0 0 6px"><strong>Strategy:</strong> ${escapeHtml(strategyName)}</p>
          ${pathLabel ? `<p style="margin:0"><strong>Commercial path:</strong> ${escapeHtml(pathLabel)}</p>` : ""}
        </div>
        <p style="text-align:center;margin:24px 0">
          <a href="${statusUrl}"
             style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600">
            Open your submission
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${statusUrl}" style="color:#111;word-break:break-all">${statusUrl}</a>
        </p>
        <p style="color:#6b7280;font-size:13px">
          From there you can download your uploaded documents and edit / refile if anything needs to change.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:12px">Odum Capital Ltd — FCA authorised · FRN 975797</p>
      </div>
    `;

    await sendEmail({
      from: getSenderFor("hello"),
      to: email,
      replyTo: INTERNAL_ADDRESS,
      subject: "Your strategy evaluation access link — Odum",
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[strategy-evaluation/resend-link] failed", err);
    return NextResponse.json({ ok: true });
  }
}
