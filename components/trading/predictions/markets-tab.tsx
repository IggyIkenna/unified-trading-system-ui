"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Search,
  Bookmark,
  Share2,
  ExternalLink,
  Flame,
  X,
  ChevronRight,
  Clock,
  BarChart3,
  ArrowLeft,
  TrendingUp,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { placeMockOrder } from "@/lib/api/mock-trade-ledger";
import { useToast } from "@/hooks/use-toast";
import type { PredictionMarket, MarketCategory, MarketVenue, SortOption } from "./types";
import { MOCK_MARKETS } from "./mock-data";
import { fmtVolume, probColour } from "./helpers";
import { VenueChip, LiveDot, ProbBadge, YesNoButtons } from "./shared";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { value: MarketCategory; label: string; icon?: "fire" }[] = [
  { value: "trending", label: "Trending", icon: "fire" },
  { value: "breaking", label: "Breaking" },
  { value: "sports", label: "Sports" },
  { value: "crypto", label: "Crypto" },
  { value: "finance", label: "Finance" },
  { value: "geopolitics", label: "Geopolitics" },
  { value: "elections", label: "Elections" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "highest_volume", label: "Highest Volume" },
  { value: "closing_soon", label: "Closing Soon" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryPills({ active, onSelect }: { active: MarketCategory; onSelect: (c: MarketCategory) => void }) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-2">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.value}
            variant={active === cat.value ? "default" : "outline"}
            size="sm"
            className="text-xs h-8 shrink-0 rounded-full"
            onClick={() => onSelect(cat.value)}
          >
            {cat.icon === "fire" && <Flame className="size-3 mr-1" />}
            {cat.label}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

function PriceHistoryChart({ series }: { series: { t: number; prob: number }[] }) {
  const colour = series.length > 1 && series[series.length - 1].prob > series[0].prob ? "#4ade80" : "#f87171";

  return (
    <div className="h-28 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="oddsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colour} stopOpacity={0.3} />
              <stop offset="95%" stopColor={colour} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="prob"
            stroke={colour}
            strokeWidth={1.5}
            fill="url(#oddsGrad)"
            dot={false}
            isAnimationActive={false}
          />
          <Tooltip
            contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 6, fontSize: 11 }}
            formatter={(v: number) => [`${v.toFixed(1)}%`, "Probability"]}
            labelFormatter={() => ""}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function BinaryMarketCard({ market, onSelect }: { market: PredictionMarket; onSelect: (id: string) => void }) {
  const outcome = market.outcomes[0];
  return (
    <Card
      className="bg-card hover:bg-muted/50 transition-colors cursor-pointer border-border/50 flex flex-col"
      onClick={() => onSelect(market.id)}
    >
      <CardHeader className="pb-2 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <VenueChip venue={market.venue} />
            {market.isLive && (
              <Badge variant="outline" className="text-[10px] border-red-500/40 text-red-400 flex items-center gap-1">
                <LiveDot />
                LIVE
              </Badge>
            )}
            {market.isTrending && (
              <Badge variant="outline" className="text-[10px] border-orange-500/40 text-orange-400">
                <TrendingUp className="size-2.5 mr-0.5" />
                Trending
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="size-7" onClick={(e) => e.stopPropagation()}>
              <Bookmark className="size-3.5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="size-7" onClick={(e) => e.stopPropagation()}>
              <Share2 className="size-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>
        <CardTitle className="text-sm font-semibold leading-snug line-clamp-2">{market.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 flex-1 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <ProbBadge probability={outcome.probability} />
          <YesNoButtons yesPrice={outcome.yesPrice} noPrice={outcome.noPrice} />
        </div>
        <Separator />
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <BarChart3 className="size-3" />
            {market.volumeLabel}
          </span>
          {market.resolutionDate && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {market.resolutionDate}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MultiOutcomeMarketCard({ market, onSelect }: { market: PredictionMarket; onSelect: (id: string) => void }) {
  return (
    <Card
      className="bg-card hover:bg-muted/50 transition-colors cursor-pointer border-border/50"
      onClick={() => onSelect(market.id)}
    >
      <CardHeader className="pb-2 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <VenueChip venue={market.venue} />
            {market.isLive && (
              <Badge variant="outline" className="text-[10px] border-red-500/40 text-red-400 flex items-center gap-1">
                <LiveDot />
                LIVE
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="size-7" onClick={(e) => e.stopPropagation()}>
              <Bookmark className="size-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>
        <CardTitle className="text-sm font-semibold leading-snug line-clamp-2">{market.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {market.outcomes.map((outcome) => {
          const barColour =
            outcome.probability >= 70
              ? "bg-emerald-500/30"
              : outcome.probability >= 40
                ? "bg-yellow-500/30"
                : "bg-red-500/30";
          return (
            <div key={outcome.name} className="relative">
              <div
                className={cn("absolute inset-0 rounded-md", barColour)}
                style={{ width: `${outcome.probability}%` }}
              />
              <div className="relative flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-medium truncate">{outcome.name}</span>
                  <span className={cn("text-xs font-bold tabular-nums", probColour(outcome.probability))}>
                    {outcome.probability}%
                  </span>
                </div>
                <YesNoButtons yesPrice={outcome.yesPrice} noPrice={outcome.noPrice} />
              </div>
            </div>
          );
        })}
        <Separator />
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <BarChart3 className="size-3" />
            {market.volumeLabel}
          </span>
          {market.resolutionDate && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {market.resolutionDate}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MarketDetailPanel({ market, onClose }: { market: PredictionMarket; onClose: () => void }) {
  const { toast } = useToast();
  const [stakeAmount, setStakeAmount] = React.useState("");
  const [selectedSide, setSelectedSide] = React.useState<"yes" | "no">("yes");
  const [selectedOutcomeIdx, setSelectedOutcomeIdx] = React.useState(0);

  const selectedOutcome = market.outcomes[selectedOutcomeIdx];
  const price = selectedSide === "yes" ? selectedOutcome.yesPrice : selectedOutcome.noPrice;
  const stakeNum = parseFloat(stakeAmount) || 0;
  const potentialReturn = stakeNum > 0 ? stakeNum / price : 0;
  const potentialProfit = potentialReturn - stakeNum;

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground h-7 -ml-2 mb-1"
              onClick={onClose}
            >
              <ArrowLeft className="size-3 mr-1" />
              Back to markets
            </Button>
            <div className="flex items-center gap-2 flex-wrap">
              <VenueChip venue={market.venue} />
              {market.isLive && (
                <Badge variant="outline" className="text-[10px] border-red-500/40 text-red-400 flex items-center gap-1">
                  <LiveDot />
                  LIVE
                </Badge>
              )}
            </div>
            <CardTitle className="text-base font-semibold leading-snug">{market.question}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price history chart */}
        {market.priceSeries && market.priceSeries.length > 1 ? (
          <div className="rounded-lg border border-border/50 bg-muted/10 p-3">
            <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">Price History</p>
            <PriceHistoryChart series={market.priceSeries} />
          </div>
        ) : (
          <div className="rounded-lg border border-border/50 bg-muted/30 p-6 flex items-center justify-center">
            <div className="text-center space-y-2">
              <TrendingUp className="size-8 text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground/60">Loading price history…</p>
            </div>
          </div>
        )}

        {/* Outcome selector for multi */}
        {market.type === "multi" && (
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Select outcome</label>
            <div className="grid gap-1.5">
              {market.outcomes.map((outcome, idx) => (
                <Button
                  key={outcome.name}
                  variant={selectedOutcomeIdx === idx ? "default" : "outline"}
                  size="sm"
                  className="justify-between text-xs h-9"
                  onClick={() => setSelectedOutcomeIdx(idx)}
                >
                  <span>{outcome.name}</span>
                  <span className="font-bold tabular-nums">{outcome.probability}%</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Order book summary */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Order book</label>
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/50 p-3">
            <div className="text-center space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">YES shares</p>
              <p className="text-lg font-bold text-emerald-400 tabular-nums">
                {(selectedOutcome.yesPrice * 100).toFixed(0)}¢
              </p>
              <p className="text-[10px] text-muted-foreground">
                {fmtVolume(market.volume * selectedOutcome.yesPrice)} matched
              </p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">NO shares</p>
              <p className="text-lg font-bold text-red-400 tabular-nums">
                {(selectedOutcome.noPrice * 100).toFixed(0)}¢
              </p>
              <p className="text-[10px] text-muted-foreground">
                {fmtVolume(market.volume * selectedOutcome.noPrice)} matched
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Trade panel */}
        <div className="space-y-3">
          <label className="text-xs text-muted-foreground">Trade</label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={selectedSide === "yes" ? "default" : "outline"}
              size="sm"
              className={cn("text-sm", selectedSide === "yes" && "bg-emerald-600 hover:bg-emerald-700 text-white")}
              onClick={() => setSelectedSide("yes")}
            >
              Buy YES
            </Button>
            <Button
              variant={selectedSide === "no" ? "default" : "outline"}
              size="sm"
              className={cn("text-sm", selectedSide === "no" && "bg-red-600 hover:bg-red-700 text-white")}
              onClick={() => setSelectedSide("no")}
            >
              Buy NO
            </Button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Stake amount ($)</label>
            <Input
              type="number"
              placeholder="0.00"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="h-9"
            />
            <div className="flex gap-1.5">
              {[10, 50, 100, 500].map((amt) => (
                <Button
                  key={amt}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6 px-2 flex-1"
                  onClick={() => setStakeAmount(amt.toString())}
                >
                  ${amt}
                </Button>
              ))}
            </div>
          </div>

          {stakeNum > 0 && (
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Avg price</span>
                <span className="tabular-nums">{(price * 100).toFixed(1)}¢</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Shares</span>
                <span className="tabular-nums">{potentialReturn.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Potential return</span>
                <span className="tabular-nums font-medium text-emerald-400">
                  ${potentialReturn.toFixed(2)} (+${potentialProfit.toFixed(2)})
                </span>
              </div>
            </div>
          )}

          <Button
            className={cn(
              "w-full",
              selectedSide === "yes" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
            )}
            disabled={stakeNum <= 0}
            onClick={() => {
              const order = placeMockOrder({
                client_id: "internal-trader",
                instrument_id: `${market.venue.toUpperCase()}:${market.id}:${selectedOutcome.name}@${selectedSide.toUpperCase()}`,
                venue: market.venue === "polymarket" ? "Polymarket" : "Kalshi",
                side: "buy",
                order_type: "limit",
                quantity: stakeNum,
                price,
                asset_class: "Prediction",
                lane: "predictions",
              });
              setStakeAmount("");
              toast({
                title: "Position opened",
                description: `${selectedSide.toUpperCase()} ${selectedOutcome.name} — $${stakeNum.toFixed(2)} @ ${(price * 100).toFixed(0)}¢ (${order.id})`,
              });
            }}
          >
            {selectedSide === "yes" ? "Buy YES" : "Buy NO"} — {selectedOutcome.name}
          </Button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2">
          <span className="flex items-center gap-1">
            <BarChart3 className="size-3" />
            {market.volumeLabel}
          </span>
          {market.resolutionDate && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              Resolves {market.resolutionDate}
            </span>
          )}
          <Button variant="ghost" size="sm" className="text-[11px] h-6 px-1.5 text-muted-foreground" onClick={() => {}}>
            <ExternalLink className="size-3 mr-1" />
            View on {market.venue === "polymarket" ? "Polymarket" : "Kalshi"}
          </Button>
        </div>

        {/* Related markets */}
        <div className="space-y-2 pt-2">
          <p className="text-xs text-muted-foreground font-medium">Related markets</p>
          {MOCK_MARKETS.filter((m) => m.category === market.category && m.id !== market.id)
            .slice(0, 3)
            .map((related) => {
              const p =
                related.type === "binary"
                  ? related.outcomes[0].probability
                  : Math.max(...related.outcomes.map((o) => o.probability));
              return (
                <div
                  key={related.id}
                  className="flex items-center justify-between rounded-md border border-border/30 px-3 py-2 hover:bg-muted/30 cursor-pointer text-xs"
                >
                  <span className="truncate mr-2">{related.question}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold tabular-nums">{p}%</span>
                    <ChevronRight className="size-3 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function MarketsTab() {
  const [activeCategory, setActiveCategory] = React.useState<MarketCategory>("trending");
  const [venueFilter, setVenueFilter] = React.useState<"all" | MarketVenue>("all");
  const [sortBy, setSortBy] = React.useState<SortOption>("trending");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedMarketId, setSelectedMarketId] = React.useState<string | null>(null);

  const filteredMarkets = React.useMemo(() => {
    let markets = [...MOCK_MARKETS];

    if (activeCategory === "trending") {
      markets = markets.filter((m) => m.isTrending);
    } else if (activeCategory === "breaking") {
      markets = markets.filter((m) => m.isLive || m.isTrending);
    } else {
      markets = markets.filter((m) => m.category === activeCategory);
    }

    if (venueFilter !== "all") {
      markets = markets.filter((m) => m.venue === venueFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      markets = markets.filter(
        (m) => m.question.toLowerCase().includes(q) || m.outcomes.some((o) => o.name.toLowerCase().includes(q))
      );
    }

    switch (sortBy) {
      case "trending":
        markets.sort((a, b) => (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0) || b.volume - a.volume);
        break;
      case "newest":
        markets.sort((a, b) => (b.resolutionDate ?? "").localeCompare(a.resolutionDate ?? ""));
        break;
      case "highest_volume":
        markets.sort((a, b) => b.volume - a.volume);
        break;
      case "closing_soon":
        markets.sort((a, b) => (a.resolutionDate ?? "9999").localeCompare(b.resolutionDate ?? "9999"));
        break;
    }
    return markets;
  }, [activeCategory, venueFilter, searchQuery, sortBy]);

  const selectedMarket = selectedMarketId ? (MOCK_MARKETS.find((m) => m.id === selectedMarketId) ?? null) : null;

  if (selectedMarket) {
    return (
      <div className="space-y-4">
        <MarketDetailPanel market={selectedMarket} onClose={() => setSelectedMarketId(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CategoryPills active={activeCategory} onSelect={setActiveCategory} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex rounded-lg border border-border/50 overflow-hidden shrink-0">
          {(["all", "polymarket", "kalshi"] as const).map((venue) => (
            <Button
              key={venue}
              variant="ghost"
              size="sm"
              className={cn(
                "text-xs h-8 rounded-none px-3 border-r border-border/50 last:border-r-0",
                venueFilter === venue && "bg-muted text-foreground"
              )}
              onClick={() => setVenueFilter(venue)}
            >
              {venue === "all" ? "All Venues" : venue === "polymarket" ? "Polymarket" : "Kalshi"}
            </Button>
          ))}
        </div>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-0 w-full sm:w-auto sm:ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs pl-8"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 size-6"
              onClick={() => setSearchQuery("")}
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {filteredMarkets.length} market{filteredMarkets.length !== 1 ? "s" : ""}
      </p>

      {filteredMarkets.length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="py-12 text-center">
            <Search className="size-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No markets found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your filters or search query</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMarkets.map((market) =>
            market.type === "binary" ? (
              <BinaryMarketCard key={market.id} market={market} onSelect={setSelectedMarketId} />
            ) : (
              <MultiOutcomeMarketCard key={market.id} market={market} onSelect={setSelectedMarketId} />
            )
          )}
        </div>
      )}
    </div>
  );
}
