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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ServiceDefinition } from "@/lib/config/services";
import { mock01 } from "@/lib/mocks/generators/deterministic";
import { PLATFORM_LIFECYCLE_CONFIG, type PlatformLifecycleStage } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import {
  padlockTooltipCopy,
  type TileLockState,
} from "@/lib/visibility/tile-lock-state";
import {
  AlertTriangle,
  ChevronRight,
  Database,
  Lock,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

// Icon map is kept in sync with the dashboard page's map; future consolidation
// into a shared registry belongs to the platform icons module, out of scope
// for G1.3.
import {
  ArrowUpCircle,
  Eye,
  FileText,
  FlaskConical,
  Settings2,
  TrendingUp,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Database,
  FlaskConical,
  ArrowUpCircle,
  TrendingUp,
  Eye,
  Settings2,
  FileText,
  Settings: Settings2,
};

function serviceKeySalt(key: string): number {
  return [...key].reduce((acc, c) => acc + c.charCodeAt(0), 0);
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
}

export function ServiceTile({
  service,
  lockState = "unlocked",
  quickStat,
  degraded,
}: ServiceTileProps): React.ReactElement | null {
  if (lockState === "hidden") {
    // Intentionally render nothing — HIDDEN-ENTIRELY per rule 06.
    return null;
  }

  const Icon = ICON_MAP[service.icon] ?? Database;
  const stageConfig =
    PLATFORM_LIFECYCLE_CONFIG[service.lifecycleStage as PlatformLifecycleStage] ??
    PLATFORM_LIFECYCLE_CONFIG.acquire;

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
              aria-label={`${service.label} — locked — request access`}
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
              className={cn(
                "border-border/40 bg-gradient-to-br from-background to-muted/20",
                "cursor-not-allowed",
              )}
              style={{ pointerEvents: "auto" }}
            >
              <CardContent
                className="p-4 flex gap-3"
                style={{ pointerEvents: "none" }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="size-8 rounded-lg bg-muted/50 flex items-center justify-center">
                    <Lock
                      className="size-3.5 text-muted-foreground/60"
                      aria-hidden
                      data-testid={`${testId}-padlock`}
                    />
                  </div>
                </div>
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {service.label}
                    </span>
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
          <TooltipContent
            side="top"
            className="text-xs"
            data-testid={`${testId}-tooltip`}
          >
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // lockState === "unlocked"
  const testId = `service-tile-${service.key}`;
  return (
    <Link href={service.href} data-testid={testId} data-lock-state={lockState}>
      <Card
        className={cn(
          "group hover:border-white/20 transition-colors cursor-pointer h-full",
          degraded && "border-amber-500/20",
        )}
      >
        <CardContent className="p-4 flex gap-3">
          <div className={cn("flex-shrink-0 mt-0.5", stageConfig.color)}>
            <Icon className="size-4" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium group-hover:text-white transition-colors">
                {service.label}
              </span>
              <span
                className={cn(
                  "text-[8px] uppercase tracking-wider",
                  stageConfig.color,
                )}
              >
                {stageConfig.label}
              </span>
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
                    {degraded
                      ? "Degraded performance"
                      : "All systems operational"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {degraded ? (
              <p className="text-[11px] text-amber-400/80 leading-relaxed flex items-center gap-1">
                <AlertTriangle className="size-3 shrink-0" />
                Degraded — elevated latency
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                {service.description}
              </p>
            )}
            {quickStat && (
              <p className="text-[10px] font-mono text-muted-foreground/80 mt-0.5">
                {quickStat}
              </p>
            )}
          </div>
          <ChevronRight className="size-3.5 text-muted-foreground/20 group-hover:text-muted-foreground flex-shrink-0 mt-1 transition-colors" />
        </CardContent>
      </Card>
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
