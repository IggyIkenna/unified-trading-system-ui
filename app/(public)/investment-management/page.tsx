import { FundSmaHierarchyDiagram } from "@/components/marketing/fund-sma-hierarchy-diagram";
import { Term } from "@/components/marketing/term";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CALENDLY_URL } from "@/lib/marketing/calendly";
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
  title: "Investment Management — Odum Research",
  description:
    "FCA-regulated investment management. Allocate capital to Odum-run systematic strategies across digital assets, traditional markets, sports, and prediction markets. Same reporting surface Odum uses internally; client-slice visibility only.",
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
            <h1 className="text-3xl font-bold">Investment Management</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Allocate capital to Odum-run systematic strategies across digital assets, traditional markets, sports, and
              prediction markets. The allocator-facing reporting surface is the same one Odum uses to run the strategies
              &mdash; one system, one codebase, partitioned views.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Odum operates as an FCA investment manager under FRN 975797 from <strong>January 2023</strong>.
            </p>
          </div>

          {/* How custody works (read-only-key mechanic) */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How custody works</CardTitle>
              <CardDescription>
                Odum does not take custody. Capital remains with the client at all times, under the client&apos;s own
                venue relationships.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Client retains venue custody. Client issues scoped read-only-plus-execute API keys to Odum. Odum never
                custodies client capital. All trades settle in the client&apos;s venue account.
              </p>
              <p>
                Keys are scoped at the venue level &mdash; trade + positions + balances where execution is required,
                read-only where only reconciliation is needed. Withdrawal permission is never requested and never
                accepted.
              </p>
            </CardContent>
          </Card>

          {/* Client-slice visibility */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Client-slice visibility only</CardTitle>
              <CardDescription>
                The reporting surface partitions on the client record. There is no cross-client view at any UI layer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Pooled fund clients see only their share-class slice. SMA clients see only their own book. No
                cross-client visibility at any UI layer.
              </p>
              <p>
                Aggregation, attribution, risk exposure, and NAV run against the client&apos;s slice &mdash; other
                clients&apos; positions are not visible, not queryable, and not inferable from any surface the client
                can reach.
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
                No management fee. A performance share plus a platform fee you pick the shape of at signing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                We don&apos;t charge a management fee. You&apos;re not paying us for capital to sit &mdash; you&apos;re
                paying us for the returns we generate.
              </p>
              <p>
                What you pay is a share of the profit, plus a small platform fee. When you sign the mandate you pick how
                the platform fee works: a slight uplift on the performance share (variable &mdash; you pay more when we
                perform), or a fixed monthly amount (flat &mdash; predictable, useful if you prefer the accounting
                clarity). Once chosen, it locks for the term of the mandate.
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
              The dashboard you log into as an IM client is the same one our own traders look at every morning &mdash;
              just filtered to your slice. Positions, P&amp;L, risk, reconciliation, audit trail: same components, same
              data, same code path. Regulatory Umbrella clients see the same dashboard too, filtered to their activity.
              One operating system; different views per audience &mdash; not three separate products stitched together.
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
                <Link href="/briefings/investment-management">
                  Open IM briefing <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                  Book a call
                </a>
              </Button>
            </div>
          </div>

          {/* Related */}
          <div className="mt-10 rounded-lg border border-border bg-card/30 p-6">
            <h2 className="text-sm font-semibold text-foreground">Related</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/regulatory" className="font-medium text-foreground underline-offset-4 hover:underline">
                  Regulatory Umbrella
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; same custody + reporting model, FCA cover for client regulatory activity.
                </span>
              </li>
              <li>
                <Link href="/platform/full" className="font-medium text-foreground underline-offset-4 hover:underline">
                  DART Full
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

          <div className="mt-10 rounded-lg border border-border bg-card/30 p-5">
            <p className="text-sm font-medium">Tell us what you&rsquo;re looking for</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Answer a few questions about the strategy styles and market exposures you want, and we&rsquo;ll map you to
              the right part of the platform.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Button asChild size="sm">
                <Link href="/questionnaire">
                  Get started <ArrowRight className="ml-1.5 size-3.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/contact">Book a call</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
