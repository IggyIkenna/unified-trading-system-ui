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
 *   - 7-step process strip (Start Review → Briefing → Fit call →
 *     Strategy Evaluation → Strategy Review → Platform walkthrough →
 *     Commercial Tailoring).
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
    body: "A tailored pre-demo review of your route, requirements, and demo focus.",
  },
  {
    number: "06",
    title: "Platform walkthrough",
    body: "A tailored walkthrough of the relevant workflows, followed by a self-guided review.",
  },
  {
    number: "07",
    title: "Commercial Tailoring",
    body: "Deeper catalogue, pricing, and mandate shape against your specifics.",
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
        <div className="mx-auto max-w-6xl">
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
            <Card className="border-border/80 bg-card/40">
              <CardHeader className="p-7 md:p-8">
                <CardTitle className="md:text-xl">For clients who want</CardTitle>
                <CardDescription className="md:text-base">
                  This route is built around eligible allocators looking for managed exposure to systematic strategies.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-7 pt-0 md:p-8 md:pt-0">
                <ul className="space-y-2.5 text-sm text-foreground/85 md:text-[15px]">
                  {ELIGIBLE_FOR.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check className="mt-1 size-3.5 shrink-0 text-primary/70" aria-hidden />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="border-border/80 bg-card/40">
              <CardHeader className="p-7 md:p-8">
                <CardTitle className="md:text-xl">Not primarily for</CardTitle>
                <CardDescription className="md:text-base">
                  Other Odum routes (DART, Regulated Operating Models) or third-party providers may be a better fit for
                  these needs.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-7 pt-0 md:p-8 md:pt-0">
                <ul className="space-y-2.5 text-sm text-foreground/85 md:text-[15px]">
                  {NOT_PRIMARILY_FOR.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <X className="mt-1 size-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Selection progression — compact 4-stage strip */}
          <section className="pt-24 md:pt-32">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">How strategies are selected</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                Strategies progress through a structured research, testing, and live-readiness process before external
                capital is allocated. Detailed materials are provided during the gated briefing and Strategy Review.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              {SELECTION_STAGES.map((stage) => (
                <div
                  key={stage.number}
                  className="flex h-full flex-col rounded-md border border-border/80 bg-card/30 p-5"
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

          {/* Allocator intake themes — mirrors the Path A Strategy Evaluation
              field set so allocators see the form's shape before they hit it. */}
          <section className="pt-24 md:pt-32">
            <div className="mb-8 max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">What we&rsquo;ll ask you about</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                The Strategy Evaluation for allocators is preference-shaped, not strategy-shaped. We don&rsquo;t ask for
                your methodology or track record: we ask what fits your mandate.
              </p>
            </div>
            <ul className="grid gap-x-8 gap-y-3 text-sm leading-relaxed text-foreground/85 md:grid-cols-2 md:text-[15px]">
              {[
                "Investor profile and risk appetite (target Sharpe, max drawdown).",
                "Allowed venues and geographies; instrument-type restrictions.",
                "Leverage caps and SMA exchange-fee preferences.",
                "Performance criteria and return horizon.",
                "Capital scaling timeline and deployment preference.",
                "Structure interest (SMA / pooled fund / unsure) and reporting cadence.",
              ].map((theme) => (
                <li key={theme} className="flex items-start gap-2.5">
                  <Check className="mt-1 size-3.5 shrink-0 text-primary/70" aria-hidden />
                  <span>{theme}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Structure + Fees — two-column row */}
          <section className="pt-24 md:pt-32">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-border/80 bg-card/40">
                <CardHeader className="p-7 md:p-8">
                  <CardTitle className="md:text-xl">Structure and reporting</CardTitle>
                  <CardDescription className="md:text-base">
                    Delivered through an SMA, fund route, or other approved structure depending on the client and
                    mandate.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-7 pt-0 text-sm leading-relaxed text-muted-foreground md:p-8 md:pt-0 md:text-base">
                  <p>
                    Reporting is scoped to the client, mandate, fund interest, or account. Custody, share-class
                    mechanics, permissions, and operational controls are reviewed during onboarding where relevant.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/80 bg-card/40">
                <CardHeader className="p-7 md:p-8">
                  <CardTitle className="md:text-xl">Fees and mandate terms</CardTitle>
                  <CardDescription className="md:text-base">
                    Agreed in the relevant mandate pack, reviewed case by case.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-7 pt-0 text-sm leading-relaxed text-muted-foreground md:p-8 md:pt-0 md:text-base">
                  <p>
                    Fees, hurdles, crystallisation timing, reporting frequency, and mandate terms are agreed at signing.
                    The public page does not quote standard terms.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Process strip — numbered 7-step */}
          <section className="pt-24 md:pt-32">
            <h3 className="mb-7 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              How the process works
            </h3>
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-7">
              {PROCESS_STEPS.map((step) => (
                <div
                  key={step.number}
                  className="flex h-full flex-col rounded-md border border-border/80 bg-card/30 p-5"
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
            <h3 className="mb-7 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Adjacent engagement routes
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              <Link
                href={PUBLIC_ROUTE_PATHS.dart}
                className="group rounded-lg border border-border/80 bg-card/40 p-7 transition-colors hover:border-border hover:bg-card/70 md:p-8"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold text-foreground md:text-lg">
                    {SERVICE_LABELS.dart.marketing}
                  </h4>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Build, run, monitor, or scale strategies through Odum&rsquo;s infrastructure.
                </p>
              </Link>
              <Link
                href={PUBLIC_ROUTE_PATHS.regulatory}
                className="group rounded-lg border border-border/80 bg-card/40 p-7 transition-colors hover:border-border hover:bg-card/70 md:p-8"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold text-foreground md:text-lg">
                    {SERVICE_LABELS.regulatory.marketing}
                  </h4>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Governance, reporting, permissions, and structuring around a trading engagement.
                </p>
              </Link>
            </div>
          </section>

          {/* Final CTA band */}
          <section className="mt-32 rounded-lg border border-border/80 bg-gradient-to-b from-card/60 to-card/30 p-10 text-center md:mt-36 md:p-14">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Ready to understand the right route?</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
              Tell us what you are looking to allocate to or evaluate. We will route you to the relevant briefing and
              next step.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
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
