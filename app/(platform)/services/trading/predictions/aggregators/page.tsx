"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/platform/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExecutionModeIndicator } from "@/components/trading/execution-mode-toggle";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Search, Plus, Trash2, AlertTriangle, BarChart3, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber, formatPercent, formatPnl } from "@/lib/utils/formatters";

// ── Types ────────────────────────────────────────────────────────────────────

interface PredictionMarket {
  id: string;
  question: string;
  category: string;
  source: string;
  probabilityYes: number;
  volume24h: number;
  liquidity: number;
  expiresAt: string;
}

interface AggregatorEntry {
  marketId: string;
  market: PredictionMarket;
  position: "yes" | "no";
  costPerShare: number;
}

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_MARKETS: PredictionMarket[] = [
  {
    id: "mkt-001",
    question: "Will BTC exceed $150,000 by June 2026?",
    category: "Crypto",
    source: "Polymarket",
    probabilityYes: 0.34,
    volume24h: 2_840_000,
    liquidity: 8_200_000,
    expiresAt: "2026-06-30",
  },
  {
    id: "mkt-002",
    question: "Will ETH flip BTC in market cap by 2027?",
    category: "Crypto",
    source: "Polymarket",
    probabilityYes: 0.08,
    volume24h: 1_120_000,
    liquidity: 4_500_000,
    expiresAt: "2027-12-31",
  },
  {
    id: "mkt-003",
    question: "Will the Fed cut rates below 3% by December 2026?",
    category: "Macro",
    source: "Kalshi",
    probabilityYes: 0.42,
    volume24h: 5_600_000,
    liquidity: 12_000_000,
    expiresAt: "2026-12-31",
  },
  {
    id: "mkt-004",
    question: "Will Arsenal win the 2025/26 Premier League?",
    category: "Sports",
    source: "Polymarket",
    probabilityYes: 0.28,
    volume24h: 890_000,
    liquidity: 3_200_000,
    expiresAt: "2026-05-25",
  },
  {
    id: "mkt-005",
    question: "Will SOL reach $500 by Q2 2026?",
    category: "Crypto",
    source: "Polymarket",
    probabilityYes: 0.18,
    volume24h: 1_560_000,
    liquidity: 5_100_000,
    expiresAt: "2026-06-30",
  },
  {
    id: "mkt-006",
    question: "Will EU impose crypto capital gains harmonization by 2027?",
    category: "Regulation",
    source: "Kalshi",
    probabilityYes: 0.55,
    volume24h: 340_000,
    liquidity: 1_800_000,
    expiresAt: "2027-01-01",
  },
  {
    id: "mkt-007",
    question: "Will a major bank launch a stablecoin in 2026?",
    category: "Crypto",
    source: "Polymarket",
    probabilityYes: 0.67,
    volume24h: 2_100_000,
    liquidity: 6_400_000,
    expiresAt: "2026-12-31",
  },
  {
    id: "mkt-008",
    question: "Will Real Madrid win Champions League 2025/26?",
    category: "Sports",
    source: "Polymarket",
    probabilityYes: 0.22,
    volume24h: 1_230_000,
    liquidity: 4_100_000,
    expiresAt: "2026-05-31",
  },
  {
    id: "mkt-009",
    question: "Will US approve a spot ETH ETF with staking by 2026?",
    category: "Regulation",
    source: "Kalshi",
    probabilityYes: 0.61,
    volume24h: 3_400_000,
    liquidity: 9_800_000,
    expiresAt: "2026-12-31",
  },
  {
    id: "mkt-010",
    question: "Will global AI regulation treaty be signed by 2027?",
    category: "Politics",
    source: "Metaculus",
    probabilityYes: 0.15,
    volume24h: 180_000,
    liquidity: 950_000,
    expiresAt: "2027-12-31",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Crypto: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  Macro: "text-sky-400 bg-sky-400/10 border-sky-400/30",
  Sports: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  Regulation: "text-violet-400 bg-violet-400/10 border-violet-400/30",
  Politics: "text-rose-400 bg-rose-400/10 border-rose-400/30",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtVolume = (v: number): string => {
  if (v >= 1_000_000) return `$${formatNumber(v / 1_000_000, 1)}M`;
  if (v >= 1_000) return `$${formatNumber(v / 1_000, 0)}K`;
  return formatCurrency(v, "USD", 0);
};

const fmtPct = (p: number): string => formatPercent(p * 100, 1);

// ── Component ────────────────────────────────────────────────────────────────

export default function AggregatorBuilderPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [entries, setEntries] = useState<AggregatorEntry[]>([]);

  const filteredMarkets = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_MARKETS;
    const q = searchQuery.toLowerCase();
    return MOCK_MARKETS.filter(
      (m) =>
        m.question.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.source.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const selectedMarketIds = new Set(entries.map((e) => e.marketId));

  const addMarket = (market: PredictionMarket) => {
    if (selectedMarketIds.has(market.id)) return;
    setEntries((prev) => [
      ...prev,
      {
        marketId: market.id,
        market,
        position: "yes",
        costPerShare: market.probabilityYes,
      },
    ]);
  };

  const removeEntry = (marketId: string) => {
    setEntries((prev) => prev.filter((e) => e.marketId !== marketId));
  };

  const togglePosition = (marketId: string) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.marketId !== marketId) return e;
        const newPos = e.position === "yes" ? "no" : "yes";
        return {
          ...e,
          position: newPos,
          costPerShare: newPos === "yes" ? e.market.probabilityYes : 1 - e.market.probabilityYes,
        };
      }),
    );
  };

  // ── Aggregator calculations ────────────────────────────────────────────

  const totalCost = useMemo(() => {
    return entries.reduce((acc, e) => acc + e.costPerShare, 0);
  }, [entries]);

  const combinedProbability = useMemo(() => {
    if (entries.length === 0) return 0;
    return entries.reduce((acc, e) => {
      const p = e.position === "yes" ? e.market.probabilityYes : 1 - e.market.probabilityYes;
      return acc * p;
    }, 1);
  }, [entries]);

  const expectedValue = useMemo(() => {
    if (entries.length === 0) return 0;
    // If all positions win: each share pays $1. Total payout = entries.length.
    // EV = prob(all win) * payout - cost
    const payout = entries.length;
    return combinedProbability * payout - totalCost;
  }, [entries, combinedProbability, totalCost]);

  // Correlation warning: if 2+ markets share a category, they may be correlated
  const hasCorrelationRisk = useMemo(() => {
    const categories = entries.map((e) => e.market.category);
    return categories.length !== new Set(categories).size;
  }, [entries]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-4 py-3 bg-background/95">
        <PageHeader
          title={
            <span className="flex flex-wrap items-center gap-2">
              <TrendingUp className="size-5 text-violet-400" />
              Aggregator Builder
              <ExecutionModeIndicator />
            </span>
          }
          description="Combine positions across prediction markets for correlated exposure"
        >
          <Badge variant="outline" className="text-[10px]">
            {entries.length} market{entries.length !== 1 ? "s" : ""} selected
          </Badge>
        </PageHeader>
      </div>

      {/* Main content: two-panel layout */}
      <div className="flex-1 overflow-hidden flex min-h-0">
        {/* Left: market search */}
        <div className="flex-1 border-r border-border flex flex-col min-w-0">
          <div className="px-4 py-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search markets by question, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredMarkets.map((market) => {
              const alreadySelected = selectedMarketIds.has(market.id);
              const catColor = CATEGORY_COLORS[market.category] ?? "";

              return (
                <Card
                  key={market.id}
                  className={cn(
                    "transition-colors cursor-pointer hover:border-primary/40",
                    alreadySelected && "opacity-50 border-primary/30",
                  )}
                  onClick={() => !alreadySelected && addMarket(market)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", catColor)}>
                          {market.category}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {market.source}
                        </Badge>
                      </div>
                      {alreadySelected ? (
                        <Badge variant="success" className="text-[10px] shrink-0">
                          Added
                        </Badge>
                      ) : (
                        <button
                          className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                          title="Add to aggregator"
                          onClick={(e) => {
                            e.stopPropagation();
                            addMarket(market);
                          }}
                        >
                          <Plus className="size-4" />
                        </button>
                      )}
                    </div>

                    <p className="text-sm font-medium leading-snug mb-2">{market.question}</p>

                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span>Prob:</span>
                        <span className="font-mono font-semibold text-foreground">{fmtPct(market.probabilityYes)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Vol 24h:</span>
                        <span className="font-mono">{fmtVolume(market.volume24h)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Liquidity:</span>
                        <span className="font-mono">{fmtVolume(market.liquidity)}</span>
                      </div>
                    </div>

                    {/* Probability bar */}
                    <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${market.probabilityYes * 100}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredMarkets.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-12">No markets match your search</div>
            )}
          </div>
        </div>

        {/* Right: aggregator composition */}
        <div className="w-[380px] shrink-0 flex flex-col bg-card/20">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Aggregator Composition</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {entries.length === 0
                ? "Click markets to add positions"
                : `${entries.length} position${entries.length !== 1 ? "s" : ""} in basket`}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {entries.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8 space-y-2">
                <Zap className="size-8 mx-auto opacity-30" />
                <p>No positions yet</p>
                <p className="text-[10px]">Click on prediction markets to add them to your aggregator</p>
              </div>
            )}

            {entries.map((entry) => (
              <div key={entry.marketId} className="p-3 rounded-md border border-border bg-card/50 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-snug line-clamp-2">{entry.market.question}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] px-1 py-0", CATEGORY_COLORS[entry.market.category] ?? "")}
                      >
                        {entry.market.category}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{entry.market.source}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeEntry(entry.marketId)}
                    className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    title="Remove"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                {/* Position toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Position:</span>
                  <div className="flex items-center border border-border rounded-md overflow-hidden">
                    <button
                      onClick={() => entry.position !== "yes" && togglePosition(entry.marketId)}
                      className={cn(
                        "px-2.5 py-0.5 text-[10px] font-medium transition-colors",
                        entry.position === "yes"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                      )}
                    >
                      Yes
                    </button>
                    <div className="w-px h-4 bg-border" />
                    <button
                      onClick={() => entry.position !== "no" && togglePosition(entry.marketId)}
                      className={cn(
                        "px-2.5 py-0.5 text-[10px] font-medium transition-colors",
                        entry.position === "no"
                          ? "bg-rose-500/15 text-rose-400"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                      )}
                    >
                      No
                    </button>
                  </div>
                  <span className="text-xs font-mono ml-auto">
                    {fmtPct(entry.position === "yes" ? entry.market.probabilityYes : 1 - entry.market.probabilityYes)}
                  </span>
                </div>

                {/* Cost */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Cost per share</span>
                  <span className="font-mono">{formatCurrency(entry.costPerShare, "USD", 2)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="border-t border-border p-4 space-y-3 bg-card/40">
            {entries.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Combined Probability</span>
                  <span className="font-mono font-semibold">{fmtPct(combinedProbability)}</span>
                </div>

                {hasCorrelationRisk && (
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-400/10 rounded-md px-2 py-1.5">
                    <AlertTriangle className="size-3 shrink-0" />
                    Markets in the same category may be correlated. Combined probability assumes independence.
                  </div>
                )}

                <div className="h-px bg-border" />

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Total Cost</span>
                  <span className="font-mono font-semibold">{formatCurrency(totalCost, "USD", 2)}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Expected Value</span>
                  <span
                    className={cn("font-mono font-semibold", expectedValue >= 0 ? "text-emerald-400" : "text-rose-400")}
                  >
                    {formatPnl(expectedValue, "USD", 2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Max Payout</span>
                  <span className="font-mono font-semibold text-emerald-400">{formatNumber(entries.length, 2)}</span>
                </div>
              </div>
            )}

            <Button className="w-full" disabled={entries.length === 0}>
              <Zap className="size-4" />
              Execute Aggregator
            </Button>

            {entries.length > 0 && (
              <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                <BarChart3 className="size-3 shrink-0 mt-0.5" />
                <span>
                  Each position costs its implied probability. All positions settle independently at $1 (win) or $0
                  (lose).
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
