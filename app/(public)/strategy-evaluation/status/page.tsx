"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Download, ExternalLink } from "lucide-react";

interface UploadedFileRef {
  readonly path: string;
  readonly url: string;
  readonly filename: string;
  readonly size: number;
  readonly contentType: string;
  readonly uploadedAt: string;
}

interface StatusResponse {
  id: string;
  email?: string;
  strategyName?: string;
  leadResearcher?: string;
  commercialPath?: string;
  submittedAt?: string;
  emailVerified?: boolean;
  backtestMethodologyDoc?: UploadedFileRef | null;
  assumptionsDoc?: UploadedFileRef | null;
  tearSheet?: UploadedFileRef | null;
  tradeLogCsv?: UploadedFileRef | null;
  equityCurveCsv?: UploadedFileRef | null;
}

const PATH_LABELS: Record<string, string> = {
  A: "Path A — DART Full",
  B: "Path B — DART Signals-In",
  C: "Path C — Regulatory Umbrella",
};

const FILE_FIELDS: { key: keyof StatusResponse; label: string }[] = [
  { key: "backtestMethodologyDoc", label: "Backtest methodology document" },
  { key: "assumptionsDoc", label: "Assumptions document" },
  { key: "tearSheet", label: "Performance tear sheet" },
  { key: "tradeLogCsv", label: "Trade log CSV" },
  { key: "equityCurveCsv", label: "Equity curve CSV" },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StrategyEvaluationStatusPage() {
  const [token, setToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<StatusResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const t = sp.get("token");
    setToken(t);
    if (!t) {
      setLoading(false);
      setError("No access token in URL.");
      return;
    }
    fetch(`/api/strategy-evaluation/status?token=${encodeURIComponent(t)}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) {
            setError("This link is invalid or has expired. Please refile the form to receive a fresh link.");
          } else {
            setError("Could not load your submission. Please try again or email info@odum-research.com.");
          }
          return null;
        }
        return res.json() as Promise<StatusResponse>;
      })
      .then((json) => {
        if (json) setData(json);
      })
      .catch(() => setError("Network error. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 md:px-6">
        <p className="text-muted-foreground">Loading your submission…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 md:px-6">
        <div className="rounded-xl border border-border bg-card p-8 space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5 text-destructive" />
            <h1 className="text-xl font-semibold">Couldn&rsquo;t load this submission</h1>
          </div>
          <p className="text-muted-foreground">{error ?? "Submission not found."}</p>
          <div className="flex gap-3 pt-2">
            <Button asChild>
              <Link href="/strategy-evaluation">Start a new submission</Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="mailto:info@odum-research.com">Contact us</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const uploadedFiles = FILE_FIELDS.map(({ key, label }) => ({
    label,
    ref: data[key] as UploadedFileRef | null | undefined,
  })).filter((entry): entry is { label: string; ref: UploadedFileRef } => !!entry.ref && !!entry.ref.filename);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:px-6 space-y-6">
      <div>
        <Badge variant="outline" className="mb-3">
          Strategy Evaluation
        </Badge>
        <h1 className="text-2xl font-bold">Your submission</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Email confirmed for <strong>{data.email ?? "—"}</strong>. We&rsquo;ll be in touch within 3 business days.
        </p>
      </div>

      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3">
        <CheckCircle2 className="size-5 text-emerald-500 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-emerald-200">Email verified, submission received.</p>
          <p className="text-xs text-emerald-200/70">
            Bookmark this page — the link in your email is the only way back to it.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Submission details</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Strategy</dt>
            <dd className="font-medium">{data.strategyName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Lead researcher</dt>
            <dd className="font-medium">{data.leadResearcher ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Commercial path</dt>
            <dd className="font-medium">{PATH_LABELS[data.commercialPath ?? ""] ?? data.commercialPath ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Submitted</dt>
            <dd className="font-medium">{data.submittedAt ? new Date(data.submittedAt).toLocaleString() : "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Submission ID</dt>
            <dd className="font-mono text-xs">{data.id}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Uploaded documents</h2>
        {uploadedFiles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents were attached to this submission.</p>
        ) : (
          <ul className="space-y-2">
            {uploadedFiles.map(({ label, ref }) => (
              <li
                key={ref.path}
                className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-card/40 px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {ref.filename} · {formatFileSize(ref.size)}
                  </p>
                </div>
                {ref.url ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={ref.url} target="_blank" rel="noopener noreferrer">
                      <Download className="size-4 mr-1.5" />
                      Download
                    </a>
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">No download link</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-lg font-semibold">Need to change something?</h2>
        <p className="text-sm text-muted-foreground">
          You can refile the form with edits and we&rsquo;ll treat the latest submission as the source of truth. Reply
          to your confirmation email if you&rsquo;d prefer we update something on our side without a full refile.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={token ? `/strategy-evaluation?token=${encodeURIComponent(token)}` : "/strategy-evaluation"}>
              <ExternalLink className="size-4 mr-1.5" />
              Refile / edit and resubmit
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <a href="mailto:info@odum-research.com">Email us instead</a>
          </Button>
        </div>
      </div>

      {token && (
        <p className="text-xs text-muted-foreground">
          This page is private to you. Don&rsquo;t share the URL — it bypasses the email confirmation.
        </p>
      )}
    </div>
  );
}
