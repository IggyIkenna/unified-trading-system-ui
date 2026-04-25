import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignalFlowDiagram } from "@/components/marketing/signal-flow-diagram";
import { CALENDLY_URL } from "@/lib/marketing/calendly";

/**
 * DART Signals-In — public page.
 *
 * Client-origin strategy with downstream integration per rule 04's
 * `(Client, downstream)` cell. The public page outlines the scope and the
 * direction of the signal arrow (Client -> Odum). Schema depth and venue
 * compatibility matrix live inside the light-auth briefing at
 * `/briefings/dart-signals-in` (built in parallel; link to `/briefings` hub
 * as fallback while the slug lands).
 *
 * Codex SSOT: _ssot-rules/04-dart-commercial-axes.md,
 * shared-core/instruction-schema-fit-and-package-boundaries.md.
 */
export const metadata: Metadata = {
  title: "DART Signals-In — Odum Research",
  description:
    "DART Signals-In: your strategy, Odum's execution, reconciliation, and reporting. Structured instructions against a defined schema. The signal arrow runs Client -> Odum.",
};

export default function DartSignalsInPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 py-12 md:px-6">
        <div className="mx-auto max-w-4xl">
          {/* Hero */}
          <div className="mb-12">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline">DART</Badge>
              <Badge variant="outline">Signals-In</Badge>
              <Badge variant="outline">Client &rarr; Odum</Badge>
            </div>
            <h1 className="text-3xl font-bold">DART Signals-In</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Your strategy runs on your infrastructure. Your instructions land on Odum&apos;s execution,
              reconciliation, positions, and reporting stack. The signal arrow runs one way: from your generator into
              Odum&apos;s operating layer.
            </p>
          </div>

          {/* What's in scope */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What sits in scope</CardTitle>
              <CardDescription>
                Operating layer for a client-origin strategy. No research, promote, or backtest pipeline &mdash; those
                sit in the full DART path.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold">Execution</h3>
                <p className="text-sm text-muted-foreground">
                  Order routing, venue adapters, algo library, fill reconciliation. Same engine Odum runs for its own
                  capital.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold">Positions &amp; P&amp;L</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time position tracking, cash and inventory reconciliation, P&amp;L attribution against your
                  instructions.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold">Reporting</h3>
                <p className="text-sm text-muted-foreground">
                  Allocator-grade surfaces: transaction-cost analysis, best execution, audit trail, regulatory
                  artefacts.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold">Instruction schema</h3>
                <p className="text-sm text-muted-foreground">
                  An eight-field schema describes every instruction. Schema detail and venue compatibility matrix are in
                  the light-auth briefing.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Direction arrow framing */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Direction of the signal arrow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                DART Signals-In sends the signal one way: from your strategy runtime to Odum&apos;s execution layer.
                Odum does not reshape, re-score, or overlay your signal; the instruction set is honoured as specified.
              </p>
              <div className="my-4 rounded-md border border-border/60 bg-background/60 p-4">
                <SignalFlowDiagram direction="in" />
              </div>
              <p>
                This is the inverse of the{" "}
                <Link href="/signals" className="font-medium text-foreground underline-offset-4 hover:underline">
                  Odum Signals
                </Link>
                , where Odum-generated signals flow out to a counterparty who executes on their own infrastructure.
              </p>
            </CardContent>
          </Card>

          {/* Fit-check */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Fit-check</CardTitle>
              <CardDescription>The path fits when all four of these hold.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Your strategy-origin IP stays upstream and you run your own signal generator.</li>
                <li>Your instructions map cleanly to the eight-field schema.</li>
                <li>
                  You want a regulated operating layer without rebuilding execution, reconciliation, and reporting
                  in-house.
                </li>
                <li>
                  You do not need Odum&apos;s research, backtest, or promotion pipeline &mdash; if you do, look at DART
                  Full.
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Pricing + commitment */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Engagement shape</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Engagement runs on a twelve-month minimum. Pricing is per-building-block and mixable: primary venues on
                a fixed tier, marginal venues on a usage tier, core reporting fixed. Numbers are disclosed at second
                call.
              </p>
              <p>Exclusivity and custom-solution premiums are available on the fixed tier and negotiated per block.</p>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="rounded-lg border border-border bg-card/50 p-6 text-center">
            <h2 className="text-lg font-semibold">Schema detail, venue compatibility, lifecycle semantics</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Full schema and integration walk-through sit behind the briefings access code. You can{" "}
              <Link
                href="/contact?service=dart-signals-in&action=request-access"
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
                <Link href="/platform/full" className="font-medium text-foreground underline-offset-4 hover:underline">
                  DART Full
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; research, promote through paper, and run live on the same stack.
                </span>
              </li>
              <li>
                <Link href="/signals" className="font-medium text-foreground underline-offset-4 hover:underline">
                  Odum Signals
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; the inverse direction: Odum-generated signals to a counterparty.
                </span>
              </li>
              <li>
                <Link
                  href="/briefings/dart-signals-in"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  DART Signals-In briefing
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; instruction-schema detail, venue compatibility matrix, lifecycle semantics behind the
                  briefings access code.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
