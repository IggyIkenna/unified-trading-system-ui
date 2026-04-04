"use client";

/**
 * ResearchFamilyShell — Shared wrapper for Strategy, ML, and Execution research.
 *
 * The gap analysis says:
 * "These should feel like one family: same shell, same context model,
 *  same candidate-selection behavior, same comparison grammar,
 *  same handoff semantics — only different result objects and slice dimensions."
 *
 * This component provides:
 * 1. Shared context bar (scope, batch/live, data provenance)
 * 2. Batch/live rail with lifecycle stage indicator
 * 3. Entitlement gating
 * 4. Error boundary
 * 5. Consistent layout wrapper
 *
 * Different per-family:
 * - Sub-tabs (Strategy, ML, Execution each define their own)
 * - Platform color scheme
 * - Result objects and metrics
 */

import * as React from "react";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { EntitlementGate } from "@/components/platform/entitlement-gate";
import { BatchLiveRail } from "@/components/platform/batch-live-rail";
import { useAuth } from "@/hooks/use-auth";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { cn } from "@/lib/utils";
import type { Entitlement } from "@/lib/config/auth";

export type ResearchPlatform = "strategy" | "ml" | "execution";

const PLATFORM_CONFIG: Record<
  ResearchPlatform,
  {
    label: string;
    entitlement: Entitlement;
    serviceName: string;
    defaultStage: string;
  }
> = {
  strategy: {
    label: "Strategy Research",
    entitlement: "strategy-full",
    serviceName: "Research",
    defaultStage: "Backtest",
  },
  ml: {
    label: "ML Research",
    entitlement: "strategy-full",
    serviceName: "Research",
    defaultStage: "Train",
  },
  execution: {
    label: "Execution Research",
    entitlement: "execution-basic",
    serviceName: "Execution Analytics",
    defaultStage: "Simulate",
  },
};

interface ResearchFamilyShellProps {
  platform: ResearchPlatform;
  tabs: React.ReactNode;
  children: React.ReactNode;
  showBatchLiveRail?: boolean;
  className?: string;
}

export function ResearchFamilyShell({
  platform,
  tabs,
  children,
  showBatchLiveRail = true,
  className,
}: ResearchFamilyShellProps) {
  const { user } = useAuth();
  const { scope, setMode } = useGlobalScope();
  const config = PLATFORM_CONFIG[platform];

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Row 1: Sub-tabs (provided by each family) */}
      {tabs}

      {/* Row 2: Batch/Live rail — shared grammar */}
      {showBatchLiveRail && (
        <BatchLiveRail
          platform={platform}
          currentStage={config.defaultStage}
          context={scope.mode === "live" ? "LIVE" : "BATCH"}
          onContextChange={(v) => setMode(v === "LIVE" ? "live" : "batch")}
          compact
        />
      )}

      {/* Content: entitlement gated + error bounded */}
      <div className="flex-1 min-h-0 overflow-auto">
        <EntitlementGate entitlement={config.entitlement} serviceName={config.serviceName}>
          <ErrorBoundary>{children}</ErrorBoundary>
        </EntitlementGate>
      </div>
    </div>
  );
}
