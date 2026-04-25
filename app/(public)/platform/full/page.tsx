import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CALENDLY_URL } from "@/lib/marketing/calendly";

/**
 * DART Full pipeline — public page.
 *
 * The `(Client, full-pipeline)` and `(Odum, full-pipeline)` cells per rule 04.
 * Public copy covers scope and engagement shape; detailed research-surface
 * walk-through and strategy catalogue preview sit behind the
 * `/briefings/full-dart` behind the briefings access code.
 *
 * Codex SSOT: _ssot-rules/04-dart-commercial-axes.md,
 * _ssot-rules/03-same-system-principle.md.
 */
export const metadata: Metadata = {
  title: "DART Full — Odum Research",
  description:
    "DART Full: enriched data, research, backtest, promotion, execution, trading, and reporting on the same stack Odum runs for its own capital.",
};

export default function DartFullPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 py-12 md:px-6">
        <div className="mx-auto max-w-4xl">
          {/* Hero */}
          <div className="mb-12">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline">DART</Badge>
              <Badge variant="outline">Full pipeline</Badge>
            </div>
            <h1 className="text-3xl font-bold">DART Full</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Research, promote through paper, and run live on the same stack Odum runs for its own capital. Data
              services, feature subscriptions, backtesting, promotion, execution, trading, and reporting &mdash; one
              operating surface, one codebase, partitioned views.
            </p>
          </div>

          {/* Scope */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What sits in scope</CardTitle>
              <CardDescription>
                Every layer Odum uses internally is available, with the strategy maturity ladder and promotion ledger
                visible end-to-end.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold">Data &amp; features</h3>
                <p className="text-sm text-muted-foreground">
                  Market-tick data, on-chain feeds, sports and prediction sources, and the feature catalogue built on
                  top. Enriched, not resold.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold">Research &amp; backtest</h3>
                <p className="text-sm text-muted-foreground">
                  Backtest engine, strategy catalogue, and the same code path used to run strategies live. Metered
                  research consumption on the compute-heavy blocks.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold">Promotion &amp; paper</h3>
                <p className="text-sm text-muted-foreground">
                  Maturity ladder from backtested through paper-validated to live, with a fourteen-day paper gate and
                  allocation-directive pipeline.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold">Execution &amp; reporting</h3>
                <p className="text-sm text-muted-foreground">
                  The execution, position, and reporting layer from DART Signals-In, plus the research-to-live promotion
                  path absent there.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Strategy origin */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Strategy origin</CardTitle>
              <CardDescription>
                DART Full accepts client-origin and Odum-origin strategies on the same stack.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Client-origin: build and run your own strategy on Odum infrastructure top-to-bottom. Research, backtest,
                promote, execute, trade, observe.
              </p>
              <p>
                Odum-origin: allocate to Odum-developed strategies under a full-stack engagement. Odum strategy exposure
                always sits in this path, not in a lighter package.
              </p>
            </CardContent>
          </Card>

          {/* Engagement shape */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Engagement shape</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Engagement runs on a twelve-month minimum. Pricing is per-building-block and mixable: reporting core and
                strategy service on the fixed tier, venue and chain packs on either tier, analytics packs
                usage-variable. Numbers are disclosed at second call.
              </p>
              <p>
                Exclusivity is available on the fixed tier, typically scoped by asset class, venue set, or strategy
                family.
              </p>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="rounded-lg border border-border bg-card/50 p-6 text-center">
            <h2 className="text-lg font-semibold">Research-surface walk-through and strategy catalogue</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The research surface walk-through and the full strategy catalogue sit behind the briefings access code.
              You can{" "}
              <Link
                href="/contact?service=dart-full&action=request-access"
                className="text-primary underline-offset-4 hover:underline"
              >
                request a code here
              </Link>
              .
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href="/briefings">
                  Open briefings <ArrowRight className="ml-2 size-4" />
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
                <Link href="/platform" className="font-medium text-foreground underline-offset-4 hover:underline">
                  Back to DART umbrella
                </Link>
                <span className="text-muted-foreground"> &mdash; DART overview with both sub-paths side by side.</span>
              </li>
              <li>
                <Link
                  href="/platform/signals-in"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  DART Signals-In
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; client-origin strategy, your instructions into Odum&apos;s execution stack.
                </span>
              </li>
              <li>
                <Link
                  href="/investment-management"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Investment Management
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; allocate capital to Odum-run strategies under the same reporting surface.
                </span>
              </li>
              <li>
                <Link
                  href="/briefings/dart-full"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  DART Full briefing
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; research-surface walk-through and strategy catalogue behind the briefings access code.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
