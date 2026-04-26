"use client";

/**
 * Strategy Review — read-only prospect-specific display.
 *
 * **Pre-demo prep pack** (NOT a final commercial proposal). The funnel order
 * is: Eval → Strategy Review → Platform walkthrough → Commercial Tailoring.
 * This surface lives BEFORE the walkthrough and is meant to set the prospect
 * up for a relevant demo, not synthesise after one.
 *
 * Sections (per Funnel Coherence plan Workstream C2 / G3):
 *  1. Proposed route hypothesis
 *  2. Relevant briefing excerpts
 *  3. Demo agenda
 *  4. Workflows / modules likely to be shown
 *  5. Curated examples (a small handful — NOT the full catalogue)
 *  6. Missing-information checklist
 *  7. Route-specific risks and constraints
 *
 * Each section renders admin-supplied prose when present in the Firestore doc,
 * or a sectioned "We'll cover" scaffolding when absent — the surface always
 * feels structured and institutional even before admin authoring.
 *
 * Strategy Review MUST NOT show: full strategy catalogue, final pricing, final
 * contract structure, full signed-in platform, all bespoke combinations. Those
 * open in Commercial Tailoring (post-walkthrough, operator-led).
 *
 * One-token-two-doors: on mount, calls `setBriefingSessionActive()` so this
 * browser can navigate `/briefings/*` without an additional access-code
 * prompt. The token is the only key required.
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
  /** Pre-demo prep pack fields (Workstream C2 schema). */
  readonly proposedRouteHypothesis?: string;
  readonly briefingExcerpts?: string;
  readonly demoAgenda?: string;
  readonly workflowsShown?: string;
  readonly curatedExamples?: string;
  readonly missingInformation?: string;
  readonly routeRisks?: string;
  /** Legacy fields from Phase 5 schema — render as fallback if new fields absent. */
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
        <p className="text-sm font-medium text-foreground/80">Your tailored pre-demo review.</p>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Prepared by Odum Research after your Strategy Evaluation. This page sets you up for a relevant platform
          walkthrough — proposed route, briefing excerpts to read first, demo agenda, workflows we expect to show,
          curated examples, missing information we still need, and route-specific risks to discuss.
        </p>
        <p className="text-xs text-muted-foreground max-w-2xl">
          This is a pre-demo preparation pack, not a final proposal. Catalogue depth, pricing, and contract shape open
          in Commercial Tailoring after the walkthrough.
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
          title="Proposed route hypothesis"
          description="Which of the three Odum routes we think fits — and why."
          bullets={[
            `${SERVICE_LABELS.investment.marketing}, ${SERVICE_LABELS.dart.marketing}, or ${SERVICE_LABELS.regulatory.marketing} — and which fits best`,
            "Why this hypothesis, given your evaluation answers",
            "Adjacent routes worth considering or ruling out",
          ]}
          {...((review.proposedRouteHypothesis ?? review.proposedOperatingModel)
            ? { notes: review.proposedRouteHypothesis ?? review.proposedOperatingModel }
            : {})}
        />

        <SectionScaffold
          title="Relevant briefing excerpts"
          description="Curated paragraphs from the matching pillar briefing — read these before the demo."
          bullets={[
            "The pillar briefing most relevant to your route",
            "Key passages and decisions worth reviewing first",
            "Supporting links you can revisit during your review window",
          ]}
          {...(review.briefingExcerpts ? { notes: review.briefingExcerpts } : {})}
        />

        <SectionScaffold
          title="Demo agenda"
          description="What we'll walk through in the platform walkthrough."
          bullets={[
            "The flow we'll follow during the operator-led portion",
            "What we'll hand over to you for the self-guided review",
            "Decision points we want your reaction to",
          ]}
          {...((review.demoAgenda ?? review.demoPreparation)
            ? { notes: review.demoAgenda ?? review.demoPreparation }
            : {})}
        />

        <SectionScaffold
          title="Workflows / modules likely to be shown"
          description="The specific platform surfaces relevant to your evaluation answers."
          bullets={[
            "Modules in scope (research, trading, execution, reporting — as relevant)",
            "Asset groups and instrument types we'll demonstrate against",
            "Surfaces we'll skip because they aren't relevant to your route",
          ]}
          {...((review.workflowsShown ?? review.dartConfiguration)
            ? { notes: review.workflowsShown ?? review.dartConfiguration }
            : {})}
        />

        <SectionScaffold
          title="Curated examples"
          description="A small handful of strategies or configurations relevant to your interest. The full catalogue opens later, in Commercial Tailoring."
          bullets={[
            "Two or three illustrative strategies aligned to your asset-group and instrument-type preferences",
            "Maturity stage (paper / live-tiny / live) for each example",
            "Indicative performance ranges — directional, not final",
          ]}
          {...(review.curatedExamples ? { notes: review.curatedExamples } : {})}
        />

        <SectionScaffold
          title="Missing-information checklist"
          description="What we still need from you to make the demo land."
          bullets={[
            "Specifics we couldn't fully scope from your evaluation",
            "Documents, data, or access we'll need before the walkthrough",
            "Any decisions you should be ready to make on the call",
          ]}
          {...((review.missingInformation ?? review.nextSteps)
            ? { notes: review.missingInformation ?? review.nextSteps }
            : {})}
        />

        <SectionScaffold
          title="Route-specific risks and constraints"
          description="What you should be ready to discuss — both operational and regulatory."
          bullets={[
            "Operational constraints we've identified (capacity, latency, venue, treasury)",
            "Regulatory wrapper applicability — when relevant to your route",
            "Pre-conditions we'd want to confirm before live capital",
          ]}
          {...((review.routeRisks ?? review.riskReview ?? review.regulatoryPathway)
            ? { notes: review.routeRisks ?? review.riskReview ?? review.regulatoryPathway }
            : {})}
        />
      </section>

      <Card className="border-border/80">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-6">
          <div>
            <h2 className="text-base font-semibold">Ready to book the walkthrough?</h2>
            <p className="text-sm text-muted-foreground">
              Push back on anything above, fill in what we&rsquo;re missing, or schedule the platform walkthrough.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/contact">Book Platform Walkthrough</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/strategy-evaluation">Submit Missing Details</Link>
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
