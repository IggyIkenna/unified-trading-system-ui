"use client";

import * as React from "react";
import { useExecutionMode } from "@/lib/execution-mode-context";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { getStrategyIdsForScope } from "@/lib/stores/scope-helpers";
import { useToast } from "@/hooks/use-toast";
import { placeMockOrder } from "@/lib/api/mock-trade-ledger";
import type { FilterDefinition } from "@/components/platform/filter-bar";
import type {
  PredictionMarket,
  MarketCategory,
  MarketVenue,
  SortOption,
  PredictionPosition,
  OdumInstrument,
  OdumInstrumentType,
  Timeframe,
  PredictionArbOpportunity,
  PredictionArbMarketType,
  PredictionQuickTradeParams,
} from "@/components/trading/predictions/types";
import {
  MOCK_MARKETS,
  MOCK_POSITIONS,
  MOCK_PREDICTION_ARBS,
  ODUM_INSTRUMENTS,
  MOCK_RECENT_FILLS,
} from "@/lib/mocks/fixtures/predictions-data";
import { calcArbStakes } from "@/components/trading/predictions/helpers";
import { mock01 } from "@/lib/mocks/generators/deterministic";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

export interface RecentFill {
  id: string;
  marketQuestion: string;
  venue: MarketVenue;
  side: "yes" | "no";
  shares: number;
  pricePerShare: number;
  total: number;
  filledAt: string;
}

export type TradeParams = PredictionQuickTradeParams;

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "highest_volume", label: "Highest Volume" },
  { value: "closing_soon", label: "Closing Soon" },
];

const CATEGORY_OPTIONS: { value: MarketCategory; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "breaking", label: "Breaking" },
  { value: "sports", label: "Sports" },
  { value: "crypto", label: "Crypto" },
  { value: "finance", label: "Finance" },
  { value: "geopolitics", label: "Geopolitics" },
  { value: "elections", label: "Elections" },
];

export interface PredictionsDataContextValue {
  markets: PredictionMarket[];
  filteredMarkets: PredictionMarket[];
  activeCategory: MarketCategory;
  setActiveCategory: (c: MarketCategory) => void;
  venueFilter: "all" | MarketVenue;
  setVenueFilter: (v: "all" | MarketVenue) => void;
  sortBy: SortOption;
  setSortBy: (s: SortOption) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedMarket: PredictionMarket | null;
  setSelectedMarketId: (id: string | null) => void;

  openPositions: PredictionPosition[];
  settledPositions: PredictionPosition[];
  portfolioKpis: {
    totalStaked: number;
    totalUnrealisedPnl: number;
    totalRealisedPnl: number;
    winRate: number;
    winCount: number;
  };

  odumInstruments: OdumInstrument[];
  odumTypeFilter: OdumInstrumentType | "all";
  setOdumTypeFilter: (f: OdumInstrumentType | "all") => void;
  odumTfFilter: Timeframe | "all";
  setOdumTfFilter: (f: Timeframe | "all") => void;

  activeArbs: PredictionArbOpportunity[];
  closedArbs: PredictionArbOpportunity[];
  arbNewIds: Set<string>;
  arbThreshold: number;
  setArbThreshold: (t: number) => void;
  arbMarketTypeFilter: PredictionArbMarketType | "all";
  setArbMarketTypeFilter: (f: PredictionArbMarketType | "all") => void;

  recentFills: RecentFill[];
  quickTradeMarketId: string;
  setQuickTradeMarketId: (id: string) => void;

  placeTrade: (params: TradeParams) => void;
  executeArb: (arbId: string) => void;

  marketsFilterDefs: FilterDefinition[];
  marketsFilterValues: Record<string, unknown>;
  handleMarketsFilterChange: (key: string, value: unknown) => void;
  resetMarketsFilters: () => void;
  mode?: string;
}

const PredictionsDataContext = React.createContext<PredictionsDataContextValue | null>(null);

function computeFilteredMarkets(
  markets: PredictionMarket[],
  activeCategory: MarketCategory,
  venueFilter: "all" | MarketVenue,
  searchQuery: string,
  sortBy: SortOption,
): PredictionMarket[] {
  let result = [...markets];

  if (activeCategory === "trending") {
    result = result.filter((m) => m.isTrending);
  } else if (activeCategory === "breaking") {
    result = result.filter((m) => m.isLive || m.isTrending);
  } else {
    result = result.filter((m) => m.category === activeCategory);
  }

  if (venueFilter !== "all") {
    result = result.filter((m) => m.venue === venueFilter);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter(
      (m) => m.question.toLowerCase().includes(q) || m.outcomes.some((o) => o.name.toLowerCase().includes(q)),
    );
  }

  switch (sortBy) {
    case "trending":
      result.sort((a, b) => (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0) || b.volume - a.volume);
      break;
    case "newest":
      result.sort((a, b) => (b.resolutionDate ?? "").localeCompare(a.resolutionDate ?? ""));
      break;
    case "highest_volume":
      result.sort((a, b) => b.volume - a.volume);
      break;
    case "closing_soon":
      result.sort((a, b) => (a.resolutionDate ?? "9999").localeCompare(b.resolutionDate ?? "9999"));
      break;
  }
  return result;
}

export function PredictionsDataProvider({ children }: { children: React.ReactNode }) {
  const { isPaper, isBatch, mode } = useExecutionMode();
  const { scope: globalScope } = useGlobalScope();
  const scopeStrategyIds = React.useMemo(
    () =>
      getStrategyIdsForScope({
        organizationIds: globalScope.organizationIds,
        clientIds: globalScope.clientIds,
        strategyIds: globalScope.strategyIds,
      }),
    [globalScope.organizationIds, globalScope.clientIds, globalScope.strategyIds],
  );
  const { toast } = useToast();

  const markets = MOCK_MARKETS;

  const [activeCategory, setActiveCategory] = React.useState<MarketCategory>("trending");
  const [venueFilter, setVenueFilter] = React.useState<"all" | MarketVenue>("all");
  const [sortBy, setSortBy] = React.useState<SortOption>("trending");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedMarketId, setSelectedMarketId] = React.useState<string | null>(null);

  const [odumTypeFilter, setOdumTypeFilter] = React.useState<OdumInstrumentType | "all">("all");
  const [odumTfFilter, setOdumTfFilter] = React.useState<Timeframe | "all">("all");

  const [arbs, setArbs] = React.useState<PredictionArbOpportunity[]>(() => [...MOCK_PREDICTION_ARBS]);
  const [arbNewIds, setArbNewIds] = React.useState<Set<string>>(() => new Set());
  const [arbThreshold, setArbThreshold] = React.useState(1.5);
  const [arbMarketTypeFilter, setArbMarketTypeFilter] = React.useState<PredictionArbMarketType | "all">("all");

  const [recentFills, setRecentFills] = React.useState<RecentFill[]>(() => MOCK_RECENT_FILLS.map((f) => ({ ...f })));
  const [quickTradeMarketId, setQuickTradeMarketId] = React.useState(() => MOCK_MARKETS[0]?.id ?? "");

  const arbStreamTickRef = React.useRef(0);

  // Batch mode: stop the 8-second arb generation interval
  React.useEffect(() => {
    if (isBatch) return;
    const timer = setInterval(() => {
      arbStreamTickRef.current += 1;
      const t = arbStreamTickRef.current;
      setArbs((prev) => {
        const updated = prev.map((a) =>
          a.isActive && mock01(t, 501) < 0.1 ? { ...a, isActive: false, decayedAt: new Date().toISOString() } : a,
        );
        if (mock01(t, 502) < 0.15) {
          const newArb: PredictionArbOpportunity = {
            id: `parb-live-${Date.now()}`,
            marketType: "crypto",
            question: "ETH > $3,400 in 24h",
            outcome: "YES",
            legs: [
              { venue: "polymarket", odds: 100 / 33, oddsDisplay: "33¢", suggestedStake: 3_300 },
              { venue: "kalshi", odds: 100 / 28, oddsDisplay: "28¢", suggestedStake: 2_800 },
            ],
            arbPct: 2.4,
            detectedAt: new Date().toISOString(),
            isActive: true,
          };
          setArbNewIds((ids) => new Set([...ids, newArb.id]));
          setTimeout(() => {
            setArbNewIds((ids) => {
              const next = new Set(ids);
              next.delete(newArb.id);
              return next;
            });
          }, 5000);
          return [...updated, newArb];
        }
        return updated;
      });
    }, 8000);
    return () => clearInterval(timer);
  }, [isBatch]);

  const filteredMarkets = React.useMemo(
    () => computeFilteredMarkets(markets, activeCategory, venueFilter, searchQuery, sortBy),
    [markets, activeCategory, venueFilter, searchQuery, sortBy],
  );

  const selectedMarket = React.useMemo(
    () => (selectedMarketId ? (markets.find((m) => m.id === selectedMarketId) ?? null) : null),
    [markets, selectedMarketId],
  );

  // Paper mode: tag all positions as simulated
  // Org scope: reduce positions when a specific org is selected (deterministic subset)
  const openPositions = React.useMemo(() => {
    let open = MOCK_POSITIONS.filter((p) => p.status === "open");
    if (scopeStrategyIds.length > 0) {
      // Show a deterministic subset based on the number of scoped strategies
      open = open.filter((_, i) => i < Math.max(1, Math.ceil(open.length * (scopeStrategyIds.length / 50))));
    }
    if (isPaper) return open.map((p) => ({ ...p, label: "simulated" as const }));
    return open;
  }, [isPaper, scopeStrategyIds]);
  const settledPositions = React.useMemo(() => {
    let settled = MOCK_POSITIONS.filter((p) => p.status === "settled");
    if (scopeStrategyIds.length > 0) {
      settled = settled.filter((_, i) => i < Math.max(1, Math.ceil(settled.length * (scopeStrategyIds.length / 50))));
    }
    if (isPaper) return settled.map((p) => ({ ...p, label: "simulated" as const }));
    return settled;
  }, [isPaper, scopeStrategyIds]);

  const portfolioKpis = React.useMemo(() => {
    const totalStaked = openPositions.reduce((s, p) => s + p.totalStaked, 0);
    const totalUnrealisedPnl = openPositions.reduce((s, p) => s + p.unrealisedPnl, 0);
    const totalRealisedPnl = settledPositions.reduce((s, p) => s + (p.realisedPnl ?? 0), 0);
    const winCount = settledPositions.filter((p) => p.settlementOutcome === "won").length;
    const winRate = settledPositions.length > 0 ? (winCount / settledPositions.length) * 100 : 0;
    return { totalStaked, totalUnrealisedPnl, totalRealisedPnl, winRate, winCount };
  }, [openPositions, settledPositions]);

  const arbsAboveThreshold = React.useMemo(() => arbs.filter((a) => a.arbPct >= arbThreshold), [arbs, arbThreshold]);

  const activeArbs = React.useMemo(
    () =>
      arbsAboveThreshold
        .filter((a) => a.isActive && (arbMarketTypeFilter === "all" || a.marketType === arbMarketTypeFilter))
        .sort((a, b) => b.arbPct - a.arbPct),
    [arbsAboveThreshold, arbMarketTypeFilter],
  );

  const closedArbs = React.useMemo(
    () =>
      arbsAboveThreshold.filter(
        (a) => !a.isActive && (arbMarketTypeFilter === "all" || a.marketType === arbMarketTypeFilter),
      ),
    [arbsAboveThreshold, arbMarketTypeFilter],
  );

  const marketsFilterDefs = React.useMemo<FilterDefinition[]>(
    () => [
      {
        key: "category",
        label: "Category",
        type: "select",
        options: CATEGORY_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
      },
      {
        key: "venue",
        label: "Venue",
        type: "select",
        options: [
          { value: "__all__", label: "All Venues" },
          { value: "polymarket", label: "Polymarket" },
          { value: "kalshi", label: "Kalshi" },
        ],
      },
      {
        key: "sort",
        label: "Sort",
        type: "select",
        options: SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
      },
      { key: "search", label: "Search", type: "search", placeholder: "Search markets..." },
    ],
    [],
  );

  const marketsFilterValues = React.useMemo(
    () => ({
      category: activeCategory,
      venue: venueFilter === "all" ? "__all__" : venueFilter,
      sort: sortBy,
      search: searchQuery || undefined,
    }),
    [activeCategory, venueFilter, sortBy, searchQuery],
  );

  const handleMarketsFilterChange = React.useCallback((key: string, value: unknown) => {
    switch (key) {
      case "category":
        setActiveCategory((value as MarketCategory) || "trending");
        break;
      case "venue": {
        const v = String(value ?? "");
        setVenueFilter(v === "polymarket" || v === "kalshi" ? (v as MarketVenue) : "all");
        break;
      }
      case "sort":
        setSortBy((value as SortOption) || "trending");
        break;
      case "search":
        setSearchQuery(String(value ?? ""));
        break;
      default:
        break;
    }
  }, []);

  const resetMarketsFilters = React.useCallback(() => {
    setActiveCategory("trending");
    setVenueFilter("all");
    setSortBy("trending");
    setSearchQuery("");
  }, []);

  const placeTrade = React.useCallback(
    (params: TradeParams) => {
      const market = markets.find((m) => m.id === params.marketId);
      if (!market) return;
      const outcome = market.outcomes[params.outcomeIndex] ?? market.outcomes[0];
      const price = params.side === "yes" ? outcome.yesPrice : outcome.noPrice;
      const stake = params.stakeUsd;
      if (stake <= 0) return;
      const order = placeMockOrder({
        client_id: "internal-trader",
        instrument_id: `${market.venue.toUpperCase()}:${market.id}:${outcome.name}@${params.side.toUpperCase()}`,
        venue: market.venue === "polymarket" ? "Polymarket" : "Kalshi",
        side: "buy",
        order_type: "limit",
        quantity: stake,
        price,
        asset_class: "Prediction",
        lane: "predictions",
      });
      const shares = stake / price;
      const fill: RecentFill = {
        id: `fill-${order.id}`,
        marketQuestion: market.question,
        venue: market.venue,
        side: params.side,
        shares: Math.round(shares),
        pricePerShare: Math.round(price * 100),
        total: stake,
        filledAt: new Date().toISOString(),
      };
      setRecentFills((prev) => [fill, ...prev]);
      toast({
        title: "Position opened",
        description: `${params.side.toUpperCase()} ${outcome.name} — $${formatNumber(stake, 2)} @ ${formatNumber(price * 100, 0)}¢ (${order.id})`,
      });
    },
    [markets, toast],
  );

  const executeArb = React.useCallback(
    (arbId: string) => {
      const arb = arbs.find((a) => a.id === arbId);
      if (!arb || !arb.isActive) return;
      const totalStake = 10_000;
      const [s1, s2] = calcArbStakes(arb.legs[0].odds, arb.legs[1].odds, totalStake);
      arb.legs.forEach((leg, i) => {
        placeMockOrder({
          client_id: "internal-trader",
          instrument_id: `ARB:${arb.id}:LEG${i + 1}`,
          venue: String(leg.venue),
          side: "buy",
          order_type: "limit",
          quantity: i === 0 ? s1 : s2,
          price: leg.odds,
          asset_class: "Prediction",
          lane: "predictions",
        });
      });
      setArbs((prev) =>
        prev.map((a) => (a.id === arbId ? { ...a, isActive: false, decayedAt: new Date().toISOString() } : a)),
      );
      toast({
        title: "Arb executed",
        description: `${arb.question} — ${formatPercent(arb.arbPct, 2)} locked in`,
      });
    },
    [arbs, toast],
  );

  const value: PredictionsDataContextValue = React.useMemo(
    () => ({
      markets,
      filteredMarkets,
      activeCategory,
      setActiveCategory,
      venueFilter,
      setVenueFilter,
      sortBy,
      setSortBy,
      searchQuery,
      setSearchQuery,
      selectedMarket,
      setSelectedMarketId,
      openPositions,
      settledPositions,
      portfolioKpis,
      odumInstruments: ODUM_INSTRUMENTS,
      odumTypeFilter,
      setOdumTypeFilter,
      odumTfFilter,
      setOdumTfFilter,
      activeArbs,
      closedArbs,
      arbNewIds,
      arbThreshold,
      setArbThreshold,
      arbMarketTypeFilter,
      setArbMarketTypeFilter,
      recentFills,
      quickTradeMarketId,
      setQuickTradeMarketId,
      placeTrade,
      executeArb,
      marketsFilterDefs,
      marketsFilterValues,
      handleMarketsFilterChange,
      resetMarketsFilters,
      mode,
    }),
    [
      markets,
      filteredMarkets,
      activeCategory,
      venueFilter,
      sortBy,
      searchQuery,
      selectedMarket,
      openPositions,
      settledPositions,
      portfolioKpis,
      odumTypeFilter,
      odumTfFilter,
      activeArbs,
      closedArbs,
      arbNewIds,
      arbThreshold,
      arbMarketTypeFilter,
      recentFills,
      quickTradeMarketId,
      placeTrade,
      executeArb,
      marketsFilterDefs,
      marketsFilterValues,
      handleMarketsFilterChange,
      resetMarketsFilters,
      isPaper,
      isBatch,
      mode,
    ],
  );

  return <PredictionsDataContext.Provider value={value}>{children}</PredictionsDataContext.Provider>;
}

export function usePredictionsData(): PredictionsDataContextValue {
  const ctx = React.useContext(PredictionsDataContext);
  if (!ctx) throw new Error("usePredictionsData must be used within PredictionsDataProvider");
  return ctx;
}
