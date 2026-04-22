import type { Metadata } from "next";
import Link from "next/link";
import { MarketingStaticFromFile } from "@/components/marketing/marketing-static-from-file";

export const metadata: Metadata = {
  title: "Story — Odum Research",
  description:
    "Odum's story as a timeline: IMC & Mako trading desks from 2011, crypto arbitrage origin, FCA authorisation in January 2023, and the four-path commercial launch.",
};

export default function MarketingStoryPage() {
  return (
    <>
      <MarketingStaticFromFile file="story.html" />
      <section className="border-t border-border/40 bg-background">
        <div className="container px-4 py-10 md:px-6">
          <div className="mx-auto max-w-4xl rounded-lg border border-border bg-card/30 p-6">
            <h2 className="text-sm font-semibold text-foreground">Related</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/our-story"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Our Story (long form)
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  &mdash; the founder&apos;s first-person narrative.
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
                  &mdash; firm identity, team, and what&apos;s live today.
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
                  &mdash; 45 minutes on the calendar.
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
                  &mdash; the operating system behind the timeline.
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
