"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExecutionModeIndicator } from "@/components/trading/execution-mode-toggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trophy,
  Search,
  X,
  AlertTriangle,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface Fixture {
  id: string;
  league: string;
  leagueCountry: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  oddsHome: number;
  oddsDraw: number;
  oddsAway: number;
}

interface AccumulatorLeg {
  fixtureId: string;
  fixture: Fixture;
  selection: "home" | "draw" | "away";
  odds: number;
}

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_FIXTURES: Fixture[] = [
  {
    id: "fix-001",
    league: "Premier League",
    leagueCountry: "England",
    homeTeam: "Arsenal",
    awayTeam: "Manchester City",
    kickoff: "2026-03-29T15:00:00Z",
    oddsHome: 2.45,
    oddsDraw: 3.30,
    oddsAway: 2.75,
  },
  {
    id: "fix-002",
    league: "Premier League",
    leagueCountry: "England",
    homeTeam: "Liverpool",
    awayTeam: "Chelsea",
    kickoff: "2026-03-29T17:30:00Z",
    oddsHome: 1.85,
    oddsDraw: 3.60,
    oddsAway: 4.10,
  },
  {
    id: "fix-003",
    league: "La Liga",
    leagueCountry: "Spain",
    homeTeam: "Real Madrid",
    awayTeam: "Barcelona",
    kickoff: "2026-03-29T20:00:00Z",
    oddsHome: 2.10,
    oddsDraw: 3.40,
    oddsAway: 3.25,
  },
  {
    id: "fix-004",
    league: "La Liga",
    leagueCountry: "Spain",
    homeTeam: "Atletico Madrid",
    awayTeam: "Sevilla",
    kickoff: "2026-03-30T14:00:00Z",
    oddsHome: 1.75,
    oddsDraw: 3.50,
    oddsAway: 4.80,
  },
  {
    id: "fix-005",
    league: "Serie A",
    leagueCountry: "Italy",
    homeTeam: "AC Milan",
    awayTeam: "Inter Milan",
    kickoff: "2026-03-30T17:45:00Z",
    oddsHome: 2.90,
    oddsDraw: 3.15,
    oddsAway: 2.40,
  },
  {
    id: "fix-006",
    league: "Bundesliga",
    leagueCountry: "Germany",
    homeTeam: "Bayern Munich",
    awayTeam: "Borussia Dortmund",
    kickoff: "2026-03-30T17:30:00Z",
    oddsHome: 1.55,
    oddsDraw: 4.20,
    oddsAway: 5.50,
  },
  {
    id: "fix-007",
    league: "Ligue 1",
    leagueCountry: "France",
    homeTeam: "PSG",
    awayTeam: "Marseille",
    kickoff: "2026-03-30T20:45:00Z",
    oddsHome: 1.40,
    oddsDraw: 4.80,
    oddsAway: 7.00,
  },
  {
    id: "fix-008",
    league: "Premier League",
    leagueCountry: "England",
    homeTeam: "Tottenham",
    awayTeam: "Newcastle",
    kickoff: "2026-03-31T14:00:00Z",
    oddsHome: 2.30,
    oddsDraw: 3.40,
    oddsAway: 3.00,
  },
];

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

  const addLeg = (fixture: Fixture, selection: "home" | "draw" | "away") => {
    if (legs.length >= MAX_LEGS) return;
    if (selectedFixtureIds.has(fixture.id)) return;

    const odds =
      selection === "home"
        ? fixture.oddsHome
        : selection === "draw"
          ? fixture.oddsDraw
          : fixture.oddsAway;

    setLegs((prev) => [
      ...prev,
      { fixtureId: fixture.id, fixture, selection, odds },
    ]);
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

  const selectionLabel = (sel: "home" | "draw" | "away", fixture: Fixture) => {
    if (sel === "home") return fixture.homeTeam;
    if (sel === "away") return fixture.awayTeam;
    return "Draw";
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-4 py-3 bg-background/95">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Trophy className="size-5 text-amber-400" />
              <h1 className="text-xl font-semibold tracking-tight">
                Accumulator Builder
              </h1>
              <ExecutionModeIndicator />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Combine multiple selections into a single high-odds accumulator bet
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {legs.length} / {MAX_LEGS} legs
            </Badge>
          </div>
        </div>
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

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredFixtures.map((fixture) => {
              const alreadySelected = selectedFixtureIds.has(fixture.id);
              return (
                <Card
                  key={fixture.id}
                  className={cn(
                    "transition-colors",
                    alreadySelected && "opacity-50 border-primary/30",
                  )}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {fixture.league}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatKickoff(fixture.kickoff)}
                        </span>
                      </div>
                      {alreadySelected && (
                        <Badge variant="success" className="text-[10px]">
                          Selected
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm font-medium mb-3">
                      {fixture.homeTeam}{" "}
                      <span className="text-muted-foreground">vs</span>{" "}
                      {fixture.awayTeam}
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
                          {fixture.oddsHome.toFixed(2)}
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
                          {fixture.oddsDraw.toFixed(2)}
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
                          {fixture.oddsAway.toFixed(2)}
                        </span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredFixtures.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-12">
                No fixtures match your search
              </div>
            )}
          </div>
        </div>

        {/* Right: accumulator slip */}
        <div className="w-[340px] shrink-0 flex flex-col bg-card/20">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Accumulator Slip</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {legs.length === 0
                ? "Click odds to add legs"
                : `${legs.length} selection${legs.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {legs.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8 space-y-2">
                <Plus className="size-8 mx-auto opacity-30" />
                <p>No selections yet</p>
                <p className="text-[10px]">
                  Click on Home, Draw, or Away odds to add legs
                </p>
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
                      {leg.odds.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {leg.fixture.league} — {formatKickoff(leg.fixture.kickoff)}
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
          </div>

          {/* Summary */}
          <div className="border-t border-border p-4 space-y-3 bg-card/40">
            {legs.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Combined Odds</span>
                  <span className="font-mono font-semibold text-lg text-amber-400">
                    {combinedOdds.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground shrink-0">
                    Stake
                  </label>
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      $
                    </span>
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
                    ${potentialPayout.toFixed(2)}
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

            <Button
              className="w-full"
              disabled={legs.length < MIN_LEGS || stakeNum <= 0}
            >
              <Trophy className="size-4" />
              Place Accumulator
            </Button>

            <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
              <AlertTriangle className="size-3 shrink-0 mt-0.5" />
              <span>
                All selections must win for the accumulator to pay out. If any
                leg loses, the entire bet is lost.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
