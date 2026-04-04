"use client";

import * as React from "react";

export interface TerminalInstrument {
  symbol: string;
  name: string;
  venue: string;
  category: string;
  instrumentKey: string;
  midPrice: number;
  change: number;
}

export interface TerminalData {
  instruments: TerminalInstrument[];
  instrumentsByCategory: Record<string, TerminalInstrument[]>;
  selectedInstrument: TerminalInstrument;
  setSelectedInstrument: (inst: TerminalInstrument) => void;
  livePrice: number;
  priceChange: number;
  wsBid: number | null;
  wsAsk: number | null;
  bids: Array<{ price: number; size: number; total: number }>;
  asks: Array<{ price: number; size: number; total: number }>;
  spread: number;
  spreadBps: number;
  candleData: Array<Record<string, unknown>>;
  indicatorOverlays: Array<Record<string, unknown>>;
  recentTrades: Array<Record<string, unknown>>;
  ownTrades: Array<Record<string, unknown>>;
  selectedAccount: { id: string; name: string; venueAccountId: string; marginType: string } | null;
  setSelectedAccount: (a: { id: string; name: string; venueAccountId: string; marginType: string } | null) => void;
  availableAccounts: Array<{ id: string; name: string; venueAccountId: string; marginType: string }>;
  orderType: "limit" | "market";
  setOrderType: (t: "limit" | "market") => void;
  orderSide: "buy" | "sell";
  setOrderSide: (s: "buy" | "sell") => void;
  orderPrice: string;
  setOrderPrice: (p: string) => void;
  orderSize: string;
  setOrderSize: (s: string) => void;
  timeframe: string;
  setTimeframe: (tf: string) => void;
  chartType: "candles" | "line" | "depth" | "options";
  setChartType: (ct: "candles" | "line" | "depth" | "options") => void;
  activeIndicators: Set<string>;
  toggleIndicator: (id: string) => void;
  linkedStrategyId: string | null;
  setLinkedStrategyId: (id: string | null) => void;
  linkedStrategy: Record<string, unknown> | null;
  strategyWarnings: string[];
  handleSubmitOrder: () => void;
  isContextComplete: boolean;
  wallClockMs: number;
  isBatchMode: boolean;
}

const TerminalDataContext = React.createContext<TerminalData | null>(null);

export function TerminalDataProvider({ value, children }: { value: TerminalData; children: React.ReactNode }) {
  return <TerminalDataContext.Provider value={value}>{children}</TerminalDataContext.Provider>;
}

export function useTerminalData(): TerminalData {
  const ctx = React.useContext(TerminalDataContext);
  if (!ctx) throw new Error("useTerminalData must be used within TerminalDataProvider");
  return ctx;
}
