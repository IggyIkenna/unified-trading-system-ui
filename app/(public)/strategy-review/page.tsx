/**
 * Strategy Review — server-component shell.
 *
 * Resolves a per-prospect magic-link token and renders the prospect-specific
 * proposed-operating-model page. Mirrors the server-component prefill pattern
 * from `app/(public)/strategy-evaluation/page.tsx` so we read Firestore once
 * server-side via the Admin SDK and bake the prior payload into initial HTML.
 * No client-side fetch race against hydration.
 *
 * One-token-two-doors: when a valid token resolves, the client component also
 * calls `setBriefingSessionActive()` so the same browser can browse
 * `/briefings/*` without an additional access-code prompt.
 *
 * Token states handled:
 *   - missing  → no-token landing
 *   - invalid  → expired/revoked/not-found landing
 *   - revoked  → revoked-link landing (revokedAt set)
 *   - expired  → expired-link landing (expiresAt < now)
 *   - valid    → renders StrategyReviewClient with initialReview
 *
 * `force-dynamic` ensures fresh resolve on every request.
 */

import Link from "next/link";
import admin from "firebase-admin";

import { Button } from "@/components/ui/button";
import { AlertCircle, Lock, Clock } from "lucide-react";

import StrategyReviewClient, { type StrategyReviewDoc } from "./_client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LoadResult =
  | { state: "missing-token" }
  | { state: "not-found" }
  | { state: "revoked"; doc: StrategyReviewDoc }
  | { state: "expired"; doc: StrategyReviewDoc }
  | { state: "valid"; doc: StrategyReviewDoc };

function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    const existing = admin.apps[0];
    if (existing) return existing;
  }
  return admin.initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

function isoFromTimestamp(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "toDate" in value) {
    try {
      const fn = (value as { toDate: () => Date }).toDate;
      if (typeof fn === "function") return fn.call(value).toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

function pickString(data: Record<string, unknown>, key: string): string | undefined {
  const v = data[key];
  return typeof v === "string" ? v : undefined;
}

async function loadByToken(token: string): Promise<LoadResult> {
  if (!token || token.length < 16) return { state: "not-found" };
  try {
    const app = getAdminApp();
    const db = admin.firestore(app);
    const snap = await db.collection("strategy_reviews").where("magicToken", "==", token).limit(1).get();
    if (snap.empty) return { state: "not-found" };
    const docSnap = snap.docs[0]!;
    const data = docSnap.data();

    const id = docSnap.id;
    const email = pickString(data, "email") ?? "";
    const prospect_name = pickString(data, "prospect_name") ?? "";
    const evaluation_id = pickString(data, "evaluation_id");
    const createdAt = isoFromTimestamp(data["createdAt"]);
    const expiresAt = isoFromTimestamp(data["expiresAt"]);
    const revokedAt = isoFromTimestamp(data["revokedAt"]);

    // Optional v2 content blocks. v1 ships without authored content; the
    // client renders sectioned scaffolding + admin-supplied notes when present.
    const notes = pickString(data, "notes");
    const proposedOperatingModel = pickString(data, "proposedOperatingModel");
    const dartConfiguration = pickString(data, "dartConfiguration");
    const regulatoryPathway = pickString(data, "regulatoryPathway");
    const riskReview = pickString(data, "riskReview");
    const demoPreparation = pickString(data, "demoPreparation");
    const nextSteps = pickString(data, "nextSteps");

    const doc: StrategyReviewDoc = {
      id,
      email,
      prospect_name,
      ...(evaluation_id ? { evaluation_id } : {}),
      ...(createdAt ? { createdAt } : {}),
      ...(expiresAt ? { expiresAt } : {}),
      ...(revokedAt ? { revokedAt } : {}),
      ...(notes ? { notes } : {}),
      ...(proposedOperatingModel ? { proposedOperatingModel } : {}),
      ...(dartConfiguration ? { dartConfiguration } : {}),
      ...(regulatoryPathway ? { regulatoryPathway } : {}),
      ...(riskReview ? { riskReview } : {}),
      ...(demoPreparation ? { demoPreparation } : {}),
      ...(nextSteps ? { nextSteps } : {}),
    };

    if (revokedAt) return { state: "revoked", doc };
    if (expiresAt && Date.parse(expiresAt) < Date.now()) {
      return { state: "expired", doc };
    }
    return { state: "valid", doc };
  } catch (err) {
    console.error("[strategy-review/page] loadByToken failed", err);
    return { state: "not-found" };
  }
}

function ErrorPanel({ icon, title, body }: { icon: React.ReactNode; title: string; body: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:px-6">
      <div className="rounded-xl border border-border bg-card p-8 space-y-4">
        <div className="flex items-center gap-2">
          {icon}
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        <div className="text-muted-foreground text-sm">{body}</div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild>
            <Link href="/strategy-evaluation">Start a new evaluation</Link>
          </Button>
          <Button variant="outline" asChild>
            <a href="mailto:info@odum-research.com">Contact us</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const params = await searchParams;
  const tokenRaw = params.token;
  const token = Array.isArray(tokenRaw) ? tokenRaw[0] : tokenRaw;

  if (!token) {
    return (
      <ErrorPanel
        icon={<Lock className="size-5 text-muted-foreground" />}
        title="Strategy Review is gated"
        body={
          <p>
            Strategy Review is a per-prospect tailored surface, accessible only via the magic link we email after your
            strategy evaluation has been reviewed. If you&rsquo;ve already submitted an evaluation, please check the
            email we sent.
          </p>
        }
      />
    );
  }

  const result = await loadByToken(token);

  if (result.state === "not-found") {
    return (
      <ErrorPanel
        icon={<AlertCircle className="size-5 text-destructive" />}
        title="This Strategy Review link isn't valid"
        body={
          <p>
            We couldn&rsquo;t find a Strategy Review for this token. The link may have been mistyped, or it may have
            been revoked.
          </p>
        }
      />
    );
  }

  if (result.state === "revoked") {
    return (
      <ErrorPanel
        icon={<Lock className="size-5 text-amber-500" />}
        title="This Strategy Review link has been revoked"
        body={
          <p>
            Access to this review has been withdrawn. If you believe this is in error, please reply to the email thread
            or contact us.
          </p>
        }
      />
    );
  }

  if (result.state === "expired") {
    return (
      <ErrorPanel
        icon={<Clock className="size-5 text-amber-500" />}
        title="This Strategy Review link has expired"
        body={
          <p>
            For your security, Strategy Review links expire after a set window. Please get in touch and we&rsquo;ll
            re-issue a fresh link.
          </p>
        }
      />
    );
  }

  if (result.state === "valid") {
    return <StrategyReviewClient review={result.doc} />;
  }

  // Defensive — every branch above returns; this preserves exhaustiveness.
  return (
    <ErrorPanel
      icon={<AlertCircle className="size-5 text-destructive" />}
      title="Couldn't load this Strategy Review"
      body={<p>An unexpected error occurred. Please contact us.</p>}
    />
  );
}
