"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CheckCircle2, Filter, Search, Trophy } from "lucide-react";
import { toast } from "sonner";

import { BetSlip, type BetSlipSelection, type BetSlipState } from "@/components/trading/sports/bet-slip";
import type { Bookmaker, Fixture, OddsMarket } from "@/components/trading/sports/types";
import { BOOKMAKER_DISPLAY_NAMES, EXECUTION_CAPABLE_BOOKMAKERS } from "@/components/trading/sports/types";
import { formatNumber } from "@/lib/utils/formatters";
import { MOCK_FIXTURES_WITH_ODDS } from "@/lib/mocks/fixtures/trading-pages";

const MARKETS: OddsMarket[] = ["FT Result", "Over/Under 2.5", "BTTS", "Asian Handicap", "DNB"];

// ─── Page Component ─────────────────────────────────────────────────────────

export default function SportsBetPage() {
  const [search, setSearch] = React.useState("");
  const [leagueFilter, setLeagueFilter] = React.useState("all");
  const [marketFilter, setMarketFilter] = React.useState<OddsMarket>("FT Result");

  // Bet slip state
  const [betSlip, setBetSlip] = React.useState<BetSlipState>({
    selections: [],
    stake: "",
    betType: "single",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [lastPlaced, setLastPlaced] = React.useState<string | null>(null);

  const leagues = [...new Set(MOCK_FIXTURES_WITH_ODDS.map((f) => f.fixture.league))];

  const filtered = MOCK_FIXTURES_WITH_ODDS.filter((f) => {
    if (leagueFilter !== "all" && f.fixture.league !== leagueFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return f.fixture.home.name.toLowerCase().includes(q) || f.fixture.away.name.toLowerCase().includes(q);
    }
    return true;
  });

  function addSelection(fixture: Fixture, market: OddsMarket, outcome: string, odds: number, bookmaker: Bookmaker) {
    const id = `${fixture.id}-${market}-${outcome}`;
    setBetSlip((prev) => {
      if (prev.selections.some((s) => s.id === id)) return prev;
      return {
        ...prev,
        selections: [...prev.selections, { id, fixture, market, outcome, odds, bookmaker }],
      };
    });
  }

  function removeSelection(id: string) {
    setBetSlip((prev) => ({
      ...prev,
      selections: prev.selections.filter((s) => s.id !== id),
    }));
  }

  function changeBookmaker(selectionId: string, bookmaker: Bookmaker) {
    setBetSlip((prev) => ({
      ...prev,
      selections: prev.selections.map((s) => (s.id === selectionId ? { ...s, bookmaker } : s)),
    }));
  }

  async function placeBet() {
    setIsSubmitting(true);
    // Mock API call — would POST to /api/sports/bets
    await new Promise((r) => setTimeout(r, 1200));
    const count = betSlip.betType === "accumulator" ? 1 : betSlip.selections.length;
    toast.success(`${count} bet${count > 1 ? "s" : ""} placed successfully (paper mode)`);
    setLastPlaced(new Date().toISOString());
    setBetSlip({ selections: [], stake: "", betType: "single" });
    setIsSubmitting(false);
  }

  // Get all bookmakers that have odds for current selections' fixtures
  const availableBookmakers = React.useMemo(() => {
    const fixtureIds = new Set(betSlip.selections.map((s) => s.fixture.id));
    const bookmakers = new Set<Bookmaker>();
    for (const fwo of MOCK_FIXTURES_WITH_ODDS) {
      if (fixtureIds.has(fwo.fixture.id)) {
        for (const o of fwo.odds) {
          if (EXECUTION_CAPABLE_BOOKMAKERS.includes(o.bookmaker)) {
            bookmakers.add(o.bookmaker);
          }
        }
      }
    }
    return [...bookmakers];
  }, [betSlip.selections]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col gap-3 px-6 pt-6 pb-4">
        <PageHeader
          title={
            <span className="flex flex-wrap items-center gap-3">
              <Trophy className="size-5 text-primary" />
              Place Bets
              <Badge variant="outline" className="border-amber-400/30 text-xs text-amber-400">
                Paper Mode
              </Badge>
            </span>
          }
        />
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search fixtures..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={leagueFilter} onValueChange={setLeagueFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="League" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leagues</SelectItem>
              {leagues.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={marketFilter} onValueChange={(v) => setMarketFilter(v as OddsMarket)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MARKETS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main: Fixtures + Bet Slip */}
      <div className="flex-1 flex min-h-0 px-6 pb-6 gap-4">
        {/* Left: Fixture odds grid */}
        <WidgetScroll className="flex-1" viewportClassName="space-y-4 pr-1">
          {filtered.map((fwo) => {
            const marketOdds = fwo.odds.filter((o) => o.market === marketFilter);
            // Group by bookmaker
            const bookmakerMap = new Map<Bookmaker, { label: string; odds: number }[]>();
            for (const mo of marketOdds) {
              bookmakerMap.set(mo.bookmaker, mo.outcomes);
            }
            const outcomes = marketOdds[0]?.outcomes.map((o) => o.label) ?? [];

            return (
              <Card key={fwo.fixture.id} className="border-border/50">
                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">
                        {fwo.fixture.home.name} vs {fwo.fixture.away.name}
                      </CardTitle>
                      <p className="text-[10px] text-muted-foreground">
                        {fwo.fixture.league} — {fwo.fixture.round} — {new Date(fwo.fixture.kickoff).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {fwo.fixture.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-3 px-4">
                  {bookmakerMap.size === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-2">No {marketFilter} odds available</p>
                  ) : (
                    <WidgetScroll axes="horizontal" scrollbarSize="thin">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border/30">
                            <th className="text-left py-1.5 pr-3 font-medium text-muted-foreground w-[140px]">
                              Bookmaker
                            </th>
                            {outcomes.map((o) => (
                              <th key={o} className="text-center py-1.5 px-2 font-medium text-muted-foreground">
                                {o}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[...bookmakerMap.entries()].map(([bk, ocs]) => (
                            <tr key={bk} className="border-b border-border/20 last:border-0">
                              <td className="py-1.5 pr-3 text-muted-foreground">{BOOKMAKER_DISPLAY_NAMES[bk]}</td>
                              {ocs.map((oc) => {
                                const selId = `${fwo.fixture.id}-${marketFilter}-${oc.label}`;
                                const isSelected = betSlip.selections.some((s) => s.id === selId && s.bookmaker === bk);
                                return (
                                  <td key={oc.label} className="text-center py-1 px-1">
                                    <button
                                      onClick={() =>
                                        isSelected
                                          ? removeSelection(selId)
                                          : addSelection(fwo.fixture, marketFilter, oc.label, oc.odds, bk)
                                      }
                                      className={cn(
                                        "font-mono px-3 py-1 rounded-md transition-all text-xs font-medium",
                                        isSelected
                                          ? "bg-primary text-primary-foreground ring-2 ring-primary/50"
                                          : "bg-muted/30 hover:bg-muted/60 text-foreground",
                                      )}
                                    >
                                      {formatNumber(oc.odds, 2)}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </WidgetScroll>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </WidgetScroll>

        {/* Right: Bet Slip */}
        <div className="w-[320px] shrink-0">
          <div className="sticky top-0">
            <BetSlip
              state={betSlip}
              onUpdateStake={(s) => setBetSlip((prev) => ({ ...prev, stake: s }))}
              onRemoveSelection={removeSelection}
              onChangeBookmaker={changeBookmaker}
              onClear={() => setBetSlip({ selections: [], stake: "", betType: "single" })}
              onPlaceBet={placeBet}
              onChangeBetType={(t) => setBetSlip((prev) => ({ ...prev, betType: t }))}
              isSubmitting={isSubmitting}
              availableBookmakers={availableBookmakers}
            />

            {lastPlaced && (
              <div className="mt-3 rounded-lg border border-[#4ade80]/20 bg-[#4ade80]/5 p-3 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-[#4ade80]" />
                <p className="text-xs text-[#4ade80]">Last bet placed at {new Date(lastPlaced).toLocaleTimeString()}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
