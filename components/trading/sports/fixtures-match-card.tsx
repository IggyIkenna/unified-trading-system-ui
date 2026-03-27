"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Cloud, Wind, Zap } from "lucide-react";
import type { Fixture } from "./types";
import { isLive, isCompleted, fmtOdds } from "./helpers";
import {
  StatusPill,
  LeagueBadge,
  MatchStatsPanel,
  ArbBadge,
  FormDots,
} from "./shared";
import { MOCK_ARB_STREAM, getBestOdds } from "./mock-data";

// ─── Event Timeline ───────────────────────────────────────────────────────────
// Compact timeline — shows last 5 events

function EventTimeline({
  events,
  maxItems = 5,
}: {
  events: Fixture["events"];
  maxItems?: number;
}) {
  if (!events?.length) return null;
  const recent = [...events].reverse().slice(0, maxItems);

  const eventIcon = (type: NonNullable<Fixture["events"]>[number]["type"]) => {
    switch (type) {
      case "goal":
        return "⚽";
      case "yellow_card":
        return "🟨";
      case "red_card":
        return "🟥";
      case "substitution":
        return "🔄";
      case "var":
        return "📺";
      case "penalty":
        return "🎯";
    }
  };

  return (
    <div className="flex flex-col gap-0.5">
      {recent.map((ev, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
        >
          <span className="tabular-nums w-6 text-right shrink-0">
            {ev.minute}&apos;
          </span>
          <span>{eventIcon(ev.type)}</span>
          <span
            className={cn(
              "truncate",
              ev.type === "goal" && "font-semibold text-foreground",
            )}
          >
            {ev.player}
            {ev.detail && (
              <span className="text-muted-foreground"> ({ev.detail})</span>
            )}
          </span>
          <span className="ml-auto shrink-0 text-muted-foreground/60 capitalize">
            {ev.team}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Live Score Display ───────────────────────────────────────────────────────

function LiveScore({ fixture }: { fixture: Fixture }) {
  const score = fixture.score;
  return (
    <div className="flex items-center justify-between gap-2">
      {/* Home team */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{fixture.home.name}</p>
        <p className="text-[10px] text-muted-foreground">
          {fixture.home.shortName}
        </p>
      </div>

      {/* Score */}
      <div className="flex items-center gap-1.5 px-2 shrink-0">
        <span className="text-2xl font-bold tabular-nums leading-none">
          {score?.home ?? 0}
        </span>
        <span className="text-sm text-muted-foreground font-light">—</span>
        <span className="text-2xl font-bold tabular-nums leading-none">
          {score?.away ?? 0}
        </span>
        {fixture.score?.ht && (
          <span className="ml-1 text-[9px] text-muted-foreground">
            (HT {score?.ht?.home}-{score?.ht?.away})
          </span>
        )}
      </div>

      {/* Away team */}
      <div className="flex-1 min-w-0 text-right">
        <p className="text-sm font-semibold truncate">{fixture.away.name}</p>
        <p className="text-[10px] text-muted-foreground">
          {fixture.away.shortName}
        </p>
      </div>
    </div>
  );
}

// ─── Pre-match Teams Display ──────────────────────────────────────────────────

function PreMatchTeams({ fixture }: { fixture: Fixture }) {
  const homeOdds = getBestOdds(
    fixture.id,
    `Home (${fixture.home.name})`,
    "FT Result",
  );
  const drawOdds = getBestOdds(fixture.id, "Draw", "FT Result");
  const awayOdds = getBestOdds(
    fixture.id,
    `Away (${fixture.away.name})`,
    "FT Result",
  );

  const kickoff = new Date(fixture.kickoff);
  const diffMs = kickoff.getTime() - Date.now();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffM = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const countdown =
    diffH > 0
      ? `in ${diffH}h ${diffM}m`
      : diffM > 0
        ? `in ${diffM}m`
        : "starting soon";

  return (
    <div className="flex flex-col gap-2">
      {/* Teams row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm font-semibold">{fixture.home.name}</p>
          {fixture.preMatch?.homeForm && (
            <FormDots form={fixture.preMatch.homeForm} />
          )}
        </div>
        <div className="flex flex-col items-center shrink-0 px-2">
          <span className="text-[10px] text-muted-foreground">{countdown}</span>
          <span className="text-xs font-medium">
            {kickoff.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="text-[9px] text-muted-foreground">vs</span>
        </div>
        <div className="flex-1 text-right">
          <p className="text-sm font-semibold">{fixture.away.name}</p>
          {fixture.preMatch?.awayForm && (
            <div className="flex justify-end">
              <FormDots form={fixture.preMatch.awayForm} />
            </div>
          )}
        </div>
      </div>

      {/* Best odds row */}
      {(homeOdds || drawOdds || awayOdds) && (
        <div className="flex items-center justify-between rounded-md bg-muted/30 px-2 py-1.5 text-xs">
          {homeOdds && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-muted-foreground">Home</span>
              <span className="font-bold tabular-nums">
                {fmtOdds(homeOdds.odds)}
              </span>
              <span className="text-[8px] text-muted-foreground">
                {homeOdds.bookmaker}
              </span>
            </div>
          )}
          {drawOdds && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-muted-foreground">Draw</span>
              <span className="font-bold tabular-nums">
                {fmtOdds(drawOdds.odds)}
              </span>
              <span className="text-[8px] text-muted-foreground">
                {drawOdds.bookmaker}
              </span>
            </div>
          )}
          {awayOdds && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-muted-foreground">Away</span>
              <span className="font-bold tabular-nums">
                {fmtOdds(awayOdds.odds)}
              </span>
              <span className="text-[8px] text-muted-foreground">
                {awayOdds.bookmaker}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Pre-match meta: xG model, weather, injuries */}
      {fixture.preMatch && (
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
          <span>
            xG model:{" "}
            <span className="text-foreground font-medium">
              {fixture.preMatch.xgModel.home.toFixed(1)} –{" "}
              {fixture.preMatch.xgModel.away.toFixed(1)}
            </span>
          </span>
          {fixture.preMatch.weather && (
            <span className="flex items-center gap-0.5">
              <Cloud className="size-2.5" />
              {fixture.preMatch.weather.tempC}°C{" "}
              {fixture.preMatch.weather.condition}
            </span>
          )}
          {fixture.preMatch.injuries.length > 0 && (
            <span className="flex items-center gap-0.5 text-amber-500">
              <AlertTriangle className="size-2.5" />
              {fixture.preMatch.injuries.length} injury alert
              {fixture.preMatch.injuries.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Match Card ───────────────────────────────────────────────────────────────

interface FixturesMatchCardProps {
  fixture: Fixture;
  onViewArb?: (fixtureId: string) => void;
  onOpenDetail?: (
    fixture: Fixture,
    initialTab?: "stats" | "odds-history" | "replay",
  ) => void;
}

export function FixturesMatchCard({
  fixture,
  onViewArb,
  onOpenDetail,
}: FixturesMatchCardProps) {
  const live =
    isLive(fixture.status) ||
    fixture.status === "HT" ||
    fixture.status === "SUSP";
  const completed = isCompleted(fixture.status);

  // Check if there's an active arb for this fixture
  const activeArb = MOCK_ARB_STREAM.find(
    (a) => a.fixtureId === fixture.id && a.isActive,
  );

  return (
    <Card
      className={cn(
        "transition-colors hover:bg-card/80",
        live && "border-primary/20",
      )}
    >
      <CardContent className="p-3 flex flex-col gap-2.5">
        {/* Header row: league + round + status + arb badge */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <LeagueBadge league={fixture.league} />
          <span className="text-[10px] text-muted-foreground">
            {fixture.round}
          </span>
          <div className="flex items-center gap-1 ml-auto">
            {activeArb && (
              <ArbBadge pct={activeArb.arbPct} className="cursor-pointer" />
            )}
            <StatusPill status={fixture.status} minute={fixture.minute} />
          </div>
        </div>

        {/* Suspended warning */}
        {fixture.status === "SUSP" && (
          <div className="flex items-center gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1.5 text-xs text-red-400 animate-pulse">
            <AlertTriangle className="size-3 shrink-0" />
            Market suspended — quoting paused
          </div>
        )}

        {/* HT notice */}
        {fixture.status === "HT" && (
          <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-400">
            <Wind className="size-3 shrink-0" />
            Half time — markets reopening shortly
          </div>
        )}

        {/* Main content area */}
        {live || fixture.status === "HT" ? (
          <>
            <LiveScore fixture={fixture} />
            {fixture.stats && (
              <MatchStatsPanel
                home={fixture.stats.home}
                away={fixture.stats.away}
                compact
              />
            )}
            {fixture.events && fixture.events.length > 0 && (
              <EventTimeline events={fixture.events} />
            )}
          </>
        ) : completed ? (
          <>
            <LiveScore fixture={fixture} />
            {fixture.stats && (
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span>
                  xG: {fixture.stats.home.xg.toFixed(1)} –{" "}
                  {fixture.stats.away.xg.toFixed(1)}
                </span>
                <span>
                  Corners: {fixture.stats.home.corners}–
                  {fixture.stats.away.corners}
                </span>
                <span>
                  Shots OT: {fixture.stats.home.shotsOnTarget}–
                  {fixture.stats.away.shotsOnTarget}
                </span>
                {(fixture.stats.home.redCards > 0 ||
                  fixture.stats.away.redCards > 0) && (
                  <span>
                    🟥 {fixture.stats.home.redCards}–
                    {fixture.stats.away.redCards}
                  </span>
                )}
              </div>
            )}
          </>
        ) : (
          <PreMatchTeams fixture={fixture} />
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 pt-0.5">
          {completed ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] px-2"
                onClick={() => onOpenDetail?.(fixture, "stats")}
              >
                View Stats
              </Button>
              {fixture.progressiveOdds &&
                fixture.progressiveOdds.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px] px-2"
                    onClick={() => onOpenDetail?.(fixture, "replay")}
                  >
                    <Zap className="size-2.5 mr-1" />
                    Replay
                  </Button>
                )}
            </>
          ) : (
            <>
              {activeArb && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] px-2 text-emerald-500 border-emerald-500/40 hover:bg-emerald-500/10"
                  onClick={() => onViewArb?.(fixture.id)}
                >
                  <Zap className="size-2.5 mr-1" />
                  View Arb
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] px-2"
                onClick={() => onOpenDetail?.(fixture, "stats")}
              >
                Details
              </Button>
              <Button
                size="sm"
                className="h-6 text-[10px] px-2 ml-auto"
                onClick={() => onOpenDetail?.(fixture, "stats")}
              >
                Place Bet
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
