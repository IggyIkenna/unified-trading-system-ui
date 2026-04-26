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
      "Use more of the DART stack — research and testing through to live trading and observation in one controlled workflow.",
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
        <div className="mx-auto max-w-5xl">
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

          {/* On-page review path — replaces the disconnected global breadcrumb. */}
          <div className="mx-auto mt-14 flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-md border border-border/60 bg-card/40 px-4 py-3 text-[12px] text-muted-foreground">
            <span className="font-medium text-foreground/85">Path</span>
            <span className="text-muted-foreground/60">·</span>
            <span>Start Your Review</span>
            <span className="text-muted-foreground/60">→</span>
            <span>Briefings</span>
            <span className="text-muted-foreground/60">→</span>
            <span>Fit call</span>
          </div>

          {/* DART capabilities — three-card grid */}
          <section className="pt-28 md:pt-32">
            <div className="mb-12 text-center">
              <h2 className="text-2xl font-semibold tracking-tight">DART capabilities</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                DART can support client-provided signals, Odum-provided signals, or hybrid workflows depending on the
                agreed engagement scope.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {DART_MODES.map((mode) => (
                <Card
                  key={mode.id}
                  id={mode.anchorId}
                  className="flex h-full flex-col scroll-mt-24 border-border/60 bg-card/40"
                >
                  <CardHeader className="space-y-4 pb-4">
                    <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider">
                      <span className="font-semibold text-primary/85">{mode.modeNumber}</span>
                      <span className="rounded-sm border border-border/60 bg-background/50 px-2 py-0.5 text-foreground/75">
                        {mode.pill}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold leading-tight">{mode.title}</h3>
                    <p className="border-t border-border/40 pt-3 text-sm leading-relaxed text-muted-foreground">
                      {mode.oneLine}
                    </p>
                  </CardHeader>
                  <CardContent className="mt-auto pt-0">
                    <ul className="space-y-2 text-sm text-foreground/85">
                      {mode.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2">
                          <Check className="mt-0.5 size-3.5 shrink-0 text-primary/70" aria-hidden />
                          <span className="leading-snug">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Dashboard + API access — compact two-column row */}
          <section className="pt-24 md:pt-32">
            <div className="grid gap-6 rounded-lg border border-border/60 bg-card/30 p-7 md:grid-cols-2 md:gap-10 md:p-8">
              <div>
                <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground/85">Dashboard</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Day-to-day work happens inside the authenticated platform, with access scoped to the agreed
                  engagement.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground/85">API access</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Where available, selected workflows can be accessed programmatically. Detailed documentation is
                  provided inside the appropriate gated or signed-in area.
                </p>
              </div>
            </div>
          </section>

          {/* Adjacent engagement routes — two compact cards */}
          <section className="pt-24 md:pt-32">
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Adjacent engagement routes
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Link
                href={PUBLIC_ROUTE_PATHS.investment}
                className="group rounded-lg border border-border/60 bg-card/30 p-5 transition-colors hover:border-border hover:bg-card/60"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">{SERVICE_LABELS.investment.marketing}</h4>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="mt-2 text-sm leading-snug text-muted-foreground">
                  Allocate to selected systematic strategies managed by Odum.
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
              Start with a short review. We&rsquo;ll route you to the relevant briefing and next step &mdash; DART, an
              Odum-managed strategy, or a regulated operating model.
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
