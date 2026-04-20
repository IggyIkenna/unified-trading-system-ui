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
 * Public umbrella landing for DART (Data Analytics, Research & Trading).
 * Phase 2 of marketing_site_restructure_2026_04_20 replaced the legacy
 * `platform.html` shell with a DART-shaped umbrella page that routes visitors
 * to the two active DART sub-paths: signals-in and full.
 *
 * Codex SSOT: unified-trading-pm/codex/14-playbooks/_ssot-rules/04-dart-commercial-axes.md
 */
export const metadata: Metadata = {
  title: "DART — Data Analytics, Research & Trading — Odum Research",
  description:
    "DART is the set of services Odum uses to build, research, promote, execute, and monitor its own systematic strategies, packaged for client use.",
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
            <h1 className="text-3xl font-bold">
              Data Analytics, Research &amp; Trading (DART)
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              DART is the set of services Odum uses to build, research, promote,
              execute, and monitor its own systematic strategies, packaged for
              client use. Clients who operate their own strategies can plug
              their signals into Odum&apos;s execution and reporting stack, or
              use the full research and promotion pipeline. The underlying
              components are the same as Odum&apos;s internal operation &mdash;
              one system, partitioned views.
            </p>
          </div>

          {/* Two DART paths */}
          <div className="mb-12">
            <h2 className="mb-6 text-center text-2xl font-semibold">
              Two DART paths
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Signals-In */}
              <Card className="flex flex-col">
                <CardHeader>
                  <Badge variant="outline" className="w-fit mb-2">
                    Signals-In (Client &rarr; Odum)
                  </Badge>
                  <CardTitle>DART Signals-In</CardTitle>
                  <CardDescription>
                    Keep your strategy IP upstream. Your instructions flow into
                    Odum&apos;s execution, reconciliation, and reporting stack.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-6">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>
                      Structured instructions against an eight-field schema.
                    </li>
                    <li>
                      Odum runs execution, reconciliation, positions, and
                      reporting.
                    </li>
                    <li>
                      No research, promote, or backtest layer in scope &mdash;
                      those sit in the full DART path.
                    </li>
                  </ul>
                  <Button asChild variant="outline" className="w-fit">
                    <Link href="/platform/signals-in">
                      DART Signals-In detail <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Full DART */}
              <Card className="flex flex-col">
                <CardHeader>
                  <Badge variant="outline" className="w-fit mb-2">
                    Full pipeline
                  </Badge>
                  <CardTitle>DART Full</CardTitle>
                  <CardDescription>
                    Research, promote through paper, and run live on the same
                    stack Odum uses for its own capital.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-6">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>
                      Enriched data services, research, backtesting, promotion,
                      execution, trading, observation.
                    </li>
                    <li>
                      The strategy catalogue, maturity ladder, and promotion
                      ledger are visible end-to-end.
                    </li>
                    <li>
                      Exclusivity available on specialised strategies under
                      fixed-tier engagement.
                    </li>
                  </ul>
                  <Button asChild variant="outline" className="w-fit">
                    <Link href="/platform/full">
                      DART Full detail <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Adjacent services */}
          <div className="rounded-lg border border-border bg-card/50 p-6">
            <h2 className="text-lg font-semibold">Adjacent services</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              DART is one of five commercial paths. Two adjacent paths cover the
              other direction of the signal arrow and capital allocation:
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link
                  href="/signals"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Signals Service (Signals-Out)
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; Odum-generated signals leased to counterparties who
                  execute on their own infrastructure.
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
                  &mdash; allocate capital to Odum-run strategies under the same
                  reporting surface.
                </span>
              </li>
              <li>
                <Link
                  href="/regulatory"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Regulatory Umbrella
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; operate regulated activity under Odum&apos;s FCA
                  permissions.
                </span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              For a detailed walk-through of either DART path, the deeper brief
              is in the briefings hub.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href="/briefings">Open briefings</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/contact">Book a call</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
