import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SERVICE_LABELS, BRIEFING_SLUGS } from "@/lib/copy/service-labels";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

/**
 * Public engagement-route page for DART Trading Infrastructure.
 *
 * Phase 2 of marketing_site_three_route_consolidation_2026_04_26 collapsed
 * /platform/signals-in, /platform/full, and /signals into in-page anchors on
 * this single page. The legacy URLs 301-redirect here:
 *   /platform/signals-in → /platform#signals-in-capability
 *   /platform/full       → /platform#full-stack-capability
 *   /signals             → /platform#signals-capability
 *
 * The page is intentionally slim — depth lives behind the briefings access
 * code at /briefings/dart-trading-infrastructure. Public copy stays minimal
 * per Completion Patch §C (1,000–1,400 word budget).
 */
export const metadata: Metadata = {
  title: `${SERVICE_LABELS.dart.marketing} | Odum Research`,
  description:
    "DART is the trading infrastructure Odum uses to build, research, execute, and monitor its own systematic strategies. Available to clients with research-to-execution workflow, signals capability (client-provided / Odum-provided / hybrid), and reporting overlay.",
};

export default function MarketingPlatformPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 py-12 md:px-6">
        <div className="mx-auto max-w-4xl">
          {/* Hero */}
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-4">
              DART
            </Badge>
            <h1 className="text-3xl font-bold">{SERVICE_LABELS.dart.marketing}</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              The infrastructure layer behind Odum&apos;s own systematic strategies, available to selected clients who
              need a controlled path from research to execution, monitoring, and reporting.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href={`/briefings/${BRIEFING_SLUGS.dart}`}>
                  Read the DART briefing <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/start-your-review">Start your review</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Briefings are gated. Start your review to receive an access code.
            </p>
          </div>

          {/* Three DART capabilities — in-page anchors target legacy redirects */}
          <div className="mb-12">
            <h2 className="mb-6 text-center text-2xl font-semibold">DART capabilities</h2>
            <p className="mb-8 text-center text-sm text-muted-foreground">
              DART supports client-provided signals, Odum-provided signals, or hybrid workflows depending on the agreed
              engagement scope.
            </p>

            <div className="space-y-6">
              {/* Signals-In capability */}
              <Card id="signals-in-capability" className="scroll-mt-24">
                <CardHeader>
                  <Badge variant="outline" className="w-fit mb-2">
                    Client &rarr; Odum
                  </Badge>
                  <CardTitle>Signals-In</CardTitle>
                  <CardDescription>
                    Your strategy runs on your infrastructure; structured instructions flow into Odum&apos;s execution,
                    reconciliation, and reporting stack. Your code never crosses the wire.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Structured instructions against an eight-field schema.</li>
                    <li>Odum runs execution, reconciliation, positions, and reporting.</li>
                    <li>Research and backtest layers stay with your team.</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Full DART capability */}
              <Card id="full-stack-capability" className="scroll-mt-24">
                <CardHeader>
                  <Badge variant="outline" className="w-fit mb-2">
                    Research &rarr; Execution
                  </Badge>
                  <CardTitle>Full research-to-execution pipeline</CardTitle>
                  <CardDescription>
                    Research, promote through paper, and run live on the same stack Odum uses for its own capital.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>
                      Enriched data services, research, backtesting, promotion, execution, trading, and observation.
                    </li>
                    <li>The strategy catalogue, maturity ladder, and promotion ledger are visible end-to-end.</li>
                    <li>
                      <strong>Your IP stays yours:</strong> client-exclusivity applies where appropriate &mdash; Odum
                      does not run your strategy on its own book, and other clients do not run it either.
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Odum-provided signals capability */}
              <Card id="signals-capability" className="scroll-mt-24">
                <CardHeader>
                  <Badge variant="outline" className="w-fit mb-2">
                    Odum &rarr; Counterparty
                  </Badge>
                  <CardTitle>Odum-provided signals</CardTitle>
                  <CardDescription>
                    Where appropriate, DART can supply Odum-generated signals to counterparties who execute on their own
                    infrastructure. Available by separate agreement.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Counterparty receives signals; execution stays with the counterparty.</li>
                    <li>Delivery, observability, and acknowledgement reporting included.</li>
                    <li>Engagement scope and counterparty fit assessed case by case.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Dashboard vs API — operating model context */}
          <div className="mb-12 rounded-lg border border-border bg-card/50 p-6">
            <h2 className="text-lg font-semibold">Dashboard vs API</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Day-to-day work runs in the authenticated platform: the post-login services portal (dashboard, data,
              research, trading, observe, reports &mdash; sliced to your entitlements). The same operations are
              available programmatically where we ship endpoints: the Unified Trading API and service REST APIs,
              documented at{" "}
              <Link href="/docs" className="font-medium text-foreground underline-offset-4 hover:underline">
                /docs
              </Link>
              .
            </p>
          </div>

          {/* Adjacent engagement routes */}
          <div className="rounded-lg border border-border bg-card/50 p-6">
            <h2 className="text-lg font-semibold">Adjacent engagement routes</h2>
            <p className="mt-2 text-sm text-muted-foreground">DART is one of three public engagement routes:</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link
                  href="/investment-management"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {SERVICE_LABELS.investment.marketing}
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; allocate capital to Odum-run strategies under the same reporting surface.
                </span>
              </li>
              <li>
                <Link href="/regulatory" className="font-medium text-foreground underline-offset-4 hover:underline">
                  {SERVICE_LABELS.regulatory.marketing}
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; structure the engagement around the right governance, permissions, and reporting where
                  required.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
