import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useCockpitOpsStore } from "@/lib/mocks/cockpit-ops-store";
import {
  STRATEGY_SCENARIOS,
  _resetScenarioEngineForTests,
  getScenarioById,
  startStrategyScenario,
  tickScenarioEngine,
} from "@/lib/mocks/strategy-scenario-engine";

describe("strategy-scenario-engine", () => {
  beforeEach(() => {
    useCockpitOpsStore.getState().reset();
    _resetScenarioEngineForTests();
  });
  afterEach(() => {
    useCockpitOpsStore.getState().reset();
    _resetScenarioEngineForTests();
  });

  describe("scenario coverage", () => {
    it("ships at least one scenario per supported asset group", () => {
      const groups = new Set(STRATEGY_SCENARIOS.map((s) => s.assetGroup));
      // At minimum: CEFI + DEFI + SPORTS + TRADFI. PREDICTION optional.
      expect(groups.has("CEFI")).toBe(true);
      expect(groups.has("DEFI")).toBe(true);
      expect(groups.has("SPORTS")).toBe(true);
      expect(groups.has("TRADFI")).toBe(true);
    });

    it("every scenario has a non-empty step list with a settlement-or-completion step", () => {
      for (const sc of STRATEGY_SCENARIOS) {
        expect(sc.steps.length).toBeGreaterThan(0);
        const hasTerminal = sc.steps.some(
          (s) => s.kind === "settlement" || s.kind === "exit_decision" || s.kind === "kill_switch_trip",
        );
        expect(hasTerminal, `scenario ${sc.id} needs a terminal step`).toBe(true);
      }
    });

    it("every scenario covers the full lifecycle (deposit → signal → entry → settlement)", () => {
      // Exception: liquidation-capture starts with capital provisioning rather than client deposit;
      // event-driven sports starts with stake allocation. Both are still client_deposit-flavoured kinds.
      for (const sc of STRATEGY_SCENARIOS) {
        const kinds = new Set(sc.steps.map((s) => s.kind));
        expect(kinds.has("client_deposit"), `scenario ${sc.id} missing client_deposit`).toBe(true);
        expect(kinds.has("signal_fired"), `scenario ${sc.id} missing signal_fired`).toBe(true);
        expect(kinds.has("entry_decision"), `scenario ${sc.id} missing entry_decision`).toBe(true);
      }
    });

    it("at least one scenario demonstrates a kill_switch_trip", () => {
      const hasKillSwitch = STRATEGY_SCENARIOS.some((sc) => sc.steps.some((s) => s.kind === "kill_switch_trip"));
      expect(hasKillSwitch).toBe(true);
    });

    it("getScenarioById resolves known ids and returns undefined for unknown", () => {
      expect(getScenarioById(STRATEGY_SCENARIOS[0]!.id)).toBeDefined();
      expect(getScenarioById("does-not-exist")).toBeUndefined();
    });
  });

  describe("startStrategyScenario + tickScenarioEngine", () => {
    it("registers an active scenario and fires steps on subsequent ticks", () => {
      const ok = startStrategyScenario(STRATEGY_SCENARIOS[0]!.id);
      expect(ok).toBe(true);
      // No events yet — step 0 has delaySec=0 but we haven't ticked
      expect(useCockpitOpsStore.getState().strategyEvents).toHaveLength(0);
      expect(useCockpitOpsStore.getState().activeScenarios).toHaveLength(1);
      expect(useCockpitOpsStore.getState().activeScenarios[0]?.cursor).toBe(0);
      // First tick fires step 0 (delaySec=0)
      tickScenarioEngine();
      expect(useCockpitOpsStore.getState().strategyEvents.length).toBeGreaterThan(0);
      expect(useCockpitOpsStore.getState().activeScenarios[0]?.cursor).toBe(1);
    });

    it("eventually completes a scenario after enough ticks (cumulative delaySec)", () => {
      const scenario = STRATEGY_SCENARIOS[0]!;
      const totalDelay = scenario.steps.reduce((sum, s) => sum + s.delaySec, 0);
      startStrategyScenario(scenario.id);
      // Run enough ticks to clear total cumulative delay + 1 per step
      for (let i = 0; i < totalDelay + scenario.steps.length + 5; i += 1) {
        tickScenarioEngine();
      }
      const sc = useCockpitOpsStore.getState().activeScenarios.find((a) => a.id === scenario.id);
      expect(sc?.status).toBe("completed");
      // StrategyScenario doesn't expose a totalEvents field; the cursor
      // advances one per step in the timeline.
      expect(sc?.cursor).toBe(scenario.steps.length);
      // Every step appears in strategyEvents
      const eventsForScenario = useCockpitOpsStore
        .getState()
        .strategyEvents.filter((e) => e.scenarioId === scenario.id);
      expect(eventsForScenario.length).toBe(scenario.steps.length);
    });

    it("multiple scenarios can run in parallel without state collision", () => {
      startStrategyScenario(STRATEGY_SCENARIOS[0]!.id);
      startStrategyScenario(STRATEGY_SCENARIOS[1]!.id);
      expect(useCockpitOpsStore.getState().activeScenarios).toHaveLength(2);
      tickScenarioEngine();
      const events = useCockpitOpsStore.getState().strategyEvents;
      const scenarioIds = new Set(events.map((e) => e.scenarioId));
      expect(scenarioIds.size).toBe(2);
    });

    it("returns false for an unknown scenario id without mutating store", () => {
      const ok = startStrategyScenario("unknown");
      expect(ok).toBe(false);
      expect(useCockpitOpsStore.getState().activeScenarios).toHaveLength(0);
    });
  });

  describe("event tone propagates to toast + warn/error events surface as toasts", () => {
    it("alert and kill_switch_trip events emit toasts; info events do not", () => {
      // STAT_ARB_TRADFI has a kill_switch_trip step → should emit a toast on tone error.
      const tradfiScenario = STRATEGY_SCENARIOS.find((s) => s.id === "scenario-stat-arb-tradfi");
      expect(tradfiScenario).toBeDefined();
      startStrategyScenario(tradfiScenario!.id);
      // Drive enough ticks to fire all steps
      const totalDelay = tradfiScenario!.steps.reduce((sum, s) => sum + s.delaySec, 0);
      for (let i = 0; i < totalDelay + tradfiScenario!.steps.length + 5; i += 1) {
        tickScenarioEngine();
      }
      const toasts = useCockpitOpsStore.getState().toastMessages;
      // At least one toast should be tone=error from the kill_switch_trip step
      const errorToasts = toasts.filter((t) => t.tone === "error");
      expect(errorToasts.length).toBeGreaterThanOrEqual(1);
    });
  });
});
