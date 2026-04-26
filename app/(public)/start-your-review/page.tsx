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
    "Answer a short questionnaire so we can route you to the relevant briefing and next step. The review takes a few minutes; outcomes range from briefing access through to a tailored fit call.",
};

export default function StartYourReviewPage() {
  return <StartYourReviewClient />;
}
