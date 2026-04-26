"use client";

/**
 * Strategy Review — read-only prospect-specific display.
 *
 * Sections (per plan Phase 5): proposed operating model · DART configuration
 * options · regulatory pathway · risk review · demo preparation · next steps.
 *
 * Sectioned heavily — no hard word cap. Each section either renders the
 * admin-supplied notes (when present in the Firestore doc) or a sectioned
 * scaffolding placeholder so the surface always feels structured and
 * institutional.
 *
 * One-token-two-doors: on mount, calls `setBriefingSessionActive()` so this
 * browser can navigate `/briefings/*` without an additional access-code
 * prompt. The token is the only key required.
 *
 * Catalogue subset display + curated strategy listing are deferred to Strategy
 * Review v2 per plan Decisions §4.
 */

import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { setBriefingSessionActive } from "@/lib/briefings/session";
import { SERVICE_LABELS } from "@/lib/copy/service-labels";

export interface StrategyReviewDoc {
  readonly id: string;
  readonly email: string;
  readonly prospect_name: string;
  readonly evaluation_id?: string;
  readonly createdAt?: string;
  readonly expiresAt?: string;
  readonly revokedAt?: string;
  readonly notes?: string;
  readonly proposedOperatingModel?: string;
  readonly dartConfiguration?: string;
  readonly regulatoryPathway?: string;
  readonly riskReview?: string;
  readonly demoPreparation?: string;
  readonly nextSteps?: string;
}

function formatDate(iso: string | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function Prose({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
      {text
        .trim()
        .split(/\n{2,}/)
        .map((para, i) => (
          <p key={i} className="whitespace-pre-wrap">
            {para}
          </p>
        ))}
    </div>
  );
}

function SectionScaffold({
  title,
  description,
  bullets,
  notes,
}: {
  title: string;
  description: string;
  bullets: readonly string[];
  notes?: string;
}) {
  return (
    <Card className="border-border/80">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notes ? (
          <Prose text={notes} />
        ) : (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              We&rsquo;ll cover
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground/40" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function StrategyReviewClient({ review }: { review: StrategyReviewDoc }) {
  // One-token-two-doors: a valid Strategy Review token also unlocks the
  // briefings session in this browser, so /briefings/* renders without an
  // access-code prompt.
  React.useEffect(() => {
    try {
      setBriefingSessionActive();
    } catch (err) {
      console.error("[strategy-review/_client] setBriefingSessionActive failed", err);
    }
  }, []);

  const issuedOn = formatDate(review.createdAt);
  const expiresOn = formatDate(review.expiresAt);
  const greetingName = review.prospect_name?.trim() || review.email;

  return (
    <main className="max-w-4xl mx-auto px-4 py-12 md:px-6 space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Strategy Review</Badge>
          <Badge variant="secondary">Private to {greetingName}</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Your tailored Strategy Review</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Prepared by Odum Research following review of your strategy evaluation submission. This surface walks through
          the operating model we&rsquo;d propose, DART configuration choices, regulatory pathway, risk review, demo
          preparation, and next steps.
        </p>
        <dl className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <div>
            <dt className="uppercase tracking-widest">Recipient</dt>
            <dd className="text-foreground font-medium">{review.email}</dd>
          </div>
          {issuedOn ? (
            <div>
              <dt className="uppercase tracking-widest">Issued</dt>
              <dd className="text-foreground font-medium">{issuedOn}</dd>
            </div>
          ) : null}
          {expiresOn ? (
            <div>
              <dt className="uppercase tracking-widest">Link expires</dt>
              <dd className="text-foreground font-medium">{expiresOn}</dd>
            </div>
          ) : null}
        </dl>
      </header>

      {review.notes ? (
        <Card className="border-border/80 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-base">Notes from your reviewer</CardTitle>
          </CardHeader>
          <CardContent>
            <Prose text={review.notes} />
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-5">
        <SectionScaffold
          title="Proposed operating model"
          description="The structural shape we recommend for your strategy."
          bullets={[
            `${SERVICE_LABELS.investment.marketing}, ${SERVICE_LABELS.dart.marketing}, or ${SERVICE_LABELS.regulatory.marketing} — and which fits best`,
            "Capital structure considerations (proprietary, SMA, pooled fund, or open / TBD)",
            "Counterparty / fund-administration / custody alignment",
            "Estimated time-to-live with our incubation rebuild",
          ]}
          {...(review.proposedOperatingModel ? { notes: review.proposedOperatingModel } : {})}
        />

        <SectionScaffold
          title="DART configuration options"
          description="Capability bundles, signal capture, execution path, and reporting."
          bullets={[
            "Signals-In / Full / Counterparty signals — which configuration matches your team",
            "Asset groups and instrument types in scope",
            "Execution path — Odum execution, client execution, or hybrid",
            "Reporting and analytics readiness — what we set up day-one",
          ]}
          {...(review.dartConfiguration ? { notes: review.dartConfiguration } : {})}
        />

        <SectionScaffold
          title="Regulatory pathway"
          description="How your strategy reaches regulated capital — fund route, advisory, or appointed representative."
          bullets={[
            "Whether to ride under our FCA permissions or run as an introducer",
            "Eligible investor classification and minimum subscription thinking",
            "Jurisdictional notes for the fund, SMA, or proprietary account",
            "Compliance review timeline and what we need from you",
          ]}
          {...(review.regulatoryPathway ? { notes: review.regulatoryPathway } : {})}
        />

        <SectionScaffold
          title="Risk review"
          description="Strategy-level and execution-level risk controls we&rsquo;d apply."
          bullets={[
            "Position-sizing, leverage, and drawdown bands",
            "Execution-risk controls — venue, slippage, fill-quality, counterparty",
            "Treasury and operational continuity expectations",
            "Stress scenarios we&rsquo;d test before live capital",
          ]}
          {...(review.riskReview ? { notes: review.riskReview } : {})}
        />

        <SectionScaffold
          title="Demo preparation"
          description="What we&rsquo;ll set up in the sandbox so you can see the platform before any commitment."
          bullets={[
            "A curated UAT environment configured to your asset class and strategy",
            "Reference datasets and a representative backtest you can re-run",
            "Account walkthrough — research, trading, execution, reports",
            "What we&rsquo;ll need from you to make the demo land",
          ]}
          {...(review.demoPreparation ? { notes: review.demoPreparation } : {})}
        />

        <SectionScaffold
          title="Next steps"
          description="What happens after you&rsquo;ve read this, and how to push back."
          bullets={[
            "Schedule a call to walk through the proposed operating model",
            "Push back on any of the above — we treat this as a working draft",
            "Sign off on the operating model and we move into the tailored demo",
            "Or pause and revisit — the link stays valid until it expires",
          ]}
          {...(review.nextSteps ? { notes: review.nextSteps } : {})}
        />
      </section>

      <Card className="border-border/80">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-6">
          <div>
            <h2 className="text-base font-semibold">Ready to talk this through?</h2>
            <p className="text-sm text-muted-foreground">Reply to your email thread, or jump straight to a call.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/contact">Book a call</Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="mailto:info@odum-research.com">Email us</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        This page is private to you. The link in your email is the only way back to it &mdash; please don&rsquo;t share
        it. Briefings on{" "}
        <Link href="/briefings" className="underline">
          /briefings
        </Link>{" "}
        are unlocked for this browser while your link is active.
      </p>
    </main>
  );
}
