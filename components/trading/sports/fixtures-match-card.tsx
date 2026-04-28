"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Cloud, Zap, Clock, Flag } from "lucide-react";
import type { Fixture, MatchStats } from "./types";
import { isLive, isCompleted, fmtOdds } from "./helpers";
import { StatusPill, LeagueBadge, ArbBadge, FormDots } from "./shared";
import { MOCK_ARB_STREAM, getBestOdds } from "@/lib/mocks/fixtures/sports-data";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

const CREST_COLOURS: Record<string, string> = {
  blue: "from-blue-600 to-blue-900",
  red: "from-red-600 to-red-900",
  white: "from-zinc-300 to-zinc-600",
  yellow: "from-yellow-500 to-yellow-800",
  green: "from-emerald-600 to-emerald-900",
};

function TeamCrest({ team }: { team: Fixture["home"] | Fixture["away"] }) {
  const gradient = CREST_COLOURS[team.logoSeed ?? "white"] ?? "from-zinc-600 to-zinc-900";
  return (
    <div
      className={cn(
        "rounded-md bg-gradient-to-br flex items-center justify-center font-black text-white shrink-0 border border-white/10 w-9 h-9 text-xs",
        gradient,
      )}
    >
      {team.shortName.slice(0, 3)}
    </div>
  );
}

function InlineStatsRow({ stats, homeS, awayS }: { stats: MatchStats; homeS: string; awayS: string }) {
  return (
    <p className="text-sm text-zinc-400 tabular-nums leading-snug">
      <span className="text-zinc-500 font-medium">{homeS}</span>
      <span className="text-zinc-600 mx-1">·</span>
      xG{" "}
      <span className="text-zinc-200 font-semibold">
        {formatNumber(stats.home.xg, 1)}-{formatNumber(stats.away.xg, 1)}
      </span>
      <span className="text-zinc-600 mx-1">·</span>
      SOT{" "}
      <span className="text-zinc-200 font-semibold">
        {stats.home.shotsOnTarget}-{stats.away.shotsOnTarget}
      </span>
      <span className="text-zinc-600 mx-1">·</span>
      Poss{" "}
      <span className="text-zinc-200 font-semibold">
        {stats.home.possession}%-{stats.away.possession}%
      </span>
      <span className="text-zinc-600 mx-1">·</span>
      Corn{" "}
      <span className="text-zinc-200 font-semibold">
        {stats.home.corners}-{stats.away.corners}
      </span>
      <span className="text-zinc-600 mx-1">·</span>
      <span className="text-zinc-500 font-medium">{awayS}</span>
    </p>
  );
}

function EventsOneLine({ events }: { events: NonNullable<Fixture["events"]> }) {
  const recent = [...events].slice(-4);
  return (
    <p className="text-sm text-zinc-500 truncate">
      {recent.map((ev, i) => (
        <span key={i}>
          {i > 0 && <span className="text-zinc-700"> · </span>}
          <span className="tabular-nums text-zinc-600">{ev.minute}&apos;</span>{" "}
          {ev.type === "goal" ? "⚽" : ev.type === "yellow_card" ? "🟨" : ev.type === "var" ? "VAR" : ""}{" "}
          <span className={ev.type === "goal" ? "text-zinc-200 font-semibold" : ""}>{ev.player.split(" ").pop()}</span>
        </span>
      ))}
    </p>
  );
}

function CompactOddsRow({
  homeOdds,
  drawOdds,
  awayOdds,
}: {
  homeOdds: ReturnType<typeof getBestOdds>;
  drawOdds: ReturnType<typeof getBestOdds>;
  awayOdds: ReturnType<typeof getBestOdds>;
}) {
  if (!homeOdds && !drawOdds && !awayOdds) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-bold tabular-nums">
      {homeOdds && (
        <span>
          <span className="text-zinc-500 text-xs font-semibold mr-1.5">Home</span>
          <span className="text-white">{fmtOdds(homeOdds.odds)}</span>
        </span>
      )}
      {drawOdds && (
        <span>
          <span className="text-zinc-500 text-xs font-semibold mr-1.5">Draw</span>
          <span className="text-white">{fmtOdds(drawOdds.odds)}</span>
        </span>
      )}
      {awayOdds && (
        <span>
          <span className="text-zinc-500 text-xs font-semibold mr-1.5">Away</span>
          <span className="text-white">{fmtOdds(awayOdds.odds)}</span>
        </span>
      )}
    </div>
  );
}

interface CardShellProps {
  children: React.ReactNode;
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
}

function CardShell({ children, selected, onSelect, className }: CardShellProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.();
        }
      }}
      className={cn(
        "rounded-lg border border-zinc-800 bg-[#0f0f0f] p-2.5 text-left transition-colors cursor-pointer",
        "hover:border-zinc-600 hover:bg-zinc-900/50",
        selected && "ring-2 ring-[#22d3ee]/50 border-[#22d3ee]/30 bg-zinc-900/60",
        className,
      )}
    >
      {children}
    </div>
  );
}

function LiveCard({
  fixture,
  selected,
  onSelect,
  onViewArb,
  onOpenDetail,
}: {
  fixture: Fixture;
  selected?: boolean;
  onSelect?: () => void;
  onViewArb?: (id: string) => void;
  onOpenDetail?: (f: Fixture, tab?: "stats" | "odds-history" | "replay") => void;
}) {
  const activeArb = MOCK_ARB_STREAM.find((a) => a.fixtureId === fixture.id && a.isActive);
  const score = fixture.score;
  const isHT = fixture.status === "HT";
  const isSusp = fixture.status === "SUSP";
  const stats = fixture.stats;

  const homeOdds = getBestOdds(fixture.id, `Home (${fixture.home.name})`, "FT Result");
  const drawOdds = getBestOdds(fixture.id, "Draw", "FT Result");
  const awayOdds = getBestOdds(fixture.id, `Away (${fixture.away.name})`, "FT Result");

  return (
    <CardShell
      selected={selected}
      onSelect={onSelect}
      className={cn(
        isSusp && "border-red-500/40",
        !isSusp && !isHT && "border-[#22d3ee]/15",
        isHT && "border-amber-500/25",
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <LeagueBadge league={fixture.league} />
          <span className="text-sm text-zinc-500">{fixture.round}</span>
          <div className="ml-auto flex items-center gap-2">
            {activeArb && (
              <button
                type="button"
                className="shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewArb?.(fixture.id);
                }}
              >
                <ArbBadge pct={activeArb.arbPct} />
              </button>
            )}
            <StatusPill status={fixture.status} minute={fixture.minute} />
          </div>
        </div>

        {isSusp && (
          <p className="text-sm text-red-400 font-semibold flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            Market suspended
          </p>
        )}
        {isHT && <p className="text-sm text-amber-400 font-medium">Half time: markets reopening shortly</p>}

        <div className="flex items-center gap-3 min-h-[2.75rem]">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <TeamCrest team={fixture.home} />
            <span className="text-base font-bold text-white truncate">{fixture.home.name}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 px-1">
            <span className="text-3xl font-black tabular-nums text-white">{score?.home ?? 0}</span>
            <span className="text-xl text-zinc-600">-</span>
            <span className="text-3xl font-black tabular-nums text-white">{score?.away ?? 0}</span>
            {score?.ht && (
              <span className="text-xs text-zinc-500 ml-1 hidden sm:inline">
                HT {score.ht.home}-{score.ht.away}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0 flex-row-reverse">
            <TeamCrest team={fixture.away} />
            <span className="text-base font-bold text-white truncate">{fixture.away.name}</span>
          </div>
        </div>

        {stats && <InlineStatsRow stats={stats} homeS={fixture.home.shortName} awayS={fixture.away.shortName} />}

        {fixture.events && fixture.events.length > 0 && <EventsOneLine events={fixture.events} />}

        <CompactOddsRow homeOdds={homeOdds} drawOdds={drawOdds} awayOdds={awayOdds} />

        <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/80">
          <Button
            type="button"
            size="sm"
            className="h-9 text-sm font-bold px-4 ml-auto bg-[#22d3ee] text-black hover:bg-[#22d3ee]/90"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.();
              onOpenDetail?.(fixture, "stats");
            }}
          >
            Place bet
          </Button>
        </div>
      </div>
    </CardShell>
  );
}

function PreMatchCard({
  fixture,
  selected,
  onSelect,
  onOpenDetail,
}: {
  fixture: Fixture;
  selected?: boolean;
  onSelect?: () => void;
  onOpenDetail?: (f: Fixture, tab?: "stats" | "odds-history" | "replay") => void;
}) {
  const [now] = React.useState(() => Date.now());
  const kickoff = new Date(fixture.kickoff);
  const diffMs = kickoff.getTime() - now;
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffM = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const countdown =
    diffMs <= 0
      ? "Starting soon"
      : diffH > 48
        ? `in ${Math.ceil(diffH / 24)}d`
        : diffH > 0
          ? `in ${diffH}h ${diffM}m`
          : `in ${diffM}m`;

  const homeOdds = getBestOdds(fixture.id, `Home (${fixture.home.name})`, "FT Result");
  const drawOdds = getBestOdds(fixture.id, "Draw", "FT Result");
  const awayOdds = getBestOdds(fixture.id, `Away (${fixture.away.name})`, "FT Result");
  const pm = fixture.preMatch;

  return (
    <CardShell selected={selected} onSelect={onSelect}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <LeagueBadge league={fixture.league} />
          <span className="text-sm text-zinc-500">{fixture.round}</span>
          <span className="ml-auto text-sm text-zinc-400 font-mono tabular-nums">
            {kickoff.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="text-sm font-semibold text-[#22d3ee]">{countdown}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <TeamCrest team={fixture.home} />
            <div className="min-w-0">
              <p className="text-base font-bold text-white truncate">{fixture.home.name}</p>
              {pm?.homeForm && <FormDots form={pm.homeForm} />}
            </div>
          </div>
          <span className="text-sm font-black text-zinc-600 shrink-0">vs</span>
          <div className="flex-1 flex items-center gap-2 flex-row-reverse min-w-0">
            <TeamCrest team={fixture.away} />
            <div className="min-w-0 text-right">
              <p className="text-base font-bold text-white truncate">{fixture.away.name}</p>
              {pm?.awayForm && (
                <div className="flex justify-end">
                  <FormDots form={pm.awayForm} />
                </div>
              )}
            </div>
          </div>
        </div>

        {pm && (
          <>
            <div className="flex h-1.5 rounded-full overflow-hidden bg-zinc-800">
              <div className="h-full bg-[#22d3ee]/70" style={{ width: `${pm.forecastProbs.homeWin * 100}%` }} />
              <div className="h-full bg-zinc-600/60" style={{ width: `${pm.forecastProbs.draw * 100}%` }} />
              <div className="h-full bg-[#a78bfa]/70" style={{ width: `${pm.forecastProbs.awayWin * 100}%` }} />
            </div>
            <p className="text-sm text-zinc-500">
              Implied: {formatPercent(pm.forecastProbs.homeWin * 100, 0)} /{" "}
              {formatPercent(pm.forecastProbs.draw * 100, 0)} / {formatPercent(pm.forecastProbs.awayWin * 100, 0)}
              {pm.xgModel && (
                <span className="text-zinc-600">
                  {" "}
                  · xG {formatNumber(pm.xgModel.home, 1)}-{formatNumber(pm.xgModel.away, 1)}
                </span>
              )}
            </p>
          </>
        )}

        {(pm?.weather || (pm && pm.injuries.length > 0)) && (
          <p className="text-sm text-zinc-500 flex flex-wrap items-center gap-x-3 gap-y-1">
            {pm.weather && (
              <span className="flex items-center gap-1">
                <Cloud className="size-4 shrink-0" />
                {pm.weather.tempC}°C {pm.weather.condition}
              </span>
            )}
            {pm.injuries.length > 0 && (
              <span className="text-amber-500/90">
                {pm.injuries.length} injury note
                {pm.injuries.length > 1 ? "s" : ""}
              </span>
            )}
          </p>
        )}

        <CompactOddsRow homeOdds={homeOdds} drawOdds={drawOdds} awayOdds={awayOdds} />

        <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/80">
          <Button
            type="button"
            size="sm"
            className="h-9 text-sm font-bold px-4 ml-auto bg-[#22d3ee] text-black"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.();
              onOpenDetail?.(fixture, "stats");
            }}
          >
            Place bet
          </Button>
        </div>
      </div>
    </CardShell>
  );
}

function CompletedCard({
  fixture,
  selected,
  onSelect,
  onOpenDetail,
}: {
  fixture: Fixture;
  selected?: boolean;
  onSelect?: () => void;
  onOpenDetail?: (f: Fixture, tab?: "stats" | "odds-history" | "replay") => void;
}) {
  const score = fixture.score;
  const stats = fixture.stats;
  const hasReplay = (fixture.progressiveOdds?.length ?? 0) > 0;
  const kickoff = new Date(fixture.kickoff);

  return (
    <CardShell selected={selected} onSelect={onSelect} className="opacity-90">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
          <LeagueBadge league={fixture.league} />
          <span className="text-sm text-zinc-500">
            {kickoff.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </span>
          <StatusPill status={fixture.status} />
        </div>
        <div className="flex items-center gap-3 flex-1 min-w-0 justify-center sm:justify-start">
          <span className="text-base font-bold text-zinc-300 truncate max-w-[40%]">{fixture.home.name}</span>
          <span className="text-2xl font-black tabular-nums text-white shrink-0">
            {score?.home ?? "-"}-{score?.away ?? "-"}
          </span>
          <span className="text-base font-bold text-zinc-300 truncate max-w-[40%] text-right">{fixture.away.name}</span>
        </div>
        {stats && (
          <p className="text-sm text-zinc-500 sm:ml-auto">
            xG {formatNumber(stats.home.xg, 1)}-{formatNumber(stats.away.xg, 1)}
            <span className="text-zinc-700 mx-2">·</span>
            Corners {stats.home.corners}-{stats.away.corners}
          </p>
        )}
        <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 text-sm"
            onClick={() => onOpenDetail?.(fixture, "stats")}
          >
            <Flag className="size-4 mr-1" />
            Stats
          </Button>
          {hasReplay && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 text-sm border-[#22d3ee]/30 text-[#22d3ee]"
              onClick={() => onOpenDetail?.(fixture, "replay")}
            >
              <Clock className="size-4 mr-1" />
              Replay
            </Button>
          )}
        </div>
      </div>
    </CardShell>
  );
}

export interface FixturesMatchCardProps {
  fixture: Fixture;
  selected?: boolean;
  onSelect?: (fixture: Fixture) => void;
  onViewArb?: (fixtureId: string) => void;
  onOpenDetail?: (fixture: Fixture, initialTab?: "stats" | "odds-history" | "replay") => void;
}

export function FixturesMatchCard({ fixture, selected, onSelect, onViewArb, onOpenDetail }: FixturesMatchCardProps) {
  const live = isLive(fixture.status) || fixture.status === "HT" || fixture.status === "SUSP";
  const completed = isCompleted(fixture.status);

  const sel = () => onSelect?.(fixture);

  if (live) {
    return (
      <LiveCard
        fixture={fixture}
        selected={selected}
        onSelect={sel}
        onViewArb={onViewArb}
        onOpenDetail={onOpenDetail}
      />
    );
  }
  if (completed) {
    return <CompletedCard fixture={fixture} selected={selected} onSelect={sel} onOpenDetail={onOpenDetail} />;
  }
  return <PreMatchCard fixture={fixture} selected={selected} onSelect={sel} onOpenDetail={onOpenDetail} />;
}
