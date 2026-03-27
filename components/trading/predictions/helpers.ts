// Re-export all sports helpers — same math applies to prediction market arbs
export {
  calcArbPct,
  calcArbStakes,
  calcKellyStake,
  fmtOdds,
  fmtImpliedProb,
  fmtOddsMovement,
  fmtRelativeTime,
  isLive,
  isCompleted,
  isUpcoming,
  getStatusLabel,
  getStatusVariant,
  formResultColour,
} from "@/components/trading/sports/helpers";

// ─── Prediction-specific helpers ──────────────────────────────────────────────

/** Format a USD dollar amount (prediction markets use USD not GBP) */
export function fmtUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format a USD amount with decimals for small values */
export function fmtUsdPrecise(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Format volume: $35M, $1.2K, etc. */
export function fmtVolume(vol: number): string {
  if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(1)}B`;
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`;
  return `$${vol}`;
}

/** Probability → colour class string */
export function probColour(p: number): string {
  if (p >= 70) return "text-emerald-400";
  if (p >= 40) return "text-yellow-400";
  return "text-red-400";
}

/** Given odds in cents (0-100) convert to decimal for arb calc */
export function centsToDecimal(cents: number): number {
  if (cents <= 0 || cents >= 100) return 1;
  return 100 / cents;
}

/** Format cents odds: 68 → "68¢" */
export function fmtCents(cents: number): string {
  return `${cents.toFixed(0)}¢`;
}

/** Seeded pseudo-random — returns 0-1, same value for same seed+index */
export function seededRandom(seed: number, index: number): number {
  const x = Math.sin(seed * 9301 + index * 49297 + 233) * 93907.74;
  return x - Math.floor(x);
}

/** Generate a time series of n points walking from startVal toward targetVal with noise */
export function generateSeries(
  n: number,
  startVal: number,
  targetVal: number,
  noiseMag: number,
  seed: number
): number[] {
  const result: number[] = [];
  let current = startVal;
  const step = (targetVal - startVal) / n;
  for (let i = 0; i < n; i++) {
    const noise = (seededRandom(seed, i) - 0.5) * 2 * noiseMag;
    current = Math.max(1, Math.min(99, current + step + noise));
    result.push(Math.round(current * 10) / 10);
  }
  return result;
}
