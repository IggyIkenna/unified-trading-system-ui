import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PUBLIC_ROUTE_PATHS, SERVICE_LABELS } from "@/lib/copy/service-labels";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

/**
 * Public DART Trading Infrastructure page — controlled institutional overview.
 *
 * Per `marketing_site_three_route_consolidation_2026_04_26.plan.md` Phase 6 + user
 * review 2026-04-26: this page does ONE job — explain that DART is the
 * infrastructure layer behind Odum-managed strategies, available to selected
 * clients in three workflow shapes (client signals / full pipeline / Odum
 * signals).
 *
 * Public copy MUST NOT include: "eight-field schema", "your code never crosses
 * the wire", "strategy catalogue / maturity ladder / promotion ledger" detail,
 * "client-exclusivity applies" commercial framing, "Unified Trading API" or
 * /docs links, "Odum's own capital" framing. That material lives in:
 *   /briefings/dart-trading-infrastructure — gated buyer education
 *   /strategy-review                       — prospect-specific structure
 *   signed-in DART surfaces / docs         — implementation detail
 *
 * In-page anchors (#signals-in-capability, #full-stack-capability,
 * #signals-capability) are preserved so legacy 301 redirects still land on
 * meaningful sections.
 */
export const metadata: Metadata = {
  title: `${SERVICE_LABELS.dart.marketing} | Odum Research`,
  description:
    "DART is the infrastructure layer behind Odum-managed strategies, available to selected clients who need a controlled path from research to execution, monitoring, and reporting.",
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
            <p className="mt-3 text-xs text-muted-foreground">
              Access to the DART briefing is provided after the initial review.
            </p>
          </div>

          {/* Three DART capabilities — in-page anchors target legacy redirects */}
          <div className="mb-12">
            <h2 className="mb-3 text-center text-2xl font-semibold">DART capabilities</h2>
            <p className="mb-8 text-center text-sm text-muted-foreground">
              DART can support client-provided signals, Odum-provided signals, or hybrid workflows depending on the
              agreed engagement scope.
            </p>

            <div className="space-y-6">
              {/* Client-provided signals */}
              <Card id="signals-in-capability" className="scroll-mt-24">
                <CardHeader>
                  <Badge variant="outline" className="w-fit mb-2">
                    Client &rarr; Odum
                  </Badge>
                  <CardTitle>Client-provided signals</CardTitle>
                  <CardDescription>
                    For teams that want to keep research and signal generation on their own infrastructure while using
                    Odum for execution, reconciliation, monitoring, and reporting.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Your research stack stays with your team.</li>
                    <li>Odum receives structured trading instructions.</li>
                    <li>Execution, positions, reconciliation, and reporting run through DART.</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Full research-to-execution */}
              <Card id="full-stack-capability" className="scroll-mt-24">
                <CardHeader>
                  <Badge variant="outline" className="w-fit mb-2">
                    Research &rarr; Execution
                  </Badge>
                  <CardTitle>Full research-to-execution workflow</CardTitle>
                  <CardDescription>
                    For teams that want to use more of the DART stack, from research and testing through to live trading
                    and observation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Research, testing, promotion, and live trading in one controlled workflow.</li>
                    <li>Shared monitoring and reporting across the engagement.</li>
                    <li>Suitable where the client wants a more integrated operating model.</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Odum-provided signals */}
              <Card id="signals-capability" className="scroll-mt-24">
                <CardHeader>
                  <Badge variant="outline" className="w-fit mb-2">
                    Odum &rarr; Counterparty
                  </Badge>
                  <CardTitle>Odum-provided signals</CardTitle>
                  <CardDescription>
                    Where appropriate, DART can support Odum-generated signals for counterparties or clients who execute
                    through their own approved infrastructure.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Signals are delivered under an agreed scope.</li>
                    <li>Execution can remain with the counterparty.</li>
                    <li>Reporting and acknowledgement workflows are agreed case by case.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Dashboard and API access — high-level only */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Dashboard and API access</CardTitle>
              <CardDescription>
                Day-to-day work happens inside the authenticated platform, with access scoped to the agreed engagement.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Where available, selected workflows can also be accessed programmatically through documented APIs.
                Detailed documentation is provided inside the appropriate gated or signed-in area.
              </p>
            </CardContent>
          </Card>

          {/* Adjacent engagement routes */}
          <div className="rounded-lg border border-border bg-card/30 p-6">
            <h2 className="text-sm font-semibold text-foreground">Adjacent engagement routes</h2>
            <p className="mt-2 text-sm text-muted-foreground">DART is one of three public engagement routes:</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link
                  href={PUBLIC_ROUTE_PATHS.investment}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {SERVICE_LABELS.investment.marketing}
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; for clients allocating to selected systematic strategies managed by Odum.
                </span>
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
                  &mdash; for engagements that require additional governance, reporting, permissions, or
                  affiliate-supported structuring.
                </span>
              </li>
            </ul>
          </div>

          {/* Final CTA */}
          <div className="mt-10 rounded-lg border border-border bg-card/50 p-6 text-center">
            <h2 className="text-lg font-semibold">Start with a review</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Start with a review so we can understand whether DART, an Odum-managed strategy, or a regulated operating
              model is the right route.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href={PUBLIC_ROUTE_PATHS.startYourReview}>Start Your Review</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={PUBLIC_ROUTE_PATHS.contact}>Contact Odum</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
