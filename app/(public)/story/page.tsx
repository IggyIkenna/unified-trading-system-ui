import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PUBLIC_ROUTE_PATHS, SERVICE_LABELS } from "@/lib/copy/service-labels";

/**
 * Public Story page — controlled, calm institutional narrative.
 *
 * Per user review 2026-04-26 the previous timeline version was too dense
 * and too internally revealing for a public surface. AUM growth, "extremely
 * easy at the start / very hard at the end" framing, single-strategy-
 * instruction-protocol detail, "all four commercial paths" wording, and the
 * "book a 45-minute call" CTA all belong in the gated /our-story founder
 * essay or the FAQ — not the public story page.
 *
 * The public arc here:
 *   1. Trading-desk foundation (Ikenna at IMC + Mako).
 *   2. Odum founded as a regulated investment manager.
 *   3. Single-strategy infrastructure proved fragile.
 *   4. DART built to operate systematic strategies properly.
 *   5. Three controlled engagement routes today.
 *
 * Five short paragraphs + a six-bullet timeline. Public page does not need
 * more than this — depth lives in /our-story (gated) and the FAQ.
 */
export const metadata: Metadata = {
  title: "Story | Odum Research",
  description:
    "Odum grew from trading desk experience, FCA-regulated investment management, and the need for a more controlled way to operate systematic strategies.",
};

export default function MarketingStoryPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 py-12 md:px-6">
        <div className="mx-auto max-w-3xl">
          {/* Hero */}
          <div className="mb-12">
            <Badge variant="outline" className="mb-3">
              Story
            </Badge>
            <h1 className="text-3xl font-bold">How Odum came to be</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Odum grew from trading desk experience, FCA-regulated investment management, and the need for a more
              controlled way to operate systematic strategies.
            </p>
          </div>

          {/* Narrative — five short paragraphs */}
          <div className="mb-12 space-y-5 text-base leading-relaxed text-foreground/90">
            <p>
              Odum Research began with a simple frustration: systematic trading had become more complex, but the
              infrastructure around it remained fragmented.
            </p>
            <p>
              Before founding Odum, Ikenna Igboaka traded at IMC in Amsterdam and Mako in London, working across
              volatility arbitrage, systematic market-making, and electronic trading. That experience shaped the
              original view behind Odum: serious trading is not just about a signal. It is about the operating system
              around the signal &mdash; data, research, execution, risk, reconciliation, reporting, and governance
              working together.
            </p>
            <p>
              Odum Research Ltd was founded in 2021 and later authorised by the Financial Conduct Authority. The firm
              initially focused on systematic crypto trading and investment management for professional and
              institutional clients. That early period was valuable because it exposed a hard lesson: relying on a
              narrow strategy set is fragile. Markets mature, edges compress, and research pipelines need to keep
              evolving.
            </p>
            <p>
              The answer was not to keep adding disconnected tools. It was to build one controlled infrastructure layer
              that could support research, execution, monitoring, reporting, and governance across selected systematic
              strategies. That infrastructure became DART.
            </p>
            <p>
              Today, Odum operates around three clear routes: clients can allocate to{" "}
              {SERVICE_LABELS.investment.marketing}, use {SERVICE_LABELS.dart.marketing}, or structure a{" "}
              {SERVICE_LABELS.regulatory.marketing.toLowerCase().replace(/s$/, "")} where the engagement requires it.
              The routes are different, but they are built around the same principle: systematic trading works better
              when the operating model is unified, controlled, and properly governed.
            </p>
            <p className="text-sm text-muted-foreground">
              Odum is still a focused firm. The ambition is not to be everything to everyone. It is to work with
              selected clients where the strategy, infrastructure, and structure fit.
            </p>
          </div>

          {/* Optional short timeline */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">2011 onward &mdash; Trading desk foundation.</strong> Ikenna
                  trades at IMC and Mako across volatility arbitrage, systematic market-making, and electronic trading.
                </li>
                <li>
                  <strong className="text-foreground">2021 &mdash; Odum founded.</strong> Odum Research Ltd is founded
                  to apply systematic trading experience to digital-asset markets and regulated investment management.
                </li>
                <li>
                  <strong className="text-foreground">2023 &mdash; FCA authorisation.</strong> Odum Research Ltd is
                  authorised by the Financial Conduct Authority and begins operating client-facing investment activity
                  for professional and institutional clients.
                </li>
                <li>
                  <strong className="text-foreground">2024 &mdash; Infrastructure lesson.</strong> The early strategy
                  journey shows that single-strategy reliance is fragile. Odum begins building a broader infrastructure
                  layer for research, execution, risk, and reporting.
                </li>
                <li>
                  <strong className="text-foreground">2025 &mdash; DART takes shape.</strong> The platform team
                  consolidates around the current DART architecture, supporting systematic trading workflows across
                  selected markets and engagement types.
                </li>
                <li>
                  <strong className="text-foreground">2026 &mdash; Three routes to work with Odum.</strong>{" "}
                  {SERVICE_LABELS.investment.marketing}, {SERVICE_LABELS.dart.marketing}, and{" "}
                  {SERVICE_LABELS.regulatory.marketing}.
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Final CTA */}
          <div className="rounded-lg border border-border bg-card/50 p-6 text-center">
            <h2 className="text-lg font-semibold">Start with a review</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tell us what you are trying to allocate, build, or structure. We will route you to the relevant briefing
              and next step.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
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

          {/* Related */}
          <div className="mt-10 rounded-lg border border-border bg-card/30 p-6">
            <h2 className="text-sm font-semibold text-foreground">Related</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/our-story" className="font-medium text-foreground underline-offset-4 hover:underline">
                  Our Story (long form)
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; the founder&rsquo;s first-person narrative (gated).
                </span>
              </li>
              <li>
                <Link
                  href={PUBLIC_ROUTE_PATHS.whoWeAre}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Who We Are
                </Link>
                <span className="text-muted-foreground"> &mdash; firm identity, team, and engagement routes.</span>
              </li>
              <li>
                <Link
                  href={PUBLIC_ROUTE_PATHS.dart}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {SERVICE_LABELS.dart.marketing}
                </Link>
                <span className="text-muted-foreground"> &mdash; the operating system behind the journey.</span>
              </li>
              <li>
                <Link
                  href={PUBLIC_ROUTE_PATHS.regulatory}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {SERVICE_LABELS.regulatory.marketing}
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; structure regulated engagements where appropriate.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
