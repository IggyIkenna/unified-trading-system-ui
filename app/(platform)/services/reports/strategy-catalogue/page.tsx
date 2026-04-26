/**
 * /services/reports/strategy-catalogue — Reports-tile sub-route alias.
 *
 * Funnel Coherence plan Workstream D2: the Reports tile splits internally
 * into "Strategy catalogue" (this surface) and "Own-account reports". The
 * canonical mount of the catalogue UI lives at /services/strategy-catalogue
 * (with deep sub-routes /coverage, /strategies/[archetype]/[slot], /admin).
 *
 * This route resolves the new Reports-tile path. We redirect to the
 * existing canonical mount rather than duplicating the client-component
 * tree, so the deep sub-routes (coverage, instances, admin tiers) all
 * continue to resolve from a single location.
 */

import { redirect } from "next/navigation";

export default function Page() {
  redirect("/services/strategy-catalogue");
}
