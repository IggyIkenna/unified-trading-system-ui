/**
 * /demo-session?token=<...> — demo-session landing.
 *
 * Funnel Coherence plan Workstream H. Resolves the demo-session magic
 * token, sets the demo-session flag in this browser, and routes the
 * prospect into the relevant /services/* surface for their persona
 * profile.
 *
 * One-token-two-doors: demo-session tokens also unlock the briefings
 * session so the prospect can revisit briefings during their demo
 * window without re-entering an access code.
 */

import Link from "next/link";
import admin from "firebase-admin";

import { Button } from "@/components/ui/button";
import { AlertCircle, Lock, Clock } from "lucide-react";
import DemoSessionClient from "./_client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface DemoSessionDoc {
  readonly id: string;
  readonly prospect_email: string;
  readonly prospect_name: string;
  readonly persona_profile: string;
  readonly surfaces_in_scope: readonly string[];
  readonly expiresAt?: string;
}

type LoadResult =
  | { state: "not-found" }
  | { state: "revoked" }
  | { state: "expired" }
  | { state: "valid"; doc: DemoSessionDoc };

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

async function loadByToken(token: string): Promise<LoadResult> {
  if (!token || token.length < 16) return { state: "not-found" };
  try {
    const app = getAdminApp();
    const db = admin.firestore(app);
    const snap = await db.collection("demo_sessions").where("magicToken", "==", token).limit(1).get();
    if (snap.empty) return { state: "not-found" };
    const docSnap = snap.docs[0]!;
    const data = docSnap.data();
    const expiresAt = isoFromTimestamp(data["expiresAt"]);
    const revokedAt = isoFromTimestamp(data["revokedAt"]);
    if (revokedAt) return { state: "revoked" };
    if (expiresAt && Date.parse(expiresAt) < Date.now()) return { state: "expired" };
    return {
      state: "valid",
      doc: {
        id: docSnap.id,
        prospect_email: typeof data["prospect_email"] === "string" ? data["prospect_email"] : "",
        prospect_name: typeof data["prospect_name"] === "string" ? data["prospect_name"] : "",
        persona_profile: typeof data["persona_profile"] === "string" ? data["persona_profile"] : "",
        surfaces_in_scope: Array.isArray(data["surfaces_in_scope"]) ? data["surfaces_in_scope"] : [],
        ...(expiresAt ? { expiresAt } : {}),
      },
    };
  } catch (err) {
    console.error("[demo-session/page] loadByToken failed", err);
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
            <Link href="/contact">Contact us</Link>
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
        title="Demo session is gated"
        body={
          <p>
            Demo sessions are accessed via a per-prospect magic link emailed after the Strategy Review. If you
            haven&rsquo;t received a link yet, please reply to your reviewer&rsquo;s email or contact us.
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
        title="This demo-session link isn't valid"
        body={<p>We couldn&rsquo;t find a demo session for this token. The link may have been mistyped or revoked.</p>}
      />
    );
  }
  if (result.state === "revoked") {
    return (
      <ErrorPanel
        icon={<Lock className="size-5 text-amber-500" />}
        title="This demo-session link has been revoked"
        body={<p>Access to this demo has been withdrawn. Please contact us if you believe this is in error.</p>}
      />
    );
  }
  if (result.state === "expired") {
    return (
      <ErrorPanel
        icon={<Clock className="size-5 text-amber-500" />}
        title="This demo-session link has expired"
        body={
          <p>For your security, demo-session links expire after a set window. Get in touch and we&rsquo;ll re-issue.</p>
        }
      />
    );
  }

  return <DemoSessionClient session={result.doc} />;
}
