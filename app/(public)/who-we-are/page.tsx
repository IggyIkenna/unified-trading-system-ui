import type { Metadata } from "next";
import Link from "next/link";
import { MarketingStaticFromFile } from "@/components/marketing/marketing-static-from-file";
import { SERVICE_LABELS } from "@/lib/copy/service-labels";

export const metadata: Metadata = {
  title: "Who We Are | Odum Research",
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
                <Link
                  href="/start-your-review"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Start your review
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  : short fit-review questionnaire, then routed to the relevant briefing.
                </span>
              </li>
              <li>
                <Link href="/briefings" className="font-medium text-foreground underline-offset-4 hover:underline">
                  Briefings hub
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  : per-route deep-dive briefings behind the light-auth gate.
                </span>
              </li>
              <li>
                <Link
                  href="/investment-management"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {SERVICE_LABELS.investment.marketing}
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  : allocate capital to selected systematic strategies managed by Odum.
                </span>
              </li>
              <li>
                <Link href="/platform" className="font-medium text-foreground underline-offset-4 hover:underline">
                  {SERVICE_LABELS.dart.marketing}
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  : the research-to-execution stack we use ourselves, available to clients.
                </span>
              </li>
              <li>
                <Link href="/regulatory" className="font-medium text-foreground underline-offset-4 hover:underline">
                  {SERVICE_LABELS.regulatory.marketing}
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  : structure regulated engagements where appropriate; FCA-regulated.
                </span>
              </li>
              <li>
                <Link href="/contact" className="font-medium text-foreground underline-offset-4 hover:underline">
                  Contact Odum
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  : general enquiries, press / partnerships, advisor / referral.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
