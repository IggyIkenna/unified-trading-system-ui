"use client";

/**
 * ResearchShell — the cockpit-wide chrome for the DART Research surface.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §5.3 + Phase 4 of §17.
 *
 * Renders the 6-stage ResearchJourneyRail above the Research layout's
 * existing chrome (BUILD_TABS / ML_SUB_TABS / STRATEGY_SUB_TABS still
 * provide the per-route deep-link affordance until Phase 9).
 */

import * as React from "react";

import { ResearchJourneyRail } from "./research-journey-rail";

interface ResearchShellProps {
  readonly children: React.ReactNode;
  readonly className?: string;
}

export function ResearchShell({ children, className }: ResearchShellProps) {
  return (
    <div className={className} data-testid="research-shell">
      <ResearchJourneyRail />
      {children}
    </div>
  );
}
