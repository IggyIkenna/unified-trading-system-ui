import type { Metadata } from "next";
import { StartYourReviewClient } from "./_client";

/**
 * `/start-your-review` — context page sitting between the homepage CTA and
 * the questionnaire. Per Phase 3 of
 * `marketing_site_three_route_consolidation_2026_04_26.plan.md`, the public
 * homepage no longer links directly to the questionnaire; the institutional
 * funnel is:
 *
 *   homepage "Start Your Review" → /start-your-review (this page) →
 *   "Begin Questionnaire" → /questionnaire
 *
 * Word budget per Completion Patch §C: 250–450 words.
 */
export const metadata: Metadata = {
  title: "Start Your Review | Odum Research",
  description:
    "A short review to find the right route into Odum — Odum-Managed Strategies, DART, or Regulated Operating Models — followed by the relevant briefing and a focused call.",
};

export default function StartYourReviewPage() {
  return <StartYourReviewClient />;
}
