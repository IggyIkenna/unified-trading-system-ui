import type { Metadata } from "next";
import Link from "next/link";
import { MarketingStaticFromFile } from "@/components/marketing/marketing-static-from-file";

export const metadata: Metadata = {
  title: "Our Story — Odum Research",
  description:
    "Odum's founder story: why two and a half years on a crypto arb desk led us to build a unified trading operating system — and why we offer it to other firms through a dual-incentive partnership model.",
};

export default function MarketingOurStoryPage() {
  return (
    <>
      <MarketingStaticFromFile file="our-story.html" />
      <section className="border-t border-border/40 bg-background">
        <div className="container px-4 py-10 md:px-6">
          <div className="mx-auto max-w-4xl rounded-lg border border-border bg-card/30 p-6">
            <h2 className="text-sm font-semibold text-foreground">Related</h2>
            <ul className="mt-3 space-y-2 text-sm">
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
                  &mdash; schedule a first call on Calendly.
                </span>
              </li>
              <li>
                <Link
                  href="/who-we-are"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Who We Are
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; the firm, the team, and what&apos;s live today.
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
                  &mdash; allocate capital to Odum-run systematic strategies.
                </span>
              </li>
              <li>
                <Link
                  href="/platform"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  DART
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; the operating system, available to clients in Signals-In or Full mode.
                </span>
              </li>
              <li>
                <Link
                  href="/signals"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Odum Signals
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; our signals, your execution stack.
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
                  &mdash; operate regulated activity under Odum&apos;s FCA permissions.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
