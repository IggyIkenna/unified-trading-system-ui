"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Clock, BarChart3, TrendingUp, CheckCircle2 } from "lucide-react";
import { placeMockOrder } from "@/lib/api/mock-trade-ledger";
import { useToast } from "@/hooks/use-toast";
import type { PredictionMarket, PredictionQuickTradeParams } from "./types";
import { MOCK_MARKETS, MOCK_RECENT_FILLS } from "./mock-data";
import { fmtVolume, calcKellyStake, fmtUsdPrecise, fmtRelativeTime } from "./helpers";
import { VenueChip, LiveDot, ProbBadge } from "./shared";

// ─── Top markets by volume (for quick-access cards) ───────────────────────────

const TOP_MARKETS = [...MOCK_MARKETS].sort((a, b) => b.volume - a.volume).slice(0, 6);

// ─── Trade Panel ──────────────────────────────────────────────────────────────

export function TradePanelInner({
  market,
  onPlaceTrade,
}: {
  market: PredictionMarket;
  /** When set, invoked instead of inline mock order + toast (e.g. workspace context). */
  onPlaceTrade?: (params: PredictionQuickTradeParams) => void;
}) {
  const { toast } = useToast();
  const [stakeAmount, setStakeAmount] = React.useState("");
  const [selectedSide, setSelectedSide] = React.useState<"yes" | "no">("yes");
  const [selectedOutcomeIdx, setSelectedOutcomeIdx] = React.useState(0);

  const outcome = market.outcomes[selectedOutcomeIdx];
  const price = selectedSide === "yes" ? outcome.yesPrice : outcome.noPrice;
  const stakeNum = parseFloat(stakeAmount) || 0;
  const potentialReturn = stakeNum > 0 ? stakeNum / price : 0;
  const potentialProfit = potentialReturn - stakeNum;

  // Kelly stake suggestion: treat current probability as estimated win prob
  const estimatedProb = (selectedSide === "yes" ? outcome.probability : 100 - outcome.probability) / 100;
  const kellySuggestion = calcKellyStake(1 / price, estimatedProb, 10_000);

  function submit() {
    if (stakeNum <= 0) return;
    if (onPlaceTrade) {
      onPlaceTrade({
        marketId: market.id,
        outcomeIndex: selectedOutcomeIdx,
        side: selectedSide,
        stakeUsd: stakeNum,
      });
      setStakeAmount("");
      return;
    }
    const order = placeMockOrder({
      client_id: "internal-trader",
      instrument_id: `${market.venue.toUpperCase()}:${market.id}:${outcome.name}@${selectedSide.toUpperCase()}`,
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
      description: `${selectedSide.toUpperCase()} "${outcome.name}" — $${stakeNum.toFixed(2)} @ ${(price * 100).toFixed(0)}¢ (${order.id})`,
    });
  }

  return (
    <div className="space-y-4">
      {/* Market info header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <VenueChip venue={market.venue} />
            {market.isLive && (
              <Badge variant="outline" className="text-[10px] border-red-500/40 text-red-400 flex items-center gap-1">
                <LiveDot />
                LIVE
              </Badge>
            )}
          </div>
          <p className="text-sm font-semibold leading-snug">{market.question}</p>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
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
          </div>
        </div>
        <ProbBadge probability={outcome.probability} />
      </div>

      {/* Outcome selector for multi */}
      {market.type === "multi" && (
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Select outcome</label>
          <div className="grid gap-1.5">
            {market.outcomes.map((o, idx) => (
              <Button
                key={o.name}
                variant={selectedOutcomeIdx === idx ? "default" : "outline"}
                size="sm"
                className="justify-between text-xs h-9"
                onClick={() => setSelectedOutcomeIdx(idx)}
              >
                <span>{o.name}</span>
                <span className="font-bold tabular-nums">{o.probability}%</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Order book mini */}
      <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/50 p-3">
        <div className="text-center space-y-0.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">YES</p>
          <p className="text-xl font-bold text-emerald-400 tabular-nums">{(outcome.yesPrice * 100).toFixed(0)}¢</p>
          <p className="text-[10px] text-muted-foreground">{fmtVolume(market.volume * outcome.yesPrice)}</p>
        </div>
        <div className="text-center space-y-0.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">NO</p>
          <p className="text-xl font-bold text-red-400 tabular-nums">{(outcome.noPrice * 100).toFixed(0)}¢</p>
          <p className="text-[10px] text-muted-foreground">{fmtVolume(market.volume * outcome.noPrice)}</p>
        </div>
      </div>

      <Separator />

      {/* Side toggle */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={selectedSide === "yes" ? "default" : "outline"}
          size="sm"
          className={cn(
            "text-sm font-semibold",
            selectedSide === "yes" && "bg-emerald-600 hover:bg-emerald-700 text-white",
          )}
          onClick={() => setSelectedSide("yes")}
        >
          Buy YES
        </Button>
        <Button
          variant={selectedSide === "no" ? "default" : "outline"}
          size="sm"
          className={cn("text-sm font-semibold", selectedSide === "no" && "bg-red-600 hover:bg-red-700 text-white")}
          onClick={() => setSelectedSide("no")}
        >
          Buy NO
        </Button>
      </div>

      {/* Stake input */}
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
          {kellySuggestion > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-6 px-2 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
              onClick={() => setStakeAmount(kellySuggestion.toFixed(0))}
            >
              Kelly ${kellySuggestion.toFixed(0)}
            </Button>
          )}
        </div>
        {kellySuggestion > 0 && (
          <p className="text-[10px] text-muted-foreground">
            Kelly (½ fraction, $10K bankroll):{" "}
            <span className="text-amber-400 font-medium">${kellySuggestion.toFixed(2)}</span>
          </p>
        )}
      </div>

      {/* Summary */}
      {stakeNum > 0 && (
        <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Avg price</span>
            <span className="tabular-nums">{(price * 100).toFixed(1)}¢</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Shares</span>
            <span className="tabular-nums">{(stakeNum / price).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs font-medium">
            <span className="text-muted-foreground">Potential return</span>
            <span className="tabular-nums text-emerald-400">
              {fmtUsdPrecise(potentialReturn)} (+{fmtUsdPrecise(potentialProfit)})
            </span>
          </div>
        </div>
      )}

      <Button
        className={cn(
          "w-full font-semibold",
          selectedSide === "yes" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700",
        )}
        disabled={stakeNum <= 0}
        onClick={submit}
      >
        {selectedSide === "yes" ? "Buy YES" : "Buy NO"} — {outcome.name}
      </Button>
    </div>
  );
}

// ─── Market selector ──────────────────────────────────────────────────────────

export function MarketSelector({
  markets,
  value,
  onChange,
}: {
  markets: PredictionMarket[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [search, setSearch] = React.useState("");

  const options = search.trim()
    ? markets.filter((m) => m.question.toLowerCase().includes(search.toLowerCase()))
    : markets;

  return (
    <div className="space-y-2">
      <label className="text-xs text-muted-foreground">Find a market</label>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          placeholder="Search markets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 text-xs pl-8"
        />
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 text-xs">
          <SelectValue placeholder="Select a market…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((m) => (
            <SelectItem key={m.id} value={m.id} className="text-xs">
              <span className="flex items-center gap-1.5">
                <span className="truncate max-w-[280px]">{m.question}</span>
                <span className="text-muted-foreground shrink-0">{m.volumeLabel}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── Top market quick-card ─────────────────────────────────────────────────────

export function TopMarketCard({ market, onSelect }: { market: PredictionMarket; onSelect: (id: string) => void }) {
  const outcome = market.outcomes[0];
  return (
    <Card
      className="bg-card border-border/50 cursor-pointer hover:bg-muted/40 transition-colors"
      onClick={() => onSelect(market.id)}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <VenueChip venue={market.venue} />
          {market.isLive && (
            <Badge variant="outline" className="text-[10px] border-red-500/40 text-red-400 flex items-center gap-1">
              <LiveDot />
              LIVE
            </Badge>
          )}
        </div>
        <p className="text-xs font-medium leading-snug line-clamp-2">{market.question}</p>
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-lg font-bold tabular-nums",
              outcome.probability >= 50 ? "text-emerald-400" : "text-red-400",
            )}
          >
            {outcome.probability}%
          </span>
          <div className="flex gap-1.5">
            <button
              className="text-[10px] px-2 py-1 rounded border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-semibold transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(market.id);
              }}
            >
              {(outcome.yesPrice * 100).toFixed(0)}¢ YES
            </button>
            <button
              className="text-[10px] px-2 py-1 rounded border border-red-500/40 text-red-400 hover:bg-red-500/10 font-semibold transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(market.id);
              }}
            >
              {(outcome.noPrice * 100).toFixed(0)}¢ NO
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Recent fills list ────────────────────────────────────────────────────────

function RecentFills() {
  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-400" />
          Recent Trades
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/30">
          {MOCK_RECENT_FILLS.map((fill) => (
            <div key={fill.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
              <div className="min-w-0">
                <p className="font-medium truncate leading-snug">{fill.marketQuestion}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <VenueChip venue={fill.venue} />
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] font-bold",
                      fill.side === "yes" ? "border-emerald-500/40 text-emerald-400" : "border-red-500/40 text-red-400",
                    )}
                  >
                    {fill.side.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="tabular-nums font-semibold">${fill.total.toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground tabular-nums">
                  {fill.pricePerShare}¢ · {fill.shares.toLocaleString()} shares
                </p>
                <p className="text-[10px] text-muted-foreground">{fmtRelativeTime(fill.filledAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function TradeTab() {
  const [selectedMarketId, setSelectedMarketId] = React.useState<string>("");

  const selectedMarket = selectedMarketId ? (MOCK_MARKETS.find((m) => m.id === selectedMarketId) ?? null) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: market selector + top markets */}
      <div className="space-y-5">
        {/* Market finder */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="size-4" />
              Trade a Market
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MarketSelector markets={MOCK_MARKETS} value={selectedMarketId} onChange={setSelectedMarketId} />
            {selectedMarket ? (
              <TradePanelInner market={selectedMarket} />
            ) : (
              <div className="py-8 text-center">
                <Search className="size-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Search or select a market above</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Or click a market below to pre-select</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right: top markets + recent fills */}
      <div className="space-y-5">
        {/* Top markets by volume */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="size-3.5" />
            Top Markets by Volume
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TOP_MARKETS.map((m) => (
              <TopMarketCard key={m.id} market={m} onSelect={setSelectedMarketId} />
            ))}
          </div>
        </div>

        <RecentFills />
      </div>
    </div>
  );
}
