"use client";

/**
 * ResearchJourneyRail — the 6-stage primary nav for DART Research.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §5.3 + Phase 4 of §17:
 * the Research surface collapses behind 6 buyer-facing stages
 * (Discover · Build · Train · Validate · Allocate · Promote).
 *
 * Visual: a horizontal "journey rail" with stage chips connected by
 * progress arrows so the user reads the lifecycle as a left-to-right
 * narrative, not a flat tab strip. Active stage gets the primary tone +
 * a bottom indicator.
 *
 * Behaviour mirrors TerminalModeTabs:
 *   - Click → router.push(stage.defaultHref) AND setResearchStage(stage)
 *   - Active stage from URL prefix (longest-prefix-wins) → scope.researchStage
 *     when surface=research → "discover" default.
 *   - Route → scope auto-sync useEffect on mount + on URL change.
 *
 * Phase 4 SCOPE: ship the rail primitive + route-driven sync. Old
 * BUILD_TABS / STRATEGY_SUB_TABS / ML_SUB_TABS render below as deep-link
 * affordances; Phase 9 retires the legacy per-route pages.
 */

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import {
  RESEARCH_STAGES,
  RESEARCH_STAGE_META,
  defaultResearchStage,
  researchStageForPath,
} from "@/lib/cockpit/research-stages";
import type { ResearchStage } from "@/lib/architecture-v2/workspace-scope";
import { useWorkspaceScope, useWorkspaceScopeStore } from "@/lib/stores/workspace-scope-store";
import { cn } from "@/lib/utils";

interface ResearchJourneyRailProps {
  readonly className?: string;
}

export function ResearchJourneyRail({ className }: ResearchJourneyRailProps) {
  const pathname = usePathname() ?? "";
  const scope = useWorkspaceScope();
  const setResearchStage = useWorkspaceScopeStore((s) => s.setResearchStage);
  const setSurface = useWorkspaceScopeStore((s) => s.setSurface);

  const activeStage: ResearchStage = React.useMemo(() => {
    const fromPath = researchStageForPath(pathname);
    if (fromPath !== null) return fromPath;
    if (scope.surface === "research" && scope.researchStage !== null) return scope.researchStage;
    return defaultResearchStage();
  }, [pathname, scope.surface, scope.researchStage]);

  // Route → scope auto-sync. Landing on /services/research/ml/training flips
  // surface=research + researchStage=train so deep-link sharing always
  // restores the cockpit shape.
  React.useEffect(() => {
    const fromPath = researchStageForPath(pathname);
    if (fromPath === null) return;
    if (scope.surface !== "research") setSurface("research", "route-redirect");
    if (scope.researchStage !== fromPath) setResearchStage(fromPath, "route-redirect");
  }, [pathname, scope.surface, scope.researchStage, setSurface, setResearchStage]);

  // Audit fix #2 — workspace-native links when inside /services/workspace.
  const insideWorkspace = pathname.startsWith("/services/workspace");

  return (
    <nav
      aria-label="Research journey"
      className={cn("flex items-stretch gap-0 border-b border-border/40 bg-background overflow-x-auto", className)}
      data-testid="research-journey-rail"
      data-active-stage={activeStage}
      data-inside-workspace={insideWorkspace ? "true" : "false"}
    >
      {RESEARCH_STAGES.map((stage, idx) => {
        const meta = RESEARCH_STAGE_META[stage];
        const isActive = stage === activeStage;
        const isFirst = idx === 0;
        const isLast = idx === RESEARCH_STAGES.length - 1;
        const href = insideWorkspace ? `/services/workspace?surface=research&rs=${stage}` : meta.defaultHref;

        return (
          <React.Fragment key={stage}>
            <Link
              href={href}
              aria-current={isActive ? "page" : undefined}
              data-testid={`research-stage-${stage}`}
              data-active={isActive}
              onClick={() => {
                if (scope.surface !== "research") setSurface("research", "research-stage-toggle");
                setResearchStage(stage, "research-stage-toggle");
              }}
              className={cn(
                "relative flex flex-col gap-0 px-4 py-2.5 text-xs transition-colors min-w-[8rem] flex-shrink-0",
                isActive
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40",
                isFirst && "pl-5",
                isLast && "pr-5",
              )}
            >
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className={cn(
                    "size-4 rounded-full border flex items-center justify-center text-[9px] font-mono",
                    isActive ? "border-primary bg-primary/20 text-primary" : "border-border/60 text-muted-foreground",
                  )}
                >
                  {idx + 1}
                </span>
                <span className="text-sm font-semibold tracking-tight">{meta.label}</span>
              </span>
              <span className="text-[10px] text-muted-foreground/70 leading-tight pl-5">{meta.tagline}</span>
              {isActive ? (
                <span
                  aria-hidden
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                  data-testid={`research-stage-${stage}-indicator`}
                />
              ) : null}
            </Link>
            {!isLast ? (
              <div
                aria-hidden
                className="flex items-center px-1 text-muted-foreground/40"
                data-testid={`research-stage-arrow-${idx}`}
              >
                <ChevronRight className="size-3" />
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
