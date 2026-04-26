import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PUBLIC_ROUTE_PATHS, SERVICE_LABELS } from "@/lib/copy/service-labels";
import { ArrowRight, Check, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

/**
 * Public Odum-Managed Strategies page — composed allocator service page.
 *
 * Per user review 2026-04-26 the prior version had right copy but read as a
 * stack of full-width document cards. Refactored into:
 *   - Hero with two badges (Allocator route / Pooled fund or SMA).
 *   - Two-column eligibility panel (For clients who want / Not primarily for).
 *   - Selection progression strip (Research → Testing → Live readiness →
 *     Mandate review).
 *   - Two-column lower row (Structure and reporting + Fees and mandate terms).
 *   - 5-step process strip (Start Review → Briefing → Fit call →
 *     Strategy Evaluation → Strategy Review).
 *   - Adjacent engagement routes as two compact link-cards.
 *   - Final CTA band.
 *
 * Public copy MUST NOT include: Fund/SMA hierarchy diagram, "same codebase /
 * partitioned views" language, detailed custody mechanics, client-confidentiality
 * data-layer detail, maturity ladder detail, stress-scenario detail, fee-band
 * mechanics, share-class mechanics, "second call" / "dashboard our traders look
 * at every morning" framing, or strategy catalogue exposure. Depth lives in:
 *   /briefings/investment-management — gated allocator briefing
 *   /strategy-review                 — prospect-specific structure
 *   signed-in allocator/onboarding   — implementation detail
 */
export const metadata: Metadata = {
  title: `${SERVICE_LABELS.investment.marketing} | Odum Research`,
  description:
    "Allocate capital to selected systematic strategies managed by Odum. Eligible clients can engage through SMA or fund-route structures where appropriate. Mandate terms reviewed case by case.",
};

interface ProcessStep {
  number: string;
  title: string;
  body: string;
}

const PROCESS_STEPS: readonly ProcessStep[] = [
  {
    number: "01",
    title: "Start Your Review",
    body: "Tell us what you are looking to allocate to or evaluate.",
  },
  {
    number: "02",
    title: "Briefing",
    body: `We share the ${SERVICE_LABELS.investment.marketing} briefing after the initial review.`,
  },
  {
    number: "03",
    title: "Fit call",
    body: "We confirm whether an Odum-managed route is appropriate.",
  },
  {
    number: "04",
    title: "Strategy Evaluation",
    body: "We collect the information needed to assess mandate fit, structure, and reporting.",
  },
  {
    number: "05",
    title: "Strategy Review",
    body: "We present the proposed route and next steps.",
  },
];

interface SelectionStage {
  number: string;
  title: string;
  body: string;
}

const SELECTION_STAGES: readonly SelectionStage[] = [
  {
    number: "01",
    title: "Research",
    body: "Strategies are sourced and reviewed against the operating model.",
  },
  {
    number: "02",
    title: "Testing",
    body: "Backtesting and simulation across the relevant markets and conditions.",
  },
  {
    number: "03",
    title: "Live readiness",
    body: "Operational checks before any external capital is allocated.",
  },
  {
    number: "04",
    title: "Mandate review",
    body: "Strategy fit and reporting requirements are confirmed against the client's mandate.",
  },
];

const ELIGIBLE_FOR: readonly string[] = [
  "Exposure to selected systematic strategies.",
  "An Odum-managed route rather than direct platform operation.",
  "SMA or fund-route structuring where appropriate.",
  "Reporting, oversight, and governance around the mandate.",
];

const NOT_PRIMARILY_FOR: readonly string[] = [
  "Retail access.",
  "Self-serve trading tools.",
  "Generic fund launch services.",
  "Clients looking only for raw data or software access.",
];

export default function InvestmentManagementPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 pb-20 pt-10 md:px-6 md:pb-24 md:pt-12">
        <div className="mx-auto max-w-5xl">
          {/* Hero */}
          <div className="mb-14 max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline">Allocator route</Badge>
              <Badge variant="outline">Pooled fund or SMA</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{SERVICE_LABELS.investment.marketing}</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Allocate to selected systematic strategies managed by Odum.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Odum acts as investment manager for selected systematic strategies available to eligible clients through
              SMA or fund-route structures where appropriate. Strategies may be developed by Odum, shaped with partners,
              or operated through Odum&rsquo;s infrastructure where the structure, governance, and risk controls are
              suitable.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href={PUBLIC_ROUTE_PATHS.startYourReview}>
                  Start Your Review <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={PUBLIC_ROUTE_PATHS.contact}>Contact Odum</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Access to the relevant allocator briefing is provided after the initial review.
            </p>
          </div>

          {/* Eligibility panel — two-column for / not-for */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/60 bg-card/40">
              <CardHeader>
                <CardTitle>For clients who want</CardTitle>
                <CardDescription>
                  This route is built around eligible allocators looking for managed exposure to systematic strategies.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-foreground/85">
                  {ELIGIBLE_FOR.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-primary/70" aria-hidden />
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card/40">
              <CardHeader>
                <CardTitle>Not primarily for</CardTitle>
                <CardDescription>
                  Other Odum routes (DART, Regulated Operating Models) or third-party providers may be a better fit for
                  these needs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-foreground/85">
                  {NOT_PRIMARILY_FOR.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <X className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Selection progression — compact 4-stage strip */}
          <section className="pt-24 md:pt-32">
            <div className="mb-8">
              <h2 className="text-xl font-semibold tracking-tight md:text-2xl">How strategies are selected</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Strategies progress through a structured research, testing, and live-readiness process before external
                capital is allocated. Detailed materials are provided during the gated briefing and Strategy Review.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              {SELECTION_STAGES.map((stage) => (
                <div
                  key={stage.number}
                  className="flex h-full flex-col rounded-md border border-border/60 bg-card/30 p-4"
                >
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary/85">
                    {stage.number}
                  </span>
                  <span className="mt-2 text-sm font-semibold leading-tight text-foreground">{stage.title}</span>
                  <span className="mt-2 text-xs leading-relaxed text-muted-foreground">{stage.body}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Structure + Fees — two-column row */}
          <div className="pt-24 grid gap-6 md:grid-cols-2 md:pt-32">
            <Card className="border-border/60 bg-card/40">
              <CardHeader>
                <CardTitle>Structure and reporting</CardTitle>
                <CardDescription>
                  Delivered through an SMA, fund route, or other approved structure depending on the client and mandate.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Reporting is scoped to the client, mandate, fund interest, or account. Custody, share-class mechanics,
                  permissions, and operational controls are reviewed during onboarding where relevant.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card/40">
              <CardHeader>
                <CardTitle>Fees and mandate terms</CardTitle>
                <CardDescription>Agreed in the relevant mandate pack, reviewed case by case.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Fees, hurdles, crystallisation timing, reporting frequency, and mandate terms are agreed at signing.
                  The public page does not quote standard terms.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Process strip — numbered 5-step */}
          <section className="pt-24 md:pt-32">
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              How the process works
            </h3>
            <div className="grid gap-3 md:grid-cols-5">
              {PROCESS_STEPS.map((step) => (
                <div
                  key={step.number}
                  className="flex h-full flex-col rounded-md border border-border/60 bg-card/30 p-4"
                >
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary/85">
                    {step.number}
                  </span>
                  <span className="mt-2 text-sm font-semibold leading-tight text-foreground">{step.title}</span>
                  <span className="mt-2 text-xs leading-relaxed text-muted-foreground">{step.body}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Adjacent engagement routes — two compact link cards */}
          <section className="pt-24 md:pt-32">
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Adjacent engagement routes
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Link
                href={PUBLIC_ROUTE_PATHS.dart}
                className="group rounded-lg border border-border/60 bg-card/30 p-5 transition-colors hover:border-border hover:bg-card/60"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">{SERVICE_LABELS.dart.marketing}</h4>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="mt-2 text-sm leading-snug text-muted-foreground">
                  Build, run, monitor, or scale strategies through Odum&rsquo;s infrastructure.
                </p>
              </Link>
              <Link
                href={PUBLIC_ROUTE_PATHS.regulatory}
                className="group rounded-lg border border-border/60 bg-card/30 p-5 transition-colors hover:border-border hover:bg-card/60"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">{SERVICE_LABELS.regulatory.marketing}</h4>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="mt-2 text-sm leading-snug text-muted-foreground">
                  Governance, reporting, permissions, and structuring around a trading engagement.
                </p>
              </Link>
            </div>
          </section>

          {/* Final CTA band */}
          <section className="mt-28 rounded-lg border border-border/60 bg-gradient-to-b from-card/60 to-card/30 p-8 text-center md:mt-32 md:p-12">
            <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Ready to understand the right route?</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
              Tell us what you are looking to allocate to or evaluate. We will route you to the relevant briefing and
              next step.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href={PUBLIC_ROUTE_PATHS.startYourReview}>Start Your Review</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={PUBLIC_ROUTE_PATHS.contact}>Contact Odum</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
