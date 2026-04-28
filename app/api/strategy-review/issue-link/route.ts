/**
 * POST /api/strategy-review/issue-link
 *
 * Admin-only. Mints a per-prospect magic-link token for Strategy Review and
 * persists a doc to Firestore `strategy_reviews/{auto-id}`. Sends the
 * recipient an email with `${siteUrl}/strategy-review?token=<magicToken>` via
 * the existing Resend pipeline.
 *
 * Body: { email, prospect_name, evaluation_id?, ttl_days? }
 *
 * Auth: caller must be a platform admin (Firebase ID token via Authorization
 * header, validated via Admin SDK). Mock mode (no Firebase Admin SDK) bypasses
 * the check so local dev works against the emulator suite.
 */

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import admin from "firebase-admin";

import { sendEmail, getSenderFor, escapeHtml, type SendResult } from "@/lib/email/resend";
import { routeResponseFromSend } from "@/lib/email/route-helpers";
import { callout, fallbackLink, heading, paragraph, primaryButton, wrapBrandedEmail } from "@/lib/email/templates";
import { getAdminAuth } from "@/lib/firebase-admin";
import { isPlatformAdmin, verifyCaller } from "@/lib/admin/server/auth-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INTERNAL_ADDRESS = "info@odum-research.com";
const DEFAULT_TTL_DAYS = 30;
const MAX_TTL_DAYS = 365;

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

interface IssueLinkBody {
  readonly email?: unknown;
  readonly prospect_name?: unknown;
  readonly evaluation_id?: unknown;
  readonly ttl_days?: unknown;
  /** allocator / builder / regulatory — drives Strategy Review section ordering. */
  readonly engagement_intent?: unknown;
  /** SSOT route id — pooled-fund-affiliate / sma-direct / combined / unsure. */
  readonly preferred_route?: unknown;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ENGAGEMENT_INTENTS = new Set(["allocator", "builder", "regulatory"] as const);
const VALID_PREFERRED_ROUTES = new Set(["pooled-fund-affiliate", "sma-direct", "combined", "unsure"] as const);

/**
 * Admin guard. Returns null when authorized; otherwise a NextResponse to
 * return immediately. Mock mode (no Firebase Admin Auth wired up) is treated
 * as authorized so local dev works without a token. Production sets the env
 * vars and the guard engages.
 */
async function guardAdmin(req: NextRequest): Promise<NextResponse | null> {
  const auth = getAdminAuth();
  if (!auth) {
    // Mock mode — no Firebase Admin available. Permit so local dev / emulator
    // suite works. Production deploys always have Admin SDK configured.
    return null;
  }
  const caller = await verifyCaller(req);
  if (!caller) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const isAdmin = await isPlatformAdmin(caller.uid);
  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  const guard = await guardAdmin(req);
  if (guard) return guard;

  let body: IssueLinkBody;
  try {
    body = (await req.json()) as IssueLinkBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body", reason: "invalid_json" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const prospect_name = typeof body.prospect_name === "string" ? body.prospect_name.trim() : "";
  const evaluation_id =
    typeof body.evaluation_id === "string" && body.evaluation_id.trim().length > 0
      ? body.evaluation_id.trim()
      : undefined;
  const ttl_days_raw = typeof body.ttl_days === "number" ? body.ttl_days : DEFAULT_TTL_DAYS;
  const ttl_days = Math.max(1, Math.min(MAX_TTL_DAYS, Math.floor(ttl_days_raw)));

  const engagement_intent =
    typeof body.engagement_intent === "string" && VALID_ENGAGEMENT_INTENTS.has(body.engagement_intent as "allocator")
      ? (body.engagement_intent as "allocator" | "builder" | "regulatory")
      : undefined;
  const preferred_route =
    typeof body.preferred_route === "string" &&
    VALID_PREFERRED_ROUTES.has(body.preferred_route as "pooled-fund-affiliate")
      ? (body.preferred_route as "pooled-fund-affiliate" | "sma-direct" | "combined" | "unsure")
      : undefined;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "Valid email required", reason: "invalid_email" }, { status: 400 });
  }
  if (!prospect_name) {
    return NextResponse.json(
      { ok: false, error: "Prospect name required", reason: "missing_prospect_name" },
      { status: 400 },
    );
  }

  // Mint magic token (mirror strategy-evaluation/submit/route.ts:80).
  const magicToken = randomBytes(32).toString("hex");
  const reviewUrl = `${getSiteUrl(req)}/strategy-review?token=${magicToken}`;

  // expiresAt is a Firestore Timestamp; revokedAt is null until revoke is
  // called. We also stamp createdAt server-side. Fields with no value are
  // destructured off below — never set undefined on a Firestore payload.
  const expiresAt = new Date(Date.now() + ttl_days * 24 * 60 * 60 * 1000);

  let docId: string | undefined;
  try {
    const app = getAdminApp();
    const db = admin.firestore(app);

    // Copy catalogue_seed + engagementIntent + parent-lineage hints from
    // the linked evaluation (when provided) so the Strategy Review surface
    // can hydrate its curated-examples section against the prospect's
    // submitted preferences without a follow-up read at render time. We
    // also use the evaluation's engagementIntent as a fallback when the
    // admin didn't pass one explicitly.
    let resolvedIntent = engagement_intent;
    let catalogueSeed: Record<string, unknown> | undefined;
    let evaluationIds: string[] | undefined;
    if (evaluation_id) {
      try {
        const evalSnap = await db.collection("strategy_evaluations").doc(evaluation_id).get();
        if (evalSnap.exists) {
          const evalData = evalSnap.data() ?? {};
          if (!resolvedIntent) {
            const evalIntent = typeof evalData.engagementIntent === "string" ? evalData.engagementIntent : "";
            if (VALID_ENGAGEMENT_INTENTS.has(evalIntent as "allocator")) {
              resolvedIntent = evalIntent as "allocator" | "builder" | "regulatory";
            }
          }
          if (evalData.catalogue_seed && typeof evalData.catalogue_seed === "object") {
            catalogueSeed = evalData.catalogue_seed as Record<string, unknown>;
          }
          // Build the lineage history for refile-aware reviews. We treat
          // the full chain as `[...parents, evaluation_id]` where parents
          // are walked from `parentSubmissionId` pointers. Capped at 8 to
          // avoid runaway loops on a corrupt chain.
          const lineage: string[] = [evaluation_id];
          let cursor = typeof evalData.parentSubmissionId === "string" ? evalData.parentSubmissionId : "";
          for (let i = 0; i < 8 && cursor; i += 1) {
            lineage.unshift(cursor);
            const parentSnap = await db.collection("strategy_evaluations").doc(cursor).get();
            if (!parentSnap.exists) break;
            const parentData = parentSnap.data() ?? {};
            cursor = typeof parentData.parentSubmissionId === "string" ? parentData.parentSubmissionId : "";
          }
          evaluationIds = lineage;
        }
      } catch (err) {
        console.error("[strategy-review/issue-link] failed to read linked evaluation", err);
      }
    }

    const payload: Record<string, unknown> = {
      magicToken,
      email,
      prospect_name,
      revokedAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    };
    if (evaluation_id) {
      payload.evaluation_id = evaluation_id;
    }
    if (evaluationIds && evaluationIds.length > 0) {
      payload.evaluation_ids = evaluationIds;
    }
    if (resolvedIntent) {
      payload.engagementIntent = resolvedIntent;
    }
    if (preferred_route) {
      payload.preferredRoute = preferred_route;
    }
    if (catalogueSeed) {
      payload.catalogue_seed = catalogueSeed;
    }
    const docRef = await db.collection("strategy_reviews").add(payload);
    docId = docRef.id;
  } catch (err) {
    console.error("[strategy-review/issue-link] Firestore write failed", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "unknown Firestore error",
        reason: "persistence_failed",
      },
      { status: 500 },
    );
  }

  // Send magic-link email via Resend pipeline.
  const greeting = prospect_name ? escapeHtml(prospect_name) : "";
  const html = wrapBrandedEmail({
    preheader: "Your tailored Strategy Review is ready.",
    body: [
      heading("Your tailored Strategy Review is ready", "Odum Research"),
      paragraph(
        `${greeting ? `${greeting}, ` : ""}we've prepared a tailored review of your strategy: the proposed operating model, DART configuration choices, regulatory pathway, and what we'd set up for the demo. The link below is private to you.`,
      ),
      primaryButton({ href: reviewUrl, label: "Open your Strategy Review" }),
      fallbackLink({ href: reviewUrl }),
      callout({
        title: "Why this is gated",
        body: `<p style="margin:0">This review is specific to your strategy and submission. The link expires in ${ttl_days} days for your security. Please don't forward it: reply to this email if you'd like us to share with a colleague.</p>`,
      }),
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
      subject: "Your Strategy Review is ready: Odum",
      html,
    });
  } catch (err) {
    console.error("[strategy-review/issue-link] sendEmail threw", err);
  }

  const env = sendResult ? routeResponseFromSend(sendResult) : { ok: false, sent: false };
  const sent = env.ok && env.sent === true;
  if (!sent) {
    console.warn(
      `[strategy-review/issue-link] email not sent for ${email}: ${("reason" in env ? env.reason : undefined) ?? "?"}`,
    );
  }

  return NextResponse.json({
    ok: true,
    id: docId,
    magicToken,
    reviewUrl,
    expiresAt: expiresAt.toISOString(),
    email_sent: sent,
  });
}
