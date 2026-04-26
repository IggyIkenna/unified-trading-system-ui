import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BRIEFING_SLUGS, PUBLIC_ROUTE_PATHS, SERVICE_LABELS } from "@/lib/copy/service-labels";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

/**
 * Public Odum-Managed Strategies page — controlled institutional overview.
 *
 * Per `marketing_site_three_route_consolidation_2026_04_26.plan.md` Phase 6 + user
 * review 2026-04-26: this page does ONE job — explain that Odum acts as investment
 * manager for selected systematic strategies through SMA or fund-route structures
 * where appropriate, with reporting and governance scoped per mandate.
 *
 * Public copy MUST NOT include: Fund/SMA hierarchy diagram, "same codebase /
 * partitioned views" language, detailed custody mechanics (scoped API keys,
 * no-withdrawal authority), client-confidentiality data-layer detail, maturity
 * ladder detail, stress-scenario detail, fee-structure mechanics (band /
 * crystallisation), share-class mechanics, "second call" / "dashboard our traders
 * look at every morning" framing, or strategy catalogue exposure. That material
 * lives in:
 *   /briefings/investment-management — gated allocator briefing
 *   /strategy-review                 — prospect-specific structure
 *   signed-in allocator/onboarding   — implementation detail
 */
export const metadata: Metadata = {
  title: `${SERVICE_LABELS.investment.marketing} | Odum Research`,
  description:
    "Allocate capital to selected systematic strategies managed by Odum. Eligible clients can engage through SMA or fund-route structures where appropriate. Mandate terms reviewed case by case.",
};

export default function InvestmentManagementPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 py-12 md:px-6">
        <div className="mx-auto max-w-4xl">
          {/* Hero */}
          <div className="mb-12">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline">Allocator route</Badge>
              <Badge variant="outline">Pooled fund or SMA</Badge>
            </div>
            <h1 className="text-3xl font-bold">{SERVICE_LABELS.investment.marketing}</h1>
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
              Briefings are gated. Start your review to receive access to the relevant allocator briefing.
            </p>
          </div>

          {/* What this route is for */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What this route is for</CardTitle>
              <CardDescription>
                {SERVICE_LABELS.investment.marketing} are for eligible clients who want exposure to systematic trading
                strategies managed by Odum, rather than building or operating the strategy themselves.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">This route may be suitable where a client wants:</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Exposure to selected systematic strategies.</li>
                <li>An SMA or fund-route structure where appropriate.</li>
                <li>Reporting, oversight, and governance around the mandate.</li>
                <li>A managed route rather than direct platform operation.</li>
              </ul>
            </CardContent>
          </Card>

          {/* How strategies are selected */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How strategies are selected</CardTitle>
              <CardDescription>
                Odum reviews strategies through a structured research, testing, and live-readiness process before
                allocating external capital.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                The level of information shared depends on the mandate, the strategy, and the stage of the review.
                Detailed research history, stress testing, and mandate-specific materials are provided during the gated
                briefing and Strategy Review process.
              </p>
            </CardContent>
          </Card>

          {/* Structure and reporting */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Structure and reporting</CardTitle>
              <CardDescription>
                {SERVICE_LABELS.investment.marketing} may be delivered through an SMA, fund route, or other approved
                structure depending on the client and mandate.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Reporting is scoped to the client, mandate, fund interest, or account. The detailed mechanics of
                custody, share classes, permissions, and operational controls are reviewed during onboarding.
              </p>
            </CardContent>
          </Card>

          {/* Fees and mandate terms */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Fees and mandate terms</CardTitle>
              <CardDescription>
                Fees, hurdles, crystallisation timing, reporting frequency, and mandate terms are agreed in the relevant
                mandate pack.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                The public page does not quote or imply standard terms. The specific structure is reviewed case by case.
              </p>
            </CardContent>
          </Card>

          {/* How the process works */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How the process works</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">Start Your Review.</strong> Tell us what you are looking to
                  allocate to or evaluate.
                </li>
                <li>
                  <strong className="text-foreground">Read the relevant briefing.</strong> We share the{" "}
                  {SERVICE_LABELS.investment.marketing} briefing after the initial review.
                </li>
                <li>
                  <strong className="text-foreground">Fit call.</strong> We confirm whether an Odum-managed route is
                  appropriate.
                </li>
                <li>
                  <strong className="text-foreground">Strategy Evaluation.</strong> We collect the information needed to
                  assess mandate fit, structure, and reporting requirements.
                </li>
                <li>
                  <strong className="text-foreground">Strategy Review.</strong> We present the proposed route and next
                  steps.
                </li>
              </ol>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/briefings/${BRIEFING_SLUGS.investment}`}>
                    Open the {SERVICE_LABELS.investment.marketing} briefing (gated)
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Adjacent engagement routes */}
          <div className="rounded-lg border border-border bg-card/30 p-6">
            <h2 className="text-sm font-semibold text-foreground">Adjacent engagement routes</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href={PUBLIC_ROUTE_PATHS.dart}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {SERVICE_LABELS.dart.marketing}
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; for clients that want to build, run, monitor, or scale strategies through Odum&rsquo;s
                  infrastructure.
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
              Tell us what you are looking to allocate to or evaluate. We will route you to the relevant briefing and
              next step.
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
