"use client";

/**
 * Own-account reports client — empty-state CTA + populated-state view.
 *
 * State machine:
 *   - has_uploaded_keys flag absent / false → empty state with "Connect
 *     venue credentials" CTA. Submitting the form creates a pending
 *     credential request (metadata only — NO raw secrets in Firestore).
 *   - has_uploaded_keys === true → populated view linking to /services/
 *     reports/overview for the actual P&L + invoice surfaces.
 *
 * Security: the credential-request submit hits /api/org-credentials/upload
 * which writes ONLY metadata (venue, scope, intended use, contact note,
 * status: pending_review). Raw API keys + secrets must move through the
 * approved secure credential path (Secret Manager) at admin approval time.
 * UI copy makes this explicit.
 */

import * as React from "react";
import Link from "next/link";

interface CredentialRequestForm {
  venue: string;
  accountType: string;
  intendedScope: string;
  contactNote: string;
}

const VENUE_OPTIONS = [
  { value: "binance", label: "Binance" },
  { value: "bybit", label: "Bybit" },
  { value: "okx", label: "OKX" },
  { value: "deribit", label: "Deribit" },
  { value: "coinbase", label: "Coinbase" },
  { value: "kraken", label: "Kraken" },
  { value: "ig", label: "IG" },
  { value: "ibkr", label: "Interactive Brokers" },
  { value: "other", label: "Other (please specify in note)" },
] as const;

const ACCOUNT_TYPES = [
  { value: "spot", label: "Spot" },
  { value: "perp", label: "Perpetual futures" },
  { value: "futures", label: "Dated futures" },
  { value: "options", label: "Options" },
  { value: "margin", label: "Margin / lending" },
  { value: "other", label: "Other" },
] as const;

const SCOPE_OPTIONS = [
  { value: "read-only", label: "Read-only (positions + balances)" },
  { value: "execute-read", label: "Execute + read (trade + read; NO withdrawal)" },
] as const;

export default function OwnAccountClient() {
  const [hasKeys, setHasKeys] = React.useState<boolean | null>(null);
  const [form, setForm] = React.useState<CredentialRequestForm>({
    venue: "",
    accountType: "",
    intendedScope: "",
    contactNote: "",
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // On mount, check if the org already has uploaded keys. In mock mode this
  // is a localStorage flag; in real production it's a Firestore lookup
  // gated by the user's org_id (server route).
  React.useEffect(() => {
    try {
      const flag = localStorage.getItem("odum-org-has-uploaded-keys");
      setHasKeys(flag === "true");
    } catch {
      setHasKeys(false);
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/org-credentials/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}${body ? `: ${body.slice(0, 160)}` : ""}`);
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (hasKeys === null) {
    return (
      <div className="container px-4 py-12">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (hasKeys) {
    return (
      <div className="container px-4 py-12 md:px-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Own-account reports
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Your performance + invoices</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Live performance against your connected venue credentials. Invoices and reconciliations available below.
            </p>
          </header>
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href="/services/reports/overview"
              className="rounded-lg border border-border/80 bg-card/40 p-6 transition-colors hover:bg-card/70"
            >
              <h2 className="font-semibold">P&amp;L + Performance</h2>
              <p className="mt-2 text-sm text-muted-foreground">Strategy × venue × instrument attribution.</p>
            </Link>
            <Link
              href="/services/reports/invoices"
              className="rounded-lg border border-border/80 bg-card/40 p-6 transition-colors hover:bg-card/70"
            >
              <h2 className="font-semibold">Invoices</h2>
              <p className="mt-2 text-sm text-muted-foreground">Billed periods, accruals, and settlement.</p>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container px-4 py-12 md:px-6">
        <div className="mx-auto max-w-2xl rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Credential request submitted</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We&rsquo;ve recorded your request. An admin will reach out via the contact channel on your account to walk
            you through the secure secret-handover path. We do NOT store raw API keys or secrets in this UI.
          </p>
          <Link href="/dashboard" className="mt-6 inline-block text-sm font-medium underline">
            &larr; Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-12 md:px-6">
      <div className="mx-auto max-w-3xl space-y-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Own-account reports</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Connect venue credentials</h1>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            Own-account reports show your org&rsquo;s perf + invoices against your venue accounts. Connect read or
            execute-and-read credentials to populate this surface. Withdrawal scope is never accepted; raw secrets are
            handed over to Odum through a separate secure path (not via this form).
          </p>
        </header>

        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
          <p className="font-semibold">Security model</p>
          <p className="mt-1.5 text-muted-foreground">
            This form captures <strong>metadata only</strong> &mdash; venue, account type, intended scope, contact note.
            No API key, no secret. After you submit, an admin reaches out to coordinate the actual key handover via the
            approved secure credential path (Secret Manager). Raw secrets never touch Firestore.
          </p>
        </div>

        <form
          onSubmit={submit}
          noValidate
          className="space-y-5 rounded-lg border border-border/80 bg-card/40 p-6 md:p-8"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">
                Venue <span className="text-destructive">*</span>
              </label>
              <select
                value={form.venue}
                onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                required
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select venue…</option>
                {VENUE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">
                Account type <span className="text-destructive">*</span>
              </label>
              <select
                value={form.accountType}
                onChange={(e) => setForm((f) => ({ ...f, accountType: e.target.value }))}
                required
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select…</option>
                {ACCOUNT_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">
              Intended scope <span className="text-destructive">*</span>
            </label>
            <select
              value={form.intendedScope}
              onChange={(e) => setForm((f) => ({ ...f, intendedScope: e.target.value }))}
              required
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select…</option>
              {SCOPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-muted-foreground">Withdrawal scope is never accepted.</p>
          </div>
          <div>
            <label className="block text-sm font-medium">Contact / ops note</label>
            <textarea
              value={form.contactNote}
              onChange={(e) => setForm((f) => ({ ...f, contactNote: e.target.value }))}
              rows={3}
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="e.g. preferred handover channel, IP allowlist requirements, sub-account naming convention"
            />
          </div>
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting || !form.venue || !form.accountType || !form.intendedScope}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            {submitting ? "Submitting…" : "Submit credential request"}
          </button>
        </form>
      </div>
    </div>
  );
}
