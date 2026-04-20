import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Investment Management — public marketing page (pb3b narrative).
 *
 * Phase 2A content-depth polish: read-only-key custody mechanic, client-slice
 * visibility framing, performance-fee framing (mechanic only, no numbers), and
 * the rule-03 same-system claim. Fund/SMA hierarchy diagram is a Phase 4
 * deliverable — the slot is reserved below.
 *
 * Codex SSOT:
 *   codex/14-playbooks/_ssot-rules/03-same-system-principle.md
 *   codex/14-playbooks/_ssot-rules/im-profit-share-structures.md
 *   codex/14-playbooks/playbooks/pb3b-investment-management.md
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
              <Badge variant="outline">Investment Management</Badge>
              <Badge variant="outline">FCA 975797</Badge>
              <Badge variant="outline">Pooled fund or SMA</Badge>
            </div>
            <h1 className="text-3xl font-bold">Investment Management</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Allocate capital to Odum-run systematic strategies across digital
              assets, traditional markets, sports, and prediction markets. The
              allocator-facing reporting surface is the same one Odum uses to
              run the strategies &mdash; one system, one codebase, partitioned
              views.
            </p>
          </div>

          {/* How custody works (read-only-key mechanic) */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How custody works</CardTitle>
              <CardDescription>
                Odum does not take custody. Capital remains with the client at
                all times, under the client&apos;s own venue relationships.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Client retains venue custody. Client issues scoped
                read-only-plus-execute API keys to Odum. Odum never custodies
                client capital. All trades settle in the client&apos;s venue
                account.
              </p>
              <p>
                Keys are scoped at the venue level &mdash; trade + positions +
                balances where execution is required, read-only where only
                reconciliation is needed. Withdrawal permission is never
                requested and never accepted.
              </p>
            </CardContent>
          </Card>

          {/* Client-slice visibility (pb3b narrative) */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Client-slice visibility only</CardTitle>
              <CardDescription>
                Pb3b isolation: the reporting surface partitions on the client
                record. There is no cross-client view at any UI layer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Pooled fund clients see only their share-class slice. SMA
                clients see only their own book. No cross-client visibility at
                any UI layer.
              </p>
              <p>
                Aggregation, attribution, risk exposure, and NAV run against the
                client&apos;s slice &mdash; other clients&apos; positions are
                not visible, not queryable, and not inferable from any surface
                the client can reach.
              </p>
            </CardContent>
          </Card>

          {/* Fund / SMA hierarchy visual slot (Phase 4) */}
          <div
            className="mb-8 rounded-lg border border-dashed border-border/60 bg-card/30 p-6 text-center text-sm text-muted-foreground"
            data-testid="fund-sma-hierarchy-diagram-slot"
          >
            {/* fund-sma-hierarchy-diagram slot — Phase 4 */}
            <p className="font-medium text-foreground/80">
              Fund / SMA hierarchy diagram
            </p>
            <p className="mt-2">
              Static visual (org &rarr; pooled fund with share classes or SMA
              per client &rarr; venue API keys) lands in Phase 4.
            </p>
          </div>

          {/* Performance fee framing (mechanic only, no numbers) */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Fee framing</CardTitle>
              <CardDescription>
                Mechanic shape is published; the specific numbers are disclosed
                at mandate-signing stage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Investment-management mandates run on a performance-share plus a
                platform-fee choice selected at mandate signing. No management
                fee is charged on invested capital.
              </p>
              <p>
                Mechanic: a performance share on realised P&amp;L, plus a
                platform fee that the client elects between a variable uplift
                on the performance share or a fixed monthly amount. The choice
                is made once per mandate and locks for the commitment term.
              </p>
              <p>
                Hurdle structure, high-water mark treatment, and crystallisation
                cadence are documented in the mandate pack and walked through
                at second call.
              </p>
            </CardContent>
          </Card>

          {/* Rule-03 same-system callout */}
          <div className="mb-8 rounded-lg border border-border bg-card/50 p-6">
            <h2 className="text-lg font-semibold">One system, partitioned views</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The same dashboards, risk controls, and audit trails serve IM
              clients that serve the Regulatory Umbrella &mdash; one system,
              slice-scoped per audience. Odum operates, audits, and reports
              against the same component tree regardless of which commercial
              path a client sits on.
            </p>
          </div>

          {/* CTA */}
          <div className="rounded-lg border border-border bg-card/50 p-6 text-center">
            <h2 className="text-lg font-semibold">
              Mandate depth and share-class mechanics
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Fund / SMA structure, share-class mechanics, and the strategy
              catalogue available under IM mandates sit behind the briefings
              access code.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href="/briefings/investment-management">
                  Open IM briefing <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/contact">Book a call</Link>
              </Button>
            </div>
          </div>

          {/* Related */}
          <div className="mt-10 rounded-lg border border-border bg-card/30 p-6">
            <h2 className="text-sm font-semibold text-foreground">Related</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/regulatory"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Regulatory Umbrella
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; same custody + reporting model, FCA cover for client
                  regulatory activity.
                </span>
              </li>
              <li>
                <Link
                  href="/platform/full"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  DART Full
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; the research-to-live stack that runs the strategies
                  capital is allocated to.
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
                  &mdash; fund / SMA mechanics, performance-share structure,
                  strategy catalogue behind the light-auth gate.
                </span>
              </li>
              <li>
                <Link
                  href="/firm"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Firm
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; team, operating history, FCA credentials.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
