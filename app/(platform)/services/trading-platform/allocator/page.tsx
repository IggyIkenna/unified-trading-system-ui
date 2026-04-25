import type { Metadata } from "next";

import { AllocationApplied } from "@/components/allocator/allocation-applied";

/**
 * G2.10 Phase A — Trading-platform side portfolio-allocator surface.
 *
 * Auto-apply flow. Platform subscribers trust the allocator algorithm;
 * every ``AllocationDirective`` commits directly on client-infra. This
 * page shows the latest applied directive + history. No approval queue,
 * no Apply button — auto-apply is the promise of the commercial model.
 *
 * Emits synthetic ``ALLOCATION_AUTO_APPLIED`` events per directive for
 * Playwright + telemetry. In prod the events stream from the strategy-
 * service emitter via Pub/Sub.
 *
 * Audience: ``trading_platform_subscriber`` (via ``resolveAllocatorRoute``
 * in ``lib/auth/allocator-routing.ts``). IM audiences route to the IM-side
 * surface instead.
 */

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Portfolio allocator · Trading Platform",
  description: "Platform-side allocator surface — auto-apply on client-infra. Latest directives + history.",
};

export default function TradingPlatformAllocatorPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="platform-page-width space-y-6 p-6">
        <div className="space-y-2">
          <h1 className="text-page-title font-semibold tracking-tight">Portfolio allocator</h1>
          <p className="text-body text-muted-foreground max-w-2xl">
            Trading platform side — auto-apply flow. Every allocator cadence emits an ``AllocationDirective`` that
            commits directly on your infra. Review applied directives + weight diffs here; there&apos;s no approval
            queue because no human is in the loop.
          </p>
        </div>
        <AllocationApplied />
      </div>
    </div>
  );
}
