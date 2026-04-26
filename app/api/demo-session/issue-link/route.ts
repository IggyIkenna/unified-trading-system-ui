/**
 * /api/demo-session/issue-link — admin-only.
 *
 * Funnel Coherence plan Workstream H. Mints a per-prospect demo-session
 * magic-link token after Strategy Review has landed. The token unlocks
 * selected /services/* surfaces in demo/UAT mode (mock data, scoped
 * entitlements, no production credentials, no destructive actions).
 *
 * Admin can choose whether to send the magic-link email automatically
 * (`send_email: true` — default) or skip the send and just receive the
 * link in the response (`send_email: false`) so they can verify/staging-
 * check first before forwarding manually.
 *
 * Mirrors /api/strategy-review/issue-link in shape; uses the
 * randomBytes(32) magic-token pattern from strategy-evaluation. Token is
 * written to Firestore demo_sessions/{sessionId} with persona profile,
 * surfaces in scope, expiry (default 30 days), createdBy, createdAt.
 */

import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import admin from "firebase-admin";

import { sendEmail, getSenderFor, escapeHtml, type SendResult } from "@/lib/email/resend";
import { routeResponseFromSend } from "@/lib/email/route-helpers";
import { callout, fallbackLink, heading, paragraph, primaryButton, wrapBrandedEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

const INTERNAL_ADDRESS = "info@odum-research.com";

const VALID_PERSONA_PROFILES = new Set([
  "im-allocator",
  "dart-signals-in",
  "dart-full",
  "odum-signals-counterparty",
  "investor-lp",
  "admin",
]);

const PERSONA_LABELS: Readonly<Record<string, string>> = {
  "im-allocator": "Odum-Managed Strategies",
  "dart-signals-in": "DART (Signals-In)",
  "dart-full": "DART (Full)",
  "odum-signals-counterparty": "Odum Signals",
  "investor-lp": "Investor Relations",
  admin: "Admin demo",
};

interface IssueLinkPayload {
  prospect_email?: string;
  prospect_name?: string;
  evaluation_id?: string;
  review_id?: string;
  persona_profile?: string;
  surfaces_in_scope?: string[];
  expires_in_days?: number;
  /** Default true. Set false to skip the email send and only return the link. */
  send_email?: boolean;
}

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
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  try {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "https://odum-research.com";
  }
}

export async function POST(request: Request) {
  let body: IssueLinkPayload;
  try {
    body = (await request.json()) as IssueLinkPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof body.prospect_email === "string" ? body.prospect_email.trim().toLowerCase() : "";
  const personaProfile = typeof body.persona_profile === "string" ? body.persona_profile : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Invalid prospect_email" }, { status: 400 });
  }
  if (!VALID_PERSONA_PROFILES.has(personaProfile)) {
    return NextResponse.json(
      { ok: false, error: `persona_profile must be one of: ${[...VALID_PERSONA_PROFILES].join(", ")}` },
      { status: 400 },
    );
  }

  const expiresInDays =
    typeof body.expires_in_days === "number" && body.expires_in_days > 0 && body.expires_in_days <= 90
      ? body.expires_in_days
      : 30;
  // Default to sending the email; admin can opt out via send_email: false.
  const shouldSendEmail = body.send_email !== false;

  const magicToken = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);
  const issuedBy = request.headers.get("x-user-id") ?? "admin";

  let sessionId: string;
  try {
    const app = getAdminApp();
    const db = admin.firestore(app);
    const ref = db.collection("demo_sessions").doc();
    await ref.set({
      prospect_email: email,
      prospect_name: typeof body.prospect_name === "string" ? body.prospect_name : "",
      evaluation_id: typeof body.evaluation_id === "string" ? body.evaluation_id : null,
      review_id: typeof body.review_id === "string" ? body.review_id : null,
      persona_profile: personaProfile,
      surfaces_in_scope: Array.isArray(body.surfaces_in_scope) ? body.surfaces_in_scope : [],
      magicToken,
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      revokedAt: null,
      issuedBy,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    sessionId = ref.id;
  } catch (err) {
    console.error("[demo-session/issue-link] persist failed", err);
    return NextResponse.json({ ok: false, error: "Persistence failed" }, { status: 500 });
  }

  const baseUrl = getSiteUrl(request);
  const link = `${baseUrl}/demo-session?token=${magicToken}`;

  // Email send (optional). When admin opts out, we skip the Resend round-
  // trip entirely so the response just carries the magic link for them to
  // copy and forward through their preferred channel after verifying.
  let emailSent = false;
  let emailReason: string | undefined;
  if (shouldSendEmail) {
    const greeting = body.prospect_name ? escapeHtml(body.prospect_name) : "";
    const personaLabel = PERSONA_LABELS[personaProfile] ?? personaProfile;
    const html = wrapBrandedEmail({
      preheader: "Your demo session is ready.",
      body: [
        heading("Your demo / UAT session is ready", "Odum Research"),
        paragraph(
          `${greeting ? `${greeting}, ` : ""}we've prepared a controlled demo session scoped to ${escapeHtml(
            personaLabel,
          )}. The link below opens our platform in demo / UAT mode &mdash; mock data, scoped entitlements, mutating actions disabled, with a persistent &ldquo;Demo / UAT&rdquo; banner on every surface.`,
        ),
        primaryButton({ href: link, label: "Open your demo session" }),
        fallbackLink({ href: link }),
        callout({
          title: "What this is and isn't",
          body: `<p style="margin:0 0 6px">It IS: the same surfaces our production clients use, configured for your evaluation. You can click around freely &mdash; no real client data is loaded.</p><p style="margin:0">It is NOT: production. No real account credentials, no withdrawal or destructive actions, no silent transition to production. Sign-up + onboarding happen separately after we agree the shape.</p>`,
        }),
        paragraph(
          `The link expires in ${expiresInDays} days for your security. If you'd like us to share with a colleague, reply to this email and we'll issue another link.`,
          { muted: true, small: true },
        ),
        paragraph(
          `Questions? Reply to this email or reach us at <a href="mailto:info@odum-research.com" style="color:#0891b2;text-decoration:none">info@odum-research.com</a>.`,
          { muted: true, small: true },
        ),
      ].join("\n"),
    });

    let sendResult: SendResult | undefined;
    try {
      sendResult = await sendEmail({
        from: getSenderFor("hello"),
        to: email,
        replyTo: INTERNAL_ADDRESS,
        subject: "Your Odum demo session is ready",
        html,
      });
    } catch (err) {
      console.error("[demo-session/issue-link] sendEmail threw", err);
      emailReason = err instanceof Error ? err.message : "send_threw";
    }

    if (sendResult) {
      const env = routeResponseFromSend(sendResult);
      emailSent = env.ok && env.sent === true;
      if (!emailSent) emailReason = "reason" in env ? env.reason : undefined;
    }
    if (!emailSent) {
      console.warn(`[demo-session/issue-link] email not sent for ${email}: ${emailReason ?? "?"}`);
    }
  }

  return NextResponse.json({
    ok: true,
    sessionId,
    magicToken,
    link,
    expiresAt: expiresAt.toISOString(),
    email_sent: emailSent,
    ...(emailReason ? { email_reason: emailReason } : {}),
    email_skipped: !shouldSendEmail,
  });
}
