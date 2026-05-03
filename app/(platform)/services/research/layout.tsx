"use client";

import { ResearchJourneyRail } from "@/components/cockpit/research-journey-rail";
import { DartScopeBar } from "@/components/shell/dart-scope-bar";
import { ServiceTabs, BUILD_TABS, LIVE_ASOF_VISIBLE } from "@/components/shell/service-tabs";
import { LiveAsOfToggle } from "@/components/platform/live-asof-toggle";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { useAuth } from "@/hooks/use-auth";

export default function ResearchServiceLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <>
      <div className="px-4 pt-3">
        <DartScopeBar />
      </div>
      {/* ResearchJourneyRail — 6-stage primary nav per §5.3 + §17 Phase 4
          (Discover · Build · Train · Validate · Allocate · Promote).
          Active stage resolved from URL prefix; route → scope auto-sync
          fires on every navigation. Old BUILD_TABS render below as deep-
          link affordance until Phase 9. */}
      <ResearchJourneyRail />
      <ServiceTabs
        tabs={BUILD_TABS}
        entitlements={user?.entitlements}
        rightSlot={LIVE_ASOF_VISIBLE.build ? <LiveAsOfToggle /> : undefined}
      />
      <ErrorBoundary>{children}</ErrorBoundary>
    </>
  );
}
