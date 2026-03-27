"use client";

import { CalendarEventFeed } from "@/components/trading/calendar-event-feed";
import type { IndicatorOverlay } from "@/components/trading/candlestick-chart";
import { ManualTradingPanel } from "@/components/trading/manual-trading-panel";
import { generateMockOrderBook } from "@/components/trading/order-book";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAlerts } from "@/hooks/api/use-alerts";
import { useInstruments } from "@/hooks/api/use-instruments";
import { useCandles, useOrderBook, useTickers } from "@/hooks/api/use-market-data";
import { useBalances, usePositions } from "@/hooks/api/use-positions";
import { useStrategyPerformance } from "@/hooks/api/use-strategies";
import { useTickingNowMs } from "@/hooks/use-ticking-now";
import { useWebSocket } from "@/hooks/use-websocket";
import { mock01, mockRange } from "@/lib/deterministic-mock";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import type { Strategy } from "@/lib/strategy-registry";
import { STRATEGIES } from "@/lib/strategy-registry";
import { cn } from "@/lib/utils";
import { bollingerBands, ema, sma } from "@/lib/utils/indicators";
import { AlertTriangle } from "lucide-react";
import * as React from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import {
  TerminalDataProvider,
  type TerminalData,
  type TerminalInstrument,
} from "@/components/widgets/terminal/terminal-data-context";

import "@/components/widgets/terminal/register";

const DEFAULT_INSTRUMENTS: TerminalInstrument[] = [
  { symbol: "BTC/USDT", name: "Bitcoin", venue: "Binance", category: "CeFi", midPrice: 87234.56, change: 1.23 },
  { symbol: "ETH/USDT", name: "Ethereum", venue: "Binance", category: "CeFi", midPrice: 2045.78, change: -0.45 },
  {
    symbol: "ETH-PERP",
    name: "ETH Perpetual",
    venue: "Hyperliquid",
    category: "CeFi",
    midPrice: 2043.5,
    change: -0.52,
  },
  { symbol: "SOL/USDT", name: "Solana", venue: "Binance", category: "CeFi", midPrice: 134.21, change: 2.15 },
  { symbol: "BTC-PERP", name: "BTC Perpetual", venue: "Binance", category: "CeFi", midPrice: 87200.0, change: 1.18 },
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
  const baseTimestamp = 1774008000;
  return Array.from({ length: points }, (_, i) => {
    const open = basePrice + (seededRandom() - 0.5) * volatility * 2;
    const close = open + (seededRandom() - 0.5) * volatility * 2;
    const high = Math.max(open, close) + seededRandom() * volatility;
    const low = Math.min(open, close) - seededRandom() * volatility;
    const volume = seededRandom() * 100 + 20;
    const timestamp = baseTimestamp - (points - i - 1) * secondsPerCandle;
    return { time: timestamp, open, close, high, low, volume, isUp: close >= open };
  });
};

export default function TradingPage() {
  const { scope: context, setMode } = useGlobalScope();
  const { data: tickersData, error: tickersError } = useTickers();
  const modeParam = context.mode === "batch" ? "batch" : "live";
  const asOfParam = context.mode === "batch" ? context.asOfDatetime?.split("T")[0] : undefined;
  const { data: positionsData, error: positionsError } = usePositions(modeParam, asOfParam);
  const { data: alertsData, error: alertsError } = useAlerts();
  const { data: strategiesApiData } = useStrategyPerformance();
  const { data: instrumentsApiData } = useInstruments();
  const { data: balancesApiData } = useBalances();

  const [wsBid, setWsBid] = React.useState<number | null>(null);
  const [wsAsk, setWsAsk] = React.useState<number | null>(null);

  const instruments = React.useMemo(() => {
    const instData = instrumentsApiData as Record<string, unknown> | undefined;
    const instArr = (instData?.instruments ?? []) as Array<Record<string, unknown>>;
    if (instArr.length > 0) {
      return instArr.map((i) => ({
        symbol: (i.symbol as string) ?? (i.instrumentKey as string) ?? "",
        name: (i.symbol as string) ?? "",
        venue: (i.venue as string) ?? "",
        category: (i.category as string) ?? "Other",
        midPrice: 0,
        change: 0,
      }));
    }
    const tickersRaw: Record<string, unknown>[] =
      ((tickersData as Record<string, unknown>)?.data as Record<string, unknown>[]) ??
      ((tickersData as Record<string, unknown>)?.tickers as Record<string, unknown>[]) ??
      [];
    if (tickersRaw.length > 0) {
      return tickersRaw.map((t) => ({
        symbol: (t.symbol as string) ?? "",
        name: (t.name as string) ?? (t.symbol as string) ?? "",
        venue: (t.venue as string) ?? "",
        category: (t.category as string) ?? "CeFi",
        midPrice: (t.midPrice as number) ?? (t.price as number) ?? 0,
        change: (t.change as number) ?? (t.changePct as number) ?? 0,
      }));
    }
    return DEFAULT_INSTRUMENTS.map((d) => ({ ...d, category: "CeFi" }));
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
  const [chartType, setChartType] = React.useState<"candles" | "line" | "depth" | "options">("candles");
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
  }, [ws.status, selectedInstrument?.symbol, ws.subscribe, ws.unsubscribe]);

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
    const balances = (raw?.balances ?? raw?.data ?? []) as Array<Record<string, unknown>>;
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
  }, [context.strategyIds]);

  const [tickCount, setTickCount] = React.useState(0);
  const wallClockMs = useTickingNowMs(1000);
  const isMockMode = process.env.NEXT_PUBLIC_MOCK_API === "true";
  const mockPriceTickRef = React.useRef(0);

  React.useEffect(() => {
    if (isMockMode) return;
    const interval = setInterval(() => {
      mockPriceTickRef.current += 1;
      const t = mockPriceTickRef.current;
      setLivePrice((prev: number) => {
        const volatility = (mock01(t, 51) - 0.5) * selectedInstrument.midPrice * 0.0002;
        const drift = selectedInstrument.midPrice * 0.00001;
        return prev + volatility + drift;
      });
      setTickCount((prev) => prev + 1);
    }, 500);
    return () => clearInterval(interval);
  }, [selectedInstrument.midPrice, isMockMode]);

  const livePriceRef = React.useRef(livePrice);
  React.useEffect(() => {
    livePriceRef.current = livePrice;
  }, [livePrice]);
  const liveTradeSeqRef = React.useRef(0);

  React.useEffect(() => {
    if (!isClient || isMockMode) return;
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
  }, [isClient, isMockMode]);

  const { bids, asks } = React.useMemo(() => {
    const apiOb = orderbookApiData as Record<string, unknown> | undefined;
    const apiBids = apiOb?.bids as Array<Record<string, number>> | undefined;
    const apiAsks = apiOb?.asks as Array<Record<string, number>> | undefined;
    if (apiBids && apiAsks && apiBids.length > 0) {
      const mappedBids = apiBids.map((b) => ({ price: b.price, size: b.size ?? b.quantity ?? 0, total: b.total ?? 0 }));
      const mappedAsks = apiAsks.map((a) => ({ price: a.price, size: a.size ?? a.quantity ?? 0, total: a.total ?? 0 }));
      if (wsBid !== null && mappedBids.length > 0) mappedBids[0] = { ...mappedBids[0], price: wsBid };
      if (wsAsk !== null && mappedAsks.length > 0) mappedAsks[0] = { ...mappedAsks[0], price: wsAsk };
      return { bids: mappedBids, asks: mappedAsks };
    }
    return generateMockOrderBook(selectedInstrument.symbol, livePrice, tickCount);
  }, [orderbookApiData, selectedInstrument.symbol, livePrice, tickCount, wsBid, wsAsk]);

  const candleData = React.useMemo(() => {
    const apiCandles = (candlesApiData as Record<string, unknown>)?.candles as
      | Array<Record<string, unknown>>
      | undefined;
    if (apiCandles && Array.isArray(apiCandles) && apiCandles.length > 0) {
      const mapped = apiCandles.map((c) => ({
        time: typeof c.time === "number" ? c.time : Math.floor(new Date(c.time as string).getTime() / 1000),
        open: c.open as number,
        high: c.high as number,
        low: c.low as number,
        close: c.close as number,
        volume: (c.volume as number) ?? 0,
        isUp: (c.close as number) >= (c.open as number),
      }));
      if (mapped.length > 0 && isClient && livePrice > 0) {
        const last = mapped[mapped.length - 1];
        const intervalSeconds = timeframe === "1m" ? 60 : timeframe === "5m" ? 300 : timeframe === "15m" ? 900 : 3600;
        const nowUnix = Math.floor(wallClockMs / 1000);
        if (nowUnix >= last.time + intervalSeconds) {
          mapped.push({
            time: Math.floor(nowUnix / intervalSeconds) * intervalSeconds,
            open: livePrice,
            high: livePrice,
            low: livePrice,
            close: livePrice,
            volume: 0,
            isUp: true,
          });
        } else {
          last.close = livePrice;
          last.high = Math.max(last.high, livePrice);
          last.low = Math.min(last.low, livePrice);
          last.isUp = last.close >= last.open;
        }
      }
      return mapped;
    }
    const data = generateCandleData(selectedInstrument.midPrice, timeframe);
    if (data.length > 0 && isClient) {
      const lastCandle = data[data.length - 1];
      const variation = (tickCount % 10) * 0.0001 * livePrice;
      lastCandle.close = livePrice + Math.sin(tickCount * 0.5) * variation;
      lastCandle.high = Math.max(lastCandle.high, lastCandle.close);
      lastCandle.low = Math.min(lastCandle.low, lastCandle.close);
      lastCandle.isUp = lastCandle.close >= lastCandle.open;
    }
    return data;
  }, [candlesApiData, selectedInstrument.midPrice, timeframe, tickCount, livePrice, isClient, wallClockMs]);

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

  const handleSubmitOrder = React.useCallback(() => {
    const size = parseFloat(orderSize);
    if (!size || size <= 0 || !isContextComplete) return;
    const price =
      orderType === "market" ? livePrice + (orderSide === "buy" ? 0.5 : -0.5) : parseFloat(orderPrice) || livePrice;
    const now = new Date();
    const newTrade = {
      id: `user-${Date.now()}`,
      time: now.toLocaleTimeString("en-US", { hour12: false, timeZone: "UTC" }),
      side: orderSide,
      price,
      size,
      status: "filled" as const,
    };
    setOwnTrades((prev) => [newTrade, ...prev]);
    setRecentTrades((prev) => [{ ...newTrade, status: undefined } as (typeof prev)[0], ...prev.slice(0, 11)]);
    setOrderSize("");
    setOrderPrice("");
  }, [orderSize, orderPrice, orderType, orderSide, livePrice, isContextComplete]);

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

  return (
    <div className="h-full bg-background flex flex-col">
      {(tickersError || positionsError || alertsError) && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive mx-4 mt-4">
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            Some data failed to load
            {tickersError ? " (tickers)" : ""}
            {positionsError ? " (positions)" : ""}
            {alertsError ? " (alerts)" : ""}. Parts of the terminal may show stale or missing data.
          </span>
        </div>
      )}
      <div className="flex-1 overflow-auto p-2">
        <TerminalDataProvider value={terminalData}>
          <WidgetGrid tab="terminal" />
        </TerminalDataProvider>
      </div>
    </div>
  );
}
