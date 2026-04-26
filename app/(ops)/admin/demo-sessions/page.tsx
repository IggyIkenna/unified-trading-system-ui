"use client";

/**
 * Admin: Demo Sessions list + tooling.
 *
 * Funnel Coherence plan Workstream H. Mirrors `/admin/strategy-reviews`
 * shape — Firestore client-SDK read of the `demo_sessions` collection
 * ordered by createdAt DESC. Per-row actions: Issue link (open dialog
 * → POST /api/demo-session/issue-link), Copy link (clipboard the
 * magic-link URL), Revoke (POST /api/demo-session/revoke).
 *
 * The (ops) layout already requires `user.role === "admin"` for the page
 * to render at all; the API routes layer in their own server-side admin
 * guard.
 */

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

import { firebaseAuth, firebaseDb } from "@/lib/admin/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DemoSessionRow {
  readonly id: string;
  readonly prospect_email?: string;
  readonly prospect_name?: string;
  readonly persona_profile?: string;
  readonly evaluation_id?: string;
  readonly review_id?: string;
  readonly surfaces_in_scope?: readonly string[];
  readonly magicToken?: string;
  readonly createdAt?: { toDate: () => Date } | null;
  readonly expiresAt?: { toDate: () => Date } | null;
  readonly revokedAt?: { toDate: () => Date } | null;
}

const PERSONA_PROFILES: readonly { value: string; label: string }[] = [
  { value: "im-allocator", label: "IM allocator" },
  { value: "dart-signals-in", label: "DART Signals-In" },
  { value: "dart-full", label: "DART Full" },
  { value: "odum-signals-counterparty", label: "Odum Signals counterparty" },
  { value: "investor-lp", label: "Investor / LP" },
  { value: "admin", label: "Admin (testing)" },
];

function fmt(d: DemoSessionRow["createdAt"]): string {
  if (!d) return "—";
  try {
    return d.toDate().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function getSiteUrl(): string {
  if (typeof window === "undefined") return "";
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  return window.location.origin;
}

async function getAuthHeader(): Promise<HeadersInit> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (firebaseAuth?.currentUser) {
    try {
      const token = await firebaseAuth.currentUser.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    } catch (err) {
      console.warn("[demo-sessions/admin] getIdToken failed", err);
    }
  }
  return headers;
}

function IssueLinkDialog({ open, onClose, onIssued }: { open: boolean; onClose: () => void; onIssued: () => void }) {
  const [email, setEmail] = useState("");
  const [prospectName, setProspectName] = useState("");
  const [personaProfile, setPersonaProfile] = useState("im-allocator");
  const [evaluationId, setEvaluationId] = useState("");
  const [reviewId, setReviewId] = useState("");
  const [ttlDays, setTtlDays] = useState("30");
  // Default: send email immediately. Admin can opt out to verify the link
  // first before forwarding manually through their preferred channel.
  const [sendEmail, setSendEmail] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ url: string; emailSent: boolean; emailReason?: string } | null>(null);

  if (!open) return null;

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const headers = await getAuthHeader();
      const ttlNum = parseInt(ttlDays, 10);
      const body: Record<string, unknown> = {
        prospect_email: email.trim(),
        prospect_name: prospectName.trim(),
        persona_profile: personaProfile,
        send_email: sendEmail,
      };
      if (evaluationId.trim()) body.evaluation_id = evaluationId.trim();
      if (reviewId.trim()) body.review_id = reviewId.trim();
      if (Number.isFinite(ttlNum) && ttlNum > 0) body.expires_in_days = ttlNum;

      const res = await fetch("/api/demo-session/issue-link", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        link?: string;
        email_sent?: boolean;
        email_reason?: string;
        email_skipped?: boolean;
        error?: string;
      };
      if (!res.ok || !json.ok) {
        setError(json.error ?? `Request failed (${res.status})`);
        return;
      }
      setIssued({
        url: json.link ?? "",
        emailSent: json.email_sent === true,
        ...(json.email_reason ? { emailReason: json.email_reason } : {}),
      });
      onIssued();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold">Issue demo-session link</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-lg leading-none text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {issued ? (
          <div className="space-y-3">
            {issued.emailSent ? (
              <p className="text-sm text-emerald-600">
                Link issued and email sent to the recipient. Copy below if you also need to share it manually.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Link issued. Email was{" "}
                {sendEmail ? (
                  <span className="text-amber-600 font-medium">
                    NOT delivered{issued.emailReason ? ` (${issued.emailReason})` : ""}
                  </span>
                ) : (
                  "skipped — copy below and forward manually"
                )}
                .
              </p>
            )}
            <div className="break-all rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
              {issued.url}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => {
                  if (issued.url) void navigator.clipboard.writeText(issued.url);
                }}
              >
                Copy link
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label htmlFor="ds-email">Recipient email</Label>
              <Input
                id="ds-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="founder@example.com"
              />
            </div>
            <div>
              <Label htmlFor="ds-name">Prospect name</Label>
              <Input
                id="ds-name"
                value={prospectName}
                onChange={(e) => setProspectName(e.target.value)}
                placeholder="Jane Smith / Acme Capital"
              />
            </div>
            <div>
              <Label htmlFor="ds-persona">Persona profile</Label>
              <select
                id="ds-persona"
                value={personaProfile}
                onChange={(e) => setPersonaProfile(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {PERSONA_PROFILES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor="ds-eval">Evaluation ID (optional)</Label>
                <Input id="ds-eval" value={evaluationId} onChange={(e) => setEvaluationId(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="ds-review">Review ID (optional)</Label>
                <Input id="ds-review" value={reviewId} onChange={(e) => setReviewId(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="ds-ttl">Link TTL (days)</Label>
              <Input
                id="ds-ttl"
                type="number"
                min="1"
                max="90"
                value={ttlDays}
                onChange={(e) => setTtlDays(e.target.value)}
              />
            </div>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border/60 bg-card/30 p-3 text-sm">
              <input
                id="ds-send-email"
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium">Email the magic link to the recipient now.</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Untick to verify the link yourself first and forward manually through your preferred channel.
                </span>
              </span>
            </label>
            {error !== null && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 pt-2">
              <Button type="button" onClick={submit} disabled={submitting || !email.trim()}>
                {submitting ? "Issuing…" : sendEmail ? "Issue link + send email" : "Issue link only"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DemoSessionsAdminPage() {
  const [rows, setRows] = useState<DemoSessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issueOpen, setIssueOpen] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        if (firebaseDb === null) {
          setError("Firebase not configured (mock mode)");
          setLoading(false);
          return;
        }
        const q = query(collection(firebaseDb, "demo_sessions"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setRows(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<DemoSessionRow, "id">),
          })),
        );
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [version]);

  const copyLink = async (row: DemoSessionRow) => {
    if (!row.magicToken) return;
    const url = `${getSiteUrl()}/demo-session?token=${row.magicToken}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch (err) {
      console.warn("[demo-sessions/admin] clipboard failed", err);
    }
  };

  const revoke = async (row: DemoSessionRow) => {
    if (!confirm(`Revoke demo session for ${row.prospect_email ?? row.id}? The link will stop working.`)) {
      return;
    }
    try {
      const headers = await getAuthHeader();
      const res = await fetch("/api/demo-session/revoke", {
        method: "POST",
        headers,
        body: JSON.stringify({ id: row.id }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        alert(`Revoke failed: ${json.error ?? res.status}`);
        return;
      }
      setVersion((v) => v + 1);
    } catch (e) {
      alert(`Revoke failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Demo sessions</h1>
          <p className="mt-1 text-sm text-slate-500">
            Per-prospect demo / UAT magic-link sessions. Each link unlocks selected <code>/services/*</code> surfaces in
            demo mode (mock data, scoped entitlements, no production credentials, persistent &ldquo;Demo / UAT&rdquo;
            banner). Issued after a Strategy Review has landed.
          </p>
        </div>
        <Button type="button" onClick={() => setIssueOpen(true)}>
          Issue link
        </Button>
      </div>

      {loading && <p className="mt-8 text-muted-foreground">Loading demo sessions…</p>}
      {error !== null && <p className="mt-8 text-red-700">Error: {error}</p>}
      {!loading && error === null && rows.length === 0 && (
        <p className="mt-8 text-muted-foreground">
          No demo sessions issued yet. Click <strong>Issue link</strong> to generate one for a prospect.
        </p>
      )}

      {rows.length > 0 && (
        <table className="mt-8 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Prospect</th>
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Persona</th>
              <th className="py-2 pr-4 font-medium">Issued</th>
              <th className="py-2 pr-4 font-medium">Expires</th>
              <th className="py-2 pr-4 font-medium">Revoked</th>
              <th className="py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isRevoked = !!row.revokedAt;
              return (
                <tr key={row.id} className="border-b align-top hover:bg-muted/40">
                  <td className="py-2 pr-4 font-medium">
                    {row.prospect_name || <span className="italic text-muted-foreground">Unnamed</span>}
                  </td>
                  <td className="py-2 pr-4 text-xs text-muted-foreground">{row.prospect_email ?? "—"}</td>
                  <td className="py-2 pr-4 text-xs">
                    <code className="rounded bg-muted/50 px-1.5 py-0.5 text-[10px]">{row.persona_profile ?? "—"}</code>
                  </td>
                  <td className="py-2 pr-4 text-xs tabular-nums text-muted-foreground">{fmt(row.createdAt)}</td>
                  <td className="py-2 pr-4 text-xs tabular-nums text-muted-foreground">{fmt(row.expiresAt)}</td>
                  <td className="py-2 pr-4 text-xs">
                    {isRevoked ? (
                      <span className="text-red-600">{fmt(row.revokedAt)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="space-x-2 whitespace-nowrap py-2 text-right">
                    <button
                      type="button"
                      onClick={() => void copyLink(row)}
                      className="text-xs text-blue-600 underline hover:text-blue-800 disabled:opacity-50"
                      disabled={!row.magicToken || isRevoked}
                    >
                      Copy link
                    </button>
                    {!isRevoked && (
                      <button
                        type="button"
                        onClick={() => void revoke(row)}
                        className="text-xs text-red-600 underline hover:text-red-800"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <IssueLinkDialog open={issueOpen} onClose={() => setIssueOpen(false)} onIssued={() => setVersion((v) => v + 1)} />
    </main>
  );
}
