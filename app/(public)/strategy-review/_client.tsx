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
import { STRUCTURE_OPTIONS, type StructureOptionId } from "@/lib/marketing/structure-options";
import type { CatalogueSeed } from "@/lib/questionnaire/seed-catalogue-filters";

/** Engagement intent — drives section ordering + bullet emphasis. */
export type ReviewEngagementIntent = "allocator" | "builder" | "regulatory";

/** Lineage-aware evaluation linkage — see /api/strategy-evaluation/submit refile flow. */
export interface ReviewLineage {
  /** Newest evaluation id (mirrors the legacy `evaluation_id` field). */
  readonly latest: string;
  /** All evaluation ids linked to this review, oldest → newest. */
  readonly history: readonly string[];
}

export interface StrategyReviewDoc {
  readonly id: string;
  readonly email: string;
  readonly prospect_name: string;
  /** Newest evaluation linked to this review. */
  readonly evaluation_id?: string;
  /**
   * Full evaluation lineage when the prospect has refiled. `evaluation_id`
   * is always the newest in this list. Absent when only one evaluation
   * has been linked.
   */
  readonly evaluation_ids?: readonly string[];
  /** allocator / builder / regulatory — drives section ordering + bullet emphasis. */
  readonly engagementIntent?: ReviewEngagementIntent;
  /** SSOT route id — refines copy when present (Pooled Fund / SMA / Combined / Unsure). */
  readonly preferredRoute?: StructureOptionId;
  /** Catalogue seed copied from the evaluation at issue-link time. */
  readonly catalogue_seed?: CatalogueSeed;
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
          {review.engagementIntent ? (
            <Badge variant="outline" className="capitalize">
              {review.engagementIntent} route
            </Badge>
          ) : null}
          {review.preferredRoute && STRUCTURE_OPTIONS[review.preferredRoute] ? (
            <Badge variant="outline">
              {STRUCTURE_OPTIONS[review.preferredRoute].label} ({STRUCTURE_OPTIONS[review.preferredRoute].tag})
            </Badge>
          ) : null}
          {review.evaluation_ids && review.evaluation_ids.length > 1 ? (
            <Badge variant="outline" title={`Linked evaluations: ${review.evaluation_ids.join(", ")}`}>
              Refiled · {review.evaluation_ids.length} evaluations
            </Badge>
          ) : null}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Your tailored Strategy Review</h1>
        <p className="text-sm font-medium text-foreground/80">Your tailored pre-demo review.</p>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Prepared by Odum Research after your Strategy Evaluation. This page sets you up for a relevant platform
          walkthrough: proposed route, briefing excerpts to read first, demo agenda, workflows we expect to show,
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

      {(() => {
        // Per-route scaffolding (Funnel Coherence plan Workstream C3 + C4 +
        // 2026-04-27 regulatory branch): allocator leads with structure,
        // builder leads with DART config, regulatory leads with operating
        // model + governance. Same 7 sections in all three; only ordering
        // and bullet emphasis shifts. When `preferredRoute` (SSOT id) is
        // set, the structure-related sections also surface the route name.
        const intent: ReviewEngagementIntent = review.engagementIntent ?? "builder";
        const route = review.preferredRoute ? STRUCTURE_OPTIONS[review.preferredRoute] : undefined;
        const routeLabel = route ? `${route.label} (${route.tag})` : null;
        const seed = review.catalogue_seed;

        // Curated-examples bullets — when an evaluation seed exists, surface
        // the asset groups / instrument types / market-neutral / risk axes
        // we'll filter the catalogue against. Otherwise fall back to the
        // generic scaffold bullets. Either way the *full* catalogue stays
        // gated behind Commercial Tailoring.
        const seedBullets = (() => {
          if (!seed) return null;
          const out: string[] = [];
          if (seed.assetGroups.length > 0) {
            out.push(`Asset groups in scope: ${seed.assetGroups.join(" · ")}`);
          }
          if (seed.instrumentTypes.length > 0) {
            out.push(`Instrument types: ${seed.instrumentTypes.join(" · ")}`);
          }
          if (seed.marketNeutral) {
            out.push(`Market exposure preference: ${seed.marketNeutral}`);
          }
          if (seed.riskProfile) {
            out.push(`Risk appetite: ${seed.riskProfile}`);
          }
          if (seed.leveragePreference) {
            out.push(`Leverage tolerance: ${seed.leveragePreference}`);
          }
          if (typeof seed.targetSharpeMin === "number") {
            out.push(`Minimum target Sharpe: ${seed.targetSharpeMin}`);
          }
          return out.length > 0 ? out : null;
        })();

        const sections: Record<string, React.ReactNode> = {
          "proposed-route": (
            <SectionScaffold
              key="proposed-route"
              title="Proposed route hypothesis"
              description={(() => {
                if (intent === "allocator") return "Which structure and route fits your mandate, and why.";
                if (intent === "regulatory") return "Which operating model fits the engagement, and why.";
                return "Which of the three Odum routes we think fits, and why.";
              })()}
              bullets={(() => {
                if (intent === "allocator") {
                  return [
                    routeLabel
                      ? `${SERVICE_LABELS.investment.marketing}: leaning toward ${routeLabel}`
                      : `${SERVICE_LABELS.investment.marketing}: SMA, pooled fund, or other structure`,
                    "Why this fits the appetite, constraints, and capital scale you described",
                    "Adjacent or alternative structures worth considering",
                  ];
                }
                if (intent === "regulatory") {
                  return [
                    routeLabel
                      ? `Operating model: leaning toward ${routeLabel}`
                      : "Operating model: Odum-as-IM, delegated trading manager, sub-adviser, or affiliate-led pathway",
                    "Why this fits your jurisdiction, distribution posture, and permission requirements",
                    "Whether the engagement should run as a single route or combined UK + EU coverage",
                  ];
                }
                return [
                  `${SERVICE_LABELS.investment.marketing}, ${SERVICE_LABELS.dart.marketing}, or ${SERVICE_LABELS.regulatory.marketing}, and which fits best`,
                  routeLabel
                    ? `Operating model: leaning toward ${routeLabel}`
                    : "Why this hypothesis, given your evaluation answers",
                  "Adjacent routes worth considering or ruling out",
                ];
              })()}
              {...((review.proposedRouteHypothesis ?? review.proposedOperatingModel)
                ? { notes: review.proposedRouteHypothesis ?? review.proposedOperatingModel }
                : {})}
            />
          ),
          "briefing-excerpts": (
            <SectionScaffold
              key="briefing-excerpts"
              title="Relevant briefing excerpts"
              description="Curated paragraphs from the matching pillar briefing. Read these before the demo."
              bullets={(() => {
                if (intent === "allocator") {
                  return [
                    "Odum-Managed Strategies briefing: the allocator-relevant sections",
                    "Mandate, structure, and reporting passages worth reviewing",
                    "Supporting links you can revisit during your review window",
                  ];
                }
                if (intent === "regulatory") {
                  return [
                    "Regulated Operating Models briefing: the structure-relevant sections",
                    "Custody, supervision, and multi-vehicle reporting passages worth reviewing",
                    "Companion read: the route-specific pillar (IM or DART) where applicable",
                  ];
                }
                return [
                  "DART Trading Infrastructure briefing: Signals-In vs Full vs Signals-Out as relevant",
                  "Key passages and decisions worth reviewing first",
                  "Supporting links you can revisit during your review window",
                ];
              })()}
              {...(review.briefingExcerpts ? { notes: review.briefingExcerpts } : {})}
            />
          ),
          "demo-agenda": (
            <SectionScaffold
              key="demo-agenda"
              title="Demo agenda"
              description={(() => {
                if (intent === "allocator") return "Reporting and structure surfaces we'll walk through.";
                if (intent === "regulatory")
                  return "Operating-model and supervisory-reporting surfaces we'll walk through.";
                return "The DART research / execution / reporting flow we'll walk through.";
              })()}
              bullets={(() => {
                if (intent === "allocator") {
                  return [
                    "Reporting surfaces (catalogue, mandate-level perf, illustrative invoices)",
                    "Structure walkthrough: SMA vs pooled fund operating shape",
                    "Decision points we want your reaction to (mandate terms, reporting cadence)",
                  ];
                }
                if (intent === "regulatory") {
                  return [
                    "Operating-model walkthrough: appointment chain, custody, and supervisory rollup",
                    "Supervisory reporting surfaces: NAV, attribution, audit trail, compliance artefacts",
                    "Decision points we want your reaction to (manager-of-record, custody route, distribution posture)",
                  ];
                }
                return [
                  "The flow we'll follow during the operator-led portion",
                  "What we'll hand over to you for the self-guided review",
                  "Decision points we want your reaction to",
                ];
              })()}
              {...((review.demoAgenda ?? review.demoPreparation)
                ? { notes: review.demoAgenda ?? review.demoPreparation }
                : {})}
            />
          ),
          workflows: (
            <SectionScaffold
              key="workflows"
              title="Workflows / modules likely to be shown"
              description="The specific platform surfaces relevant to your evaluation answers."
              bullets={(() => {
                if (intent === "allocator") {
                  return [
                    "Strategy catalogue scoped to your asset-group + instrument-type preferences",
                    "Mandate / fund-level reports and performance views",
                    "Surfaces we'll skip because they aren't relevant to allocator mandates",
                  ];
                }
                if (intent === "regulatory") {
                  return [
                    "Multi-vehicle reporting hierarchy: sub-funds, share classes, SMA books, supervisory rollup",
                    "Permission scoping: venue / broker / wallet keys, scoped read + execute, no withdrawals",
                    "Surfaces we'll skip because they aren't relevant to the operating-model conversation",
                  ];
                }
                return [
                  "Modules in scope (research, trading, execution, reporting, as relevant)",
                  "Asset groups and instrument types we'll demonstrate against",
                  "Surfaces we'll skip because they aren't relevant to your route",
                ];
              })()}
              {...((review.workflowsShown ?? review.dartConfiguration)
                ? { notes: review.workflowsShown ?? review.dartConfiguration }
                : {})}
            />
          ),
          "curated-examples": (
            <SectionScaffold
              key="curated-examples"
              title="Curated examples"
              description={
                seedBullets
                  ? "Filtered against the preferences you submitted. The full catalogue opens later, in Commercial Tailoring."
                  : "A small handful of strategies or configurations relevant to your interest. The full catalogue opens later, in Commercial Tailoring."
              }
              bullets={
                seedBullets ?? [
                  "Two or three illustrative strategies aligned to your preferences",
                  "Maturity stage (paper / live-tiny / live) for each example",
                  "Indicative performance ranges, directional rather than final",
                ]
              }
              {...(review.curatedExamples ? { notes: review.curatedExamples } : {})}
            />
          ),
          "missing-info": (
            <SectionScaffold
              key="missing-info"
              title="Missing-information checklist"
              description="What we still need from you to make the demo land."
              bullets={(() => {
                if (intent === "allocator") {
                  return [
                    "Capital timing + scaling specifics we couldn't fully scope",
                    "Mandate / IPS documents we'd want sight of before the walkthrough",
                    "Any decisions you should be ready to make on the call",
                  ];
                }
                if (intent === "regulatory") {
                  return [
                    "Investor jurisdiction + distribution-posture specifics we couldn't fully scope",
                    "Existing manager / AIFM / fund-admin relationships we should know about",
                    "Compliance and supervisory documents we'd want sight of before the walkthrough",
                  ];
                }
                return [
                  "Specifics we couldn't fully scope from your evaluation",
                  "Documents, data, or access we'll need before the walkthrough",
                  "Any decisions you should be ready to make on the call",
                ];
              })()}
              {...((review.missingInformation ?? review.nextSteps)
                ? { notes: review.missingInformation ?? review.nextSteps }
                : {})}
            />
          ),
          risks: (
            <SectionScaffold
              key="risks"
              title="Route-specific risks and constraints"
              description="What you should be ready to discuss, both operational and regulatory."
              bullets={(() => {
                if (intent === "allocator") {
                  return [
                    "Concentration / drawdown sensitivity given your appetite",
                    "Mandate constraints (venues, leverage, instrument types)",
                    "Pre-conditions we'd want to confirm before initial allocation",
                  ];
                }
                if (intent === "regulatory") {
                  return [
                    "Permission scope and supervisory responsibility under the proposed structure",
                    "Custody and fund-administration boundaries: who carries which formal role",
                    "Pre-conditions we'd want to confirm before mandate documentation",
                  ];
                }
                return [
                  "Operational constraints we've identified (capacity, latency, venue, treasury)",
                  "Regulatory wrapper applicability, when relevant to your route",
                  "Pre-conditions we'd want to confirm before live capital",
                ];
              })()}
              {...((review.routeRisks ?? review.riskReview ?? review.regulatoryPathway)
                ? { notes: review.routeRisks ?? review.riskReview ?? review.regulatoryPathway }
                : {})}
            />
          ),
        };
        // Allocator: structure first, demo agenda focused on reporting,
        // missing-info before risks.
        // Builder: DART config first, broader workflows, risks before
        // missing-info.
        // Regulatory: operating-model first, missing-info before risks
        // (you usually need more documentation before the conversation can
        // sharpen than you do operational data).
        const ALLOCATOR_ORDER = [
          "proposed-route",
          "briefing-excerpts",
          "demo-agenda",
          "workflows",
          "curated-examples",
          "missing-info",
          "risks",
        ] as const;
        const BUILDER_ORDER = [
          "proposed-route",
          "briefing-excerpts",
          "workflows",
          "demo-agenda",
          "curated-examples",
          "risks",
          "missing-info",
        ] as const;
        const REGULATORY_ORDER = [
          "proposed-route",
          "briefing-excerpts",
          "workflows",
          "demo-agenda",
          "missing-info",
          "risks",
          "curated-examples",
        ] as const;
        const order =
          intent === "allocator" ? ALLOCATOR_ORDER : intent === "regulatory" ? REGULATORY_ORDER : BUILDER_ORDER;
        return <section className="space-y-5">{order.map((key) => sections[key])}</section>;
      })()}

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
        This page is private to you. The link in your email is the only way back to it: please don&rsquo;t share it.
        Briefings on{" "}
        <Link href="/briefings" className="underline">
          /briefings
        </Link>{" "}
        are unlocked for this browser while your link is active.
      </p>
    </main>
  );
}
