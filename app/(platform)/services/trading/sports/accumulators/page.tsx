"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExecutionModeIndicator } from "@/components/trading/execution-mode-toggle";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Search, X, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/formatters";
import { MOCK_FIXTURES, type AccumulatorLeg, type AccumulatorFixture } from "@/lib/mocks/fixtures/trading-pages";

const MAX_LEGS = 12;
const MIN_LEGS = 2;

// ── Component ────────────────────────────────────────────────────────────────

export default function AccumulatorBuilderPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [legs, setLegs] = useState<AccumulatorLeg[]>([]);
  const [stake, setStake] = useState<string>("10");

  const filteredFixtures = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_FIXTURES;
    const q = searchQuery.toLowerCase();
    return MOCK_FIXTURES.filter(
      (f) =>
        f.homeTeam.toLowerCase().includes(q) ||
        f.awayTeam.toLowerCase().includes(q) ||
        f.league.toLowerCase().includes(q) ||
        f.leagueCountry.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const selectedFixtureIds = new Set(legs.map((l) => l.fixtureId));

  const addLeg = (fixture: AccumulatorFixture, selection: "home" | "draw" | "away") => {
    if (legs.length >= MAX_LEGS) return;
    if (selectedFixtureIds.has(fixture.id)) return;

    const odds = selection === "home" ? fixture.oddsHome : selection === "draw" ? fixture.oddsDraw : fixture.oddsAway;

    setLegs((prev) => [...prev, { fixtureId: fixture.id, fixture, selection, odds }]);
  };

  const removeLeg = (fixtureId: string) => {
    setLegs((prev) => prev.filter((l) => l.fixtureId !== fixtureId));
  };

  const combinedOdds = legs.reduce((acc, leg) => acc * leg.odds, 1);
  const stakeNum = parseFloat(stake) || 0;
  const potentialPayout = stakeNum * combinedOdds;

  const formatKickoff = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const selectionLabel = (sel: "home" | "draw" | "away", fixture: AccumulatorFixture) => {
    if (sel === "home") return fixture.homeTeam;
    if (sel === "away") return fixture.awayTeam;
    return "Draw";
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-4 py-3 bg-background/95">
        <PageHeader
          title={
            <span className="flex flex-wrap items-center gap-2">
              <Trophy className="size-5 text-amber-400" />
              Accumulator Builder
              <ExecutionModeIndicator />
            </span>
          }
          description="Combine multiple selections into a single high-odds accumulator bet"
        >
          <Badge variant="outline" className="text-[10px]">
            {legs.length} / {MAX_LEGS} legs
          </Badge>
        </PageHeader>
      </div>

      {/* Main content: two-panel layout */}
      <div className="flex-1 overflow-hidden flex min-h-0">
        {/* Left: fixture search + selection */}
        <div className="flex-1 border-r border-border flex flex-col min-w-0">
          <div className="px-4 py-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search fixtures by team, league..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>

          <WidgetScroll className="flex-1" viewportClassName="p-3 space-y-2">
            {filteredFixtures.map((fixture) => {
              const alreadySelected = selectedFixtureIds.has(fixture.id);
              return (
                <Card
                  key={fixture.id}
                  className={cn("transition-colors", alreadySelected && "opacity-50 border-primary/30")}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {fixture.league}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{formatKickoff(fixture.kickoff)}</span>
                      </div>
                      {alreadySelected && (
                        <Badge variant="success" className="text-[10px]">
                          Selected
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm font-medium mb-3">
                      {fixture.homeTeam} <span className="text-muted-foreground">vs</span> {fixture.awayTeam}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => addLeg(fixture, "home")}
                        disabled={alreadySelected || legs.length >= MAX_LEGS}
                        className={cn(
                          "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md border text-xs transition-colors",
                          "hover:bg-primary/10 hover:border-primary/50",
                          "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-border",
                        )}
                      >
                        <span className="text-[10px] text-muted-foreground">Home</span>
                        <span className="font-mono font-semibold text-emerald-400">
                          {formatNumber(fixture.oddsHome, 2)}
                        </span>
                      </button>
                      <button
                        onClick={() => addLeg(fixture, "draw")}
                        disabled={alreadySelected || legs.length >= MAX_LEGS}
                        className={cn(
                          "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md border text-xs transition-colors",
                          "hover:bg-primary/10 hover:border-primary/50",
                          "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-border",
                        )}
                      >
                        <span className="text-[10px] text-muted-foreground">Draw</span>
                        <span className="font-mono font-semibold text-amber-400">
                          {formatNumber(fixture.oddsDraw, 2)}
                        </span>
                      </button>
                      <button
                        onClick={() => addLeg(fixture, "away")}
                        disabled={alreadySelected || legs.length >= MAX_LEGS}
                        className={cn(
                          "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md border text-xs transition-colors",
                          "hover:bg-primary/10 hover:border-primary/50",
                          "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-border",
                        )}
                      >
                        <span className="text-[10px] text-muted-foreground">Away</span>
                        <span className="font-mono font-semibold text-sky-400">
                          {formatNumber(fixture.oddsAway, 2)}
                        </span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredFixtures.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-12">No fixtures match your search</div>
            )}
          </WidgetScroll>
        </div>

        {/* Right: accumulator slip */}
        <div className="w-[340px] shrink-0 flex flex-col bg-card/20">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Accumulator Slip</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {legs.length === 0 ? "Click odds to add legs" : `${legs.length} selection${legs.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          <WidgetScroll className="flex-1" viewportClassName="p-3 space-y-2">
            {legs.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8 space-y-2">
                <Plus className="size-8 mx-auto opacity-30" />
                <p>No selections yet</p>
                <p className="text-[10px]">Click on Home, Draw, or Away odds to add legs</p>
              </div>
            )}

            {legs.map((leg, idx) => (
              <div
                key={leg.fixtureId}
                className="flex items-start gap-2 p-2 rounded-md border border-border bg-card/50"
              >
                <div className="flex items-center justify-center size-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">
                    {leg.fixture.homeTeam} vs {leg.fixture.awayTeam}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {selectionLabel(leg.selection, leg.fixture)}
                    </Badge>
                    <span className="text-xs font-mono font-semibold text-emerald-400">
                      {formatNumber(leg.odds, 2)}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {leg.fixture.league}: {formatKickoff(leg.fixture.kickoff)}
                  </div>
                </div>
                <button
                  onClick={() => removeLeg(leg.fixtureId)}
                  className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  title="Remove leg"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </WidgetScroll>

          {/* Summary */}
          <div className="border-t border-border p-4 space-y-3 bg-card/40">
            {legs.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Combined Odds</span>
                  <span className="font-mono font-semibold text-lg text-amber-400">
                    {formatNumber(combinedOdds, 2)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground shrink-0">Stake</label>
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={stake}
                      onChange={(e) => setStake(e.target.value)}
                      className="pl-5 h-8 text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Potential Payout</span>
                  <span
                    className={cn(
                      "font-mono font-bold text-lg",
                      potentialPayout > 0 ? "text-emerald-400" : "text-muted-foreground",
                    )}
                  >
                    ${formatNumber(potentialPayout, 2)}
                  </span>
                </div>
              </div>
            )}

            {legs.length > 0 && legs.length < MIN_LEGS && (
              <div className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-400/10 rounded-md px-2 py-1.5">
                <AlertTriangle className="size-3 shrink-0" />
                Add at least {MIN_LEGS} legs to place an accumulator
              </div>
            )}

            <Button className="w-full" disabled={legs.length < MIN_LEGS || stakeNum <= 0}>
              <Trophy className="size-4" />
              Place Accumulator
            </Button>

            <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
              <AlertTriangle className="size-3 shrink-0 mt-0.5" />
              <span>
                All selections must win for the accumulator to pay out. If any leg loses, the entire bet is lost.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
