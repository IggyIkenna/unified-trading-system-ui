import { describe, it, expect } from "vitest";
import {
  generateStressData,
  ALL_STRESS_SCENARIOS,
  type StressScenario,
  type StressDataSet,
} from "./index.js";

describe("generateStressData", () => {
  it("returns data for all 6 scenarios without throwing", () => {
    for (const scenario of ALL_STRESS_SCENARIOS) {
      const data = generateStressData(scenario);
      expect(data).toBeDefined();
      expect(data.scenario).toBe(scenario);
    }
  });

  it("ALL_STRESS_SCENARIOS contains exactly 6 entries", () => {
    expect(ALL_STRESS_SCENARIOS).toHaveLength(6);
  });

  describe("BIG_DRAWDOWN scenario", () => {
    let data: StressDataSet;

    it("generates large negative P&L positions", () => {
      data = generateStressData("BIG_DRAWDOWN");
      expect(data.positions.length).toBeGreaterThan(0);

      const totalPnl = data.positions.reduce(
        (sum, p) => sum + p.unrealizedPnl,
        0,
      );
      expect(totalPnl).toBeLessThan(-1000000);
    });

    it("generates critical alerts", () => {
      data = generateStressData("BIG_DRAWDOWN");
      const criticalAlerts = data.alerts.filter(
        (a) => a.severity === "critical",
      );
      expect(criticalAlerts.length).toBeGreaterThanOrEqual(2);
    });

    it("generates failed deployments", () => {
      data = generateStressData("BIG_DRAWDOWN");
      const failedDeps = data.deployments.filter((d) => d.status === "failed");
      expect(failedDeps.length).toBeGreaterThan(0);
    });

    it("has halted strategies", () => {
      data = generateStressData("BIG_DRAWDOWN");
      const halted = data.strategies.filter((s) => s.status === "halted");
      expect(halted.length).toBeGreaterThan(0);
    });
  });

  describe("BIG_TICKS scenario", () => {
    it("generates many orders for high-frequency testing", () => {
      const data = generateStressData("BIG_TICKS");
      expect(data.orders.length).toBeGreaterThanOrEqual(200);
    });

    it("generates many positions", () => {
      const data = generateStressData("BIG_TICKS");
      expect(data.positions.length).toBeGreaterThanOrEqual(50);
    });

    it("generates many log entries", () => {
      const data = generateStressData("BIG_TICKS");
      expect(data.logs.length).toBeGreaterThanOrEqual(100);
    });
  });

  describe("MISSING_DATA scenario", () => {
    it("contains positions with empty string fields", () => {
      const data = generateStressData("MISSING_DATA");
      const emptyPositions = data.positions.filter(
        (p) => p.id === "" || p.symbol === "",
      );
      expect(emptyPositions.length).toBeGreaterThan(0);
    });

    it("contains empty arrays", () => {
      const data = generateStressData("MISSING_DATA");
      expect(data.deployments).toHaveLength(0);
      expect(data.alerts).toHaveLength(0);
      expect(data.orders).toHaveLength(0);
      expect(data.logs).toHaveLength(0);
    });

    it("has services with null latency and empty lastCheck", () => {
      const data = generateStressData("MISSING_DATA");
      const nullLatency = data.health.services.filter(
        (s) => s.latency === null,
      );
      expect(nullLatency.length).toBeGreaterThan(0);
    });
  });

  describe("BAD_SCHEMAS scenario", () => {
    it("contains positions with NaN and Infinity values", () => {
      const data = generateStressData("BAD_SCHEMAS");
      const hasNaN = data.positions.some((p) => Number.isNaN(p.currentPrice));
      const hasInfinity = data.positions.some(
        (p) => !Number.isFinite(p.unrealizedPnl),
      );
      expect(hasNaN || hasInfinity).toBe(true);
    });

    it("contains positions with negative quantities", () => {
      const data = generateStressData("BAD_SCHEMAS");
      const negQty = data.positions.filter((p) => p.quantity < 0);
      expect(negQty.length).toBeGreaterThan(0);
    });

    it("contains alerts with very long messages", () => {
      const data = generateStressData("BAD_SCHEMAS");
      const longMsg = data.alerts.filter((a) => a.message.length > 1000);
      expect(longMsg.length).toBeGreaterThan(0);
    });
  });

  describe("STALE_DATA scenario", () => {
    it("contains timestamps from before 2024", () => {
      const data = generateStressData("STALE_DATA");
      const hasStale = data.health.services.some((s) => {
        if (!s.lastCheck) return false;
        const d = new Date(s.lastCheck);
        return d.getFullYear() < 2024;
      });
      expect(hasStale).toBe(true);
    });

    it("has positions with outdated prices", () => {
      const data = generateStressData("STALE_DATA");
      // BTC at $3800 is clearly a 2019/2020 price
      const stalePrice = data.positions.some(
        (p) => p.symbol === "BTC/USDT" && p.entryPrice < 10000,
      );
      expect(stalePrice).toBe(true);
    });
  });

  describe("HIGH_CARDINALITY scenario", () => {
    it("generates 2000 positions", () => {
      const data = generateStressData("HIGH_CARDINALITY");
      expect(data.positions).toHaveLength(2000);
    });

    it("generates 500 deployments", () => {
      const data = generateStressData("HIGH_CARDINALITY");
      expect(data.deployments).toHaveLength(500);
    });

    it("generates 500 alerts", () => {
      const data = generateStressData("HIGH_CARDINALITY");
      expect(data.alerts).toHaveLength(500);
    });

    it("generates 2000 orders", () => {
      const data = generateStressData("HIGH_CARDINALITY");
      expect(data.orders).toHaveLength(2000);
    });

    it("generates 2000 logs", () => {
      const data = generateStressData("HIGH_CARDINALITY");
      expect(data.logs).toHaveLength(2000);
    });

    it("generates 50 services in health", () => {
      const data = generateStressData("HIGH_CARDINALITY");
      expect(data.health.services).toHaveLength(50);
    });

    it("generates 200 strategies", () => {
      const data = generateStressData("HIGH_CARDINALITY");
      expect(data.strategies).toHaveLength(200);
    });
  });

  describe("all scenarios have valid structure", () => {
    const scenarios: StressScenario[] = [...ALL_STRESS_SCENARIOS];

    for (const scenario of scenarios) {
      it(`${scenario} has all required top-level fields`, () => {
        const data = generateStressData(scenario);
        expect(data.scenario).toBe(scenario);
        expect(data.health).toBeDefined();
        expect(data.health.overall).toBeDefined();
        expect(data.health.services).toBeDefined();
        expect(Array.isArray(data.positions)).toBe(true);
        expect(Array.isArray(data.deployments)).toBe(true);
        expect(Array.isArray(data.alerts)).toBe(true);
        expect(Array.isArray(data.orders)).toBe(true);
        expect(Array.isArray(data.logs)).toBe(true);
        expect(Array.isArray(data.strategies)).toBe(true);
        expect(Array.isArray(data.experiments)).toBe(true);
        expect(Array.isArray(data.settlements)).toBe(true);
        expect(Array.isArray(data.reports)).toBe(true);
      });
    }
  });
});
