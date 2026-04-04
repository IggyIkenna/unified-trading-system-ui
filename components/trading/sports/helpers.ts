import type { FixtureStatus, OddsMovement } from "./types";
import { KELLY_HALF_FRACTION, KELLY_MAX_STAKE_PCT, TOTAL_BANKROLL } from "@/lib/mocks/fixtures/sports-fixtures";

// ─── Kelly Criterion ──────────────────────────────────────────────────────────

/**
 * Half-Kelly stake given decimal odds and estimated win probability.
 * Capped at KELLY_MAX_STAKE_PCT of bankroll.
 */
export function calcKellyStake(decimalOdds: number, estimatedProb: number, bankroll: number = TOTAL_BANKROLL): number {
  const b = decimalOdds - 1;
  const q = 1 - estimatedProb;
  const fullKelly = (b * estimatedProb - q) / b;
  if (fullKelly <= 0) return 0;
  const halfKelly = fullKelly * KELLY_HALF_FRACTION;
  const maxStake = bankroll * KELLY_MAX_STAKE_PCT;
  return Math.min(halfKelly * bankroll, maxStake);
}

// ─── Arb Calculations ─────────────────────────────────────────────────────────

/**
 * Returns guaranteed profit % if arb exists, 0 otherwise.
 * Arb exists when sum of implied probs < 1.
 */
export function calcArbPct(leg1Odds: number, leg2Odds: number): number {
  const impliedSum = 1 / leg1Odds + 1 / leg2Odds;
  if (impliedSum >= 1) return 0;
  return (1 / impliedSum - 1) * 100;
}

/**
 * Optimal stake split for a two-leg arb given a total stake budget.
 * Returns [stake1, stake2] ensuring equal return on both legs.
 */
export function calcArbStakes(leg1Odds: number, leg2Odds: number, totalStake: number): [number, number] {
  const impliedSum = 1 / leg1Odds + 1 / leg2Odds;
  const stake1 = (totalStake * (1 / leg1Odds)) / impliedSum;
  const stake2 = (totalStake * (1 / leg2Odds)) / impliedSum;
  return [Math.round(stake1 * 100) / 100, Math.round(stake2 * 100) / 100];
}

// ─── Status Helpers ───────────────────────────────────────────────────────────

export function isLive(status: FixtureStatus): boolean {
  return status === "LIVE" || status === "1H" || status === "2H" || status === "ET";
}

export function isCompleted(status: FixtureStatus): boolean {
  return status === "FT" || status === "AET" || status === "PEN";
}

export function isUpcoming(status: FixtureStatus): boolean {
  return status === "NS";
}

export function getStatusLabel(status: FixtureStatus, minute?: number): string {
  switch (status) {
    case "NS":
      return "Upcoming";
    case "1H":
      return minute != null ? `${minute}'` : "1st Half";
    case "LIVE":
      return minute != null ? `${minute}'` : "Live";
    case "HT":
      return "HT";
    case "2H":
      return minute != null ? `${minute}'` : "2nd Half";
    case "ET":
      return minute != null ? `${minute}' AET` : "Extra Time";
    case "SUSP":
      return "Suspended";
    case "FT":
      return "FT";
    case "AET":
      return "AET";
    case "PEN":
      return "Penalties";
  }
}

export function getStatusVariant(status: FixtureStatus): "default" | "secondary" | "destructive" | "outline" {
  if (isLive(status)) return "default";
  if (status === "SUSP") return "destructive";
  if (status === "HT") return "secondary";
  return "outline";
}

// ─── Odds Formatting ──────────────────────────────────────────────────────────

export function fmtOdds(decimal: number): string {
  return decimal.toFixed(2);
}

export function fmtImpliedProb(decimal: number): string {
  return `${((1 / decimal) * 100).toFixed(1)}%`;
}

export function fmtOddsMovement(current: number, prev: number): OddsMovement {
  const delta = current - prev;
  if (Math.abs(delta) < 0.005) return "STABLE";
  return delta > 0 ? "UP" : "DOWN";
}

export function fmtCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function fmtRelativeTime(isoTimestamp: string): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime();
  const diffS = Math.floor(diffMs / 1000);
  if (diffS < 60) return `${diffS}s ago`;
  const diffM = Math.floor(diffS / 60);
  if (diffM < 60) return `${diffM}m ago`;
  const diffH = Math.floor(diffM / 60);
  return `${diffH}h ago`;
}

// ─── Form Helpers ─────────────────────────────────────────────────────────────

export function formResultColour(result: "W" | "D" | "L"): string {
  if (result === "W") return "bg-emerald-500 text-white";
  if (result === "D") return "bg-amber-500 text-white";
  return "bg-red-500 text-white";
}
