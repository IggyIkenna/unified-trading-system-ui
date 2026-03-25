"use client";

import { CalendarEventFeed } from "@/components/trading/calendar-event-feed";
import type { IndicatorOverlay } from "@/components/trading/candlestick-chart";
import { CandlestickChart } from "@/components/trading/candlestick-chart";
import { ManualTradingPanel } from "@/components/trading/manual-trading-panel";
import {
  DepthChart,
  generateMockOrderBook,
  OrderBook,
} from "@/components/trading/order-book";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAlerts } from "@/hooks/api/use-alerts";
import { useInstruments } from "@/hooks/api/use-instruments";
import {
  useCandles,
  useOrderBook,
  useTickers,
} from "@/hooks/api/use-market-data";
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
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Database,
  Maximize2,
  Radio,
  RefreshCw,
  Settings,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const OptionsChain = dynamic(
  () =>
    import("@/components/trading/options-chain").then((m) => ({
      default: m.OptionsChain,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
        Loading options chain...
      </div>
    ),
  },
);
const VolSurfaceChart = dynamic(
  () =>
    import("@/components/trading/vol-surface-chart").then((m) => ({
      default: m.VolSurfaceChart,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
        Loading vol surface...
      </div>
    ),
  },
);

// Strategy to instrument mapping - loaded from API where available
const strategyInstruments: Record<string, string> = {
  CEFI_BTC_PERP_FUND_EVT_TICK: "BTC-PERP",
  CEFI_ETH_PERP_FUND_EVT_TICK: "ETH-PERP",
  CEFI_SOL_PERP_FUND_EVT_TICK: "SOL/USDT",
  CEFI_BTC_OPT_MM_EVT_TICK: "BTC/USD",
  CEFI_ETH_OPT_MM_EVT_TICK: "ETH/USDT",
  CEFI_BTC_ML_DIR_HUF_4H: "BTC/USDT",
  CEFI_ETH_ML_DIR_HUF_4H: "ETH/USDT",
  CEFI_SOL_MOM_HUF_4H: "SOL/USDT",
  DEFI_AAVE_YIELD_EVT_BLK: "ETH/USDT",
  DEFI_UNI_LP_EVT_BLK: "ETH/USDT",
};

// Default instruments fallback
const DEFAULT_INSTRUMENTS = [
  {
    symbol: "BTC/USDT",
    name: "Bitcoin",
    venue: "Binance",
    midPrice: 67234.5,
    change: 2.4,
  },
  {
    symbol: "ETH/USDT",
    name: "Ethereum",
    venue: "Binance",
    midPrice: 3456.78,
    change: 1.8,
  },
  {
    symbol: "SOL/USDT",
    name: "Solana",
    venue: "Binance",
    midPrice: 156.42,
    change: 4.2,
  },
  {
    symbol: "BTC-PERP",
    name: "Bitcoin Perp",
    venue: "Hyperliquid",
    midPrice: 67245.0,
    change: 2.5,
  },
  {
    symbol: "ETH-PERP",
    name: "Ethereum Perp",
    venue: "Hyperliquid",
    midPrice: 3458.5,
    change: 1.9,
  },
  {
    symbol: "BTC/USD",
    name: "Bitcoin",
    venue: "Deribit",
    midPrice: 67250.0,
    change: 2.3,
  },
];

// Generate candlestick data for different timeframes - v2.0
// Uses Unix timestamps (seconds) for lightweight-charts compatibility
const generateCandleData = (basePrice: number, timeframe: string) => {
  const points =
    timeframe === "1m"
      ? 60
      : timeframe === "5m"
        ? 48
        : timeframe === "15m"
          ? 32
          : 24;
  const volatility = basePrice * 0.002;

  // Use seeded random for consistent SSR/client rendering
  let seed = basePrice * 1000;
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // Calculate seconds per candle based on timeframe
  const secondsPerCandle =
    timeframe === "1m"
      ? 60
      : timeframe === "5m"
        ? 300
        : timeframe === "15m"
          ? 900
          : 3600;

  // Use a fixed base timestamp for consistent SSR/client rendering (Mar 18, 2026 12:00 UTC)
  const baseTimestamp = 1774008000; // Unix timestamp in seconds

  return Array.from({ length: points }, (_, i) => {
    const open = basePrice + (seededRandom() - 0.5) * volatility * 2;
    const close = open + (seededRandom() - 0.5) * volatility * 2;
    const high = Math.max(open, close) + seededRandom() * volatility;
    const low = Math.min(open, close) - seededRandom() * volatility;
    const volume = seededRandom() * 100 + 20;

    // Generate Unix timestamp in seconds for lightweight-charts
    const timestamp = baseTimestamp - (points - i - 1) * secondsPerCandle;

    return {
      time: timestamp,
      open,
      close,
      high,
      low,
      volume,
      isUp: close >= open,
    };
  });
};

export default function TradingPage() {
  const { scope: context, setMode } = useGlobalScope();
  const { data: tickersData, error: tickersError } = useTickers();
  const modeParam = context.mode === "batch" ? "batch" : "live";
  const asOfParam =
    context.mode === "batch" ? context.asOfDatetime?.split("T")[0] : undefined;
  const { data: positionsData, error: positionsError } = usePositions(
    modeParam,
    asOfParam,
  );
  const { data: alertsData, error: alertsError } = useAlerts();
  const { data: strategiesApiData } = useStrategyPerformance();
  const { data: instrumentsApiData } = useInstruments();
  const { data: balancesApiData } = useBalances();

  // WebSocket bid/ask state for orderbook overlay (hooks declared early, wired after useState below)
  const [wsBid, setWsBid] = React.useState<number | null>(null);
  const [wsAsk, setWsAsk] = React.useState<number | null>(null);

  // Extract instruments: prefer instruments API (with categories), fallback to tickers, then defaults
  const instruments = React.useMemo(() => {
    // Try instruments API (from useInstruments → /api/instruments/list)
    const instData = instrumentsApiData as Record<string, unknown> | undefined;
    const instArr = (instData?.instruments ?? []) as Array<
      Record<string, unknown>
    >;
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
    // Fallback to tickers API
    const tickersRaw: Record<string, unknown>[] =
      ((tickersData as Record<string, unknown>)?.data as Record<
        string,
        unknown
      >[]) ??
      ((tickersData as Record<string, unknown>)?.tickers as Record<
        string,
        unknown
      >[]) ??
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

  // Group instruments by category for the selector
  const instrumentsByCategory = React.useMemo(() => {
    const groups: Record<string, typeof instruments> = {};
    for (const inst of instruments) {
      const cat = inst.category ?? "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(inst);
    }
    return groups;
  }, [instruments]);

  const [selectedInstrument, setSelectedInstrument] = React.useState(
    instruments[0],
  );
  const [livePrice, setLivePrice] = React.useState(
    instruments[0]?.midPrice ?? 0,
  );
  const [priceChange, setPriceChange] = React.useState(
    instruments[0]?.change ?? 0,
  );
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
  const [chartType, setChartType] = React.useState<
    "candles" | "line" | "depth" | "options"
  >("candles");
  const [activeIndicators, setActiveIndicators] = React.useState<Set<string>>(
    new Set(),
  );
  const [tradesTab, setTradesTab] = React.useState<"market" | "own">("market");
  const [linkedStrategyId, setLinkedStrategyId] = React.useState<string | null>(
    null,
  );
  const [constraintsOpen, setConstraintsOpen] = React.useState(false);

  // Look up the linked strategy from the registry
  const linkedStrategy: Strategy | null = React.useMemo(() => {
    if (!linkedStrategyId) return null;
    return STRATEGIES.find((s) => s.id === linkedStrategyId) ?? null;
  }, [linkedStrategyId]);

  // When a strategy is linked, auto-populate instrument and side bias
  React.useEffect(() => {
    if (!linkedStrategy) return;
    // Auto-populate instrument from strategy's first instrument
    const firstInst = linkedStrategy.instruments[0];
    if (firstInst) {
      // Try to match the strategy instrument key to an available instrument symbol
      const matchedInstrument = instruments.find((i) => {
        const instKey = firstInst.key.toLowerCase();
        const sym = i.symbol.toLowerCase();
        return (
          instKey.includes(sym.replace("/", "")) ||
          sym.includes(instKey.split(":").pop()?.split("@")[0] ?? "")
        );
      });
      if (matchedInstrument) {
        setSelectedInstrument(matchedInstrument);
        setLivePrice(matchedInstrument.midPrice);
        setPriceChange(matchedInstrument.change);
      }
    }
    // Auto-populate side bias from strategy archetype
    const longArchetypes = [
      "BASIS_TRADE",
      "YIELD",
      "DIRECTIONAL",
      "ML_DIRECTIONAL",
      "MOMENTUM",
      "RECURSIVE_STAKED_BASIS",
    ];
    const shortArchetypes = ["MEAN_REVERSION"];
    if (longArchetypes.includes(linkedStrategy.archetype)) {
      setOrderSide("buy");
    } else if (shortArchetypes.includes(linkedStrategy.archetype)) {
      setOrderSide("sell");
    }
  }, [linkedStrategy, instruments]);

  // Strategy constraint validation warnings
  const strategyWarnings: string[] = React.useMemo(() => {
    if (!linkedStrategy) return [];
    const warnings: string[] = [];
    const size = parseFloat(orderSize);
    // Check max position from risk profile (parse maxLeverage as a multiplier hint for sizing)
    const maxLeverage =
      parseFloat(linkedStrategy.riskProfile.maxLeverage.replace("x", "")) || 1;
    const maxDrawdown =
      parseFloat(linkedStrategy.riskProfile.maxDrawdown.replace("%", "")) ||
      100;
    if (size > 0 && maxLeverage <= 1 && size > 10) {
      warnings.push(
        `Size ${size} may exceed conservative position limits for a ${linkedStrategy.riskProfile.maxLeverage} leverage strategy`,
      );
    }
    // Check venue restrictions
    if (linkedStrategy.venues.length > 0 && selectedInstrument) {
      const venueMatch = linkedStrategy.venues.some(
        (v) =>
          v.toLowerCase().includes(selectedInstrument.venue.toLowerCase()) ||
          selectedInstrument.venue
            .toLowerCase()
            .includes(v.toLowerCase().split("-")[0]),
      );
      if (!venueMatch) {
        warnings.push(
          `Venue "${selectedInstrument.venue}" is not in strategy's allowed venues: ${linkedStrategy.venues.join(", ")}`,
        );
      }
    }
    // Check order type vs execution mode
    if (linkedStrategy.executionMode === "HUF" && orderType === "market") {
      warnings.push(
        "HUF strategies typically use limit orders for tighter spread control",
      );
    }
    return warnings;
  }, [linkedStrategy, orderSize, selectedInstrument, orderType]);

  // API data: candles and order book (must be after useState declarations to avoid TS block-scoping errors)
  const { data: candlesApiData } = useCandles(
    selectedInstrument?.venue ?? "Binance",
    selectedInstrument?.symbol ?? "BTC/USDT",
    timeframe === "1m"
      ? "1M"
      : timeframe === "5m"
        ? "5M"
        : timeframe === "15m"
          ? "15M"
          : "1H",
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

  // WebSocket for real-time ticks (after useState to avoid block-scoping errors)
  const handleWsMessage = React.useCallback(
    (msg: Record<string, unknown>) => {
      if (
        msg.instrument === selectedInstrument?.symbol &&
        typeof msg.price === "number"
      ) {
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

  // Subscribe to selected instrument on WebSocket
  React.useEffect(() => {
    if (ws.status === "connected" && selectedInstrument) {
      ws.subscribe([selectedInstrument.symbol]);
      return () => {
        ws.unsubscribe([selectedInstrument.symbol]);
      };
    }
  }, [ws.status, selectedInstrument?.symbol, ws.subscribe, ws.unsubscribe]);

  // Own trades (user's fills)
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

  // Reset price when instrument changes
  React.useEffect(() => {
    setLivePrice(selectedInstrument.midPrice);
    setPriceChange(selectedInstrument.change);
  }, [selectedInstrument]);

  // Get available accounts from balances API
  const availableAccounts = React.useMemo(() => {
    const raw = balancesApiData as Record<string, unknown> | undefined;
    const balances = (raw?.balances ?? raw?.data ?? []) as Array<
      Record<string, unknown>
    >;
    if (balances.length > 0) {
      return balances.map((b, i) => ({
        id: (b.id as string) ?? `acc-${i}`,
        name: (b.venue as string) ?? `Account ${i + 1}`,
        venueAccountId: (b.account_id as string) ?? "",
        marginType: (b.margin_type as string) ?? "cross",
      }));
    }
    return [
      {
        id: "default",
        name: "Default Account",
        venueAccountId: "default-001",
        marginType: "cross",
      },
    ];
  }, [balancesApiData]);

  // Check if trading context is complete
  const isContextComplete = React.useMemo(() => {
    return (
      context.organizationIds.length > 0 &&
      context.clientIds.length > 0 &&
      selectedAccount !== null
    );
  }, [context.organizationIds, context.clientIds, selectedAccount]);

  // Animated recent trades - initialize empty to avoid hydration mismatch
  const [recentTrades, setRecentTrades] = React.useState<
    Array<{
      id: string;
      time: string;
      side: "buy" | "sell";
      price: number;
      size: number;
    }>
  >([]);

  // Hydration-safe flag
  const [isClient, setIsClient] = React.useState(false);

  // Initialize trades on client only to avoid hydration mismatch
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Generate trades for the selected instrument
  React.useEffect(() => {
    if (!isClient) return;

    // Generate realistic price variation based on instrument
    const priceVariation = selectedInstrument.midPrice * 0.0005; // 0.05% variation

    const newTrades = Array.from({ length: 12 }, (_, i) => {
      const now = new Date();
      now.setSeconds(now.getSeconds() - i * 2);
      const side = mock01(i, 11) > 0.5 ? "buy" : "sell";
      const price =
        selectedInstrument.midPrice +
        (mock01(i, 12) - 0.5) * priceVariation * 2;
      const size = mockRange(0.01, 0.51, i, 13);
      return {
        id: `trade-mock-${selectedInstrument.symbol}-${i}`,
        time: now.toLocaleTimeString("en-US", {
          hour12: false,
          timeZone: "UTC",
        }),
        side: side as "buy" | "sell",
        price,
        size,
      };
    });
    setRecentTrades(newTrades);
  }, [isClient, selectedInstrument]);

  // Get strategies from API (replaces lib/trading-data.ts STRATEGIES)
  const filteredStrategies = React.useMemo(() => {
    const raw = strategiesApiData as Record<string, unknown> | undefined;
    const strategies = (raw?.strategies ?? raw?.data ?? []) as Array<{
      id: string;
      name: string;
      status?: string;
      [k: string]: unknown;
    }>;
    if (!Array.isArray(strategies) || strategies.length === 0) return [];
    // Apply scope filters if set
    if (context.strategyIds.length > 0) {
      return strategies.filter((s) => context.strategyIds.includes(s.id));
    }
    return strategies;
  }, [strategiesApiData, context.strategyIds]);

  // When strategy filter changes, update instrument
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

  // Tick counter for order book and depth chart updates
  const [tickCount, setTickCount] = React.useState(0);
  const wallClockMs = useTickingNowMs(1000);

  const isMockMode = process.env.NEXT_PUBLIC_MOCK_API === "true";

  const mockPriceTickRef = React.useRef(0);

  // Animate price updates and increment tick
  // Brownian motion with slight upward drift (trending market)
  React.useEffect(() => {
    if (isMockMode) return;
    const interval = setInterval(() => {
      mockPriceTickRef.current += 1;
      const t = mockPriceTickRef.current;
      setLivePrice((prev: number) => {
        const volatility =
          (mock01(t, 51) - 0.5) * selectedInstrument.midPrice * 0.0002;
        const drift = selectedInstrument.midPrice * 0.00001;
        return prev + volatility + drift;
      });
      setTickCount((prev) => prev + 1);
    }, 500);
    return () => clearInterval(interval);
  }, [selectedInstrument.midPrice, isMockMode]);

  // Animate recent trades - use ref to avoid stale closure
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
        const side = mock01(s, 61) > 0.5 ? "buy" : "sell";
        const priceVariation = currentPrice * 0.0002;
        const price = currentPrice + (mock01(s, 62) - 0.5) * priceVariation * 2;
        const size = mockRange(0.01, 0.51, s, 63);
        const newTrade = {
          id: `live-${s}`,
          time: now.toLocaleTimeString("en-US", {
            hour12: false,
            timeZone: "UTC",
          }),
          side: side as "buy" | "sell",
          price,
          size,
        };
        return [newTrade, ...prev.slice(0, 11)];
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [isClient, isMockMode]);

  // Order book: prefer API data, fall back to client-side generation
  // WebSocket bid/ask updates the top-of-book in real-time
  const { bids, asks } = React.useMemo(() => {
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
      // Overlay WebSocket bid/ask at top of book
      if (wsBid !== null && mappedBids.length > 0)
        mappedBids[0] = { ...mappedBids[0], price: wsBid };
      if (wsAsk !== null && mappedAsks.length > 0)
        mappedAsks[0] = { ...mappedAsks[0], price: wsAsk };
      return { bids: mappedBids, asks: mappedAsks };
    }
    return generateMockOrderBook(
      selectedInstrument.symbol,
      livePrice,
      tickCount,
    );
  }, [
    orderbookApiData,
    selectedInstrument.symbol,
    livePrice,
    tickCount,
    wsBid,
    wsAsk,
  ]);

  // Candle data: prefer API data, fall back to client-side generation
  const candleData = React.useMemo(() => {
    // Use API candle data if available
    const apiCandles = (candlesApiData as Record<string, unknown>)?.candles as
      | Array<Record<string, unknown>>
      | undefined;
    if (apiCandles && Array.isArray(apiCandles) && apiCandles.length > 0) {
      const mapped = apiCandles.map((c) => ({
        time:
          typeof c.time === "number"
            ? c.time
            : Math.floor(new Date(c.time as string).getTime() / 1000),
        open: c.open as number,
        high: c.high as number,
        low: c.low as number,
        close: c.close as number,
        volume: (c.volume as number) ?? 0,
        isUp: (c.close as number) >= (c.open as number),
      }));
      // Update last candle or create new one based on live price
      if (mapped.length > 0 && isClient && livePrice > 0) {
        const last = mapped[mapped.length - 1];
        const intervalSeconds =
          timeframe === "1m"
            ? 60
            : timeframe === "5m"
              ? 300
              : timeframe === "15m"
                ? 900
                : 3600;
        const nowUnix = Math.floor(wallClockMs / 1000);
        const candleBoundary = last.time + intervalSeconds;

        if (nowUnix >= candleBoundary) {
          // New candle period: create new candle from live price
          const newTime =
            Math.floor(nowUnix / intervalSeconds) * intervalSeconds;
          mapped.push({
            time: newTime,
            open: livePrice,
            high: livePrice,
            low: livePrice,
            close: livePrice,
            volume: 0,
            isUp: true,
          });
        } else {
          // Still in current candle: update close/high/low
          last.close = livePrice;
          last.high = Math.max(last.high, livePrice);
          last.low = Math.min(last.low, livePrice);
          last.isUp = last.close >= last.open;
        }
      }
      return mapped;
    }
    // Fallback: client-side generated candles
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
  }, [
    candlesApiData,
    selectedInstrument.midPrice,
    timeframe,
    tickCount,
    livePrice,
    isClient,
    wallClockMs,
  ]);

  // Compute indicator overlays from candle close prices
  const indicatorOverlays: IndicatorOverlay[] = React.useMemo(() => {
    if (!candleData || candleData.length === 0) return [];
    const closes = candleData.map((c) => c.close);
    const times = candleData.map((c) => c.time);
    const overlays: IndicatorOverlay[] = [];

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
    if (activeIndicators.has("ema26")) {
      const values = ema(closes, 26);
      overlays.push({
        id: "ema26",
        label: "EMA 26",
        color: "#ec4899",
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

  // Calculate order total
  const orderTotal = React.useMemo(() => {
    const price = parseFloat(orderPrice) || livePrice;
    const size = parseFloat(orderSize) || 0;
    return price * size;
  }, [orderPrice, orderSize, livePrice]);

  // Handle order submission
  const handleSubmitOrder = () => {
    const size = parseFloat(orderSize);
    if (!size || size <= 0 || !isContextComplete) return;

    const price =
      orderType === "market"
        ? livePrice + (orderSide === "buy" ? 0.5 : -0.5)
        : parseFloat(orderPrice) || livePrice;

    const now = new Date();
    const newTrade = {
      id: `user-${Date.now()}`,
      time: now.toLocaleTimeString("en-US", { hour12: false, timeZone: "UTC" }),
      side: orderSide,
      price,
      size,
      status: "filled" as const,
    };

    // Add to own trades
    setOwnTrades((prev) => [newTrade, ...prev]);
    // Also show in market trades
    setRecentTrades((prev) => [
      { ...newTrade, status: undefined } as (typeof prev)[0],
      ...prev.slice(0, 11),
    ]);
    setOrderSize("");
    setOrderPrice("");
    setTradesTab("own"); // Switch to own trades tab to show the fill
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 p-4 space-y-4 overflow-auto">
        {/* Inline error banner for API failures */}
        {(tickersError || positionsError || alertsError) && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            <AlertTriangle className="size-4 shrink-0" />
            <span>
              Some data failed to load
              {tickersError ? " (tickers)" : ""}
              {positionsError ? " (positions)" : ""}
              {alertsError ? " (alerts)" : ""}. Parts of the terminal may show
              stale or missing data.
            </span>
          </div>
        )}

        {/* Instrument & Account Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select
              value={selectedInstrument.symbol}
              onValueChange={(v) =>
                setSelectedInstrument(
                  instruments.find((i) => i.symbol === v) || instruments[0],
                )
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                {Object.entries(instrumentsByCategory).map(
                  ([category, catInstruments]) => (
                    <React.Fragment key={category}>
                      <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {category}
                      </div>
                      {catInstruments.map((inst) => (
                        <SelectItem
                          key={`${inst.symbol}-${inst.venue}`}
                          value={inst.symbol}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">
                              {inst.symbol}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {inst.venue}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </React.Fragment>
                  ),
                )}
              </SelectContent>
            </Select>

            {/* Account Selector */}
            <Select
              value={selectedAccount?.id || ""}
              onValueChange={(v) =>
                setSelectedAccount(
                  availableAccounts.find((a) => a.id === v) || null,
                )
              }
            >
              <SelectTrigger
                className={cn(
                  "w-[260px]",
                  !selectedAccount && "border-amber-500/50 text-amber-500",
                )}
              >
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {availableAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{acc.name}</span>
                      <Badge
                        variant="outline"
                        className="text-[9px] h-4 px-1 capitalize"
                      >
                        {acc.marginType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {acc.venueAccountId}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <span className="text-2xl font-mono font-bold transition-all">
                $
                {livePrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  priceChange >= 0
                    ? "text-emerald-400 border-emerald-400/30"
                    : "text-rose-400 border-rose-400/30",
                )}
              >
                {priceChange >= 0 ? "+" : ""}
                {priceChange.toFixed(1)}%
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live/Batch Mode Toggle */}
            <Badge variant="outline" className="text-xs">
              {context.mode === "live" ? (
                <span className="flex items-center gap-1">
                  <Radio className="size-2.5 animate-pulse text-emerald-400" />
                  Live
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Database className="size-2.5" />
                  Batch
                </span>
              )}
            </Badge>

            <ManualTradingPanel
              defaultInstrument={selectedInstrument.symbol}
              defaultVenue={selectedInstrument.venue}
              currentPrice={livePrice}
              instruments={instruments}
              strategies={filteredStrategies.map((s) => ({
                id: s.id,
                name: s.name,
              }))}
            />

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm">
                <RefreshCw className="size-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="size-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Maximize2 className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Batch Mode Banner */}
        {context.mode === "batch" && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <Database className="size-4 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-500">
                Viewing Batch Data
              </p>
              <p className="text-xs text-muted-foreground">
                As of {context.asOfDatetime?.split("T")[0] ?? "yesterday"} —
                Historical snapshot, read-only
              </p>
            </div>
          </div>
        )}

        {/* Main Trading Grid — Resizable Panels */}
        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-[600px] rounded-lg"
          autoSaveId="trading-terminal-layout"
        >
          {/* Order Book Panel */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
            <div className="h-full pr-2">
              <OrderBook
                symbol={selectedInstrument.symbol}
                bids={bids}
                asks={asks}
                lastPrice={livePrice}
                spread={spread}
                spreadBps={spreadBps}
                midPrice={livePrice}
                venue={selectedInstrument.venue}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />

          {/* Chart Panel */}
          <ResizablePanel defaultSize={55} minSize={30}>
            <div className="h-full px-2">
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">Price Chart</CardTitle>
                      <div className="flex items-center gap-1 ml-4">
                        {["candles", "line", "depth", "options"].map((type) => (
                          <Button
                            key={type}
                            variant={chartType === type ? "secondary" : "ghost"}
                            size="sm"
                            className="h-6 px-2 text-xs capitalize"
                            onClick={() =>
                              setChartType(type as typeof chartType)
                            }
                          >
                            {type}
                          </Button>
                        ))}
                      </div>
                    </div>
                    {/* Indicator toggles */}
                    {chartType === "candles" && (
                      <div className="flex items-center gap-1">
                        {[
                          { id: "sma20", label: "SMA 20", color: "#f59e0b" },
                          { id: "sma50", label: "SMA 50", color: "#8b5cf6" },
                          { id: "ema12", label: "EMA 12", color: "#06b6d4" },
                          { id: "bb", label: "BB", color: "#94a3b8" },
                        ].map((ind) => (
                          <Button
                            key={ind.id}
                            variant={
                              activeIndicators.has(ind.id)
                                ? "secondary"
                                : "ghost"
                            }
                            size="sm"
                            className="h-5 px-1.5 text-[10px]"
                            style={
                              activeIndicators.has(ind.id)
                                ? { borderBottom: `2px solid ${ind.color}` }
                                : undefined
                            }
                            onClick={() => toggleIndicator(ind.id)}
                          >
                            {ind.label}
                          </Button>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      {["1m", "5m", "15m", "1H", "4H", "1D"].map((tf) => (
                        <Button
                          key={tf}
                          variant={timeframe === tf ? "secondary" : "ghost"}
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => setTimeframe(tf)}
                        >
                          {tf}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Candlestick / Line / Depth Chart */}
                  <div className="h-[300px]">
                    {chartType === "candles" ? (
                      <CandlestickChart
                        data={candleData}
                        indicators={indicatorOverlays}
                        height={300}
                      />
                    ) : chartType === "line" ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={candleData}>
                          <defs>
                            <linearGradient
                              id="priceGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="var(--primary)"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="100%"
                                stopColor="var(--primary)"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border)"
                            opacity={0.5}
                          />
                          <XAxis
                            dataKey="time"
                            tick={{
                              fontSize: 10,
                              fill: "var(--muted-foreground)",
                            }}
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            domain={["auto", "auto"]}
                            tick={{
                              fontSize: 10,
                              fill: "var(--muted-foreground)",
                            }}
                            tickFormatter={(v) => v.toLocaleString()}
                            width={70}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "var(--popover)",
                              border: "1px solid var(--border)",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                            formatter={(value: number) => [
                              `$${value.toFixed(2)}`,
                              "Price",
                            ]}
                          />
                          <Area
                            type="monotone"
                            dataKey="close"
                            stroke="var(--primary)"
                            fill="url(#priceGradient)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : chartType === "depth" ? (
                      <DepthChart
                        bids={bids}
                        asks={asks}
                        midPrice={livePrice}
                        symbol={selectedInstrument.symbol}
                        height={300}
                      />
                    ) : chartType === "options" ? (
                      <div className="space-y-4">
                        <OptionsChain
                          underlying={
                            selectedInstrument.symbol
                              .split("/")[0]
                              .split("-")[0]
                          }
                          venue={selectedInstrument.venue.toLowerCase()}
                        />
                        <VolSurfaceChart
                          underlying={
                            selectedInstrument.symbol
                              .split("/")[0]
                              .split("-")[0]
                          }
                        />
                      </div>
                    ) : null}
                  </div>

                  {/* Volume Chart below - only show for line chart (candles have built-in volume) */}
                  {chartType === "line" && (
                    <div className="h-[60px] mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={candleData}>
                          <XAxis dataKey="time" tick={false} axisLine={false} />
                          <YAxis hide />
                          <Bar dataKey="volume" radius={[2, 2, 0, 0]}>
                            {candleData.map((entry, index) => (
                              <Cell
                                key={`vol-${index}`}
                                fill={
                                  entry.isUp
                                    ? "var(--pnl-positive)"
                                    : "var(--pnl-negative)"
                                }
                                opacity={0.5}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Trades Section - Below Chart */}
                  <div className="mt-4 border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant={
                            tradesTab === "market" ? "secondary" : "ghost"
                          }
                          size="sm"
                          className="h-7 px-3 text-xs"
                          onClick={() => setTradesTab("market")}
                        >
                          Market Trades
                        </Button>
                        <Button
                          variant={tradesTab === "own" ? "secondary" : "ghost"}
                          size="sm"
                          className="h-7 px-3 text-xs"
                          onClick={() => setTradesTab("own")}
                        >
                          Own Trades
                          {ownTrades.length > 0 && (
                            <Badge
                              variant="outline"
                              className="ml-1.5 h-4 px-1 text-[10px]"
                            >
                              {ownTrades.length}
                            </Badge>
                          )}
                        </Button>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        UTC
                      </span>
                    </div>

                    <div
                      className="space-y-0.5 max-h-[120px] overflow-y-auto"
                      suppressHydrationWarning
                    >
                      {!isClient ? (
                        <div className="text-center py-4 text-xs text-muted-foreground">
                          Loading trades...
                        </div>
                      ) : tradesTab === "market" ? (
                        recentTrades.map((trade, i) => (
                          <div
                            key={trade.id}
                            className={cn(
                              "flex items-center justify-between py-1 text-xs font-mono transition-all duration-300",
                              i === 0 && "bg-muted/30 -mx-2 px-2 rounded",
                            )}
                            suppressHydrationWarning
                          >
                            <span
                              className="text-muted-foreground w-16"
                              suppressHydrationWarning
                            >
                              {trade.time}
                            </span>
                            <span
                              className={cn(
                                "w-24 text-right",
                                trade.side === "buy"
                                  ? "text-emerald-400"
                                  : "text-rose-400",
                              )}
                              suppressHydrationWarning
                            >
                              {trade.price.toFixed(2)}
                            </span>
                            <span
                              className="w-16 text-right text-muted-foreground"
                              suppressHydrationWarning
                            >
                              {trade.size.toFixed(4)}
                            </span>
                          </div>
                        ))
                      ) : ownTrades.length > 0 ? (
                        ownTrades.map((trade, i) => (
                          <div
                            key={trade.id}
                            className={cn(
                              "flex items-center justify-between py-1 text-xs font-mono",
                              i === 0 && "bg-primary/10 -mx-2 px-2 rounded",
                            )}
                            suppressHydrationWarning
                          >
                            <span
                              className="text-muted-foreground w-16"
                              suppressHydrationWarning
                            >
                              {trade.time}
                            </span>
                            <span
                              className={cn(
                                "w-24 text-right font-medium",
                                trade.side === "buy"
                                  ? "text-emerald-400"
                                  : "text-rose-400",
                              )}
                              suppressHydrationWarning
                            >
                              {trade.price.toFixed(2)}
                            </span>
                            <span
                              className="w-16 text-right"
                              suppressHydrationWarning
                            >
                              {trade.size.toFixed(4)}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "h-4 px-1 text-[9px]",
                                trade.status === "filled" &&
                                  "text-emerald-400 border-emerald-400/30",
                              )}
                            >
                              {trade.status}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-xs text-muted-foreground">
                          No trades yet. Place an order to see your fills here.
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />

          {/* Order Entry Panel */}
          <ResizablePanel defaultSize={25} minSize={18} maxSize={40}>
            <div className="h-full pl-2 space-y-4 overflow-y-auto">
              {/* Order Entry */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Order Entry</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Buy/Sell Toggle */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={orderSide === "buy" ? "default" : "outline"}
                      className={cn(
                        "w-full",
                        orderSide === "buy" &&
                          "bg-emerald-600 hover:bg-emerald-700",
                      )}
                      onClick={() => setOrderSide("buy")}
                    >
                      <TrendingUp className="size-4 mr-2" />
                      Buy
                    </Button>
                    <Button
                      variant={orderSide === "sell" ? "default" : "outline"}
                      className={cn(
                        "w-full",
                        orderSide === "sell" && "bg-rose-600 hover:bg-rose-700",
                      )}
                      onClick={() => setOrderSide("sell")}
                    >
                      <TrendingDown className="size-4 mr-2" />
                      Sell
                    </Button>
                  </div>

                  {/* Order Type */}
                  <Tabs
                    value={orderType}
                    onValueChange={(v) => setOrderType(v as "limit" | "market")}
                  >
                    <TabsList className="w-full">
                      <TabsTrigger value="limit" className="flex-1">
                        Limit
                      </TabsTrigger>
                      <TabsTrigger value="market" className="flex-1">
                        Market
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Price Input (Limit only) */}
                  {orderType === "limit" && (
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">
                        Price (USD)
                      </label>
                      <Input
                        type="number"
                        placeholder={livePrice.toFixed(2)}
                        value={orderPrice}
                        onChange={(e) => setOrderPrice(e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  )}

                  {/* Size Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">
                      Size ({selectedInstrument.symbol.split("/")[0]})
                    </label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={orderSize}
                      onChange={(e) => setOrderSize(e.target.value)}
                      className="font-mono"
                    />
                    <div className="flex items-center gap-1">
                      {[25, 50, 75, 100].map((pct) => (
                        <Button
                          key={pct}
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] flex-1"
                          onClick={() => setOrderSize((0.01 * pct).toFixed(4))}
                        >
                          {pct}%
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-mono font-medium">
                        $
                        {orderTotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    className={cn(
                      "w-full",
                      orderSide === "buy"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-rose-600 hover:bg-rose-700",
                    )}
                    disabled={!orderSize || !isContextComplete}
                    onClick={handleSubmitOrder}
                  >
                    {orderSide === "buy" ? "Buy" : "Sell"}{" "}
                    {selectedInstrument.symbol.split("/")[0]}
                  </Button>

                  {!isContextComplete && (
                    <p className="text-[10px] text-amber-500 text-center">
                      Select Organization, Client, and Account to trade
                    </p>
                  )}

                  {/* Strategy Link */}
                  <div className="pt-2 border-t border-border space-y-2">
                    <label className="text-xs text-muted-foreground">
                      Link to Strategy
                    </label>
                    <Select
                      value={linkedStrategyId ?? "manual"}
                      onValueChange={(v) =>
                        setLinkedStrategyId(v === "manual" ? null : v)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs mt-1">
                        <SelectValue placeholder="Manual trade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual trade</SelectItem>
                        {STRATEGIES.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            <div className="flex items-center gap-1.5">
                              <span>{s.name}</span>
                              <Badge
                                variant="outline"
                                className="text-[8px] px-1 py-0 h-3.5"
                              >
                                {s.assetClass}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Constraint badges when strategy linked */}
                    {linkedStrategy && (
                      <div className="space-y-2">
                        {/* Quick constraint badges */}
                        <div className="flex flex-wrap gap-1">
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 py-0"
                          >
                            <Target className="size-2.5 mr-0.5" />
                            {linkedStrategy.archetype.replace(/_/g, " ")}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 py-0"
                          >
                            <Zap className="size-2.5 mr-0.5" />
                            {linkedStrategy.executionMode}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 py-0"
                          >
                            Max {linkedStrategy.riskProfile.maxLeverage}{" "}
                            leverage
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 py-0"
                          >
                            DD {linkedStrategy.riskProfile.maxDrawdown}
                          </Badge>
                          {linkedStrategy.venues.length > 0 && (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5 py-0"
                            >
                              {linkedStrategy.venues.length} venue
                              {linkedStrategy.venues.length > 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>

                        {/* Inline warnings */}
                        {strategyWarnings.map((w, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-1.5 text-[10px] text-amber-400"
                          >
                            <AlertTriangle className="size-3 shrink-0 mt-0.5" />
                            <span>{w}</span>
                          </div>
                        ))}

                        {/* Risk subscriptions panel */}
                        {linkedStrategy.riskSubscriptions.length > 0 && (
                          <div className="p-2 rounded-md border bg-muted/20">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <Shield className="size-3" />
                              Risk Subscriptions
                            </p>
                            <div className="space-y-1">
                              {linkedStrategy.riskSubscriptions.map((rs, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between text-[10px]"
                                >
                                  <span
                                    className={cn(
                                      "font-medium",
                                      rs.subscribed
                                        ? "text-emerald-400"
                                        : "text-muted-foreground",
                                    )}
                                  >
                                    {rs.riskType}
                                  </span>
                                  {rs.threshold && (
                                    <span className="text-muted-foreground font-mono">
                                      {rs.threshold}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Collapsible strategy constraints detail */}
                        <Collapsible
                          open={constraintsOpen}
                          onOpenChange={setConstraintsOpen}
                        >
                          <CollapsibleTrigger className="flex items-center gap-1.5 w-full text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                            {constraintsOpen ? (
                              <ChevronDown className="size-3" />
                            ) : (
                              <ChevronRight className="size-3" />
                            )}
                            <span className="uppercase tracking-wider">
                              Strategy Constraints
                            </span>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="mt-1.5 p-2 rounded-md border bg-muted/10 space-y-2 text-[10px]">
                              {/* Archetype & Execution */}
                              <div className="grid grid-cols-2 gap-1">
                                <span className="text-muted-foreground">
                                  Archetype
                                </span>
                                <span className="font-mono text-right">
                                  {linkedStrategy.archetype.replace(/_/g, " ")}
                                </span>
                                <span className="text-muted-foreground">
                                  Execution Mode
                                </span>
                                <span className="font-mono text-right">
                                  {linkedStrategy.executionMode}
                                </span>
                                <span className="text-muted-foreground">
                                  Status
                                </span>
                                <span
                                  className={cn(
                                    "font-mono text-right",
                                    linkedStrategy.status === "live"
                                      ? "text-emerald-400"
                                      : linkedStrategy.status === "paused"
                                        ? "text-amber-400"
                                        : "text-muted-foreground",
                                  )}
                                >
                                  {linkedStrategy.status}
                                </span>
                              </div>
                              {/* Latency Profile */}
                              <div className="border-t pt-1.5">
                                <p className="text-muted-foreground mb-1">
                                  Latency Profile
                                </p>
                                <div className="grid grid-cols-2 gap-0.5">
                                  <span className="text-muted-foreground">
                                    Data-to-Signal
                                  </span>
                                  <span className="font-mono text-right">
                                    {linkedStrategy.latencyProfile.dataToSignal}
                                  </span>
                                  <span className="text-muted-foreground">
                                    Signal-to-Instruction
                                  </span>
                                  <span className="font-mono text-right">
                                    {
                                      linkedStrategy.latencyProfile
                                        .signalToInstruction
                                    }
                                  </span>
                                  <span className="text-muted-foreground">
                                    End-to-End
                                  </span>
                                  <span className="font-mono text-right">
                                    {linkedStrategy.latencyProfile.endToEnd}
                                  </span>
                                </div>
                              </div>
                              {/* Risk Limits */}
                              <div className="border-t pt-1.5">
                                <p className="text-muted-foreground mb-1">
                                  Risk Limits
                                </p>
                                <div className="grid grid-cols-2 gap-0.5">
                                  <span className="text-muted-foreground">
                                    Target Return
                                  </span>
                                  <span className="font-mono text-right">
                                    {linkedStrategy.riskProfile.targetReturn}
                                  </span>
                                  <span className="text-muted-foreground">
                                    Target Sharpe
                                  </span>
                                  <span className="font-mono text-right">
                                    {linkedStrategy.riskProfile.targetSharpe}
                                  </span>
                                  <span className="text-muted-foreground">
                                    Max Drawdown
                                  </span>
                                  <span className="font-mono text-right">
                                    {linkedStrategy.riskProfile.maxDrawdown}
                                  </span>
                                  <span className="text-muted-foreground">
                                    Max Leverage
                                  </span>
                                  <span className="font-mono text-right">
                                    {linkedStrategy.riskProfile.maxLeverage}
                                  </span>
                                  <span className="text-muted-foreground">
                                    Capital Scalability
                                  </span>
                                  <span className="font-mono text-right">
                                    {
                                      linkedStrategy.riskProfile
                                        .capitalScalability
                                    }
                                  </span>
                                </div>
                              </div>
                              {/* Venues */}
                              <div className="border-t pt-1.5">
                                <p className="text-muted-foreground mb-1">
                                  Allowed Venues
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {linkedStrategy.venues.map((v) => (
                                    <Badge
                                      key={v}
                                      variant="secondary"
                                      className="text-[8px] px-1 py-0"
                                    >
                                      {v}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              {/* Allowed Order Types */}
                              <div className="border-t pt-1.5">
                                <p className="text-muted-foreground mb-1">
                                  Instruction Types
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {linkedStrategy.instructionTypes.map((t) => (
                                    <Badge
                                      key={t}
                                      variant="outline"
                                      className="text-[8px] px-1 py-0"
                                    >
                                      {t}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* Calendar Event Feed — collapsible bottom panel */}
        <div className="px-4 pb-4 mt-2">
          <CalendarEventFeed />
        </div>
      </main>
    </div>
  );
}
