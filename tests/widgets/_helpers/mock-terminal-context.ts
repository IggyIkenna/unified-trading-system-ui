import { vi } from "vitest";
import type { TerminalInstrument, TerminalEvent } from "@/components/widgets/terminal/terminal-data-context";

/**
 * Builds a minimal TerminalInstrument suitable for widget harness tests.
 */
export function buildMockInstrument(overrides: Partial<TerminalInstrument> = {}): TerminalInstrument {
  return {
    symbol: "BTC-USDT",
    name: "Bitcoin / Tether",
    venue: "Binance",
    category: "crypto",
    instrumentKey: "btc-usdt-binance",
    midPrice: 63450,
    change: 1.23,
    ...overrides,
  };
}

/**
 * Builds a minimal TerminalEvent suitable for widget harness tests.
 */
export function buildMockTerminalEvent(overrides: Partial<TerminalEvent> = {}): TerminalEvent {
  return {
    id: "evt-001",
    timestamp: "12:00:00",
    domain: "EXECUTION",
    severity: "INFO",
    title: "Order placed",
    detail: "BTC-USDT buy 0.5 @ 63450",
    ...overrides,
  };
}

export interface MockTerminalDataOverrides {
  instruments?: TerminalInstrument[];
  selectedInstrument?: TerminalInstrument;
  livePrice?: number;
  priceChange?: number;
  wsBid?: number | null;
  wsAsk?: number | null;
  bids?: Array<{ price: number; size: number; total: number }>;
  asks?: Array<{ price: number; size: number; total: number }>;
  spread?: number;
  spreadBps?: number;
  recentTrades?: Array<Record<string, unknown>>;
  ownTrades?: Array<Record<string, unknown>>;
  events?: TerminalEvent[];
  isLoading?: boolean;
  isLoadingEvents?: boolean;
  error?: string | null;
  errorEvents?: string | null;
}

/**
 * Returns the fields terminal widgets read from useTerminalData().
 * Use with vi.mock('@/components/widgets/terminal/terminal-data-context', ...).
 *
 * Minimal surface — tests don't break when unrelated TerminalData fields are added.
 */
export function buildMockTerminalData(overrides: MockTerminalDataOverrides = {}) {
  const defaultInstrument = buildMockInstrument();
  const defaultBids = [
    { price: 63440, size: 0.5, total: 0.5 },
    { price: 63430, size: 1.2, total: 1.7 },
    { price: 63420, size: 0.8, total: 2.5 },
  ];
  const defaultAsks = [
    { price: 63460, size: 0.3, total: 0.3 },
    { price: 63470, size: 0.9, total: 1.2 },
    { price: 63480, size: 1.1, total: 2.3 },
  ];
  const defaultTrades = [
    { time: "12:00:01", price: 63450, size: 0.5, side: "buy" },
    { time: "12:00:02", price: 63440, size: 0.3, side: "sell" },
  ];
  const defaultEvents: TerminalEvent[] = [
    buildMockTerminalEvent(),
    buildMockTerminalEvent({ id: "evt-002", domain: "RISK", severity: "WARNING", title: "Position limit 80%" }),
  ];

  return {
    instruments: overrides.instruments ?? [defaultInstrument],
    instrumentsByCategory: { crypto: [defaultInstrument] },
    selectedInstrument: overrides.selectedInstrument ?? defaultInstrument,
    setSelectedInstrument: vi.fn(),
    livePrice: overrides.livePrice ?? 63450,
    priceChange: overrides.priceChange ?? 1.23,
    wsBid: overrides.wsBid !== undefined ? overrides.wsBid : 63440,
    wsAsk: overrides.wsAsk !== undefined ? overrides.wsAsk : 63460,
    bids: overrides.bids ?? defaultBids,
    asks: overrides.asks ?? defaultAsks,
    spread: overrides.spread ?? 20,
    spreadBps: overrides.spreadBps ?? 3.1,
    candleData: [],
    loadMoreCandles: vi.fn(),
    isLoadingMoreHistory: false,
    indicatorOverlays: [],
    recentTrades: overrides.recentTrades ?? defaultTrades,
    ownTrades: overrides.ownTrades ?? [],
    selectedAccount: null,
    setSelectedAccount: vi.fn(),
    availableAccounts: [],
    orderType: "limit" as const,
    setOrderType: vi.fn(),
    orderSide: "buy" as const,
    setOrderSide: vi.fn(),
    orderPrice: "",
    setOrderPrice: vi.fn(),
    orderSize: "",
    setOrderSize: vi.fn(),
    timeframe: "1h",
    setTimeframe: vi.fn(),
    chartType: "candles" as const,
    setChartType: vi.fn(),
    activeIndicators: new Set<string>(),
    toggleIndicator: vi.fn(),
    linkedStrategyId: null,
    setLinkedStrategyId: vi.fn(),
    linkedStrategy: null,
    strategyWarnings: [],
    handleSubmitOrder: vi.fn(),
    isContextComplete: true,
    wallClockMs: Date.now(),
    isBatchMode: false,
    isLoading: overrides.isLoading ?? false,
    error: overrides.error !== undefined ? overrides.error : null,
    events: overrides.events ?? defaultEvents,
    isLoadingEvents: overrides.isLoadingEvents ?? false,
    errorEvents: overrides.errorEvents !== undefined ? overrides.errorEvents : null,
  };
}
