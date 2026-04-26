import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PUBLIC_ROUTE_PATHS, SERVICE_LABELS } from "@/lib/copy/service-labels";

/**
 * Public Regulated Operating Models page — controlled institutional overview.
 *
 * Per `marketing_site_three_route_consolidation_2026_04_26.plan.md` Phase 6 + user
 * review 2026-04-26: this page does ONE job — explain that Odum can structure
 * selected engagements around appropriate governance, reporting, regulatory
 * coverage, SMA routes, or affiliate pathways, case by case.
 *
 * Public copy MUST NOT include: API key scopes, Secret Manager references, MLRO
 * sign-off detail, mandate-shape diagrams (Shape 1/2/3), AR registration timing,
 * multi-fund/SMA hierarchy mechanics, sub-fund/share-class detail, venue lists,
 * compliance certifications, audit-trail mechanics, "same component tree" language,
 * or N-to-one supervisory rollups. That material lives in:
 *   /briefings/regulated-operating-models — gated buyer education
 *   /strategy-review                       — prospect-specific structure
 *   signed-in onboarding/client docs       — implementation detail
 */
export const metadata: Metadata = {
  title: `${SERVICE_LABELS.regulatory.marketing} | Odum Research`,
  description:
    "Some trading engagements need more than technology. Odum can help selected clients structure an appropriate operating model around governance, reporting, permissions, counterparties, and regulatory responsibilities. Coverage is reviewed case by case.",
};

export default function RegulatoryPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 py-12 md:px-6">
        <div className="mx-auto max-w-4xl">
          {/* Hero */}
          <div className="mb-12">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline">Regulatory</Badge>
              <Badge variant="outline">Case by case</Badge>
            </div>
            <h1 className="text-3xl font-bold">{SERVICE_LABELS.regulatory.marketing}</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Some trading engagements need more than technology. Odum can help selected clients structure an
              appropriate operating model around governance, reporting, counterparties, permissions, and regulatory
              responsibilities.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Coverage is reviewed case by case. The right route depends on who manages the strategy, who faces the
              client, where the capital sits, and what approvals or affiliate arrangements are required.
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
          </div>

          {/* What this route covers */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What this route covers</CardTitle>
              <CardDescription>
                Regulated Operating Models are the governance and structuring layer around selected trading engagements.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                The structure may include SMA arrangements, Odum-managed mandates, affiliate fund pathways, supervisory
                reporting, or other approved arrangements depending on the engagement.
              </p>
              <p>
                In some cases, the structuring layer may be the main engagement. In others, it sits alongside an
                Odum-managed strategy or DART Trading Infrastructure mandate.
              </p>
            </CardContent>
          </Card>

          {/* When it matters */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>When it matters</CardTitle>
              <CardDescription>This route may be relevant when a client needs to:</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Operate a strategy under a clearer governance framework.</li>
                <li>Separate trading activity across mandates, funds, or accounts.</li>
                <li>Evidence reporting, oversight, and audit trails.</li>
                <li>Use Odum&rsquo;s infrastructure while maintaining appropriate controls.</li>
                <li>Assess whether an SMA, fund route, affiliate pathway, or regulated arrangement is suitable.</li>
              </ul>
            </CardContent>
          </Card>

          {/* How Odum approaches structure */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How Odum approaches structure</CardTitle>
              <CardDescription>
                Odum starts with the commercial and operational facts of the engagement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>We review:</p>
              <ul className="space-y-2">
                <li>Who owns or originates the strategy.</li>
                <li>Who is expected to manage or supervise it.</li>
                <li>Where the capital will sit.</li>
                <li>What reporting and oversight are required.</li>
                <li>Which counterparties, custodians, venues, or affiliates are involved.</li>
                <li>Whether Odum, the client, or an affiliate should carry the relevant role.</li>
              </ul>
              <p>
                The outcome is not assumed in advance. Some engagements may need only DART infrastructure. Others may
                require a more formal regulated or affiliate-supported model.
              </p>
            </CardContent>
          </Card>

          {/* Custody and control */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Custody and control</CardTitle>
              <CardDescription>Odum does not present regulated operating models as a custody service.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Where custody, brokerage, exchange, or fund-administration arrangements are required, they are
                structured through the appropriate account, custodian, venue, broker, administrator, or affiliate route.
                Permissions and controls are scoped to the agreed mandate. The details are reviewed during onboarding
                and documented in the relevant operating model.
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
                  <strong className="text-foreground">Start Your Review.</strong> Tell us what you are trying to operate
                  or structure.
                </li>
                <li>
                  <strong className="text-foreground">Read the relevant briefing.</strong> We share the appropriate
                  regulated-model briefing after the initial review.
                </li>
                <li>
                  <strong className="text-foreground">Fit call.</strong> We confirm whether Odum, DART, an SMA route, or
                  an affiliate pathway is relevant.
                </li>
                <li>
                  <strong className="text-foreground">Strategy Evaluation.</strong> You provide the specifics needed to
                  assess structure, risk, venues, reporting, and operational responsibilities.
                </li>
                <li>
                  <strong className="text-foreground">Strategy Review.</strong> We present the proposed operating model
                  and next steps.
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Related routes */}
          <div className="rounded-lg border border-border bg-card/30 p-6">
            <h2 className="text-sm font-semibold text-foreground">Related routes</h2>
            <ul className="mt-3 space-y-2 text-sm">
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
                  href={PUBLIC_ROUTE_PATHS.dart}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {SERVICE_LABELS.dart.marketing}
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; for clients using Odum&rsquo;s infrastructure to build, run, monitor, or scale systematic
                  strategies.
                </span>
              </li>
            </ul>
          </div>

          {/* Final CTA */}
          <div className="mt-10 rounded-lg border border-border bg-card/50 p-6 text-center">
            <h2 className="text-lg font-semibold">Start with a review</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tell us what you are trying to operate, manage, or structure. We will route you to the relevant briefing
              and next step.
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
