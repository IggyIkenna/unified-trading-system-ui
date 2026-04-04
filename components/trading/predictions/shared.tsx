"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { MarketVenue } from "./types";
import { probColour, fmtCents } from "./helpers";
import { formatNumber } from "@/lib/utils/formatters";

// ─── Venue Chip ───────────────────────────────────────────────────────────────

export function VenueChip({ venue, className }: { venue: MarketVenue | string; className?: string }) {
  const isPolymarket = venue === "polymarket";
  const isKalshi = venue === "kalshi";
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] shrink-0 font-semibold",
        isPolymarket && "bg-blue-500/15 text-blue-400 border-blue-500/30",
        isKalshi && "bg-purple-500/15 text-purple-400 border-purple-500/30",
        !isPolymarket && !isKalshi && "bg-zinc-700/50 text-zinc-400 border-zinc-600/40",
        className,
      )}
    >
      {isPolymarket ? "Polymarket" : isKalshi ? "Kalshi" : String(venue).replace(/_/g, " ")}
    </Badge>
  );
}

// ─── Live Dot ─────────────────────────────────────────────────────────────────

export function LiveDot() {
  return (
    <span className="relative flex size-2">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex size-2 rounded-full bg-red-500" />
    </span>
  );
}

// ─── Probability Bar ──────────────────────────────────────────────────────────

export function ProbabilityBar({ probability, className }: { probability: number; className?: string }) {
  const colour = probability >= 70 ? "bg-emerald-500/50" : probability >= 40 ? "bg-yellow-500/50" : "bg-red-500/50";

  return (
    <div className={cn("h-1 w-full rounded-full bg-zinc-800", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-300", colour)}
        style={{ width: `${probability}%` }}
      />
    </div>
  );
}

// ─── Big Probability Badge ────────────────────────────────────────────────────

export function ProbBadge({ probability }: { probability: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={cn("text-3xl font-bold tabular-nums", probColour(probability))}>{probability}%</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">chance</span>
    </div>
  );
}

// ─── YES / NO Buttons ─────────────────────────────────────────────────────────

export function YesNoButtons({
  yesPrice,
  noPrice,
  size = "sm",
  onYes,
  onNo,
}: {
  yesPrice: number; // 0-1
  noPrice: number; // 0-1
  size?: "sm" | "default";
  onYes?: () => void;
  onNo?: () => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        className={cn(
          "rounded border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 font-semibold transition-colors",
          size === "sm" ? "text-xs px-2.5 py-1" : "text-sm px-3 py-1.5",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onYes?.();
        }}
      >
        Yes {fmtCents(yesPrice * 100)}
      </button>
      <button
        className={cn(
          "rounded border border-red-500/40 text-red-400 hover:bg-red-500/20 hover:text-red-300 font-semibold transition-colors",
          size === "sm" ? "text-xs px-2.5 py-1" : "text-sm px-3 py-1.5",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onNo?.();
        }}
      >
        No {fmtCents(noPrice * 100)}
      </button>
    </div>
  );
}

// ─── Divergence Badge ─────────────────────────────────────────────────────────

export function DivergenceBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] border-amber-500/40 text-amber-400 bg-amber-500/10 font-bold", className)}
    >
      ⚡ Divergence
    </Badge>
  );
}

// ─── Delta Pill ───────────────────────────────────────────────────────────────

export function DeltaPill({ delta }: { delta: number }) {
  const colour = delta > 0.5 ? "text-emerald-400" : delta > 0.3 ? "text-yellow-400" : "text-zinc-400";
  return <span className={cn("text-[10px] font-mono tabular-nums", colour)}>δ {formatNumber(delta, 2)}</span>;
}

// ─── Timeframe Badge ─────────────────────────────────────────────────────────

export function TimeframeBadge({ tf, className }: { tf: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn("text-[10px] font-mono border-zinc-700/60 text-zinc-400", className)}>
      {tf}
    </Badge>
  );
}

// ─── Resolution Countdown ─────────────────────────────────────────────────────

export function ResolutionCountdown({ resolutionAt }: { resolutionAt: string }) {
  const [label, setLabel] = React.useState("");

  React.useEffect(() => {
    function tick() {
      const diff = new Date(resolutionAt).getTime() - Date.now();
      if (diff <= 0) {
        setLabel("Resolving");
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      if (h > 24) {
        const d = Math.floor(h / 24);
        setLabel(`${d}d ${h % 24}h`);
      } else if (h > 0) {
        setLabel(`${h}h ${m}m`);
      } else {
        setLabel(`${m}m ${s}s`);
      }
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [resolutionAt]);

  return <span className="text-[10px] text-muted-foreground tabular-nums font-mono">{label}</span>;
}
