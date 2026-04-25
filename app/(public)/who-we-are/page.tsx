import type { Metadata } from "next";
import Link from "next/link";
import { MarketingStaticFromFile } from "@/components/marketing/marketing-static-from-file";

export const metadata: Metadata = {
  title: "Who We Are — Odum Research",
  description: "Odum Research: team, mission, and how we work with clients and allocators.",
};

export default function MarketingWhoWeArePage() {
  return (
    <>
      <MarketingStaticFromFile file="who-we-are.html" />
      {/* Related — React-level sibling-links (shadow DOM above is untouched). */}
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
                <span className="text-muted-foreground"> &mdash; schedule a first call on Calendly.</span>
              </li>
              <li>
                <Link href="/briefings" className="font-medium text-foreground underline-offset-4 hover:underline">
                  Briefings hub
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; per-path deep-dive briefings behind the light-auth gate.
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
                <Link href="/regulatory" className="font-medium text-foreground underline-offset-4 hover:underline">
                  Regulatory Umbrella
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; operate regulated activity under Odum&apos;s FCA permissions.
                </span>
              </li>
              <li>
                <Link href="/platform" className="font-medium text-foreground underline-offset-4 hover:underline">
                  DART
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; Data Analytics, Research &amp; Trading: our operating system, available to clients.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
