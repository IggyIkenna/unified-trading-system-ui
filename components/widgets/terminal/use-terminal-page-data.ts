"use client";

import * as React from "react";
import type { TerminalData, TerminalInstrument } from "./terminal-data-context";
import { useInstruments } from "@/hooks/api/use-instruments";
import { useCandles, useOrderBook, useTickers } from "@/hooks/api/use-market-data";
import { useBalances, usePositions } from "@/hooks/api/use-positions";
import { useStrategyPerformance } from "@/hooks/api/use-strategies";
import { useAlerts } from "@/hooks/api/use-alerts";
import { useTickingNowMs } from "@/hooks/use-ticking-now";
import { useWebSocket } from "@/hooks/use-websocket";
import { getOrders, placeMockOrder } from "@/lib/api/mock-trade-ledger";
import { mock01, mockRange } from "@/lib/mocks/generators/deterministic";
import { generateMockOrderBook } from "@/lib/mocks/generators/order-book";
import { isMockDataMode } from "@/lib/runtime/data-mode";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import type { Strategy } from "@/lib/strategy-registry";
import { STRATEGIES } from "@/lib/strategy-registry";
import { bollingerBands, ema, sma } from "@/lib/utils/indicators";

const DEFAULT_INSTRUMENTS: TerminalInstrument[] = [
  {
    symbol: "BTC/USDT",
    name: "Bitcoin",
    venue: "Binance",
    category: "CeFi",
    instrumentKey: "BTC-USDT-SPOT@BINANCE",
    midPrice: 87234.56,
    change: 1.23,
  },
  {
    symbol: "ETH/USDT",
    name: "Ethereum",
    venue: "Binance",
    category: "CeFi",
    instrumentKey: "ETH-USDT-SPOT@BINANCE",
    midPrice: 2045.78,
    change: -0.45,
  },
  {
    symbol: "ETH-PERP",
    name: "ETH Perpetual",
    venue: "Hyperliquid",
    category: "CeFi",
    instrumentKey: "ETH-PERP@HYPERLIQUID",
    midPrice: 2043.5,
    change: -0.52,
  },
  {
    symbol: "SOL/USDT",
    name: "Solana",
    venue: "Binance",
    category: "CeFi",
    instrumentKey: "SOL-USDT-SPOT@BINANCE",
    midPrice: 134.21,
    change: 2.15,
  },
  {
    symbol: "BTC-PERP",
    name: "BTC Perpetual",
    venue: "Binance",
    category: "CeFi",
    instrumentKey: "BTC-PERP@BINANCE",
    midPrice: 87200.0,
    change: 1.18,
  },
];

const strategyInstruments: Record<string, string> = {
  "btc-basis-v3": "BTC/USDT",
  "eth-vol-arb": "ETH/USDT",
  "defi-yield-aave": "ETH/USDT",
  "sol-momentum": "SOL/USDT",
};

const generateCandleData = (basePrice: number, tf: string, points = 200) => {
  const volatility = basePrice * 0.005;
  const secondsPerCandle =
    tf === "1m" ? 60 : tf === "5m" ? 300 : tf === "15m" ? 900 : tf === "1H" ? 3600 : tf === "4H" ? 14400 : 86400;
  let seed = 42;
  const seededRandom = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const nowSec = Math.floor(Date.now() / 1000);
  const lastCandleTime = Math.floor(nowSec / secondsPerCandle) * secondsPerCandle - secondsPerCandle;
  return Array.from({ length: points }, (_, i) => {
    const open = basePrice + (seededRandom() - 0.5) * volatility * 2;
    const close = open + (seededRandom() - 0.5) * volatility * 2;
    const high = Math.max(open, close) + seededRandom() * volatility;
    const low = Math.min(open, close) - seededRandom() * volatility;
    const volume = seededRandom() * 100 + 20;
    const timestamp = lastCandleTime - (points - i - 1) * secondsPerCandle;
    return { time: timestamp, open, close, high, low, volume, isUp: close >= open };
  });
};

export interface TerminalPageResult {
  terminalData: TerminalData;
  errors: { tickers: boolean; positions: boolean; alerts: boolean };
}

/**
 * Extracted from terminal/page.tsx — all data construction logic for the Terminal tab.
 */
export function useTerminalPageData(): TerminalPageResult {
  const { scope: context } = useGlobalScope();
  const { data: tickersData, error: tickersError } = useTickers();
  const modeParam = context.mode === "batch" ? "batch" : "live";
  const asOfParam = context.mode === "batch" ? context.asOfDatetime?.split("T")[0] : undefined;
  const { error: positionsError } = usePositions(modeParam, asOfParam);
  const { error: alertsError } = useAlerts();
  const { data: strategiesApiData } = useStrategyPerformance();
  const { data: instrumentsApiData } = useInstruments();
  const { data: balancesApiData } = useBalances();

  const [wsBid, setWsBid] = React.useState<number | null>(null);
  const [wsAsk, setWsAsk] = React.useState<number | null>(null);

  const instruments = React.useMemo(() => {
    if (isMockDataMode()) return DEFAULT_INSTRUMENTS.map((d) => ({ ...d }));

    const instData = instrumentsApiData as Record<string, unknown> | undefined;
    const instArr = (instData?.data ?? instData?.instruments ?? []) as Array<Record<string, unknown>>;

    const tickersRaw: Record<string, unknown>[] =
      ((tickersData as Record<string, unknown>)?.data as Record<string, unknown>[]) ??
      ((tickersData as Record<string, unknown>)?.tickers as Record<string, unknown>[]) ??
      [];

    if (instArr.length > 0) {
      const tickersBySymbol = new Map<string, Record<string, unknown>>();
      for (const t of tickersRaw) {
        const sym = (t.symbol as string) ?? "";
        if (sym) tickersBySymbol.set(sym, t);
      }
      return instArr.map((i) => {
        const sym = (i.symbol as string) ?? (i.instrumentKey as string) ?? "";
        const ven = (i.venue as string) ?? "";
        const iKey = (i.instrument_key as string) ?? (i.instrumentKey as string) ?? `${sym}@${ven}`;
        const ticker = tickersBySymbol.get(sym);
        const defaultInst = DEFAULT_INSTRUMENTS.find((d) => d.symbol === sym);
        const midPrice =
          (i.midPrice as number) ||
          (i.price as number) ||
          (ticker?.midPrice as number) ||
          (ticker?.price as number) ||
          defaultInst?.midPrice ||
          0;
        const change =
          (i.change as number) ||
          (ticker?.change as number) ||
          (ticker?.changePct as number) ||
          defaultInst?.change ||
          0;
        return {
          symbol: sym,
          name: sym,
          venue: ven,
          category: (i.category as string) ?? "Other",
          instrumentKey: iKey,
          midPrice,
          change,
        };
      });
    }
    if (tickersRaw.length > 0) {
      return tickersRaw.map((t) => {
        const sym = (t.symbol as string) ?? "";
        const ven = (t.venue as string) ?? "";
        return {
          symbol: sym,
          name: (t.name as string) ?? sym,
          venue: ven,
          category: (t.category as string) ?? "CeFi",
          instrumentKey: (t.instrument_key as string) ?? (t.instrumentKey as string) ?? `${sym}@${ven}`,
          midPrice: (t.midPrice as number) ?? (t.price as number) ?? 0,
          change: (t.change as number) ?? (t.changePct as number) ?? 0,
        };
      });
    }
    return DEFAULT_INSTRUMENTS.map((d) => ({ ...d }));
  }, [instrumentsApiData, tickersData]);

  const instrumentsByCategory = React.useMemo(() => {
    const groups: Record<string, typeof instruments> = {};
    for (const inst of instruments) {
      const cat = inst.category ?? "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(inst);
    }
    return groups;
  }, [instruments]);

  const [selectedInstrument, setSelectedInstrument] = React.useState(instruments[0]);
  const [livePrice, setLivePrice] = React.useState(instruments[0]?.midPrice ?? 0);
  const [priceChange, setPriceChange] = React.useState(instruments[0]?.change ?? 0);
  const [selectedAccount, setSelectedAccount] = React.useState<{
    id: string;
    name: string;
    venueAccountId: string;
    marginType: string;
  } | null>(null);
  const [orderType, setOrderType] = React.useState<"limit" | "market">("limit");
  const [orderSide, setOrderSide] = React.useState<"buy" | "sell">("buy");
  const [orderPrice, setOrderPrice] = React.useState("");
  const [orderSize, setOrderSize] = React.useState("");
  const [timeframe, setTimeframe] = React.useState("5m");
  const [chartType, setChartType] = React.useState<"candles" | "line">("candles");
  const [activeIndicators, setActiveIndicators] = React.useState<Set<string>>(new Set());
  const [linkedStrategyId, setLinkedStrategyId] = React.useState<string | null>(null);

  const linkedStrategy: Strategy | null = React.useMemo(() => {
    if (!linkedStrategyId) return null;
    return STRATEGIES.find((s) => s.id === linkedStrategyId) ?? null;
  }, [linkedStrategyId]);

  React.useEffect(() => {
    if (!linkedStrategy) return;
    const firstInst = linkedStrategy.instruments[0];
    if (firstInst) {
      const matchedInstrument = instruments.find((i) => {
        const instKey = firstInst.key.toLowerCase();
        const sym = i.symbol.toLowerCase();
        return instKey.includes(sym.replace("/", "")) || sym.includes(instKey.split(":").pop()?.split("@")[0] ?? "");
      });
      if (matchedInstrument) {
        setSelectedInstrument(matchedInstrument);
        setLivePrice(matchedInstrument.midPrice);
        setPriceChange(matchedInstrument.change);
      }
    }
    const longArchetypes = [
      "BASIS_TRADE",
      "YIELD",
      "DIRECTIONAL",
      "ML_DIRECTIONAL",
      "MOMENTUM",
      "RECURSIVE_STAKED_BASIS",
    ];
    const shortArchetypes = ["MEAN_REVERSION"];
    if (longArchetypes.includes(linkedStrategy.archetype)) setOrderSide("buy");
    else if (shortArchetypes.includes(linkedStrategy.archetype)) setOrderSide("sell");
  }, [linkedStrategy, instruments]);

  const strategyWarnings: string[] = React.useMemo(() => {
    if (!linkedStrategy) return [];
    const warnings: string[] = [];
    const size = parseFloat(orderSize);
    const maxLeverage = parseFloat(linkedStrategy.riskProfile.maxLeverage.replace("x", "")) || 1;
    if (size > 0 && maxLeverage <= 1 && size > 10) {
      warnings.push(
        `Size ${size} may exceed conservative position limits for a ${linkedStrategy.riskProfile.maxLeverage} leverage strategy`,
      );
    }
    if (linkedStrategy.venues.length > 0 && selectedInstrument) {
      const venueMatch = linkedStrategy.venues.some(
        (v) =>
          v.toLowerCase().includes(selectedInstrument.venue.toLowerCase()) ||
          selectedInstrument.venue.toLowerCase().includes(v.toLowerCase().split("-")[0]),
      );
      if (!venueMatch)
        warnings.push(
          `Venue "${selectedInstrument.venue}" is not in strategy's allowed venues: ${linkedStrategy.venues.join(", ")}`,
        );
    }
    if (linkedStrategy.executionMode === "HUF" && orderType === "market") {
      warnings.push("HUF strategies typically use limit orders for tighter spread control");
    }
    return warnings;
  }, [linkedStrategy, orderSize, selectedInstrument, orderType]);

  const { data: candlesApiData } = useCandles(
    selectedInstrument?.venue ?? "Binance",
    selectedInstrument?.symbol ?? "BTC/USDT",
    timeframe === "1m" ? "1M" : timeframe === "5m" ? "5M" : timeframe === "15m" ? "15M" : "1H",
    200,
    modeParam,
    asOfParam,
  );
  const { data: orderbookApiData } = useOrderBook(
    selectedInstrument?.venue ?? "Binance",
    selectedInstrument?.symbol ?? "BTC/USDT",
    modeParam,
    asOfParam,
  );

  const handleWsMessage = React.useCallback(
    (msg: Record<string, unknown>) => {
      if (msg.instrument === selectedInstrument?.symbol && typeof msg.price === "number") {
        setLivePrice(msg.price as number);
        if (typeof msg.bid === "number") setWsBid(msg.bid as number);
        if (typeof msg.ask === "number") setWsAsk(msg.ask as number);
      }
    },
    [selectedInstrument?.symbol],
  );

  const ws = useWebSocket({
    url: "ws://localhost:8030/ws",
    enabled: context.mode === "live",
    onMessage: handleWsMessage,
  });

  React.useEffect(() => {
    if (ws.status === "connected" && selectedInstrument) {
      ws.subscribe([selectedInstrument.symbol]);
      return () => {
        ws.unsubscribe([selectedInstrument.symbol]);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws.status, selectedInstrument?.symbol]);

  const [ownTrades, setOwnTrades] = React.useState<
    Array<{
      id: string;
      time: string;
      side: "buy" | "sell";
      price: number;
      size: number;
      status: "filled" | "partial" | "pending";
    }>
  >([]);

  React.useEffect(() => {
    setLivePrice(selectedInstrument.midPrice);
    setPriceChange(selectedInstrument.change);
  }, [selectedInstrument]);

  const availableAccounts = React.useMemo(() => {
    const raw = balancesApiData as Record<string, unknown> | undefined;
    const balances = (raw?.data ?? raw?.balances ?? []) as Array<Record<string, unknown>>;
    if (balances.length > 0) {
      return balances.map((b, i) => ({
        id: (b.id as string) ?? `acc-${i}`,
        name: (b.venue as string) ?? `Account ${i + 1}`,
        venueAccountId: (b.account_id as string) ?? "",
        marginType: (b.margin_type as string) ?? "cross",
      }));
    }
    return [{ id: "default", name: "Default Account", venueAccountId: "default-001", marginType: "cross" }];
  }, [balancesApiData]);

  const isContextComplete = React.useMemo(() => {
    if (isMockDataMode()) return true;
    return context.organizationIds.length > 0 && context.clientIds.length > 0 && selectedAccount !== null;
  }, [context.organizationIds, context.clientIds, selectedAccount]);

  const [recentTrades, setRecentTrades] = React.useState<
    Array<{ id: string; time: string; side: "buy" | "sell"; price: number; size: number }>
  >([]);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    if (!isClient) return;
    const priceVariation = selectedInstrument.midPrice * 0.0005;
    const newTrades = Array.from({ length: 12 }, (_, i) => {
      const now = new Date();
      now.setSeconds(now.getSeconds() - i * 2);
      return {
        id: `trade-mock-${selectedInstrument.symbol}-${i}`,
        time: now.toLocaleTimeString("en-US", { hour12: false, timeZone: "UTC" }),
        side: (mock01(i, 11) > 0.5 ? "buy" : "sell") as "buy" | "sell",
        price: selectedInstrument.midPrice + (mock01(i, 12) - 0.5) * priceVariation * 2,
        size: mockRange(0.01, 0.51, i, 13),
      };
    });
    setRecentTrades(newTrades);
  }, [isClient, selectedInstrument]);

  const filteredStrategies = React.useMemo(() => {
    const raw = strategiesApiData as Record<string, unknown> | undefined;
    const strategies = (raw?.strategies ?? raw?.data ?? []) as Array<{
      id: string;
      name: string;
      status?: string;
      [k: string]: unknown;
    }>;
    if (!Array.isArray(strategies) || strategies.length === 0) return [];
    if (context.strategyIds.length > 0) return strategies.filter((s) => context.strategyIds.includes(s.id));
    return strategies;
  }, [strategiesApiData, context.strategyIds]);

  React.useEffect(() => {
    if (context.strategyIds.length === 1) {
      const strategyId = context.strategyIds[0];
      const mappedSymbol = strategyInstruments[strategyId];
      if (mappedSymbol) {
        const instrument = instruments.find((i) => i.symbol === mappedSymbol);
        if (instrument) {
          setSelectedInstrument(instrument);
          setLivePrice(instrument.midPrice);
          setPriceChange(instrument.change);
        }
      }
    }
  }, [context.strategyIds, instruments]);

  const [tickCount, setTickCount] = React.useState(0);
  const wallClockMs = useTickingNowMs(1000);
  const isMockMode = isMockDataMode();
  const mockPriceTickRef = React.useRef(0);
  const livePriceRef = React.useRef(livePrice);
  React.useEffect(() => {
    livePriceRef.current = livePrice;
  }, [livePrice]);
  const timeframeRef = React.useRef(timeframe);
  React.useEffect(() => {
    timeframeRef.current = timeframe;
  }, [timeframe]);
  const [liveCandle, setLiveCandle] = React.useState<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  } | null>(null);

  React.useEffect(() => {
    setLiveCandle(null);
    const basePrice = selectedInstrument.midPrice > 0 ? selectedInstrument.midPrice : DEFAULT_INSTRUMENTS[0].midPrice;
    const data = generateCandleData(basePrice, timeframe);
    if (data.length > 0) {
      setLivePrice(data[data.length - 1].close);
    }
  }, [selectedInstrument.midPrice, timeframe]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      mockPriceTickRef.current += 1;
      const t = mockPriceTickRef.current;
      const prev = livePriceRef.current;
      const volatility = (mock01(t, 51) - 0.5) * selectedInstrument.midPrice * 0.0002;
      const drift = selectedInstrument.midPrice * 0.00001;
      const next = prev + volatility + drift;

      setLivePrice(next);

      const tf = timeframeRef.current;
      const intervalSec =
        tf === "1m" ? 60 : tf === "5m" ? 300 : tf === "15m" ? 900 : tf === "1H" ? 3600 : tf === "4H" ? 14400 : 86400;
      const nowUnix = Math.floor(Date.now() / 1000);
      const candleTime = Math.floor(nowUnix / intervalSec) * intervalSec;
      setLiveCandle((lc) => {
        if (!lc || candleTime !== lc.time) {
          return { time: candleTime, open: prev, high: Math.max(prev, next), low: Math.min(prev, next), close: next };
        }
        return {
          time: lc.time,
          open: lc.open,
          high: Math.max(lc.high, next),
          low: Math.min(lc.low, next),
          close: next,
        };
      });

      setTickCount((c) => c + 1);
    }, 500);
    return () => clearInterval(interval);
  }, [selectedInstrument.midPrice]);

  const liveTradeSeqRef = React.useRef(0);

  React.useEffect(() => {
    if (!isClient) return;
    const interval = setInterval(() => {
      const currentPrice = livePriceRef.current;
      setRecentTrades((prev) => {
        liveTradeSeqRef.current += 1;
        const s = liveTradeSeqRef.current;
        const now = new Date();
        return [
          {
            id: `live-${s}`,
            time: now.toLocaleTimeString("en-US", { hour12: false, timeZone: "UTC" }),
            side: (mock01(s, 61) > 0.5 ? "buy" : "sell") as "buy" | "sell",
            price: currentPrice + (mock01(s, 62) - 0.5) * currentPrice * 0.0004,
            size: mockRange(0.01, 0.51, s, 63),
          },
          ...prev.slice(0, 11),
        ];
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [isClient]);

  const { bids, asks } = React.useMemo(() => {
    if (!isMockMode) {
      const apiOb = orderbookApiData as Record<string, unknown> | undefined;
      const apiBids = apiOb?.bids as Array<Record<string, number>> | undefined;
      const apiAsks = apiOb?.asks as Array<Record<string, number>> | undefined;
      if (apiBids && apiAsks && apiBids.length > 0) {
        const mappedBids = apiBids.map((b) => ({
          price: b.price,
          size: b.size ?? b.quantity ?? 0,
          total: b.total ?? 0,
        }));
        const mappedAsks = apiAsks.map((a) => ({
          price: a.price,
          size: a.size ?? a.quantity ?? 0,
          total: a.total ?? 0,
        }));
        if (wsBid !== null && mappedBids.length > 0) mappedBids[0] = { ...mappedBids[0], price: wsBid };
        if (wsAsk !== null && mappedAsks.length > 0) mappedAsks[0] = { ...mappedAsks[0], price: wsAsk };
        return { bids: mappedBids, asks: mappedAsks };
      }
    }
    return generateMockOrderBook(selectedInstrument.symbol, livePrice, tickCount);
  }, [orderbookApiData, selectedInstrument.symbol, livePrice, tickCount, wsBid, wsAsk, isMockMode]);

  const candleData = React.useMemo(() => {
    const apiCandles = isMockMode
      ? undefined
      : ((candlesApiData as Record<string, unknown>)?.candles as Array<Record<string, unknown>> | undefined);
    if (apiCandles && Array.isArray(apiCandles) && apiCandles.length > 0) {
      const mapped = apiCandles
        .map((c) => {
          const rawTime = c.time ?? c.timestamp;
          const time =
            typeof rawTime === "number"
              ? rawTime
              : typeof rawTime === "string"
                ? Math.floor(new Date(rawTime).getTime() / 1000)
                : NaN;
          return {
            time,
            open: c.open as number,
            high: c.high as number,
            low: c.low as number,
            close: c.close as number,
            volume: (c.volume as number) ?? 0,
            isUp: (c.close as number) >= (c.open as number),
          };
        })
        .filter((c) => Number.isFinite(c.time));
      if (mapped.length === 0) {
        // intentional fall-through
      } else {
        if (isClient && livePrice > 0) {
          const last = mapped[mapped.length - 1];
          if (liveCandle) {
            if (liveCandle.time > last.time) {
              mapped.push({
                time: liveCandle.time,
                open: liveCandle.open,
                high: liveCandle.high,
                low: liveCandle.low,
                close: liveCandle.close,
                volume: 0,
                isUp: liveCandle.close >= liveCandle.open,
              });
            } else {
              last.close = liveCandle.close;
              last.high = liveCandle.high;
              last.low = liveCandle.low;
              last.isUp = liveCandle.close >= liveCandle.open;
            }
          } else {
            last.close = livePrice;
            last.high = Math.max(last.high, livePrice);
            last.low = Math.min(last.low, livePrice);
            last.isUp = last.close >= last.open;
          }
        }
        return mapped;
      }
    }
    const basePrice = selectedInstrument.midPrice > 0 ? selectedInstrument.midPrice : DEFAULT_INSTRUMENTS[0].midPrice;
    const data = generateCandleData(basePrice, timeframe);
    if (data.length > 0 && isClient && livePrice > 0) {
      const lastCandle = data[data.length - 1];
      if (liveCandle) {
        if (liveCandle.time > lastCandle.time) {
          data.push({
            time: liveCandle.time,
            open: liveCandle.open,
            high: liveCandle.high,
            low: liveCandle.low,
            close: liveCandle.close,
            volume: 0,
            isUp: liveCandle.close >= liveCandle.open,
          });
        } else {
          lastCandle.close = liveCandle.close;
          lastCandle.high = liveCandle.high;
          lastCandle.low = liveCandle.low;
          lastCandle.isUp = liveCandle.close >= liveCandle.open;
        }
      } else {
        lastCandle.close = livePrice;
        lastCandle.high = Math.max(lastCandle.high, lastCandle.close);
        lastCandle.low = Math.min(lastCandle.low, lastCandle.close);
        lastCandle.isUp = lastCandle.close >= lastCandle.open;
      }
    }
    return data;
  }, [candlesApiData, selectedInstrument.midPrice, timeframe, livePrice, isClient, isMockMode, liveCandle]);

  const indicatorOverlays = React.useMemo(() => {
    if (!candleData || candleData.length === 0) return [];
    const closes = candleData.map((c) => c.close);
    const times = candleData.map((c) => c.time);
    const overlays: Array<Record<string, unknown>> = [];
    if (activeIndicators.has("sma20")) {
      const values = sma(closes, 20);
      overlays.push({
        id: "sma20",
        label: "SMA 20",
        color: "#f59e0b",
        data: times.map((t, i) => ({ time: t, value: values[i] })),
      });
    }
    if (activeIndicators.has("sma50")) {
      const values = sma(closes, 50);
      overlays.push({
        id: "sma50",
        label: "SMA 50",
        color: "#8b5cf6",
        data: times.map((t, i) => ({ time: t, value: values[i] })),
      });
    }
    if (activeIndicators.has("ema12")) {
      const values = ema(closes, 12);
      overlays.push({
        id: "ema12",
        label: "EMA 12",
        color: "#06b6d4",
        data: times.map((t, i) => ({ time: t, value: values[i] })),
      });
    }
    if (activeIndicators.has("bb")) {
      const bb = bollingerBands(closes, 20, 2);
      overlays.push(
        {
          id: "bb-upper",
          label: "BB Upper",
          color: "rgba(148, 163, 184, 0.5)",
          data: times.map((t, i) => ({ time: t, value: bb.upper[i] })),
          lineStyle: 2,
        },
        {
          id: "bb-lower",
          label: "BB Lower",
          color: "rgba(148, 163, 184, 0.5)",
          data: times.map((t, i) => ({ time: t, value: bb.lower[i] })),
          lineStyle: 2,
        },
        {
          id: "bb-middle",
          label: "BB Middle",
          color: "rgba(148, 163, 184, 0.8)",
          data: times.map((t, i) => ({ time: t, value: bb.middle[i] })),
        },
      );
    }
    return overlays;
  }, [candleData, activeIndicators]);

  const toggleIndicator = React.useCallback((id: string) => {
    setActiveIndicators((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const spread = asks[0]?.price - bids[0]?.price || 0;
  const spreadBps = (spread / livePrice) * 10000;

  const syncOwnTradesFromLedger = React.useCallback(() => {
    const orders = getOrders();
    const filled = orders.filter(
      (o) =>
        o.client_id === "internal-trader" &&
        (o.status === "filled" || o.status === "open") &&
        o.average_fill_price !== null,
    );
    setOwnTrades(
      filled
        .slice()
        .reverse()
        .slice(0, 20)
        .map((o) => ({
          id: o.id,
          time: new Date(o.updated_at).toLocaleTimeString("en-US", { hour12: false, timeZone: "UTC" }),
          side: o.side,
          price: o.average_fill_price ?? o.price,
          size: o.filled_quantity,
          status: "filled" as const,
        })),
    );
  }, []);

  React.useEffect(() => {
    const handler = () => {
      syncOwnTradesFromLedger();
    };
    window.addEventListener("mock-order-filled", handler);
    return () => window.removeEventListener("mock-order-filled", handler);
  }, [syncOwnTradesFromLedger]);

  const handleSubmitOrder = React.useCallback(() => {
    const size = parseFloat(orderSize);
    if (!size || size <= 0 || !isContextComplete) return;

    const currentBid = bids[0]?.price ?? livePrice * 0.9999;
    const currentAsk = asks[0]?.price ?? livePrice * 1.0001;

    const limitPrice = parseFloat(orderPrice);
    const isLimitCrossing =
      orderType === "limit" &&
      limitPrice > 0 &&
      ((orderSide === "buy" && limitPrice >= currentAsk) || (orderSide === "sell" && limitPrice <= currentBid));

    const useMarketFill = orderType === "market" || isLimitCrossing;
    const submitPrice = orderType === "market" ? livePrice : limitPrice > 0 ? limitPrice : livePrice;

    placeMockOrder({
      client_id: "internal-trader",
      instrument_id: selectedInstrument.instrumentKey,
      venue: selectedInstrument.venue,
      side: orderSide,
      order_type: useMarketFill ? "market" : "limit",
      quantity: size,
      price: submitPrice,
      asset_class: "CeFi",
      lane: "book",
      max_slippage_bps: 10,
      strategy_id: linkedStrategyId ?? undefined,
    });

    if (orderType === "limit" && !isLimitCrossing && limitPrice > 0) {
      const now = new Date();
      setOwnTrades((prev) => [
        {
          id: `user-${Date.now()}`,
          time: now.toLocaleTimeString("en-US", { hour12: false, timeZone: "UTC" }),
          side: orderSide,
          price: limitPrice,
          size,
          status: "pending" as const,
        },
        ...prev,
      ]);
    }

    setRecentTrades((prev) => [
      {
        id: `user-${Date.now()}`,
        time: new Date().toLocaleTimeString("en-US", { hour12: false, timeZone: "UTC" }),
        side: orderSide,
        price: submitPrice,
        size,
      },
      ...prev.slice(0, 11),
    ]);
    setOrderSize("");
    setOrderPrice("");
  }, [orderSize, orderPrice, orderType, orderSide, livePrice, isContextComplete, bids, asks, selectedInstrument]);

  const terminalData: TerminalData = React.useMemo(
    () => ({
      instruments,
      instrumentsByCategory,
      selectedInstrument,
      setSelectedInstrument,
      livePrice,
      priceChange,
      wsBid,
      wsAsk,
      bids,
      asks,
      spread,
      spreadBps,
      candleData: candleData as Array<Record<string, unknown>>,
      indicatorOverlays,
      recentTrades: recentTrades as Array<Record<string, unknown>>,
      ownTrades: ownTrades as Array<Record<string, unknown>>,
      selectedAccount,
      setSelectedAccount,
      availableAccounts,
      orderType,
      setOrderType,
      orderSide,
      setOrderSide,
      orderPrice,
      setOrderPrice,
      orderSize,
      setOrderSize,
      timeframe,
      setTimeframe,
      chartType,
      setChartType,
      activeIndicators,
      toggleIndicator,
      linkedStrategyId,
      setLinkedStrategyId,
      linkedStrategy: linkedStrategy as unknown as Record<string, unknown> | null,
      strategyWarnings,
      handleSubmitOrder,
      isContextComplete,
      wallClockMs,
      isBatchMode: context.mode === "batch",
      // TODO: wire from API hook when real endpoint exists
      isLoading: false,
      error: null,
    }),
    [
      instruments,
      instrumentsByCategory,
      selectedInstrument,
      livePrice,
      priceChange,
      wsBid,
      wsAsk,
      bids,
      asks,
      spread,
      spreadBps,
      candleData,
      indicatorOverlays,
      recentTrades,
      ownTrades,
      selectedAccount,
      availableAccounts,
      orderType,
      orderSide,
      orderPrice,
      orderSize,
      timeframe,
      chartType,
      activeIndicators,
      toggleIndicator,
      linkedStrategyId,
      linkedStrategy,
      strategyWarnings,
      handleSubmitOrder,
      isContextComplete,
      wallClockMs,
      context.mode,
    ],
  );

  return {
    terminalData,
    errors: {
      tickers: !!tickersError,
      positions: !!positionsError,
      alerts: !!alertsError,
    },
  };
}
