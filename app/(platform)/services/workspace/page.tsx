"use client";

/**
 * /services/workspace — the unified cockpit shell.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §5 + §17 + §22.
 *
 * This is the "wow-factor" surface. The dashboard tile for DART Terminal /
 * DART Research routes here; the user lands inside the cockpit and the
 * widget grid + dial controls reshape around their scope.
 *
 *   - DartScopeBar (Phase 2) — global scope summary + dials
 *   - TerminalModeTabs OR ResearchJourneyRail (Phases 3 + 4) — surface-
 *     contextual primary nav
 *   - CockpitWidgetGrid (Phase 5) — `widgetsForScope(scope).primary`
 *   - ContextualLockedPreview (Phase 7) — scope-aware FOMO cards
 *
 * URL contract: every WorkspaceScope axis round-trips on the URL, so deep
 * links restore the cockpit shape on a fresh tab.
 */

import * as React from "react";

import { AdminOperationalConfigPanel } from "@/components/cockpit/admin-operational-config-panel";
import { AssumptionStackPanel } from "@/components/cockpit/assumption-stack-panel";
import { BacktestVsOperatingPanel } from "@/components/cockpit/backtest-vs-operating-panel";
import { CockpitWidgetGrid } from "@/components/cockpit/cockpit-widget-grid";
import {
  BacktestRunsPanel,
  CockpitToastDock,
  MlTrainingRunsPanel,
  OrderTicketPanel,
} from "@/components/cockpit/cockpit-ops-panels";
import { ContextualLockedPreview } from "@/components/cockpit/contextual-locked-preview";
import { ExplainAttributionPanel } from "@/components/cockpit/explain-attribution-panel";
import { PromoteBundleForm } from "@/components/cockpit/promote-bundle-form";
import { ReleaseBundlePanel } from "@/components/cockpit/release-bundle-panel";
import { ResearchJourneyRail } from "@/components/cockpit/research-journey-rail";
import { RuntimeOverrideAuthoring } from "@/components/cockpit/runtime-override-authoring";
import { StrategyScenarioTapePanel } from "@/components/cockpit/strategy-scenario-tape";
import { StrategyVisibilitySummary } from "@/components/cockpit/strategy-visibility-summary";
import { TerminalModeTabs } from "@/components/cockpit/terminal-mode-tabs";
import { WorkspaceUrlSync } from "@/components/cockpit/workspace-url-sync";
import { AllWidgetProviders } from "@/components/widgets/all-widget-providers";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DartScopeBar } from "@/components/shell/dart-scope-bar";
import {
  DEMO_ASSUMPTION_STACK,
  DEMO_BUNDLE,
  DEMO_CONNECTIVITY,
  DEMO_DRIFT_REPORT,
  DEMO_OVERRIDES,
  DEMO_TREASURY_OPERATIONAL,
} from "@/lib/cockpit/demo-bundle";
import { useWorkspaceScope } from "@/lib/stores/workspace-scope-store";

export default function WorkspaceShellPage() {
  const scope = useWorkspaceScope();

  // Audit fix #1 — the CockpitWidgetGrid renders REAL widget components for
  // primary widgets, not just cards. The widgets read from context-based
  // data providers, so the entire workspace shell must be wrapped in
  // `AllWidgetProviders` (the same provider tree the legacy /services/trading
  // layouts used). Each provider seeds deterministic mock data for the demo.
  return (
    <AllWidgetProviders>
      <div className="flex flex-col h-full">
        {/* Scope bar — always visible, always answers "what am I looking at". */}
        <div className="border-b border-border/40 px-4 py-2.5">
          <DartScopeBar defaultExpanded />
        </div>

        {/* Surface-specific primary nav. */}
        {scope.surface === "research" ? <ResearchJourneyRail /> : <TerminalModeTabs />}

        {/* Cockpit body — scope summary header + widget grid + locked previews
          + release-bundle panel surfaces the typed Configuration Lifecycle
          (Bundle + active RuntimeOverrides) on Strategies / Explain modes. */}
        <main className="flex-1 min-h-0 overflow-auto p-4 space-y-4" data-testid="cockpit-shell-body">
          {/* Audit fix #6 — every scope mutation pushes the canonical URL so
            refresh + share-link both restore the exact cockpit shape. */}
          <WorkspaceUrlSync />
          <CockpitHeader />
          {/* Audit fix #5 — StrategyAvailabilityResolver counts surface here so
            the buyer sees scope + persona + entitlement combined into a
            single visibility decision (not just scope filtering). */}
          <StrategyVisibilitySummary />
          {/* Plan §4.9 — assumption-stack USP. Renders on every cockpit
              surface where the buyer asks "what assumptions drive this?":
              Research/Validate (author), Research/Promote (frozen),
              Terminal/Strategies (active), Terminal/Explain (drift). */}
          {scope.surface === "research" && (scope.researchStage === "validate" || scope.researchStage === "promote") ? (
            <AssumptionStackPanel stack={DEMO_ASSUMPTION_STACK} />
          ) : null}
          {scope.surface === "terminal" && (scope.terminalMode === "strategies" || scope.terminalMode === "explain") ? (
            <AssumptionStackPanel
              stack={DEMO_ASSUMPTION_STACK}
              drift={scope.terminalMode === "explain" ? DEMO_DRIFT_REPORT : undefined}
            />
          ) : null}
          {/* Plan §4.9 — backtest vs operating-adjusted simulation. Lives on
              Research/Validate alongside the assumption stack — answers
              "would this signal still work after the operating costs are
              applied?" */}
          {scope.surface === "research" && scope.researchStage === "validate" ? <BacktestVsOperatingPanel /> : null}
          {/* Plan §13 mock-mode liveness: real interactive backtest runs on
              Research/Validate. Click "Run backtest" → row appears →
              progresses → completes with operating-adjusted Sharpe. */}
          {scope.surface === "research" && scope.researchStage === "validate" ? <BacktestRunsPanel /> : null}
          {/* ML training runs on Research/Train — Start training → row
              progresses → "Promote to paper" transitions state. */}
          {scope.surface === "research" && scope.researchStage === "train" ? <MlTrainingRunsPanel /> : null}
          {/* Order ticket on Terminal/Command — Submit → pending → fill
              lands ~1s later with synthetic slippage. */}
          {scope.surface === "terminal" && scope.terminalMode === "command" ? <OrderTicketPanel /> : null}
          {/* Strategy lifecycle replay — fires scripted scenarios end-to-end
              across asset groups + archetypes. Renders on Terminal/Strategies
              (where users are inspecting running strategies) and
              Terminal/Explain (where users want to replay what happened). */}
          {scope.surface === "terminal" && (scope.terminalMode === "strategies" || scope.terminalMode === "explain") ? (
            <StrategyScenarioTapePanel />
          ) : null}
          <CockpitWidgetGrid />
          {(scope.surface === "terminal" &&
            (scope.terminalMode === "strategies" || scope.terminalMode === "explain")) ||
          (scope.surface === "research" && scope.researchStage === "promote") ? (
            <ReleaseBundlePanel bundle={DEMO_BUNDLE} activeOverrides={DEMO_OVERRIDES} />
          ) : null}
          {/* Promote bundle-creation form — only on Research/Promote. Pairs with
            the read-only ReleaseBundlePanel above so the user sees the
            artifact they would create AND the form that creates it. */}
          {scope.surface === "research" && scope.researchStage === "promote" ? (
            <PromoteBundleForm connectivity={DEMO_CONNECTIVITY} />
          ) : null}
          {/* Runtime-override authoring — daily-trader configuration surface.
            Renders on Terminal/Command + Strategies (where the user is
            actively running the strategy and may need to override). */}
          {scope.surface === "terminal" && (scope.terminalMode === "command" || scope.terminalMode === "strategies") ? (
            <RuntimeOverrideAuthoring bundle={DEMO_BUNDLE} />
          ) : null}
          {/* Explain side-by-side attribution — bundle baseline + override
            deltas + realised. §4.8.3 rule 2 (overrides surfaced by
            contract). */}
          {scope.surface === "terminal" && scope.terminalMode === "explain" ? (
            <ExplainAttributionPanel bundle={DEMO_BUNDLE} activeOverrides={DEMO_OVERRIDES} />
          ) : null}
          {/* Admin Operational config — Treasury routing + CeFi/DeFi
            connectivity + signers + outbound endpoints. Renders on
            Terminal/Ops mode (operator view) and on the dedicated
            surface=ops admin route group. */}
          {(scope.surface === "terminal" && scope.terminalMode === "ops") || scope.surface === "ops" ? (
            <AdminOperationalConfigPanel treasury={DEMO_TREASURY_OPERATIONAL} connectivity={DEMO_CONNECTIVITY} />
          ) : null}
          <ContextualLockedPreview />
        </main>
        {/* Bottom-right toast dock — every interactive dispatch (override,
            promote, backtest queued, ML training started, order routed,
            fill landed) renders a confirmation here. Auto-dismisses after
            4s. */}
        <CockpitToastDock />
      </div>
    </AllWidgetProviders>
  );
}

function CockpitHeader() {
  const scope = useWorkspaceScope();
  const surfaceLabel = SURFACE_LABEL[scope.surface] ?? scope.surface;
  const detail =
    scope.surface === "terminal"
      ? (scope.terminalMode ?? "command")
      : scope.surface === "research"
        ? (scope.researchStage ?? "discover")
        : "—";

  return (
    <Card className="border-border/40 bg-gradient-to-br from-background to-muted/10" data-testid="cockpit-shell-header">
      <CardContent className="p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold tracking-tight">{surfaceLabel}</h1>
            <Badge variant="secondary" className="text-[10px] font-mono uppercase">
              {detail}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-mono" data-testid="cockpit-shell-engagement-badge">
              {scope.engagement}
            </Badge>
            <Badge
              variant="outline"
              className={
                scope.executionStream === "live"
                  ? "text-[10px] font-mono border-rose-500/40 bg-rose-500/10 text-rose-400"
                  : "text-[10px] font-mono"
              }
              data-testid="cockpit-shell-stream-badge"
            >
              {scope.executionStream}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">{describeScope(scope)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

const SURFACE_LABEL: Record<string, string> = {
  dashboard: "Dashboard",
  terminal: "DART Terminal",
  research: "DART Research",
  reports: "Reports",
  signals: "Signals",
  ops: "Ops",
};

function describeScope(scope: ReturnType<typeof useWorkspaceScope>): string {
  const bits: string[] = [];
  if (scope.assetGroups.length > 0) bits.push(scope.assetGroups.join(" + "));
  else bits.push("Cross-asset");
  if (scope.families.length > 0) bits.push(scope.families.join(" / "));
  if (scope.archetypes.length > 0) bits.push(scope.archetypes.join(" / "));
  if (scope.shareClasses.length > 0) bits.push(scope.shareClasses.join("/"));
  return bits.join(" · ");
}
