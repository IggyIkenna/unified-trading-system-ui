import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("execution-analytics mock-api backtest & recon data (ph3)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("window", {
      fetch: vi.fn(),
      location: { origin: "http://localhost:5173" },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns recon break data with realistic fields", async () => {
    const { installMockHandlers } = await import("./mock-api");
    installMockHandlers(true);

    const response = await window.fetch("/api/recon/breaks");
    const data = (await (response as Response).json()) as {
      breaks: Array<{
        break_id: string;
        strategy: string;
        type: string;
        severity: string;
        resolved: boolean;
      }>;
      total: number;
    };

    expect(data.breaks).toBeDefined();
    expect(data.breaks.length).toBeGreaterThanOrEqual(3);
    expect(data.total).toBe(data.breaks.length);

    // Verify break structure
    for (const brk of data.breaks) {
      expect(brk.break_id).toBeTruthy();
      expect(brk.strategy).toBeTruthy();
      expect(brk.type).toBeTruthy();
      expect(["info", "warning", "critical"]).toContain(brk.severity);
      expect(typeof brk.resolved).toBe("boolean");
    }

    // Verify different break types
    const types = new Set(data.breaks.map((b) => b.type));
    expect(types.size).toBeGreaterThanOrEqual(2);

    // Verify mix of resolved and unresolved
    const hasResolved = data.breaks.some((b) => b.resolved);
    const hasUnresolved = data.breaks.some((b) => !b.resolved);
    expect(hasResolved).toBe(true);
    expect(hasUnresolved).toBe(true);
  });

  it("returns backtest results with per-strategy detail", async () => {
    const { installMockHandlers } = await import("./mock-api");
    installMockHandlers(true);

    const response = await window.fetch("/api/backtest/results");
    const data = (await (response as Response).json()) as {
      results: Array<{
        id: string;
        strategy: string;
        status: string;
        sharpe: number;
        maxDrawdown: number;
        totalReturn: number;
        tradeCount: number;
        winRate: number;
        profitFactor: number;
        equity: Array<{ date: string; value: number }>;
        venues: Array<{ venue: string; trades: number; pnl: number }>;
        dailyPnl: Array<{ date: string; pnl: number; cumPnl: number }>;
      }>;
      total: number;
    };

    expect(data.results).toBeDefined();
    expect(data.results.length).toBeGreaterThanOrEqual(2);
    expect(data.total).toBe(data.results.length);

    for (const result of data.results) {
      expect(result.id).toBeTruthy();
      expect(result.strategy).toBeTruthy();
      expect(result.status).toBe("completed");
      expect(typeof result.sharpe).toBe("number");
      expect(typeof result.maxDrawdown).toBe("number");
      expect(typeof result.totalReturn).toBe("number");
      expect(typeof result.tradeCount).toBe("number");
      expect(typeof result.winRate).toBe("number");
      expect(typeof result.profitFactor).toBe("number");
      expect(result.equity.length).toBeGreaterThan(0);
      expect(result.venues.length).toBeGreaterThan(0);
      expect(result.dailyPnl.length).toBeGreaterThan(0);
    }

    // Verify different strategies
    const strategies = new Set(data.results.map((r) => r.strategy));
    expect(strategies.size).toBeGreaterThanOrEqual(2);
  });

  it("returns backtest run list", async () => {
    const { installMockHandlers } = await import("./mock-api");
    installMockHandlers(true);

    const response = await window.fetch("/api/runs");
    const data = (await (response as Response).json()) as {
      runs: Array<{
        id: string;
        strategy: string;
        status: string;
        sharpe: number | null;
      }>;
      total: number;
    };

    expect(data.runs).toBeDefined();
    expect(data.runs.length).toBeGreaterThanOrEqual(3);

    // Verify different statuses
    const statuses = new Set(data.runs.map((r) => r.status));
    expect(statuses.size).toBeGreaterThanOrEqual(2);
  });

  it("returns health status", async () => {
    const { installMockHandlers } = await import("./mock-api");
    installMockHandlers(true);

    const response = await window.fetch("/api/health");
    const data = (await (response as Response).json()) as {
      status: string;
      mock: boolean;
    };

    expect(data.status).toBe("healthy");
    expect(data.mock).toBe(true);
  });

  it("returns instruments list", async () => {
    const { installMockHandlers } = await import("./mock-api");
    installMockHandlers(true);

    const response = await window.fetch("/api/instruments");
    const data = (await (response as Response).json()) as {
      instruments: Array<{
        symbol: string;
        category: string;
        venue: string;
        active: boolean;
      }>;
    };

    expect(data.instruments).toBeDefined();
    expect(data.instruments.length).toBeGreaterThanOrEqual(3);

    // Verify different categories
    const categories = new Set(data.instruments.map((i) => i.category));
    expect(categories.size).toBeGreaterThanOrEqual(2);
  });
});
