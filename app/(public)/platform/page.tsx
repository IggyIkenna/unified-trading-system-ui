import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PUBLIC_ROUTE_PATHS, SERVICE_LABELS } from "@/lib/copy/service-labels";
import { ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

/**
 * Public DART Trading Infrastructure page.
 *
 * Tightened presentation per user review 2026-04-26: 3-card responsive
 * grid for the three capability modes, mono mode pills, check-row
 * bullets, compact two-column dashboard/API row, two-card adjacent-
 * routes block, review-path strip directly under the hero, reduced
 * vertical padding throughout.
 *
 * Public copy MUST NOT include: "eight-field schema", "your code never
 * crosses the wire", strategy catalogue / maturity ladder / promotion
 * ledger detail, "client-exclusivity applies" framing, /docs links,
 * "Odum's own capital" framing. Depth lives in:
 *   /briefings/dart-trading-infrastructure — gated buyer education
 *   /strategy-review                       — prospect-specific structure
 *   signed-in DART surfaces                — implementation detail
 */
export const metadata: Metadata = {
  title: `${SERVICE_LABELS.dart.marketing} | Odum Research`,
  description:
    "DART is the infrastructure layer behind Odum's systematic trading activity, available to selected clients who need a controlled path from research to execution, monitoring, and reporting.",
};

interface ProcessStep {
  number: string;
  title: string;
  body: string;
}

const PROCESS_STEPS: readonly ProcessStep[] = [
  {
    number: "01",
    title: "Questionnaire",
    body: "A few minutes. Routes you to the relevant briefing pillar.",
  },
  {
    number: "02",
    title: "Briefings",
    body: "Gated material covering DART's structure, mechanics, and scope.",
  },
  {
    number: "03",
    title: "Initial call",
    body: "If the briefing lines up, a focused call rather than a generic intro.",
  },
  {
    number: "04",
    title: "Strategy Evaluation",
    body: "Structured DDQ covering your strategy, venues, risk, and infrastructure needs.",
  },
  {
    number: "05",
    title: "Strategy Review",
    body: "A tailored pre-demo review of your route, requirements, and demo focus.",
  },
  {
    number: "06",
    title: "Platform walkthrough",
    body: "A tailored walkthrough of the relevant workflows and a self-guided fit check.",
  },
  {
    number: "07",
    title: "Commercial Tailoring",
    body: "Deeper catalogue, pricing, and contract shape against your specifics.",
  },
];

interface DartMode {
  id: string;
  modeNumber: string;
  pill: string;
  title: string;
  oneLine: string;
  bullets: readonly string[];
  anchorId: string;
}

const DART_MODES: readonly DartMode[] = [
  {
    id: "signals-in",
    modeNumber: "Mode 01",
    pill: "Client → Odum",
    title: "Client-provided signals",
    oneLine:
      "Keep research and signal generation on your own infrastructure. Odum runs execution, reconciliation, monitoring, and reporting.",
    bullets: [
      "Your research stack stays with your team.",
      "Odum receives structured trading instructions.",
      "Execution, positions, reconciliation, and reporting run through DART.",
    ],
    anchorId: "signals-in-capability",
  },
  {
    id: "full-stack",
    modeNumber: "Mode 02",
    pill: "Research → Execution",
    title: "Full research-to-execution workflow",
    oneLine:
      "Use more of the DART stack: research and testing through to live trading and observation in one controlled workflow.",
    bullets: [
      "Research, testing, promotion, and live trading in one workflow.",
      "Shared monitoring and reporting across the engagement.",
      "Suited to integrated operating models.",
    ],
    anchorId: "full-stack-capability",
  },
  {
    id: "signals-out",
    modeNumber: "Mode 03",
    pill: "Odum → Counterparty",
    title: "Odum-provided signals",
    oneLine:
      "Where appropriate, DART can deliver Odum-generated signals to counterparties or clients who execute through their own approved infrastructure.",
    bullets: [
      "Signals delivered under an agreed scope.",
      "Execution stays with the counterparty.",
      "Reporting and acknowledgement workflows agreed case by case.",
    ],
    anchorId: "signals-capability",
  },
];

export default function MarketingPlatformPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 pb-16 pt-10 md:px-6 md:pb-20 md:pt-12">
        <div className="mx-auto max-w-6xl">
          {/* Hero */}
          <div className="text-center">
            <Badge variant="outline" className="mb-3">
              DART
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{SERVICE_LABELS.dart.marketing}</h1>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground">
              DART is the infrastructure layer behind Odum&rsquo;s systematic trading activity, available to selected
              clients who need a controlled path from research to execution, monitoring, and reporting.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href={PUBLIC_ROUTE_PATHS.startYourReview}>
                  Start Your Review <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={PUBLIC_ROUTE_PATHS.contact}>Contact Odum</Link>
              </Button>
            </div>
          </div>

          {/* On-page review path — quieter than before so it doesn't compete
              with the page heading. */}
          <div className="mx-auto mt-14 flex max-w-2xl flex-wrap items-center justify-center gap-x-2.5 gap-y-1 rounded-md border border-border/40 bg-card/20 px-4 py-2.5 text-[11px] text-muted-foreground/80">
            <span className="font-medium text-foreground/70">Path</span>
            <span className="text-muted-foreground/40">·</span>
            <span>Start Your Review</span>
            <span className="text-muted-foreground/40">→</span>
            <span>Briefings</span>
            <span className="text-muted-foreground/40">→</span>
            <span>Fit call</span>
          </div>

          {/* DART capabilities — three-card grid */}
          <section className="pt-28 md:pt-36">
            <div className="mb-14 text-center">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">DART capabilities</h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                DART can support client-provided signals, Odum-provided signals, or hybrid workflows depending on the
                agreed engagement scope.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 md:gap-7">
              {DART_MODES.map((mode) => (
                <Card
                  key={mode.id}
                  id={mode.anchorId}
                  className="flex h-full flex-col scroll-mt-24 border-border/60 bg-card/40"
                >
                  <CardHeader className="space-y-4 p-7 pb-4 md:p-8 md:pb-5">
                    <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider">
                      <span className="font-semibold text-primary/85">{mode.modeNumber}</span>
                      <span className="rounded-sm border border-border/60 bg-background/50 px-2 py-0.5 text-foreground/75">
                        {mode.pill}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold leading-tight md:text-xl">{mode.title}</h3>
                    <p className="border-t border-border/40 pt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                      {mode.oneLine}
                    </p>
                  </CardHeader>
                  <CardContent className="mt-auto p-7 pt-0 md:p-8 md:pt-0">
                    <ul className="space-y-2.5 text-sm text-foreground/85 md:text-[15px]">
                      {mode.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2.5">
                          <Check className="mt-1 size-3.5 shrink-0 text-primary/70" aria-hidden />
                          <span className="leading-relaxed">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Mode 01 vs Mode 02 differentiation — "When to choose Full" callout.
              Sharpens the why-Full-when-it-is-still-your-signals argument that
              isn't covered by the three-card grid above. */}
          <section className="pt-24 md:pt-32">
            <div className="rounded-lg border border-border/80 bg-card/40 p-7 md:p-10">
              <div className="grid gap-8 md:grid-cols-[1fr_2fr] md:gap-12">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Mode 01 vs Mode 02
                  </h3>
                  <h2 className="mt-3 text-xl font-semibold tracking-tight md:text-2xl">When to choose Full</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                    Signals-In handles execution, post-trade, and reporting against your strategy. Full opens the
                    research and operational stack we run on our own capital &mdash; useful when the prospect&rsquo;s
                    signals are still being shaped or when execution-quality alone isn&rsquo;t the answer.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    What Full unlocks beyond Signals-In
                  </p>
                  <ul className="mt-4 grid gap-x-8 gap-y-2.5 text-sm leading-relaxed text-foreground/85 md:grid-cols-2 md:text-[15px]">
                    {[
                      "Rich data sources (granular tick + book + on-chain + alternative).",
                      "Research environment for backtest, paper, and promotion-ladder workflows.",
                      "Test fee, treasury, risk, liquidation, and rebalancing assumptions on the most granular data.",
                      "Live execution + post-trade analytics + reconciliation + treasury observability.",
                      "Paper trading alongside live, with delivery health and ack flows.",
                      "Live performance vs backtest tracking on a T+1 basis.",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <Check className="mt-1 size-3.5 shrink-0 text-primary/70" aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Dashboard + API access — secondary information band */}
          <section className="pt-24 md:pt-32">
            <div className="grid gap-8 rounded-lg border border-border/80 bg-card/50 p-8 md:grid-cols-2 md:gap-12 md:p-10">
              <div>
                <h3 className="text-xs font-semibold tracking-[0.12em] uppercase text-foreground/70">Dashboard</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                  Day-to-day work happens inside the authenticated platform, with access scoped to the agreed
                  engagement.
                </p>
              </div>
              <div>
                <h3 className="text-xs font-semibold tracking-[0.12em] uppercase text-foreground/70">API access</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                  Where available, selected workflows can be accessed programmatically. Detailed documentation is
                  provided inside the appropriate gated or signed-in area.
                </p>
              </div>
            </div>
          </section>

          {/* Process strip — numbered 7-step funnel (parity with /investment-management + /regulatory) */}
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

          {/* Adjacent engagement routes — two compact cards */}
          <section className="pt-24 md:pt-32">
            <h3 className="mb-7 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Adjacent engagement routes
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              <Link
                href={PUBLIC_ROUTE_PATHS.investment}
                className="group rounded-lg border border-border/80 bg-card/40 p-7 transition-colors hover:border-border hover:bg-card/70 md:p-8"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold text-foreground md:text-lg">
                    {SERVICE_LABELS.investment.marketing}
                  </h4>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Allocate to selected systematic strategies managed by Odum.
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
              Start with a short review. We&rsquo;ll route you to the relevant briefing and next step &mdash; DART, an
              Odum-managed strategy, or a regulated operating model.
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
