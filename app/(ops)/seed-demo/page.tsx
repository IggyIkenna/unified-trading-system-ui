"use client";

/**
 * /seed-demo — admin-only page to seed a demo session for a prospect.
 *
 * Flow:
 *   1. Admin clicks "Seed demo" on /admin/questionnaires (which builds
 *      a /seed-demo?submissionId=<id>&service_family=<X> URL).
 *   2. This page resolves the submission from Firestore, trying first
 *      `strategy_evaluations/{id}` (depth DDQ — usually has more
 *      contact/persona signal) and falling back to `questionnaires/{id}`
 *      (light intake).
 *   3. Pre-fills the demo-session issue form: prospect email, name,
 *      derived persona_profile, surfaces_in_scope hint, and links the
 *      submission via evaluation_id when available.
 *   4. Admin reviews + clicks "Issue demo session link". POSTs to
 *      /api/demo-session/issue-link, which mints the magic-link token,
 *      writes `demo_sessions/{id}`, and (optionally) emails the prospect.
 *   5. Magic link displayed on the page for clipboard copy.
 *
 * Lives under the `(ops)` route group, which already gates on
 * `user?.role === "admin"` via app/(ops)/layout.tsx — no extra auth
 * check needed here.
 *
 * The bare `/seed-demo` URL path (not `/admin/seed-demo`) matches the
 * link generator in /admin/questionnaires and the historical bookmark
 * the user has been visiting.
 */

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";

import { firebaseDb } from "@/lib/admin/firebase";
import { firebaseAuth } from "@/lib/admin/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Persona profiles supported by the demo-session API. Keep in sync with
// VALID_PERSONA_PROFILES in app/api/demo-session/issue-link/route.ts.
type PersonaProfile =
  | "im-allocator"
  | "dart-signals-in"
  | "dart-full"
  | "odum-signals-counterparty"
  | "investor-lp"
  | "admin";

const PERSONA_OPTIONS: { value: PersonaProfile; label: string }[] = [
  { value: "im-allocator", label: "Odum-Managed Strategies (IM allocator)" },
  { value: "dart-full", label: "DART Full" },
  { value: "dart-signals-in", label: "DART Signals-In" },
  { value: "odum-signals-counterparty", label: "Odum Signals counterparty" },
  { value: "investor-lp", label: "Investor / LP" },
  { value: "admin", label: "Admin demo" },
];

const SERVICE_FAMILY_TO_PERSONA: Record<string, PersonaProfile> = {
  IM: "im-allocator",
  DART: "dart-full",
  RegUmbrella: "dart-full",
  combo: "dart-full",
};

interface ResolvedSubmission {
  readonly source: "strategy_evaluations" | "questionnaires";
  readonly id: string;
  readonly email?: string;
  readonly prospectName?: string;
  readonly serviceFamily?: string;
  readonly commercialPath?: string;
  readonly summary: Record<string, unknown>;
}

async function resolveSubmission(submissionId: string): Promise<ResolvedSubmission | null> {
  if (!firebaseDb) return null;
  // Try the deeper Strategy Evaluation collection first — it's the
  // higher-information surface and the one prospects fill out in the
  // post-questionnaire stage of the funnel.
  for (const source of ["strategy_evaluations", "questionnaires"] as const) {
    try {
      const ref = doc(firebaseDb, source, submissionId);
      const snap = await getDoc(ref);
      if (!snap.exists()) continue;
      const data = snap.data() as Record<string, unknown>;
      const submitted = (data.submitted_by as Record<string, unknown> | undefined) ?? null;
      const email =
        (typeof data.email === "string" ? data.email : undefined) ??
        (submitted && typeof submitted.email === "string" ? submitted.email : undefined);
      const prospectName =
        (typeof data.leadResearcher === "string" ? data.leadResearcher : undefined) ??
        (submitted && typeof submitted.firm_name === "string" ? submitted.firm_name : undefined);
      const serviceFamily = typeof data.service_family === "string" ? data.service_family : undefined;
      const commercialPath = typeof data.commercialPath === "string" ? data.commercialPath : undefined;
      return {
        source,
        id: submissionId,
        email,
        prospectName,
        serviceFamily,
        commercialPath,
        summary: data,
      };
    } catch (err) {
      console.error(`[seed-demo] Firestore read failed for ${source}/${submissionId}:`, err);
    }
  }
  return null;
}

export default function SeedDemoPage() {
  const searchParams = useSearchParams();
  const submissionIdParam = searchParams.get("submissionId") ?? "";
  const serviceFamilyParam = searchParams.get("service_family") ?? "";

  const [submission, setSubmission] = React.useState<ResolvedSubmission | null>(null);
  const [resolveLoading, setResolveLoading] = React.useState(true);
  const [resolveError, setResolveError] = React.useState<string | null>(null);

  // Form state
  const [submissionId, setSubmissionId] = React.useState(submissionIdParam);
  const [email, setEmail] = React.useState("");
  const [prospectName, setProspectName] = React.useState("");
  const [personaProfile, setPersonaProfile] = React.useState<PersonaProfile>(
    SERVICE_FAMILY_TO_PERSONA[serviceFamilyParam] ?? "dart-full",
  );
  const [expiresInDays, setExpiresInDays] = React.useState("30");
  const [sendEmail, setSendEmail] = React.useState(true);

  // Issue state
  const [issuing, setIssuing] = React.useState(false);
  const [issued, setIssued] = React.useState<{ link: string; emailSent: boolean } | null>(null);
  const [issueError, setIssueError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!submissionIdParam) {
      setResolveLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setResolveLoading(true);
      setResolveError(null);
      try {
        const result = await resolveSubmission(submissionIdParam);
        if (cancelled) return;
        if (!result) {
          setResolveError(
            `No submission found with ID ${submissionIdParam} in this environment. The submission may live in the other Firebase project (UAT writes to odum-staging; prod writes to central-element-323112). You can still issue a demo session by filling the form manually below.`,
          );
        } else {
          setSubmission(result);
          if (result.email) setEmail(result.email);
          if (result.prospectName) setProspectName(result.prospectName);
          if (result.serviceFamily && SERVICE_FAMILY_TO_PERSONA[result.serviceFamily]) {
            setPersonaProfile(SERVICE_FAMILY_TO_PERSONA[result.serviceFamily]);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setResolveError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setResolveLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [submissionIdParam]);

  async function handleIssue(e: React.FormEvent) {
    e.preventDefault();
    setIssuing(true);
    setIssueError(null);
    setIssued(null);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      // The issue-link route accepts a Firebase ID token in the
      // Authorization header for admin-gating in production. Mock-mode
      // permits any caller; either way attaching the token is harmless.
      try {
        const token = await firebaseAuth?.currentUser?.getIdToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      } catch {
        /* token retrieval failure is non-fatal in mock mode */
      }
      const ttlNum = parseInt(expiresInDays, 10);
      const body: Record<string, unknown> = {
        prospect_email: email.trim(),
        prospect_name: prospectName.trim(),
        persona_profile: personaProfile,
        send_email: sendEmail,
      };
      if (Number.isFinite(ttlNum) && ttlNum > 0) {
        body.expires_in_days = ttlNum;
      }
      // Link the submission lineage when present so admins can trace
      // demo session -> originating evaluation in /admin/demo-sessions.
      if (submission?.source === "strategy_evaluations") {
        body.evaluation_id = submission.id;
      }
      const res = await fetch("/api/demo-session/issue-link", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        link?: string;
        email_sent?: boolean;
        error?: string;
        reason?: string;
      };
      if (!res.ok || !json.ok || !json.link) {
        setIssueError(json.error ?? json.reason ?? `Request failed (${res.status})`);
        return;
      }
      setIssued({ link: json.link, emailSent: json.email_sent === true });
    } catch (err) {
      setIssueError(err instanceof Error ? err.message : String(err));
    } finally {
      setIssuing(false);
    }
  }

  // Magic-link URLs into the prospect's own surfaces so the operator can
  // walk through what the prospect sees end-to-end. Only available when the
  // submission carries a magicToken (every strategy_evaluations submit
  // mints one; light /questionnaire submits don't).
  const magicToken =
    submission && typeof submission.summary["magicToken"] === "string"
      ? (submission.summary["magicToken"] as string)
      : null;
  const prospectStatusUrl = magicToken ? `/strategy-evaluation/status?token=${magicToken}` : null;
  const adminRowHref =
    submission?.source === "strategy_evaluations"
      ? `/admin/strategy-evaluations#row-${submission.id}`
      : submission?.source === "questionnaires"
        ? `/admin/questionnaires#row-${submission.id}`
        : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-8" data-testid="seed-demo-page">
      <h1 className="text-2xl font-semibold">Seed demo session</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Issue a scoped demo / UAT magic link for a prospect after their questionnaire or Strategy Evaluation lands. The
        token is persisted to <code>demo_sessions/&#123;id&#125;</code> and (optionally) emailed via the Resend
        pipeline. Mirror of{" "}
        <Link href="/admin/demo-sessions" className="underline">
          /admin/demo-sessions
        </Link>{" "}
        with the submission pre-filled.
      </p>
      <div className="mt-3 rounded-md border border-sky-500/40 bg-sky-500/5 p-3 text-xs text-sky-100/90">
        <strong className="font-medium">Starting point, not a script.</strong> The pre-fill below is derived from the
        prospect&rsquo;s answers; review the full submission, walk through what they see at their magic-link surface,
        then tailor the demo content (curated catalogue, walkthrough agenda, supporting docs) after the link is issued.
        The demo session is just the access vehicle.
      </div>

      {resolveLoading && submissionIdParam ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Resolving submission <code>{submissionIdParam}</code>…
        </p>
      ) : null}

      {resolveError ? (
        <div className="mt-6 rounded-md border border-amber-500/50 bg-amber-500/10 p-4 text-sm">
          <p className="font-medium text-amber-200">Submission not resolved</p>
          <p className="mt-1 text-amber-100/80">{resolveError}</p>
        </div>
      ) : null}

      {submission ? (
        <div className="mt-6 rounded-md border border-border bg-card/30 p-4 text-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium">Submission resolved</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {prospectStatusUrl ? (
                <Link
                  href={prospectStatusUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-border/60 px-2 py-1 text-blue-400 underline-offset-2 hover:underline"
                >
                  Open prospect&rsquo;s magic-link view ↗
                </Link>
              ) : null}
              {adminRowHref ? (
                <Link
                  href={adminRowHref}
                  className="rounded-md border border-border/60 px-2 py-1 text-blue-400 underline-offset-2 hover:underline"
                >
                  Open in admin {submission.source === "strategy_evaluations" ? "evaluations" : "questionnaires"} →
                </Link>
              ) : null}
            </div>
          </div>
          <dl className="mt-3 grid grid-cols-[140px_1fr] gap-x-4 gap-y-1 text-xs">
            <dt className="text-muted-foreground">Source collection</dt>
            <dd>
              <code>{submission.source}</code>
            </dd>
            <dt className="text-muted-foreground">Submission ID</dt>
            <dd className="font-mono">{submission.id}</dd>
            {submission.email ? (
              <>
                <dt className="text-muted-foreground">Email</dt>
                <dd>{submission.email}</dd>
              </>
            ) : null}
            {submission.prospectName ? (
              <>
                <dt className="text-muted-foreground">Prospect / firm</dt>
                <dd>{submission.prospectName}</dd>
              </>
            ) : null}
            {submission.serviceFamily ? (
              <>
                <dt className="text-muted-foreground">Service family</dt>
                <dd>{submission.serviceFamily}</dd>
              </>
            ) : null}
            {submission.commercialPath ? (
              <>
                <dt className="text-muted-foreground">Commercial path</dt>
                <dd>{submission.commercialPath}</dd>
              </>
            ) : null}
          </dl>

          {/* Full submission as collapsible answers — operator reads these
              to tailor the demo. Hide bulky / opaque fields (token,
              timestamps already shown, raw upload refs already linked
              in the admin view). */}
          <details className="mt-4 rounded-md border border-border/60 bg-background/30 p-3 text-xs">
            <summary className="cursor-pointer select-none text-muted-foreground hover:text-foreground">
              Show all answers ({Object.keys(submission.summary).length} fields)
            </summary>
            <dl className="mt-3 grid grid-cols-[180px_1fr] gap-x-4 gap-y-1 break-all">
              {Object.entries(submission.summary)
                .filter(([k]) => !["magicToken", "submittedAt", "submitted_by", "_id"].includes(k))
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, value]) => {
                  const display = (() => {
                    if (value === null || value === undefined) return "(empty)";
                    if (typeof value === "boolean") return value ? "yes" : "no";
                    if (typeof value === "string" || typeof value === "number") return String(value);
                    if (Array.isArray(value)) {
                      if (value.length === 0) return "(empty)";
                      return value.map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v))).join(", ");
                    }
                    if (typeof value === "object") return JSON.stringify(value);
                    return String(value);
                  })();
                  return (
                    <React.Fragment key={key}>
                      <dt className="text-muted-foreground font-mono text-[11px]">{key}</dt>
                      <dd className="whitespace-pre-wrap">{display}</dd>
                    </React.Fragment>
                  );
                })}
            </dl>
          </details>
        </div>
      ) : null}

      {!issued ? (
        <form onSubmit={handleIssue} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="sd-submissionId">Submission ID (optional)</Label>
            <Input
              id="sd-submissionId"
              value={submissionId}
              onChange={(e) => setSubmissionId(e.target.value)}
              placeholder="strategy_evaluations or questionnaires doc ID"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Only used to display context; the demo session is keyed off the email + persona profile below.
            </p>
          </div>
          <div>
            <Label htmlFor="sd-email">Prospect email</Label>
            <Input
              id="sd-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="founder@example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="sd-name">Prospect / firm name</Label>
            <Input
              id="sd-name"
              value={prospectName}
              onChange={(e) => setProspectName(e.target.value)}
              placeholder="Jane Smith / Acme Capital"
            />
          </div>
          <div>
            <Label htmlFor="sd-persona">Persona profile</Label>
            <select
              id="sd-persona"
              value={personaProfile}
              onChange={(e) => setPersonaProfile(e.target.value as PersonaProfile)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {PERSONA_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Maps to the surfaces the magic link unlocks under <code>/services/*</code>.
            </p>
          </div>
          <div>
            <Label htmlFor="sd-ttl">Link TTL (days)</Label>
            <Input
              id="sd-ttl"
              type="number"
              min="1"
              max="90"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
            Email the magic link to the prospect now
          </label>
          {issueError ? (
            <p className="text-sm text-red-500" data-testid="seed-demo-error">
              {issueError}
            </p>
          ) : null}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={issuing || !email.trim()}>
              {issuing ? "Issuing…" : sendEmail ? "Issue link + send email" : "Issue link only"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/questionnaires">Cancel</Link>
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-6 rounded-md border border-emerald-500/50 bg-emerald-500/10 p-4 text-sm">
          <p className="font-medium text-emerald-200">Demo session issued</p>
          <p className="mt-1 text-emerald-100/80">
            {issued.emailSent
              ? "Magic link emailed to the prospect."
              : "Email send was skipped — copy the link below and forward manually."}
          </p>
          <div className="mt-3 rounded-md border border-border bg-background/40 p-3 font-mono text-xs break-all">
            {issued.link}
          </div>
          <div className="mt-3 flex gap-2">
            <Button type="button" size="sm" onClick={() => void navigator.clipboard.writeText(issued.link)}>
              Copy link
            </Button>
            <Button type="button" size="sm" variant="outline" asChild>
              <Link href="/admin/demo-sessions">View all demo sessions →</Link>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setIssued(null);
              }}
            >
              Issue another
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
