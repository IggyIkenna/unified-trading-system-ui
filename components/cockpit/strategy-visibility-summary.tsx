"use client";

/**
 * StrategyVisibilitySummary — runs the StrategyAvailabilityResolver against
 * a representative spread of strategy instances and surfaces the count per
 * visibility state in the cockpit shell.
 *
 * Per audit fix #5: the resolver exists but the workspace shell did not
 * visibly consume it. This component is the demonstration layer — it shows
 * the buyer "for YOU specifically (entitlements + role + subscriptions),
 * scope alone never decides what you see; the resolver does."
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §4.5 + §4.6 four-state
 * taxonomy.
 *
 * Renders a strip in the workspace shell:
 *   [12 owned] [5 available-to-request] [8 locked-by-tier] [3 hidden]
 *
 * Each badge is clickable in production; this demo just shows the count.
 */

import * as React from "react";
import { CheckCircle2, EyeOff, ExternalLink, Lock, ShieldQuestion } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  resolveVisibleStrategyInstances,
  type AuthUserForResolver,
  type StrategyInstanceForResolver,
  type StrategyVisibilityState,
} from "@/lib/architecture-v2/strategy-availability-resolver";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspaceScope } from "@/lib/stores/workspace-scope-store";
import { cn } from "@/lib/utils";

/**
 * Representative spread of strategy instances covering every combination of
 * (maturity × availability × routing × coverage) the resolver needs to
 * exercise. Used both by the visibility summary AND as the seed for any
 * future cockpit list that needs honest visibility decisions.
 */
const DEMO_INSTANCES: readonly StrategyInstanceForResolver[] = [
  // Mainstream owned (DART-Full subscription paths)
  {
    id: "arb-cefi-defi-spot",
    maturityPhase: "live_stable",
    coverageStatus: "SUPPORTED",
    productRouting: "both",
    availabilityState: "PUBLIC",
    shareClass: "USDT",
  },
  {
    id: "carry-basis-perp-cefi",
    maturityPhase: "live_stable",
    coverageStatus: "SUPPORTED",
    productRouting: "both",
    availabilityState: "PUBLIC",
    shareClass: "USDT",
  },
  {
    id: "yield-rotation-defi",
    maturityPhase: "live_stable",
    coverageStatus: "SUPPORTED",
    productRouting: "both",
    availabilityState: "PUBLIC",
    shareClass: "USDT",
  },
  {
    id: "stat-arb-pairs",
    maturityPhase: "paper_14d",
    coverageStatus: "SUPPORTED",
    productRouting: "both",
    availabilityState: "PUBLIC",
    shareClass: "USDT",
  },
  {
    id: "vol-deribit",
    maturityPhase: "paper_1d",
    coverageStatus: "PARTIAL",
    productRouting: "both",
    availabilityState: "PUBLIC",
    shareClass: "USDT",
  },
  {
    id: "ml-directional",
    maturityPhase: "live_stable",
    coverageStatus: "SUPPORTED",
    productRouting: "both",
    availabilityState: "PUBLIC",
    shareClass: "BTC",
  },

  // Available-to-request (Tier-3 catalogue)
  {
    id: "carry-recursive-staked",
    maturityPhase: "paper_14d",
    coverageStatus: "SUPPORTED",
    productRouting: "both",
    availabilityState: "PUBLIC",
    shareClass: "USDT",
  },
  {
    id: "liquidation-capture-defi",
    maturityPhase: "live_stable",
    coverageStatus: "SUPPORTED",
    productRouting: "both",
    availabilityState: "PUBLIC",
    shareClass: "USDT",
  },
  {
    id: "event-driven-sports",
    maturityPhase: "paper_14d",
    coverageStatus: "PARTIAL",
    productRouting: "both",
    availabilityState: "PUBLIC",
    shareClass: null,
  },
  {
    id: "market-making-prediction",
    maturityPhase: "paper_14d",
    coverageStatus: "PARTIAL",
    productRouting: "both",
    availabilityState: "PUBLIC",
    shareClass: null,
  },

  // IM-reserved (visible to IM-desk-operator as read-only; hidden from clients without im-fund mandate)
  {
    id: "im-reserved-mandate-a",
    maturityPhase: "live_stable",
    coverageStatus: "SUPPORTED",
    productRouting: "im_only",
    availabilityState: "INVESTMENT_MANAGEMENT_RESERVED",
    shareClass: "USDT",
  },
  {
    id: "im-reserved-mandate-b",
    maturityPhase: "live_stable",
    coverageStatus: "SUPPORTED",
    productRouting: "im_only",
    availabilityState: "INVESTMENT_MANAGEMENT_RESERVED",
    shareClass: "BTC",
  },

  // Pre-maturity (hidden for client tier; visible for admin)
  {
    id: "smoke-experimental",
    maturityPhase: "smoke",
    coverageStatus: "SUPPORTED",
    productRouting: "both",
    availabilityState: "PUBLIC",
    shareClass: "USDT",
  },
  {
    id: "backtest-only",
    maturityPhase: "backtest_30d",
    coverageStatus: "SUPPORTED",
    productRouting: "both",
    availabilityState: "PUBLIC",
    shareClass: "USDT",
  },

  // Internal admin-only
  {
    id: "internal-only-vol",
    maturityPhase: "live_stable",
    coverageStatus: "SUPPORTED",
    productRouting: "internal_only",
    availabilityState: "PUBLIC",
    shareClass: "USDT",
  },

  // Retired (always hidden client-side)
  {
    id: "retired-arb-old",
    maturityPhase: "live_stable",
    coverageStatus: "SUPPORTED",
    productRouting: "both",
    availabilityState: "RETIRED",
    shareClass: "USDT",
  },

  // Coverage-blocked (hidden for clients; visible internally)
  {
    id: "blocked-tradfi-options",
    maturityPhase: "paper_1d",
    coverageStatus: "BLOCKED",
    productRouting: "both",
    availabilityState: "PUBLIC",
    shareClass: "USDT",
  },

  // Client-exclusive (visible to IM-desk as read_only; hidden from prospects)
  {
    id: "client-exclusive-mandate",
    maturityPhase: "live_stable",
    coverageStatus: "SUPPORTED",
    productRouting: "im_only",
    availabilityState: "CLIENT_EXCLUSIVE",
    shareClass: "USDT",
  },
];

const STATE_LABEL: Record<StrategyVisibilityState, string> = {
  owned: "owned",
  available_to_request: "available to request",
  locked_by_tier: "locked by tier",
  locked_by_workflow: "locked by workflow",
  hidden: "hidden",
  admin_only: "admin only",
  read_only: "read only",
};

const STATE_TONE: Record<StrategyVisibilityState, string> = {
  owned: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  available_to_request: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
  locked_by_tier: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  locked_by_workflow: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  hidden: "border-border/40 bg-muted/20 text-muted-foreground/70",
  admin_only: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  read_only: "border-sky-500/40 bg-sky-500/10 text-sky-300",
};

const STATE_ICON: Record<StrategyVisibilityState, React.ComponentType<{ className?: string }>> = {
  owned: CheckCircle2,
  available_to_request: ExternalLink,
  locked_by_tier: Lock,
  locked_by_workflow: Lock,
  hidden: EyeOff,
  admin_only: ShieldQuestion,
  read_only: ShieldQuestion,
};

interface StrategyVisibilitySummaryProps {
  readonly className?: string;
}

export function StrategyVisibilitySummary({ className }: StrategyVisibilitySummaryProps) {
  const { user } = useAuth();
  const scope = useWorkspaceScope();

  const resolverUser: AuthUserForResolver = React.useMemo(() => {
    if (!user) {
      return { role: "client", entitlements: [], subscriptions: [] };
    }
    return {
      role: user.role === "admin" ? "admin" : user.role === "internal" ? "internal" : "client",
      entitlements: (user.entitlements ?? []).map((e) => (typeof e === "string" ? e : `${e.domain}:${e.tier}`)),
      // For demo: assume "owned" subscriptions match the first 2 instances above
      // so the resolver returns a non-zero "owned" count for any persona that
      // has a subscription axis. Production wires the real subscription list.
      subscriptions:
        user.role === "client" && user.entitlements?.some((e) => typeof e === "string" && e === "strategy-full")
          ? ["arb-cefi-defi-spot", "carry-basis-perp-cefi"]
          : [],
    };
  }, [user]);

  const decisions = React.useMemo(
    () => resolveVisibleStrategyInstances(DEMO_INSTANCES, resolverUser, scope.surface),
    [resolverUser, scope.surface],
  );

  const counts = React.useMemo(() => {
    const c: Record<StrategyVisibilityState, number> = {
      owned: 0,
      available_to_request: 0,
      locked_by_tier: 0,
      locked_by_workflow: 0,
      hidden: 0,
      admin_only: 0,
      read_only: 0,
    };
    for (const { decision } of decisions) {
      c[decision.visibility] += 1;
    }
    return c;
  }, [decisions]);

  const totalVisible = decisions.length - counts.hidden;
  const surfaceLabel = scope.surface;

  // Hide hidden + admin-only with zero counts to keep the strip tight.
  const ordered: readonly StrategyVisibilityState[] = [
    "owned",
    "available_to_request",
    "read_only",
    "locked_by_tier",
    "locked_by_workflow",
    "admin_only",
    "hidden",
  ];

  return (
    <Card
      className={cn("border-border/40 bg-muted/5", className)}
      data-testid="strategy-visibility-summary"
      data-surface={surfaceLabel}
    >
      <CardContent className="p-2.5 flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
          Strategy availability for you on <span className="font-mono">{surfaceLabel}</span>
        </span>
        <span className="text-[10px] text-muted-foreground/60">
          ({totalVisible} of {DEMO_INSTANCES.length} visible)
        </span>
        <span aria-hidden className="text-muted-foreground/30">
          ·
        </span>
        {ordered.map((state) => {
          const n = counts[state];
          if (n === 0) return null;
          const Icon = STATE_ICON[state];
          return (
            <Badge
              key={state}
              variant="outline"
              className={cn("gap-1 font-mono text-[9px]", STATE_TONE[state])}
              data-testid={`visibility-count-${state}`}
              data-count={n}
            >
              <Icon className="size-3" aria-hidden />
              {n} {STATE_LABEL[state]}
            </Badge>
          );
        })}
      </CardContent>
    </Card>
  );
}
