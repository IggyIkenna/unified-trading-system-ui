"use client";

/**
 * Shared presentational primitives for the Sports tab.
 * Centralised here so layout and style changes propagate everywhere automatically.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type {
  FixtureStatus,
  OddsMovement,
  FootballLeague,
  TeamStats,
} from "./types";
import {
  getStatusLabel,
  getStatusVariant,
  isLive,
  formResultColour,
} from "./helpers";
import { TrendingUp, TrendingDown, Minus, Lock } from "lucide-react";

// ─── Status Pill ──────────────────────────────────────────────────────────────

interface StatusPillProps {
  status: FixtureStatus;
  minute?: number;
  className?: string;
}

export function StatusPill({ status, minute, className }: StatusPillProps) {
  const live = isLive(status) || status === "SUSP";
  return (
    <Badge
      variant={getStatusVariant(status)}
      className={cn(
        "flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5",
        className,
      )}
    >
      {live && status !== "SUSP" && (
        <span className="relative flex size-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full size-1.5 bg-current" />
        </span>
      )}
      {getStatusLabel(status, minute)}
    </Badge>
  );
}

// ─── Dual Stat Bar ────────────────────────────────────────────────────────────
// Used in match cards and the detail drawer stats panel.
// home value | ████░░░░ | away value — proportional to total

interface DualStatBarProps {
  label: string;
  homeValue: number;
  awayValue: number;
  /** If true, lower is better (e.g. fouls). Used to colour the dominant side correctly. */
  invertDominance?: boolean;
  /** Format the number for display */
  format?: (v: number) => string;
  className?: string;
}

export function DualStatBar({
  label,
  homeValue,
  awayValue,
  invertDominance = false,
  format = (v) => String(v),
  className,
}: DualStatBarProps) {
  const total = homeValue + awayValue;
  const homePct = total === 0 ? 50 : (homeValue / total) * 100;
  const awayPct = 100 - homePct;

  // Dominant side gets an accent tint
  const homeDominates = invertDominance
    ? homeValue < awayValue
    : homeValue > awayValue;
  const awayDominates = invertDominance
    ? awayValue < homeValue
    : awayValue > homeValue;

  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto_1fr] items-center gap-1 text-xs",
        className,
      )}
    >
      {/* Home value */}
      <span
        className={cn(
          "text-right tabular-nums",
          homeDominates && "font-semibold text-foreground",
        )}
      >
        {format(homeValue)}
      </span>

      {/* Bar + label */}
      <div className="flex flex-col items-center gap-0.5 w-28">
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider leading-none">
          {label}
        </span>
        <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-muted">
          <div
            className={cn(
              "h-full rounded-l-full transition-all",
              homeDominates ? "bg-primary" : "bg-muted-foreground/40",
            )}
            style={{ width: `${homePct}%` }}
          />
          <div
            className={cn(
              "h-full rounded-r-full transition-all",
              awayDominates ? "bg-primary" : "bg-muted-foreground/40",
            )}
            style={{ width: `${awayPct}%` }}
          />
        </div>
      </div>

      {/* Away value */}
      <span
        className={cn(
          "text-left tabular-nums",
          awayDominates && "font-semibold text-foreground",
        )}
      >
        {format(awayValue)}
      </span>
    </div>
  );
}

// ─── Match Stats Panel ────────────────────────────────────────────────────────
// Renders a standard set of DualStatBars for a MatchStats object.
// Used both in the card (compact) and the detail drawer (full).

interface MatchStatsPanelProps {
  home: Partial<TeamStats>;
  away: Partial<TeamStats>;
  compact?: boolean; // compact shows 4 stats, full shows all 8
  className?: string;
}

export function MatchStatsPanel({
  home,
  away,
  compact = false,
  className,
}: MatchStatsPanelProps) {
  const stats: Array<{
    label: string;
    homeVal: number | undefined;
    awayVal: number | undefined;
    invert?: boolean;
    format?: (v: number) => string;
  }> = [
    {
      label: "xG",
      homeVal: home.xg,
      awayVal: away.xg,
      format: (v) => v.toFixed(1),
    },
    {
      label: "Shots OT",
      homeVal: home.shotsOnTarget,
      awayVal: away.shotsOnTarget,
    },
    {
      label: "Possession",
      homeVal: home.possession,
      awayVal: away.possession,
      format: (v) => `${v}%`,
    },
    { label: "Corners", homeVal: home.corners, awayVal: away.corners },
    ...(!compact
      ? [
          {
            label: "Shots",
            homeVal: home.shotsTotal,
            awayVal: away.shotsTotal,
          },
          {
            label: "Fouls",
            homeVal: home.fouls,
            awayVal: away.fouls,
            invert: true,
          },
          {
            label: "Yellows",
            homeVal: home.yellowCards,
            awayVal: away.yellowCards,
            invert: true,
          },
          {
            label: "Attacks",
            homeVal: home.dangerousAttacks,
            awayVal: away.dangerousAttacks,
          },
        ]
      : []),
  ];

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {stats.map((s) => (
        <DualStatBar
          key={s.label}
          label={s.label}
          homeValue={s.homeVal ?? 0}
          awayValue={s.awayVal ?? 0}
          invertDominance={s.invert}
          format={s.format}
        />
      ))}
    </div>
  );
}

// ─── Odds Movement Icon ───────────────────────────────────────────────────────

export function OddsMovementIcon({ movement }: { movement: OddsMovement }) {
  if (movement === "UP")
    return <TrendingUp className="size-3 text-emerald-500" />;
  if (movement === "DOWN")
    return <TrendingDown className="size-3 text-red-500" />;
  return <Minus className="size-3 text-muted-foreground" />;
}

// ─── Locked Cell ─────────────────────────────────────────────────────────────
// Used in the arb grid for bookmakers the client isn't subscribed to.

export function LockedCell({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1 text-muted-foreground/40",
        className,
      )}
    >
      <Lock className="size-3" />
    </div>
  );
}

// ─── Form Dots ────────────────────────────────────────────────────────────────
// Last 5 results shown as coloured circles.

export function FormDots({ form }: { form: ("W" | "D" | "L")[] }) {
  return (
    <div className="flex items-center gap-0.5">
      {form.map((r, i) => (
        <span
          key={i}
          className={cn(
            "inline-flex items-center justify-center size-4 rounded-full text-[9px] font-bold",
            formResultColour(r),
          )}
        >
          {r}
        </span>
      ))}
    </div>
  );
}

// ─── League Badge ─────────────────────────────────────────────────────────────

const LEAGUE_COLOURS: Record<string, string> = {
  EPL: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "La Liga": "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Bundesliga: "bg-red-500/15 text-red-400 border-red-500/30",
  "Serie A": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Ligue 1": "bg-sky-500/15 text-sky-400 border-sky-500/30",
  UCL: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  UEL: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

export function LeagueBadge({
  league,
  className,
}: {
  league: FootballLeague;
  className?: string;
}) {
  const colours = LEAGUE_COLOURS[league] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
        colours,
        className,
      )}
    >
      {league}
    </span>
  );
}

// ─── Arb Pct Badge ───────────────────────────────────────────────────────────

export function ArbBadge({
  pct,
  className,
}: {
  pct: number;
  className?: string;
}) {
  // Green intensity scales with pct: 0.5% = light, 3%+ = strong
  const intensity = Math.min(pct / 3, 1);
  const bgClass =
    intensity > 0.66
      ? "bg-emerald-500 text-white"
      : intensity > 0.33
        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
        : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
        bgClass,
        className,
      )}
    >
      +{pct.toFixed(2)}%
    </span>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
// Consistent section divider used across Fixtures, My Bets, and Arb tabs.

export function SectionHeader({
  title,
  count,
  action,
  className,
}: {
  title: string;
  count?: number;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center justify-between px-1 py-1.5", className)}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        {count != null && (
          <span className="inline-flex items-center justify-center size-4 rounded-full bg-muted text-[9px] font-bold text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export function EmptyState({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center py-12 text-sm text-muted-foreground",
        className,
      )}
    >
      {message}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
// Compact metric card used in My Bets summary row.

export function KpiTile({
  label,
  value,
  subtext,
  valueClassName,
  className,
}: {
  label: string;
  value: React.ReactNode;
  subtext?: string;
  valueClassName?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-lg border bg-card/50 px-3 py-2",
        className,
      )}
    >
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className={cn("text-sm font-bold tabular-nums", valueClassName)}>
        {value}
      </span>
      {subtext && (
        <span className="text-[10px] text-muted-foreground">{subtext}</span>
      )}
    </div>
  );
}
