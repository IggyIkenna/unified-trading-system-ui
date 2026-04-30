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

import { CockpitWidgetGrid } from "@/components/cockpit/cockpit-widget-grid";
import { ContextualLockedPreview } from "@/components/cockpit/contextual-locked-preview";
import { ReleaseBundlePanel } from "@/components/cockpit/release-bundle-panel";
import { ResearchJourneyRail } from "@/components/cockpit/research-journey-rail";
import { RuntimeOverrideAuthoring } from "@/components/cockpit/runtime-override-authoring";
import { TerminalModeTabs } from "@/components/cockpit/terminal-mode-tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DartScopeBar } from "@/components/shell/dart-scope-bar";
import { DEMO_BUNDLE, DEMO_OVERRIDES } from "@/lib/cockpit/demo-bundle";
import { useWorkspaceScope } from "@/lib/stores/workspace-scope-store";

export default function WorkspaceShellPage() {
  const scope = useWorkspaceScope();

  return (
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
        <CockpitHeader />
        <CockpitWidgetGrid />
        {(scope.surface === "terminal" && (scope.terminalMode === "strategies" || scope.terminalMode === "explain")) ||
        (scope.surface === "research" && scope.researchStage === "promote") ? (
          <ReleaseBundlePanel bundle={DEMO_BUNDLE} activeOverrides={DEMO_OVERRIDES} />
        ) : null}
        {/* Runtime-override authoring — daily-trader configuration surface.
            Renders on Terminal/Command + Strategies (where the user is
            actively running the strategy and may need to override). */}
        {scope.surface === "terminal" && (scope.terminalMode === "command" || scope.terminalMode === "strategies") ? (
          <RuntimeOverrideAuthoring bundle={DEMO_BUNDLE} />
        ) : null}
        <ContextualLockedPreview />
      </main>
    </div>
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
