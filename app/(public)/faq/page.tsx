import type { Metadata } from "next";
import Link from "next/link";
import { MarketingStaticFromFile } from "@/components/marketing/marketing-static-from-file";

export const metadata: Metadata = {
  title: "FAQ: Odum Research",
  description:
    "Short answers to the questions we get asked most: product scope, IP protection, strategy decay, regulatory coverage, and onboarding flow.",
};

export default function MarketingFaqPage() {
  return (
    <>
      <MarketingStaticFromFile file="faq.html" />
      <section className="border-t border-border/40 bg-background">
        <div className="container px-4 py-10 md:px-6">
          <div className="mx-auto max-w-4xl rounded-lg border border-border bg-card/30 p-6">
            <h2 className="text-sm font-semibold text-foreground">Longer versions</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/our-story" className="font-medium text-foreground underline-offset-4 hover:underline">
                  Our Story
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  : the founder&apos;s first-person take on why Odum exists.
                </span>
              </li>
              <li>
                <Link href="/story" className="font-medium text-foreground underline-offset-4 hover:underline">
                  Timeline
                </Link>
                <span className="text-muted-foreground">: dated milestones from 2011 to today.</span>
              </li>
              <li>
                <Link href="/briefings" className="font-medium text-foreground underline-offset-4 hover:underline">
                  Briefings hub
                </Link>
                <span className="text-muted-foreground">: per-path briefings (access-code gated).</span>
              </li>
              <li>
                <Link href="/docs" className="font-medium text-foreground underline-offset-4 hover:underline">
                  Developer docs
                </Link>
                <span className="text-muted-foreground">: UAC contracts, integration paths, API reference.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
