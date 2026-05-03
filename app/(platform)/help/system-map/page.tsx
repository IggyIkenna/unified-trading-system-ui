"use client";

/**
 * /help/system-map — buyer-facing IA explainer page.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §15.2 + Phase 7 of §17.
 *
 * Authenticated, platform-scoped page reachable from:
 *   - The "?" button next to the DartScopeBar (Phase 7 follow-up wiring).
 *   - Every locked-preview's "Learn more" link.
 *   - The global help menu.
 *
 * Renders the same SystemMap component the wizard step 0 uses, so the
 * wording is impossible to drift between the two surfaces.
 */

import { SystemMap } from "@/components/cockpit/system-map";

export default function SystemMapPage() {
  return (
    <main className="platform-page-width p-6">
      <SystemMap />
    </main>
  );
}
