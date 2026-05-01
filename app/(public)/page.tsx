import type { Metadata } from "next";
import { HomePageClient } from "./_home-client";

/**
 * Public homepage — React composition.
 *
 * Plan: `marketing_site_three_route_consolidation_2026_04_26.plan.md`,
 * Phase 3. Replaces the prior `<MarketingStaticFromFile file="homepage.html" />`
 * shadow-DOM render with a typed React component tree.
 *
 * Six sections per Phase 3 § 6:
 *   1. Hero (single primary CTA: Start Your Review)
 *   2. Three engagement-route cards (Odum-Managed Strategies / DART /
 *      Regulated Operating Models)
 *   3. Why Odum exists (~70 words + link to /story)
 *   4. Six-step engagement journey
 *   5. Governance and risk (short, serious)
 *   6. Final CTA (mirror Hero)
 *
 * Word budget per Completion Patch §C: 700–1,000 words max.
 * SEO metadata per Completion Patch §J.
 * CTA discipline per Completion Patch §D — banned strings: "Get Started",
 * "Apply Now", "Request Demo", "Take Questionnaire", "Sign Up",
 * "Access Platform", "Launch Strategy". "Begin Questionnaire" is allowed
 * only on `/start-your-review`.
 */
export const metadata: Metadata = {
  title: "Odum Research | Trading Infrastructure for Institutional Clients",
  description:
    "Odum helps institutional clients design, build, and operate systematic trading capabilities across digital assets, traditional markets, sports, and prediction markets. Bring your own strategies (we protect your IP) or use ours.",
};

export default function PublicHomePage() {
  return <HomePageClient />;
}
