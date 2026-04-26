"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics/track";
import { SERVICE_LABELS } from "@/lib/copy/service-labels";

/**
 * Homepage React composition. See `app/(public)/page.tsx` for the metadata,
 * word-budget, and CTA-discipline contracts this file implements.
 */
export function HomePageClient() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <Hero />
        <EngagementRoutes />
        <WhyOdum />
        <EngagementJourney />
        <GovernanceAndRisk />
        <FinalCTA />
      </main>
    </div>
  );
}

function HomeStartReviewButton({
  size = "lg",
  variant = "default",
  source,
}: {
  readonly size?: "default" | "lg" | "sm";
  readonly variant?: "default" | "outline";
  readonly source: "hero" | "final";
}) {
  return (
    <Button asChild size={size} variant={variant}>
      <Link href="/start-your-review" onClick={() => trackEvent("homepage_start_review_click", { source })}>
        Start Your Review
        <ArrowRight className="ml-2 size-4" />
      </Link>
    </Button>
  );
}

function HomeContactButton({
  size = "lg",
  source,
}: {
  readonly size?: "default" | "lg" | "sm";
  readonly source: "hero" | "final";
}) {
  return (
    <Button asChild size={size} variant="outline">
      <Link href="/contact" onClick={() => trackEvent("homepage_contact_click", { source })}>
        Contact Odum
      </Link>
    </Button>
  );
}

const LIFECYCLE_STEPS = ["Research", "Execution", "Monitoring", "Reporting", "Governance"] as const;

const PROOF_POINTS = ["FCA-authorised", "Professional / institutional clients", "Regulated since 2023"] as const;

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/40 bg-background">
      {/* Subtle dark-gradient + grid backdrop for institutional weight without
          stat-strip clutter. Pure CSS — no images, no animation. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-background to-background"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:48px_48px]"
      />

      <div className="container relative px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Odum Research &middot; FCA 975797
          </p>
          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            Systematic strategies and trading infrastructure for institutional clients
          </h1>
          <p className="mt-6 text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            Odum manages selected systematic strategies and operates the infrastructure behind them &mdash; from
            research and execution to monitoring, reporting, and governance.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground/85 md:text-base">
            Clients engage through {SERVICE_LABELS.investment.marketing}, {SERVICE_LABELS.dart.marketing}, or{" "}
            {SERVICE_LABELS.regulatory.marketing} where appropriate.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <HomeStartReviewButton source="hero" />
            <HomeContactButton source="hero" />
          </div>

          {/* Lifecycle strip — restrained proof of platform breadth, no stats. */}
          <div
            aria-hidden
            className="mt-12 hidden items-center justify-center gap-3 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground/80 md:flex"
          >
            {LIFECYCLE_STEPS.map((step, i) => (
              <span key={step} className="flex items-center gap-3">
                <span className={i === 0 ? "text-foreground/85" : ""}>{step}</span>
                {i < LIFECYCLE_STEPS.length - 1 && <span className="text-muted-foreground/40">→</span>}
              </span>
            ))}
          </div>
          <div
            aria-hidden
            className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] uppercase tracking-[0.15em] text-muted-foreground/70 md:hidden"
          >
            {LIFECYCLE_STEPS.map((step) => (
              <span key={step} className="font-mono">
                {step}
              </span>
            ))}
          </div>

          {/* Proof row — institutional credibility without metrics-row clutter. */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-muted-foreground/85">
            {PROOF_POINTS.map((proof, i) => (
              <span key={proof} className="flex items-center gap-3">
                <span>{proof}</span>
                {i < PROOF_POINTS.length - 1 && <span className="text-muted-foreground/40">·</span>}
              </span>
            ))}
          </div>

          {/* Optional market context line — controlled, no five-asset-class mega-list. */}
          <p className="mt-4 text-xs text-muted-foreground/60">
            Digital assets &middot; Traditional markets &middot; Alternative trading contexts
          </p>
        </div>
      </div>
    </section>
  );
}

type EngagementRoute = {
  readonly key: "investment" | "dart" | "regulatory";
  readonly title: string;
  readonly summary: string;
  readonly bullets: readonly string[];
  readonly href: string;
  readonly cta: string;
};

const ENGAGEMENT_ROUTES: readonly EngagementRoute[] = [
  {
    key: "investment",
    title: SERVICE_LABELS.investment.marketing,
    summary: "Allocate capital to systematic strategies that Odum runs, with reporting Odum uses internally.",
    bullets: [
      "SMA or fund-route structures, available by separate agreement.",
      "Odum acts as investment manager; clients keep custody on the SMA route.",
      "Same reporting surface used to operate the strategies — partitioned views.",
    ],
    href: "/investment-management",
    cta: "Explore Odum-Managed Strategies",
  },
  {
    key: "dart",
    title: SERVICE_LABELS.dart.marketing,
    summary:
      "License the research-to-execution stack and run your own strategies on it, with the signal-flow you need.",
    bullets: [
      "Client-provided, Odum-provided, or hybrid signals — same code path.",
      "Research, ML, simulation, execution, and reporting in one operating model.",
      "Fits trading teams that want infrastructure without allocating capital to Odum.",
    ],
    href: "/platform",
    cta: "Explore DART Trading Infrastructure",
  },
  {
    key: "regulatory",
    title: SERVICE_LABELS.regulatory.marketing,
    summary: "Where the engagement requires it, Odum can structure the operating model under FCA cover.",
    bullets: [
      "Reviewed case by case; not a generic regulatory umbrella offer.",
      "Specific structures considered: advisory, AR-style arrangement, affiliate fund route.",
      "Governance, reporting, and oversight align with the engagement.",
    ],
    href: "/regulatory",
    cta: "Explore Regulated Operating Models",
  },
] as const;

function EngagementRoutes() {
  return (
    <section aria-labelledby="engagement-routes-heading" className="border-b border-border/40 bg-background">
      <div className="container px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="engagement-routes-heading" className="text-3xl font-semibold tracking-tight md:text-4xl">
              Three engagement routes
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Most prospects fit one of three. The questionnaire helps us confirm which one applies before either side
              spends time on a call.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {ENGAGEMENT_ROUTES.map((route) => (
              <Card key={route.key} className="flex h-full flex-col border-border/80 bg-card/60">
                <CardHeader>
                  <CardTitle className="text-lg">{route.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{route.summary}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {route.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2">
                        <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/70" />
                        <span className="leading-relaxed">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-2">
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={route.href}
                        onClick={() =>
                          trackEvent("engagement_route_card_click", {
                            route: route.key,
                          })
                        }
                      >
                        {route.cta}
                        <ArrowRight className="ml-1.5 size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyOdum() {
  return (
    <section aria-labelledby="why-odum-heading" className="border-b border-border/40 bg-card/20">
      <div className="container px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 id="why-odum-heading" className="text-2xl font-semibold tracking-tight md:text-3xl">
            Why Odum exists
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
            Odum was built because the systems institutional traders run on internally rarely match the systems
            available to the clients funding them. We operate one codebase across research, execution, reporting, and
            compliance, and offer narrow access to it under structures that hold up to allocator and regulator scrutiny.
          </p>
          <p className="mt-6 text-sm">
            <Link href="/our-story" className="font-medium text-foreground underline-offset-4 hover:underline">
              Read the short story
              <ArrowRight className="ml-1 inline size-3.5 align-[-2px]" />
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

const ENGAGEMENT_JOURNEY: readonly {
  readonly step: string;
  readonly title: string;
  readonly description: string;
}[] = [
  {
    step: "01",
    title: "Questionnaire",
    description: "Six axes; a few minutes. Routes you to the relevant briefing pillar.",
  },
  {
    step: "02",
    title: "Briefings",
    description: "Three pillars; gated material covering structure, mechanics, and scope.",
  },
  {
    step: "03",
    title: "Initial call",
    description: "If the briefings line up, a focused call rather than a generic intro.",
  },
  {
    step: "04",
    title: "Strategy Evaluation",
    description: "Structured DDQ covering entity, paths, risk, treasury, and governance.",
  },
  {
    step: "05",
    title: "Strategy Review",
    description: "Per-prospect tailored layer: proposed operating model, DART config, regulatory pathway, demo prep.",
  },
  {
    step: "06",
    title: "Onboarding",
    description: "Documentation, custody arrangements, and platform access where applicable.",
  },
] as const;

function EngagementJourney() {
  return (
    <section aria-labelledby="engagement-journey-heading" className="border-b border-border/40 bg-background">
      <div className="container px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="engagement-journey-heading" className="text-3xl font-semibold tracking-tight md:text-4xl">
              How an engagement progresses
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              The funnel is intentional. Each stage filters fit on both sides and earns the next.
            </p>
          </div>
          <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ENGAGEMENT_JOURNEY.map((stage) => (
              <li key={stage.step} className="rounded-lg border border-border/60 bg-card/40 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Step {stage.step}
                </p>
                <p className="mt-3 text-base font-medium text-foreground">{stage.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{stage.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function GovernanceAndRisk() {
  return (
    <section aria-labelledby="governance-heading" className="border-b border-border/40 bg-card/20">
      <div className="container px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 id="governance-heading" className="text-2xl font-semibold tracking-tight md:text-3xl">
            Governance and risk
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Odum Research Limited is authorised and regulated by the FCA (firm reference 975797). Investment management
            activity sits inside that perimeter; trading-infrastructure engagements and regulated operating models are
            reviewed case by case. Strategies carry capacity limits, drawdown discipline, and the same risk-and-exposure
            controls in research and live operation. Where a structure depends on third-party custody, fund
            administration, or counterparty onboarding, timelines depend on those parties &mdash; we do not guarantee
            coverage we do not control.
          </p>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section aria-labelledby="final-cta-heading" className="bg-background">
      <div className="container px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="final-cta-heading" className="text-3xl font-semibold tracking-tight md:text-4xl">
            Ready to start?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            A short questionnaire is the most efficient way for both sides to check fit. If your situation is already
            specific, contact us directly.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <HomeStartReviewButton source="final" />
            <HomeContactButton source="final" />
          </div>
        </div>
      </div>
    </section>
  );
}
