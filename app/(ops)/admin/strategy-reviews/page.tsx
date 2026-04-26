"use client";

/**
 * Admin: Strategy Reviews list + tooling.
 *
 * Mirrors `/admin/strategy-evaluations` shape — Firestore client-SDK read of
 * the `strategy_reviews` collection ordered by createdAt DESC. Per-row
 * actions: Issue link (open dialog → POST /api/strategy-review/issue-link),
 * Copy link (clipboard the magic-link URL), Revoke (POST
 * /api/strategy-review/revoke).
 *
 * The (ops) layout already requires `user.role === "admin"` for the page to
 * render at all; the API routes layer in their own server-side admin guard.
 */

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

import { firebaseAuth, firebaseDb } from "@/lib/admin/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ReviewDoc {
  readonly id: string;
  readonly email?: string;
  readonly prospect_name?: string;
  readonly evaluation_id?: string;
  readonly magicToken?: string;
  readonly createdAt?: { toDate: () => Date } | null;
  readonly expiresAt?: { toDate: () => Date } | null;
  readonly revokedAt?: { toDate: () => Date } | null;
}

function fmt(d: ReviewDoc["createdAt"]): string {
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
      console.warn("[strategy-reviews/admin] getIdToken failed", err);
    }
  }
  return headers;
}

function IssueLinkDialog({ open, onClose, onIssued }: { open: boolean; onClose: () => void; onIssued: () => void }) {
  const [email, setEmail] = useState("");
  const [prospectName, setProspectName] = useState("");
  const [evaluationId, setEvaluationId] = useState("");
  const [ttlDays, setTtlDays] = useState("30");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ url: string } | null>(null);

  if (!open) return null;

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const headers = await getAuthHeader();
      const ttlNum = parseInt(ttlDays, 10);
      const body: Record<string, unknown> = {
        email: email.trim(),
        prospect_name: prospectName.trim(),
      };
      if (evaluationId.trim()) {
        body.evaluation_id = evaluationId.trim();
      }
      if (Number.isFinite(ttlNum) && ttlNum > 0) {
        body.ttl_days = ttlNum;
      }
      const res = await fetch("/api/strategy-review/issue-link", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { ok?: boolean; reviewUrl?: string; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? `Request failed (${res.status})`);
        return;
      }
      setIssued({ url: json.reviewUrl ?? "" });
      onIssued();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold">Issue Strategy Review link</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {issued ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Link issued and email sent. Copy below if you need to share it manually.
            </p>
            <div className="rounded-md border border-border bg-muted/40 p-3 text-xs font-mono break-all">
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
              <Label htmlFor="sr-email">Recipient email</Label>
              <Input
                id="sr-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="founder@example.com"
              />
            </div>
            <div>
              <Label htmlFor="sr-name">Prospect name</Label>
              <Input
                id="sr-name"
                value={prospectName}
                onChange={(e) => setProspectName(e.target.value)}
                placeholder="Jane Smith / Acme Capital"
              />
            </div>
            <div>
              <Label htmlFor="sr-eval">Evaluation ID (optional)</Label>
              <Input
                id="sr-eval"
                value={evaluationId}
                onChange={(e) => setEvaluationId(e.target.value)}
                placeholder="strategy_evaluations doc ID"
              />
            </div>
            <div>
              <Label htmlFor="sr-ttl">Link TTL (days)</Label>
              <Input
                id="sr-ttl"
                type="number"
                min="1"
                max="365"
                value={ttlDays}
                onChange={(e) => setTtlDays(e.target.value)}
              />
            </div>
            {error !== null && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 pt-2">
              <Button type="button" onClick={submit} disabled={submitting}>
                {submitting ? "Issuing…" : "Issue link"}
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

export default function StrategyReviewsAdminPage() {
  const [rows, setRows] = useState<ReviewDoc[]>([]);
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
        const q = query(collection(firebaseDb, "strategy_reviews"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setRows(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ReviewDoc, "id">),
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

  const copyLink = async (row: ReviewDoc) => {
    if (!row.magicToken) return;
    const url = `${getSiteUrl()}/strategy-review?token=${row.magicToken}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch (err) {
      console.warn("[strategy-reviews/admin] clipboard failed", err);
    }
  };

  const revoke = async (row: ReviewDoc) => {
    if (!confirm(`Revoke Strategy Review for ${row.email ?? row.id}? The link will stop working.`)) {
      return;
    }
    try {
      const headers = await getAuthHeader();
      const res = await fetch("/api/strategy-review/revoke", {
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
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Strategy reviews</h1>
          <p className="mt-1 text-slate-500 text-sm">
            Per-prospect magic-link surfaces issued from <code>/strategy-review</code>. Each link unlocks a tailored
            review page and the briefings session in the recipient&rsquo;s browser.
          </p>
        </div>
        <Button type="button" onClick={() => setIssueOpen(true)}>
          Issue link
        </Button>
      </div>

      {loading && <p className="mt-8 text-muted-foreground">Loading reviews…</p>}
      {error !== null && <p className="mt-8 text-red-700">Error: {error}</p>}
      {!loading && error === null && rows.length === 0 && (
        <p className="mt-8 text-muted-foreground">
          No reviews issued yet. Click <strong>Issue link</strong> to generate one for a prospect.
        </p>
      )}

      {rows.length > 0 && (
        <table className="mt-8 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Prospect</th>
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Evaluation</th>
              <th className="py-2 pr-4 font-medium">Issued</th>
              <th className="py-2 pr-4 font-medium">Expires</th>
              <th className="py-2 pr-4 font-medium">Revoked</th>
              <th className="py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isRevoked = !!row.revokedAt;
              return (
                <tr key={row.id} className="border-b align-top hover:bg-muted/40">
                  <td className="py-2 pr-4 font-medium">
                    {row.prospect_name || <span className="text-muted-foreground italic">Unnamed</span>}
                  </td>
                  <td className="py-2 pr-4 text-xs text-muted-foreground">{row.email ?? "—"}</td>
                  <td className="py-2 pr-4 text-xs font-mono text-muted-foreground">{row.evaluation_id ?? "—"}</td>
                  <td className="py-2 pr-4 text-xs text-muted-foreground tabular-nums">{fmt(row.createdAt)}</td>
                  <td className="py-2 pr-4 text-xs text-muted-foreground tabular-nums">{fmt(row.expiresAt)}</td>
                  <td className="py-2 pr-4 text-xs">
                    {isRevoked ? (
                      <span className="text-red-600">{fmt(row.revokedAt)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-2 text-right space-x-2 whitespace-nowrap">
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
