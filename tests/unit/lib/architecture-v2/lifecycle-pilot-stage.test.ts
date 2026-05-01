import { describe, expect, it } from "vitest";

import {
  MATURITY_PHASE_LABEL,
  MATURITY_PHASE_TONE,
  STRATEGY_MATURITY_PHASES,
  type StrategyMaturityPhase,
} from "@/lib/architecture-v2/lifecycle";

describe("StrategyMaturityPhase — Pilot stage added (§4.8.7)", () => {
  it("includes pilot in the canonical phase list", () => {
    expect(STRATEGY_MATURITY_PHASES).toContain("pilot");
  });

  it("includes monitor as an explicit phase (between live_stable and retired)", () => {
    expect(STRATEGY_MATURITY_PHASES).toContain("monitor");
  });

  it("orders pilot between paper_stable and live_early", () => {
    const idxPaperStable = STRATEGY_MATURITY_PHASES.indexOf("paper_stable");
    const idxPilot = STRATEGY_MATURITY_PHASES.indexOf("pilot");
    const idxLiveEarly = STRATEGY_MATURITY_PHASES.indexOf("live_early");
    expect(idxPaperStable).toBeLessThan(idxPilot);
    expect(idxPilot).toBeLessThan(idxLiveEarly);
  });

  it("orders monitor after live_stable, before retired", () => {
    const idxLiveStable = STRATEGY_MATURITY_PHASES.indexOf("live_stable");
    const idxMonitor = STRATEGY_MATURITY_PHASES.indexOf("monitor");
    const idxRetired = STRATEGY_MATURITY_PHASES.indexOf("retired");
    expect(idxLiveStable).toBeLessThan(idxMonitor);
    expect(idxMonitor).toBeLessThan(idxRetired);
  });

  it("every phase has a label", () => {
    for (const phase of STRATEGY_MATURITY_PHASES) {
      expect(MATURITY_PHASE_LABEL[phase]).toBeTruthy();
    }
  });

  it("every phase has a tone", () => {
    for (const phase of STRATEGY_MATURITY_PHASES) {
      expect(MATURITY_PHASE_TONE[phase]).toBeTruthy();
    }
  });

  it("13 phases total (11 forward + monitor + retired) — backtest_30d added per dart-cockpit plan §22", () => {
    expect(STRATEGY_MATURITY_PHASES).toHaveLength(13);
  });

  it("phase set is exhaustive over StrategyMaturityPhase", () => {
    const exhaustive: StrategyMaturityPhase[] = [
      "smoke",
      "backtest_30d",
      "backtest_minimal",
      "backtest_1yr",
      "backtest_multi_year",
      "paper_1d",
      "paper_14d",
      "paper_stable",
      "pilot",
      "live_early",
      "live_stable",
      "monitor",
      "retired",
    ];
    expect([...STRATEGY_MATURITY_PHASES].sort()).toEqual([...exhaustive].sort());
  });
});
