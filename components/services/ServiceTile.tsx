"use client";

/**
 * ServiceTile — shared service-card primitive with a three-state lockState enum.
 *
 * Refactor G1.3 (Stage 3E §1.3) introduces the `padlocked-visible` state — the
 * tile renders with a padlock affordance and "request access" nudge, instead of
 * being invisible. This enables the demo tempt-logic and "show what's possible"
 * discovery that rule 06's show/don't-show discipline calls out, without
 * leaking data or entering a page the prospect hasn't bought.
 *
 * States:
 *   - "unlocked"         — tile is a clickable Link; today's default behaviour.
 *   - "padlocked-visible" — tile renders with lock icon + tooltip + disabled
 *                           click (aria-disabled="true", no navigation).
 *   - "hidden"           — tile returns null (no DOM rendered).
 *
 * The lockState is resolved upstream via `useTileLockState(tileId)` (stub
 * today; Refactor G1.7 wires the real restriction-profile lookup).
 *
 * SSOTs:
 *   - codex/14-playbooks/infra-spec/stage-3e-refactor-plan.md §1.3
 *   - codex/14-playbooks/_ssot-rules/06-show-dont-show-discipline.md
 *   - codex/14-playbooks/cross-cutting/visibility-slicing.md
 *   - codex/14-playbooks/demo-ops/demo-restriction-profiles.md
 */

import { StatusDot } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ServiceDefinition } from "@/lib/config/services";
import { mock01 } from "@/lib/mocks/generators/deterministic";
import { PLATFORM_LIFECYCLE_CONFIG, type PlatformLifecycleStage } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { padlockTooltipCopy, type TileLockState } from "@/lib/visibility/tile-lock-state";
import {
  Activity,
  AlertTriangle,
  ArrowUpCircle,
  BarChart3,
  Building2,
  ChevronRight,
  Database,
  Eye,
  FileCode,
  FileText,
  FlaskConical,
  Gauge,
  History,
  Layers,
  LifeBuoy,
  ListChecks,
  Lock,
  Network,
  Newspaper,
  Presentation,
  Radio,
  Receipt,
  Rocket,
  Scale,
  ScrollText,
  Settings2,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

// Icon map is kept in sync with the dashboard page's map; future consolidation
// into a shared registry belongs to the platform icons module, out of scope
// for G1.3.
const ICON_MAP: Record<string, React.ElementType> = {
  Activity,
  ArrowUpCircle,
  BarChart3,
  Building2,
  Database,
  Eye,
  FileCode,
  FileText,
  FlaskConical,
  Gauge,
  History,
  Layers,
  LifeBuoy,
  ListChecks,
  Network,
  Newspaper,
  Presentation,
  Radio,
  Receipt,
  Rocket,
  Scale,
  ScrollText,
  Settings2,
  ShieldCheck,
  TrendingUp,
  Users,
  Settings: Settings2,
};

function serviceKeySalt(key: string): number {
  return [...key].reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

/**
 * Chip rendered in the sub-route row under an unlocked tile. The caller
 * pre-filters `service.subRoutes` (entitlement + persona-dashboard-shape) and
 * passes through the resolved `locked` state for each chip.
 */
export interface ServiceTileSubRouteChip {
  key: string;
  label: string;
  href: string;
  icon: string;
  locked: boolean;
}

export interface ServiceTileProps {
  service: ServiceDefinition;
  /**
   * Three-state lockState enum. Default `"unlocked"` preserves today's
   * behaviour for any caller that has not yet been migrated to the hook.
   */
  lockState?: TileLockState;
  /** Optional quick-stat line rendered below the description (e.g. "$142K P&L"). */
  quickStat?: string;
  /** Optional derived health badge shown in the corner of the unlocked tile. */
  degraded?: boolean;
  /**
   * Optional sub-route chip row (2026-04-21, dashboard 5-tile collapse). Caller
   * pre-filters by entitlement + persona shape; locked chips render padlocked.
   * Only rendered when `lockState === "unlocked"` — padlocked tiles stay
   * description-only per rule 06.
   */
  subRoutes?: readonly ServiceTileSubRouteChip[];
  /** Max chips to show inline; overflow becomes `+N more` link. Default 4. */
  maxChips?: number;
}

export function ServiceTile({
  service,
  lockState = "unlocked",
  quickStat,
  degraded,
  subRoutes,
  maxChips = 4,
}: ServiceTileProps): React.ReactElement | null {
  // Hooks MUST run before any conditional return per react-hooks/rules-of-hooks.
  // Audit fix #7 disclosure state — tiles that route into /services/workspace
  // collapse their legacy sub-route chips behind a "Show advanced tools"
  // toggle so the dashboard leads with the cockpit, not the maze.
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  if (lockState === "hidden") {
    // Intentionally render nothing — HIDDEN-ENTIRELY per rule 06.
    return null;
  }

  const Icon = ICON_MAP[service.icon] ?? Database;
  const stageConfig =
    PLATFORM_LIFECYCLE_CONFIG[service.lifecycleStage as PlatformLifecycleStage] ?? PLATFORM_LIFECYCLE_CONFIG.acquire;

  if (lockState === "padlocked-visible") {
    const tooltip = padlockTooltipCopy();
    const testId = `service-tile-${service.key}`;
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card
              data-testid={testId}
              data-lock-state={lockState}
              aria-disabled="true"
              aria-label={`${service.label}: locked: request access`}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                // Explicit no-op — the tile is focusable but Enter/Space must
                // not navigate. Prevent the default form-submit-like behaviour
                // some browsers attach to role=button.
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                }
              }}
              className={cn("border-border/40 bg-gradient-to-br from-background to-muted/20", "cursor-not-allowed")}
              style={{ pointerEvents: "auto" }}
            >
              <CardContent className="p-4 flex gap-3" style={{ pointerEvents: "none" }}>
                <div className="flex-shrink-0 mt-0.5">
                  <div className="size-8 rounded-lg bg-muted/50 flex items-center justify-center">
                    <Lock className="size-3.5 text-muted-foreground/60" aria-hidden data-testid={`${testId}-padlock`} />
                  </div>
                </div>
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">{service.label}</span>
                    <Badge
                      className="text-[8px] px-1.5 py-0 bg-gradient-to-r from-amber-500/10 to-amber-500/5 text-amber-400 border-amber-500/20"
                      data-testid={`${testId}-request-access-badge`}
                    >
                      Request access
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground/50 leading-relaxed line-clamp-2">
                    {service.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs" data-testid={`${testId}-tooltip`}>
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // lockState === "unlocked"
  const testId = `service-tile-${service.key}`;
  const visibleChips = subRoutes ?? [];
  const shownChips = visibleChips.slice(0, maxChips);
  const overflowCount = Math.max(0, visibleChips.length - shownChips.length);
  const hasChips = shownChips.length > 0;
  // 2026-04-30 audit fix #7: tiles that route into the unified workspace
  // shell (DART Terminal / DART Research) are anchors for the cockpit
  // experience; their sub-route chips are LEGACY deep links to the per-page
  // surfaces the cockpit replaces. Demote them behind an "Advanced tools"
  // disclosure so the dashboard leads with the cockpit, not the maze.
  // Tiles that do NOT route to the workspace (Reports, IM, Admin, etc.)
  // keep their chips visible — those routes are still the canonical surfaces.
  const routesToCockpit = service.href.startsWith("/services/workspace");
  const chipsVisible = routesToCockpit ? showAdvanced : true;
  return (
    <Card
      data-testid={testId}
      data-lock-state={lockState}
      className={cn("group hover:border-white/20 transition-colors h-full", degraded && "border-amber-500/20")}
    >
      <Link href={service.href} className="block" data-testid={`${testId}-primary`}>
        <CardContent className="p-4 flex gap-3">
          <div className={cn("flex-shrink-0 mt-0.5", stageConfig.color)}>
            <Icon className="size-4" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium group-hover:text-white transition-colors">{service.label}</span>
              <span className={cn("text-[8px] uppercase tracking-wider", stageConfig.color)}>{stageConfig.label}</span>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-auto inline-flex flex-shrink-0">
                      <StatusDot
                        status={degraded ? "in_progress" : "live"}
                        className={cn("size-1.5", degraded && "animate-pulse")}
                      />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {degraded ? "Degraded performance" : "All systems operational"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {degraded ? (
              <p className="text-[11px] text-amber-400/80 leading-relaxed flex items-center gap-1">
                <AlertTriangle className="size-3 shrink-0" />
                Degraded: elevated latency
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{service.description}</p>
            )}
            {quickStat && <p className="text-[10px] font-mono text-muted-foreground/80 mt-0.5">{quickStat}</p>}
          </div>
          <ChevronRight className="size-3.5 text-muted-foreground/20 group-hover:text-muted-foreground flex-shrink-0 mt-1 transition-colors" />
        </CardContent>
      </Link>
      {hasChips && routesToCockpit ? (
        <div className="px-4 pb-3 pt-0">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-[10px] text-muted-foreground/60 hover:text-foreground border border-border/40 rounded px-1.5 h-5 inline-flex items-center gap-1"
            data-testid={`${testId}-advanced-toggle`}
            data-expanded={showAdvanced ? "true" : "false"}
            aria-expanded={showAdvanced}
          >
            {showAdvanced ? "Hide" : "Show"} advanced tools ({visibleChips.length})
          </button>
          {chipsVisible ? (
            <div className="mt-2 flex flex-wrap gap-1.5" data-testid={`${testId}-subroutes`}>
              {shownChips.map((chip) => (
                <SubRouteChip key={chip.key} chip={chip} stageColor={stageConfig.color} />
              ))}
              {overflowCount > 0 && (
                <Link
                  href={service.href}
                  className="inline-flex items-center px-1.5 h-5 rounded text-[10px] text-muted-foreground/70 hover:text-foreground border border-border/40 hover:border-border"
                  data-testid={`${testId}-subroute-overflow`}
                >
                  +{overflowCount} more
                </Link>
              )}
            </div>
          ) : null}
        </div>
      ) : hasChips ? (
        <div className="px-4 pb-3 pt-0 flex flex-wrap gap-1.5" data-testid={`${testId}-subroutes`}>
          {shownChips.map((chip) => (
            <SubRouteChip key={chip.key} chip={chip} stageColor={stageConfig.color} />
          ))}
          {overflowCount > 0 && (
            <Link
              href={service.href}
              className="inline-flex items-center px-1.5 h-5 rounded text-[10px] text-muted-foreground/70 hover:text-foreground border border-border/40 hover:border-border"
              data-testid={`${testId}-subroute-overflow`}
            >
              +{overflowCount} more
            </Link>
          )}
        </div>
      ) : null}
    </Card>
  );
}

function SubRouteChip({ chip, stageColor }: { chip: ServiceTileSubRouteChip; stageColor: string }) {
  const ChipIcon = ICON_MAP[chip.icon] ?? ChevronRight;
  if (chip.locked) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="inline-flex items-center gap-1 px-1.5 h-5 rounded text-[10px] text-muted-foreground/50 border border-border/40 cursor-not-allowed"
              data-testid={`subroute-chip-${chip.key}`}
              data-locked="true"
              aria-disabled="true"
            >
              <Lock className="size-2.5 opacity-60" />
              {chip.label}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Upgrade to access
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  return (
    <Link
      href={chip.href}
      className={cn(
        "inline-flex items-center gap-1 px-1.5 h-5 rounded text-[10px] border border-border/50 hover:border-white/20 hover:bg-muted/30 transition-colors",
        stageColor,
      )}
      data-testid={`subroute-chip-${chip.key}`}
      data-locked="false"
      onClick={(e) => e.stopPropagation()}
    >
      <ChipIcon className="size-2.5" />
      {chip.label}
    </Link>
  );
}

/**
 * Deterministic mock-derived degraded signal — mirrors the dashboard page's
 * health-jitter logic so the extracted tile component behaves identically to
 * the inline card it replaced until the real health API arrives.
 */
export function mockServiceDegraded(serviceKey: string): boolean {
  return mock01(serviceKeySalt(serviceKey), 701) > 0.9;
}
