import { FundSmaHierarchyDiagram } from "@/components/marketing/fund-sma-hierarchy-diagram";
import { Term } from "@/components/marketing/term";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BRIEFING_SLUGS, PUBLIC_ROUTE_PATHS, SERVICE_LABELS } from "@/lib/copy/service-labels";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

/**
 * Investment Management — public marketing page.
 *
 * Content axes: custody mechanic (Odum never custodies; execute+read API key
 * for SMA; fund admin via regulated affiliate for Pooled), client-slice
 * visibility framing, performance-fee mechanic (no numbers), same-system
 * claim. Fund/SMA hierarchy diagram is tracked separately.
 *
 * Codex SSOT:
 *   codex/14-playbooks/_ssot-rules/03-same-system-principle.md
 *   codex/14-playbooks/_ssot-rules/im-profit-share-structures.md
 *   codex/14-playbooks/shared-core/fund-administration-and-custody.md
 *   codex/14-playbooks/playbooks/04-investment-management.md
 */
export const metadata: Metadata = {
  title: `${SERVICE_LABELS.investment.marketing} | Odum Research`,
  description:
    "Allocate capital to selected systematic strategies managed by Odum across digital assets, traditional markets, sports, and prediction markets. FCA-regulated. Same reporting surface Odum uses internally; client-slice visibility only.",
};

export default function InvestmentManagementPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 py-12 md:px-6">
        <div className="mx-auto max-w-4xl">
          {/* Hero */}
          <div className="mb-12">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                <Term id="im">Investment Management</Term>
              </Badge>
              <Badge variant="outline">
                <Term id="fca">FCA</Term> 975797
              </Badge>
              <Badge variant="outline">
                <Term id="pooled">Pooled</Term> fund or <Term id="sma">SMA</Term>
              </Badge>
            </div>
            <h1 className="text-3xl font-bold">{SERVICE_LABELS.investment.marketing}</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Allocate capital to selected systematic strategies managed by Odum across digital assets, traditional
              markets, sports, and prediction markets. The allocator-facing reporting surface is the same one Odum uses
              to run the strategies &mdash; one system, one codebase, partitioned views.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Odum operates as an FCA investment manager under FRN 975797 from <strong>January 2023</strong>.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href={`/briefings/${BRIEFING_SLUGS.investment}`}>
                  Read the briefing <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={PUBLIC_ROUTE_PATHS.startYourReview}>Start Your Review</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Briefings are gated. Start your review to receive an access code.
            </p>
          </div>

          {/* Custody — short pointer to /regulatory which carries the depth */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Custody</CardTitle>
              <CardDescription>
                Odum does not take custody. Capital stays under your own venue relationships (SMA) or with a qualified
                third-party custodian (Pooled).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                The custody mechanic is shared across {SERVICE_LABELS.investment.marketing} and{" "}
                <Link href="/regulatory" className="text-primary underline-offset-4 hover:underline">
                  {SERVICE_LABELS.regulatory.marketing}
                </Link>{" "}
                — scoped venue API keys with no withdrawal authority, ever. Read the full custody walk-through on the{" "}
                {SERVICE_LABELS.regulatory.marketing} page.
              </p>
            </CardContent>
          </Card>

          {/* Client confidentiality */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Client confidentiality is enforced at the system level</CardTitle>
              <CardDescription>
                Your slice is your slice. Other clients&apos; positions are not visible, not queryable, and not
                inferable from any surface you can reach.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Reporting partitions on your client record at the data layer — not just at the UI layer. Pooled fund
                allocators see only their share-class slice; SMA allocators see only their own book. Aggregation,
                attribution, risk exposure, and NAV all run against your slice.
              </p>
              <p>
                Confidentiality is built in, not opted into: there is no cross-client view at any UI layer, and the same
                rule binds Odum&apos;s internal staff sharing the system — operational visibility is bounded by the same
                partitions that bound your view of others.
              </p>
            </CardContent>
          </Card>

          {/* Fund / SMA hierarchy diagram — Phase 4 visual */}
          <FundSmaHierarchyDiagram />

          {/* Strategy lifecycle + evidence-led promotion */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Evidence-led promotion, backtest to live</CardTitle>
              <CardDescription>
                Every strategy capital is allocated to has been through the same research surface Odum uses internally.
                The decision to go live is evidence-led, not hope-led.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Strategies progress through a one-way maturity ladder &mdash; code-audited, backtested, paper-traded,
                live-tiny, then live-allocated. Backtest, paper, and live results sit on the same timeline, so you see
                the identical strategy behaving across all three regimes before any real money is at stake.
              </p>
              <p>
                The research surface also runs parameterised stress scenarios &mdash; the shocks an allocator actually
                worries about (venue outage, funding spike, liquidity drain, correlation break) tested on demand.
                Allocators in the second call walk through the ladder state of every strategy in their mandate and the
                stress responses that matter for their mandate shape.
              </p>
            </CardContent>
          </Card>

          {/* Performance fee framing (mechanic only, no numbers) */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How fees work</CardTitle>
              <CardDescription>
                No management fee &mdash; you pay for returns generated, plus a small platform fee you pick the shape of
                at signing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                You pay a share of the profit plus a small platform fee. At signing you choose how the platform fee
                works: a slight uplift on the performance share (variable &mdash; you pay more when we perform), or a
                fixed monthly amount (flat &mdash; predictable, useful if you prefer accounting clarity). Once chosen,
                it locks for the term of the mandate.
              </p>
              <p>
                The specific percentages, how the hurdle is defined, and how often fees crystallise all sit in the
                mandate pack. We walk you through them at the second call &mdash; no surprises.
              </p>
            </CardContent>
          </Card>

          {/* Same-system callout */}
          <div className="mb-8 rounded-lg border border-border bg-card/50 p-6">
            <h2 className="text-lg font-semibold">You see the same system we use ourselves</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The dashboard you log into as an allocator is the same one our own traders look at every morning &mdash;
              just filtered to your slice. Positions, P&amp;L, risk, reconciliation, audit trail: same components, same
              data, same code path. {SERVICE_LABELS.regulatory.marketing} clients see the same dashboard too, filtered
              to their activity. One operating system; different views per audience &mdash; not separate products
              stitched together.
            </p>
          </div>

          {/* CTA */}
          <div className="rounded-lg border border-border bg-card/50 p-6 text-center">
            <h2 className="text-lg font-semibold">Mandate depth and share-class mechanics</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Fund / SMA structure, share-class mechanics, and the strategy catalogue available under IM mandates sit
              behind the briefings access code. You can{" "}
              <Link
                href="/contact?service=investment-management&action=request-access"
                className="text-primary underline-offset-4 hover:underline"
              >
                request a code here
              </Link>
              .
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href={`/briefings/${BRIEFING_SLUGS.investment}`}>
                  Open IM briefing <ArrowRight className="ml-2 size-4" />
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
                <Link href="/regulatory" className="font-medium text-foreground underline-offset-4 hover:underline">
                  {SERVICE_LABELS.regulatory.marketing}
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; same custody + reporting model, FCA cover for client regulatory activity.
                </span>
              </li>
              <li>
                <Link href="/platform" className="font-medium text-foreground underline-offset-4 hover:underline">
                  {SERVICE_LABELS.dart.marketing}
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; the research-to-live stack that runs the strategies capital is allocated to.
                </span>
              </li>
              <li>
                <Link
                  href="/briefings/investment-management"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  IM briefing
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; fund / SMA mechanics, performance-share structure, strategy catalogue behind the briefings
                  access code.
                </span>
              </li>
              <li>
                <Link href="/who-we-are" className="font-medium text-foreground underline-offset-4 hover:underline">
                  Who We Are
                </Link>
                <span className="text-muted-foreground"> &mdash; team, operating history, FCA credentials.</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
