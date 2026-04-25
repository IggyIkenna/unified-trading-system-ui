import type { Metadata } from "next";
import Link from "next/link";
import { MarketingStaticFromFile } from "@/components/marketing/marketing-static-from-file";
import { SignalFlowDiagram } from "@/components/marketing/signal-flow-diagram";

export const metadata: Metadata = {
  title: "Odum Signals — Odum Research",
  description:
    "Odum Signals: Odum-generated signals delivered to authenticated counterparty endpoints. The counterparty executes on its own infrastructure; Odum does not see fills, positions, or P&L.",
};

export default function MarketingSignalsPage() {
  return (
    <>
      <MarketingStaticFromFile file="signals.html" />
      {/* Coverage breadth — surfaces USP #2 (five asset groups × options/futures/spot) in the signals context. */}
      <section className="border-t border-border/40 bg-background">
        <div className="container px-4 py-10 md:px-6">
          <div className="mx-auto max-w-4xl rounded-lg border border-border bg-card/30 p-6">
            <h2 className="text-sm font-semibold text-foreground">Signals across five asset groups</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Odum-generated signals span CeFi exchanges, DeFi protocols, traditional venues (commodities, currencies,
              equities), sports books, and prediction markets (Polymarket, Kalshi, etc.). Options, futures, and spot
              across everything. The signals are generated on the same research surface Odum uses for its own capital;
              what reaches the counterparty endpoint is a typed, HMAC-signed payload on the eight-field schema.
            </p>
          </div>
        </div>
      </section>
      {/* Direction-arrow diagram — React-level, rendered below the shadow DOM marketing surface. */}
      <section className="border-t border-border/40 bg-background">
        <div className="container px-4 py-10 md:px-6">
          <div className="mx-auto max-w-4xl rounded-lg border border-border bg-card/30 p-6">
            <h2 className="text-sm font-semibold text-foreground">Direction of the signal arrow</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Signal leasing is one-way: Odum emits; the counterparty executes on its own infrastructure. No capital
              flows; Odum does not see counterparty fills.
            </p>
            <div className="mt-4 rounded-md border border-border/60 bg-background/60 p-4">
              <SignalFlowDiagram direction="out" />
            </div>
          </div>
        </div>
      </section>
      {/* Existing counterparty CTA — gated by login, routes to tenant-scoped dashboard. */}
      <section className="border-t border-border/40 bg-background">
        <div className="container px-4 py-10 md:px-6">
          <div className="mx-auto max-w-4xl rounded-lg border border-border bg-card/30 p-6">
            <h2 className="text-sm font-semibold text-foreground">Already a counterparty?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              View your tenant-scoped signal history, delivery health, and backtest comparison. Login required;
              counterparty-type users are routed directly to the dashboard after auth.
            </p>
            <div className="mt-4">
              <Link
                href="/services/signals/dashboard"
                data-testid="signals-public-counterparty-cta"
                className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                View your dashboard &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* Related — React-level sibling-links (shadow DOM above is untouched). */}
      <section className="border-t border-border/40 bg-background">
        <div className="container px-4 py-10 md:px-6">
          <div className="mx-auto max-w-4xl rounded-lg border border-border bg-card/30 p-6">
            <h2 className="text-sm font-semibold text-foreground">Related</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/platform/signals-in"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  DART Signals-In
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; the inverse direction: your signals into Odum&apos;s execution stack.
                </span>
              </li>
              <li>
                <Link
                  href="/briefings/signals-out"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Odum Signals briefing
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; signal payload schema, delivery mechanics, and light observability UI behind the briefings
                  access code.
                </span>
              </li>
              <li>
                <Link href="/platform" className="font-medium text-foreground underline-offset-4 hover:underline">
                  DART umbrella
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; where Signals-In and Full DART sit alongside Odum Signals.
                </span>
              </li>
              <li>
                <a
                  href="https://calendly.com/odum-ikenna"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Book a call
                </a>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; schedule a first call to discuss signal leasing shape.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
