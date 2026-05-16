/**
 * MockEventLoop — drives the Tier-0 demo's "alive" feel.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan §13 + Phase 8 of §17.
 *
 * The Tier-0 demo cockpit needs to feel alive so a buyer doesn't write
 * the demo off as "frozen mock". This module provides a controlled
 * event-loop with:
 *
 *   - Bounded random walk for P&L / positions / alerts so values move
 *     naturally between bounds.
 *   - Deterministic seed so a snapshot reproduces (Playwright + image
 *     diff).
 *   - Pace control via `?pace=10` URL param (10× real-time for demo
 *     walkthroughs).
 *   - Freeze mode via `?freeze=true` URL param (Playwright determinism).
 *
 * Phase 8 SCOPE: ship the loop primitive + drift profiles. Per-widget
 * subscription wiring is incremental — widgets call `useMockTick()` to
 * subscribe.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Drift profile — bounded random walk for a single mock value
// ─────────────────────────────────────────────────────────────────────────────

export interface DriftProfile {
  readonly id: string;
  /** Initial value at t=0. */
  readonly initial: number;
  /** Lower bound (inclusive). */
  readonly min: number;
  /** Upper bound (inclusive). */
  readonly max: number;
  /** Standard-deviation per tick (in absolute units of the value). */
  readonly volatility: number;
  /** Drift toward `mean` per tick (0 = pure random walk; 1 = full snap-to-mean). */
  readonly meanReversion: number;
  /** Mean (target) value the walk drifts toward. Defaults to (min+max)/2. */
  readonly mean?: number;
}

/**
 * Curated drift profiles for the cockpit's most-watched signals. Bounded
 * within realistic ranges so the demo doesn't show $999K P&L drift.
 */
export const DEFAULT_DRIFT_PROFILES: readonly DriftProfile[] = [
  {
    id: "pnl-today",
    initial: 25_000,
    min: -50_000,
    max: 200_000,
    volatility: 800,
    meanReversion: 0.05,
    mean: 30_000,
  },
  {
    id: "exposure-usd",
    initial: 281_450_000,
    min: 200_000_000,
    max: 350_000_000,
    volatility: 250_000,
    meanReversion: 0.02,
    mean: 280_000_000,
  },
  {
    id: "alerts-count",
    initial: 8,
    min: 0,
    max: 20,
    volatility: 1.5,
    meanReversion: 0.1,
    mean: 6,
  },
  {
    id: "positions-count",
    initial: 31,
    min: 25,
    max: 45,
    volatility: 0.8,
    meanReversion: 0.05,
    mean: 31,
  },
  {
    id: "btc-price-usd",
    initial: 95_000,
    min: 90_000,
    max: 105_000,
    volatility: 80,
    meanReversion: 0.03,
    mean: 96_000,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic random walk
// ─────────────────────────────────────────────────────────────────────────────

/** Mulberry32 — small, fast, deterministic PRNG. */
function mulberry32(seed: number) {
  let state = seed | 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard-normal sample via the Box-Muller transform. */
function standardNormal(rng: () => number): number {
  const u1 = Math.max(rng(), 1e-12);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Step a drift profile one tick. Pure function — deterministic given the
 * (profile, currentValue, rng) inputs. Caller advances the seeded rng and
 * passes the next value to the next call.
 */
export function stepDrift(profile: DriftProfile, currentValue: number, rng: () => number): number {
  const mean = profile.mean ?? (profile.min + profile.max) / 2;
  const noise = standardNormal(rng) * profile.volatility;
  const pull = (mean - currentValue) * profile.meanReversion;
  const next = currentValue + noise + pull;
  // Clamp.
  return Math.max(profile.min, Math.min(profile.max, next));
}

// ─────────────────────────────────────────────────────────────────────────────
// MockEventLoop — manages tick state for an array of profiles
// ─────────────────────────────────────────────────────────────────────────────

export interface TickSnapshot {
  /** Current value per profile id. */
  readonly values: Readonly<Record<string, number>>;
  /** Tick number (monotonic from 0). */
  readonly tick: number;
  /** ISO timestamp for the snapshot. */
  readonly timestamp: string;
}

export interface MockEventLoopOptions {
  readonly seed?: number; // default: 42
  readonly profiles?: readonly DriftProfile[]; // default: DEFAULT_DRIFT_PROFILES
  /** Tick interval in ms. Default 1000ms (1 tick per second). */
  readonly intervalMs?: number;
  /** Pace multiplier — 10 = 10× real-time. Default 1. */
  readonly pace?: number;
  /** When true, no advancement happens until unfrozen. Default false. */
  readonly frozen?: boolean;
}

export class MockEventLoop {
  private readonly profiles: ReadonlyArray<DriftProfile>;
  private readonly rng: () => number;
  private readonly intervalMs: number;
  private readonly pace: number;
  private values: Record<string, number>;
  private tick: number;
  private frozen: boolean;
  private timer: ReturnType<typeof setInterval> | null;
  private listeners: Set<(snap: TickSnapshot) => void>;

  constructor(opts: MockEventLoopOptions = {}) {
    this.profiles = opts.profiles ?? DEFAULT_DRIFT_PROFILES;
    this.rng = mulberry32(opts.seed ?? 42);
    this.intervalMs = opts.intervalMs ?? 1000;
    this.pace = opts.pace ?? 1;
    this.frozen = opts.frozen ?? false;
    this.values = Object.fromEntries(this.profiles.map((p) => [p.id, p.initial]));
    this.tick = 0;
    this.timer = null;
    this.listeners = new Set();
  }

  /** Subscribe to tick events. Returns an unsubscribe function. */
  subscribe(fn: (snap: TickSnapshot) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Snapshot the current state. */
  snapshot(): TickSnapshot {
    return {
      values: { ...this.values },
      tick: this.tick,
      timestamp: new Date().toISOString(),
    };
  }

  /** Advance one tick manually (used by tests + `.start()`). */
  advance(): TickSnapshot {
    if (this.frozen) return this.snapshot();
    this.tick += 1;
    for (const p of this.profiles) {
      this.values[p.id] = stepDrift(p, this.values[p.id], this.rng);
    }
    const snap = this.snapshot();
    for (const fn of this.listeners) fn(snap);
    return snap;
  }

  /** Start the timer. */
  start(): void {
    if (this.timer !== null || this.frozen) return;
    const effectiveInterval = Math.max(50, Math.floor(this.intervalMs / this.pace));
    this.timer = setInterval(() => this.advance(), effectiveInterval);
  }

  /** Stop the timer. */
  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Freeze the loop (tests + screenshots). */
  freeze(): void {
    this.frozen = true;
    this.stop();
  }

  /** Unfreeze. */
  unfreeze(): void {
    this.frozen = false;
  }

  isFrozen(): boolean {
    return this.frozen;
  }
}
