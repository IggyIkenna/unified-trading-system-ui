import { describe, expect, it } from "vitest";

import {
  DEFAULT_DRIFT_PROFILES,
  MockEventLoop,
  stepDrift,
  type DriftProfile,
} from "@/lib/cockpit/mock-event-loop";

const PNL: DriftProfile = {
  id: "pnl",
  initial: 25_000,
  min: -50_000,
  max: 200_000,
  volatility: 800,
  meanReversion: 0.05,
  mean: 30_000,
};

function fixedRng(values: readonly number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe("stepDrift", () => {
  it("clamps below min", () => {
    const rng = fixedRng([0.001, 0.001]); // big negative shock
    const next = stepDrift({ ...PNL, initial: -49_999, volatility: 1_000_000 }, -49_999, rng);
    expect(next).toBeGreaterThanOrEqual(PNL.min);
  });

  it("clamps above max", () => {
    const rng = fixedRng([0.001, 0.999]); // big positive shock
    const next = stepDrift({ ...PNL, volatility: 10_000_000 }, 199_999, rng);
    expect(next).toBeLessThanOrEqual(PNL.max);
  });

  it("returns the same value with zero volatility + no mean reversion", () => {
    const rng = fixedRng([0.5, 0.5]);
    const next = stepDrift({ ...PNL, volatility: 0, meanReversion: 0 }, 25_000, rng);
    expect(next).toBe(25_000);
  });

  it("reverts toward mean when meanReversion>0", () => {
    const rng = fixedRng([0.5, 0.5]); // approximately zero noise
    const profile: DriftProfile = { ...PNL, volatility: 0, meanReversion: 1 }; // 100% snap
    const next = stepDrift(profile, 0, rng);
    // mean=30_000; one step at meanReversion=1 should go to mean.
    expect(next).toBe(30_000);
  });
});

describe("MockEventLoop", () => {
  it("starts at the profiles' initial values", () => {
    const loop = new MockEventLoop({ profiles: [PNL] });
    const snap = loop.snapshot();
    expect(snap.values.pnl).toBe(25_000);
    expect(snap.tick).toBe(0);
  });

  it("advance() increments tick and mutates values", () => {
    const loop = new MockEventLoop({ profiles: [PNL], seed: 7 });
    loop.advance();
    expect(loop.snapshot().tick).toBe(1);
  });

  it("freeze() makes advance() a no-op", () => {
    const loop = new MockEventLoop({ profiles: [PNL] });
    loop.freeze();
    const snap1 = loop.advance();
    const snap2 = loop.advance();
    expect(snap1.values.pnl).toBe(snap2.values.pnl);
    expect(snap1.tick).toBe(0);
    expect(snap2.tick).toBe(0);
  });

  it("subscribe() fires listeners on every tick", () => {
    const loop = new MockEventLoop({ profiles: [PNL] });
    let count = 0;
    const unsubscribe = loop.subscribe(() => {
      count += 1;
    });
    loop.advance();
    loop.advance();
    loop.advance();
    expect(count).toBe(3);
    unsubscribe();
    loop.advance();
    expect(count).toBe(3); // no new ticks after unsubscribe
  });

  it("deterministic — same seed produces same sequence", () => {
    const loopA = new MockEventLoop({ profiles: [PNL], seed: 42 });
    const loopB = new MockEventLoop({ profiles: [PNL], seed: 42 });
    for (let i = 0; i < 10; i++) {
      loopA.advance();
      loopB.advance();
    }
    expect(loopA.snapshot().values.pnl).toBe(loopB.snapshot().values.pnl);
  });

  it("different seeds produce different sequences", () => {
    const loopA = new MockEventLoop({ profiles: [PNL], seed: 42 });
    const loopB = new MockEventLoop({ profiles: [PNL], seed: 99 });
    for (let i = 0; i < 20; i++) {
      loopA.advance();
      loopB.advance();
    }
    expect(loopA.snapshot().values.pnl).not.toBe(loopB.snapshot().values.pnl);
  });

  it("values stay within bounds across many ticks", () => {
    const loop = new MockEventLoop({ profiles: DEFAULT_DRIFT_PROFILES, seed: 99 });
    for (let i = 0; i < 200; i++) loop.advance();
    const snap = loop.snapshot();
    for (const p of DEFAULT_DRIFT_PROFILES) {
      expect(snap.values[p.id]).toBeGreaterThanOrEqual(p.min);
      expect(snap.values[p.id]).toBeLessThanOrEqual(p.max);
    }
  });
});

describe("DEFAULT_DRIFT_PROFILES", () => {
  it("ships at least 5 curated drift profiles", () => {
    expect(DEFAULT_DRIFT_PROFILES.length).toBeGreaterThanOrEqual(5);
  });

  it("every profile has min < initial < max", () => {
    for (const p of DEFAULT_DRIFT_PROFILES) {
      expect(p.min).toBeLessThanOrEqual(p.initial);
      expect(p.initial).toBeLessThanOrEqual(p.max);
    }
  });
});
