"use client";

/**
 * Shared presentational primitives for the Sports tab.
 * Centralised here so layout and style changes propagate everywhere automatically.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import type {
  FixtureStatus,
  OddsMovement,
  FootballLeague,
  TeamStats,
} from "./types";
import { getStatusLabel, isLive, formResultColour } from "./helpers";
import { TrendingUp, TrendingDown, Minus, Lock, Zap } from "lucide-react";

// ─── Status Pill ──────────────────────────────────────────────────────────────

interface StatusPillProps {
  status: FixtureStatus;
  minute?: number;
  className?: string;
}

export function StatusPill({ status, minute, className }: StatusPillProps) {
  const live = isLive(status);
  const susp = status === "SUSP";
  const ht = status === "HT";
  const ft = status === "FT" || status === "AET" || status === "PEN";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-black uppercase tracking-wider",
        live && "bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/30",
        susp &&
          "bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse",
        ht && "bg-amber-400/15 text-amber-400 border border-amber-400/30",
        ft && "bg-zinc-700/60 text-zinc-400 border border-zinc-600/40",
        !live &&
          !susp &&
          !ht &&
          !ft &&
          "bg-zinc-800/60 text-zinc-400 border border-zinc-700/40",
        className,
      )}
    >
      {live && (
        <span className="relative flex size-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-75" />
          <span className="relative inline-flex rounded-full size-1.5 bg-[#4ade80]" />
        </span>
      )}
      {getStatusLabel(status, minute)}
    </span>
  );
}

// ─── Dual Stat Bar ────────────────────────────────────────────────────────────

interface DualStatBarProps {
  label: string;
  homeValue: number;
  awayValue: number;
  invertDominance?: boolean;
  format?: (v: number) => string;
  className?: string;
  accentHome?: string;
  accentAway?: string;
}

export function DualStatBar({
  label,
  homeValue,
  awayValue,
  invertDominance = false,
  format = (v) => String(v),
  className,
  accentHome = "#22d3ee",
  accentAway = "#a78bfa",
}: DualStatBarProps) {
  const total = homeValue + awayValue;
  const homePct = total === 0 ? 50 : (homeValue / total) * 100;
  const awayPct = 100 - homePct;
  const homeDom = invertDominance
    ? homeValue < awayValue
    : homeValue > awayValue;
  const awayDom = invertDominance
    ? awayValue < homeValue
    : awayValue > homeValue;

  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_96px_1fr] items-center gap-2",
        className,
      )}
    >
      <span
        className={cn(
          "text-right tabular-nums text-sm",
          homeDom ? "font-bold text-white" : "text-zinc-400",
        )}
      >
        {format(homeValue)}
      </span>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] text-zinc-500 uppercase tracking-widest leading-none whitespace-nowrap font-semibold">
          {label}
        </span>
        <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-zinc-800">
          <div
            className="h-full transition-all duration-700"
            style={{
              width: `${homePct}%`,
              background: homeDom ? accentHome : "rgba(255,255,255,0.1)",
            }}
          />
          <div
            className="h-full transition-all duration-700"
            style={{
              width: `${awayPct}%`,
              background: awayDom ? accentAway : "rgba(255,255,255,0.1)",
            }}
          />
        </div>
      </div>
      <span
        className={cn(
          "text-left tabular-nums text-sm",
          awayDom ? "font-bold text-white" : "text-zinc-400",
        )}
      >
        {format(awayValue)}
      </span>
    </div>
  );
}

// ─── Match Stats Panel ────────────────────────────────────────────────────────

interface MatchStatsPanelProps {
  home: Partial<TeamStats>;
  away: Partial<TeamStats>;
  compact?: boolean;
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
    <div className={cn("flex flex-col gap-3", className)}>
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
    return <TrendingUp className="size-3 text-[#4ade80]" />;
  if (movement === "DOWN")
    return <TrendingDown className="size-3 text-red-400" />;
  return <Minus className="size-3 text-zinc-600" />;
}

// ─── Locked Cell ─────────────────────────────────────────────────────────────

export function LockedCell({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1 text-zinc-700",
        className,
      )}
    >
      <Lock className="size-3" />
    </div>
  );
}

// ─── Form Dots ────────────────────────────────────────────────────────────────

export function FormDots({ form }: { form: ("W" | "D" | "L")[] }) {
  return (
    <div className="flex items-center gap-0.5">
      {form.map((r, i) => (
        <span
          key={i}
          className={cn(
            "inline-flex items-center justify-center w-5 h-5 rounded-sm text-[10px] font-black",
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

const LEAGUE_COLOURS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  EPL: { bg: "#7c3aed22", text: "#a78bfa", border: "#7c3aed44" },
  "La Liga": { bg: "#ea580c22", text: "#fb923c", border: "#ea580c44" },
  Bundesliga: { bg: "#dc262622", text: "#f87171", border: "#dc262644" },
  "Serie A": { bg: "#1d4ed822", text: "#60a5fa", border: "#1d4ed844" },
  "Ligue 1": { bg: "#0369a122", text: "#38bdf8", border: "#0369a144" },
  UCL: { bg: "#1e3a8a22", text: "#93c5fd", border: "#1e3a8a55" },
  UEL: { bg: "#92400e22", text: "#fbbf24", border: "#92400e44" },
};

export function LeagueBadge({
  league,
  className,
}: {
  league: FootballLeague;
  className?: string;
}) {
  const c = LEAGUE_COLOURS[league] ?? {
    bg: "#27272a",
    text: "#a1a1aa",
    border: "#3f3f46",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-1 text-xs font-black uppercase tracking-wider border",
        className,
      )}
      style={{ background: c.bg, color: c.text, borderColor: c.border }}
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
  const strong = pct >= 2;
  const medium = pct >= 1;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-black border",
        strong
          ? "bg-[#4ade80]/20 text-[#4ade80] border-[#4ade80]/40"
          : medium
            ? "bg-[#4ade80]/10 text-[#4ade80]/80 border-[#4ade80]/20"
            : "bg-zinc-700/30 text-zinc-400 border-zinc-600/30",
        className,
      )}
    >
      <Zap className="size-2.5" />+{pct.toFixed(2)}%
    </span>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

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
    <div className={cn("flex items-center gap-2 px-1 py-1", className)}>
      <span className="text-xs font-black uppercase tracking-widest text-zinc-500">
        {title}
      </span>
      {count != null && (
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-sm bg-zinc-800 text-xs font-bold text-zinc-400 px-1">
          {count}
        </span>
      )}
      {action && <div className="ml-auto">{action}</div>}
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
        "flex items-center justify-center py-16 text-base text-zinc-500",
        className,
      )}
    >
      {message}
    </div>
  );
}

// ─── KPI Tile ─────────────────────────────────────────────────────────────────

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
        "flex flex-col gap-0.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5",
        className,
      )}
    >
      <span className="text-xs uppercase tracking-widest font-semibold text-zinc-500">
        {label}
      </span>
      <span className={cn("text-lg font-black tabular-nums", valueClassName)}>
        {value}
      </span>
      {subtext && <span className="text-sm text-zinc-600">{subtext}</span>}
    </div>
  );
}

// ─── Pulse Live Dot ───────────────────────────────────────────────────────────

export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex size-2 shrink-0", className)}>
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-60" />
      <span className="relative inline-flex rounded-full size-2 bg-[#4ade80]" />
    </span>
  );
}

// ─── Odds Chip ────────────────────────────────────────────────────────────────
// Standard clickable odds button used in multiple places

interface OddsChipProps {
  label: string;
  odds: number;
  movement?: OddsMovement;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function OddsChip({
  label,
  odds,
  movement,
  active,
  onClick,
  className,
}: OddsChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-lg border px-3 py-2.5 transition-all min-w-[4.5rem]",
        active
          ? "bg-[#22d3ee]/15 border-[#22d3ee]/50 text-[#22d3ee]"
          : "bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/80",
        className,
      )}
    >
      <span className="text-xs text-zinc-500 uppercase tracking-wide font-medium leading-none">
        {label}
      </span>
      <span className="text-lg font-black tabular-nums leading-tight">
        {odds.toFixed(2)}
      </span>
      {movement && movement !== "STABLE" && (
        <span
          className={cn(
            "text-xs font-bold",
            movement === "UP" ? "text-[#4ade80]" : "text-red-400",
          )}
        >
          {movement === "UP" ? "▲" : "▼"}
        </span>
      )}
    </button>
  );
}
