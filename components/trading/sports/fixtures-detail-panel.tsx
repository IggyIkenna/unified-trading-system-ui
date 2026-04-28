"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";
import { CloudSun, Pause, Play, RotateCcw, ShieldAlert, TrendingUp, Users, X } from "lucide-react";
import * as React from "react";
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { isCompleted } from "./helpers";
import { FormDots, LeagueBadge, MatchStatsPanel, StatusPill } from "./shared";
import type { Fixture, OddsMarket } from "./types";

// ─── Stats Tab (readable type scale) ─────────────────────────────────────────

function StatsTab({ fixture }: { fixture: Fixture }) {
  return (
    <div className="flex flex-col gap-5 p-4 overflow-auto">
      {fixture.stats ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm font-bold">
            <span className="text-zinc-100 truncate pr-2">{fixture.home.name}</span>
            <span className="text-xs text-zinc-500 uppercase tracking-widest shrink-0">Match stats</span>
            <span className="text-zinc-100 truncate text-right pl-2">{fixture.away.name}</span>
          </div>
          <MatchStatsPanel home={fixture.stats.home} away={fixture.stats.away} compact={false} />
        </div>
      ) : (
        <p className="text-base text-zinc-500 text-center py-10">Stats not yet available</p>
      )}

      {fixture.events && fixture.events.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Key events</p>
          <div className="relative flex flex-col gap-0">
            <div className="absolute left-10 top-2 bottom-2 w-px bg-zinc-800" />
            {fixture.events.map((ev, i) => {
              const icons: Record<string, string> = {
                goal: "⚽",
                yellow_card: "🟨",
                red_card: "🟥",
                substitution: "🔄",
                var: "📺",
                penalty: "🎯",
              };
              return (
                <div key={i} className="flex items-center gap-3 py-2 relative">
                  <span className="text-sm text-zinc-500 tabular-nums w-8 text-right shrink-0 font-medium">
                    {ev.minute}&apos;
                  </span>
                  <span className="relative z-10 text-lg leading-none">{icons[ev.type]}</span>
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <span className={cn("text-sm", ev.type === "goal" ? "font-bold text-white" : "text-zinc-200")}>
                      {ev.player}
                    </span>
                    {ev.detail && <span className="text-sm text-zinc-500">({ev.detail})</span>}
                    <span className="text-xs text-zinc-500 capitalize">{ev.team}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {fixture.lineups && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500">
            Lineups · {fixture.lineups.home.formation} vs {fixture.lineups.away.formation}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">{fixture.home.shortName}</p>
              {fixture.lineups.home.startingXI.map((p, i) => (
                <p key={i} className="text-sm text-zinc-300 py-1 border-b border-zinc-800/50 last:border-0">
                  {p}
                </p>
              ))}
              <p className="text-xs text-zinc-500 uppercase tracking-wider mt-3 mb-1">Subs</p>
              {fixture.lineups.home.subs.map((p, i) => (
                <p key={i} className="text-sm text-zinc-500">
                  {p}
                </p>
              ))}
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">{fixture.away.shortName}</p>
              {fixture.lineups.away.startingXI.map((p, i) => (
                <p key={i} className="text-sm text-zinc-300 py-1 border-b border-zinc-800/50 last:border-0">
                  {p}
                </p>
              ))}
              <p className="text-xs text-zinc-500 uppercase tracking-wider mt-3 mb-1">Subs</p>
              {fixture.lineups.away.subs.map((p, i) => (
                <p key={i} className="text-sm text-zinc-500">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ODDS_HISTORY_MARKETS: OddsMarket[] = ["FT Result", "Over/Under 2.5"];

function OddsHistoryTab({ fixture }: { fixture: Fixture }) {
  const [market, setMarket] = React.useState<OddsMarket>("FT Result");

  if (!fixture.progressiveOdds?.length) {
    return (
      <div className="flex items-center justify-center py-16 text-base text-zinc-500 px-4 text-center">
        Odds history only available for completed matches
      </div>
    );
  }

  const data = fixture.progressiveOdds.map((s) => ({
    minute: Math.round(s.minuteDecimal),
    home: s.odds1x2.home,
    draw: s.odds1x2.draw,
    away: s.odds1x2.away,
    over: s.ouOver,
    under: s.ouUnder,
  }));

  const goalMinutes = fixture.events?.filter((e) => e.type === "goal").map((e) => e.minute) ?? [];

  const tooltipStyle: React.CSSProperties = {
    background: "#111113",
    border: "1px solid #27272a",
    borderRadius: "6px",
    fontSize: 13,
    color: "#fafafa",
  };

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto">
      <div className="flex items-center gap-2 flex-wrap">
        {ODDS_HISTORY_MARKETS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMarket(m)}
            className={cn(
              "px-3 py-2 text-sm font-semibold rounded-md border transition-all",
              market === m
                ? "bg-[#22d3ee]/15 border-[#22d3ee]/40 text-[#22d3ee]"
                : "border-zinc-800 text-zinc-500 hover:text-zinc-300",
            )}
          >
            {m}
          </button>
        ))}
      </div>

      <p className="text-sm text-zinc-500">
        {fixture.progressiveOdds.length} snapshots · 30s intervals · vertical lines = goals
      </p>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 4 }}>
          <XAxis
            dataKey="minute"
            tickFormatter={(v: number) => `${v}'`}
            tick={{ fontSize: 11, fill: "#a1a1aa" }}
            tickCount={10}
            axisLine={{ stroke: "#27272a" }}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} domain={["auto", "auto"]} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(v: number, name: string) => [formatNumber(v, 2), name]}
            labelFormatter={(v: number) => `Minute ${v}'`}
            contentStyle={tooltipStyle}
          />
          {goalMinutes.map((min, i) => (
            <ReferenceLine key={i} x={min} stroke="#4ade80" strokeDasharray="3 3" strokeWidth={1} />
          ))}
          {market === "FT Result" ? (
            <>
              <Line dataKey="home" name={fixture.home.shortName} dot={false} stroke="#22d3ee" strokeWidth={2} />
              <Line dataKey="draw" name="Draw" dot={false} stroke="#71717a" strokeWidth={1.5} strokeDasharray="4 2" />
              <Line dataKey="away" name={fixture.away.shortName} dot={false} stroke="#a78bfa" strokeWidth={2} />
            </>
          ) : (
            <>
              <Line dataKey="over" name="Over 2.5" dot={false} stroke="#22d3ee" strokeWidth={2} />
              <Line dataKey="under" name="Under 2.5" dot={false} stroke="#f87171" strokeWidth={2} />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ReplayTab({ fixture }: { fixture: Fixture }) {
  const snapshots = fixture.progressiveStats;
  const oddsSnaps = fixture.progressiveOdds;
  const totalSnaps = snapshots?.length ?? 0;

  const [idx, setIdx] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    if (playing && totalSnaps > 0) {
      intervalRef.current = setInterval(() => {
        setIdx((prev) => {
          if (prev >= totalSnaps - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 400);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, totalSnaps]);

  if (!snapshots?.length) {
    return (
      <div className="flex items-center justify-center py-16 text-base text-zinc-500 px-4 text-center">
        Replay available for completed matches with progressive data only
      </div>
    );
  }

  const cur = snapshots[idx];
  const curOdds = oddsSnaps?.[idx];
  const progress = (idx / (totalSnaps - 1)) * 100;

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto">
      <div className="flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-2.5">
        <span className="text-xs font-black uppercase tracking-widest text-amber-400">As-Of replay</span>
        <span className="text-sm text-amber-200/80">
          Minute {Math.floor(cur.minuteDecimal)}&apos; · {cur.timer}
        </span>
        <div className="ml-auto h-2 w-20 rounded-full overflow-hidden bg-zinc-800">
          <div className="h-full bg-amber-400 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="h-9 w-9 p-0"
          onClick={() => {
            setPlaying(false);
            setIdx(0);
          }}
        >
          <RotateCcw className="size-4" />
        </Button>
        <Button
          size="sm"
          className={cn("h-9 px-4 text-sm font-bold", playing ? "bg-zinc-700" : "bg-[#22d3ee] text-black")}
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? (
            <>
              <Pause className="size-4 mr-1" />
              Pause
            </>
          ) : (
            <>
              <Play className="size-4 mr-1" />
              Play
            </>
          )}
        </Button>
        <span className="ml-auto text-sm text-zinc-500 tabular-nums font-mono">
          {cur.timer} / {snapshots[totalSnaps - 1]?.timer}
        </span>
      </div>

      <Slider
        min={0}
        max={totalSnaps - 1}
        step={1}
        value={[idx]}
        onValueChange={([v]) => {
          setPlaying(false);
          setIdx(v);
        }}
        className="w-full"
      />

      <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="flex items-center justify-between text-sm font-bold text-zinc-400">
          <span>{fixture.home.shortName}</span>
          <span className="text-xs text-zinc-600">Stats at {cur.timer}</span>
          <span>{fixture.away.shortName}</span>
        </div>
        <MatchStatsPanel home={cur.home} away={cur.away} compact={false} />
      </div>

      {curOdds && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Odds at {curOdds.timer}</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: fixture.home.shortName, value: curOdds.odds1x2.home },
              { label: "Draw", value: curOdds.odds1x2.draw },
              { label: fixture.away.shortName, value: curOdds.odds1x2.away },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1 rounded-lg bg-zinc-900/60 border border-zinc-800 px-2 py-3"
              >
                <span className="text-xs text-zinc-500">{label}</span>
                <span className="text-xl font-black text-white tabular-nums">{formatNumber(value, 2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Results Tab (completed fixtures: predicted vs actual, P&L) ─────────────

function ResultsTab({ fixture }: { fixture: Fixture }) {
  if (!fixture.score) {
    return (
      <div className="flex items-center justify-center py-16 text-base text-zinc-500 px-4 text-center">
        Results available for completed fixtures only
      </div>
    );
  }

  const totalGoals = fixture.score.home + fixture.score.away;
  const result =
    fixture.score.home > fixture.score.away
      ? "Home Win"
      : fixture.score.away > fixture.score.home
        ? "Away Win"
        : "Draw";
  const btts = fixture.score.home > 0 && fixture.score.away > 0;
  const over25 = totalGoals > 2;

  const pm = fixture.preMatch;
  const predicted = pm
    ? pm.forecastProbs.homeWin > pm.forecastProbs.awayWin
      ? "Home Win"
      : pm.forecastProbs.awayWin > pm.forecastProbs.homeWin
        ? "Away Win"
        : "Draw"
    : null;

  return (
    <div className="flex flex-col gap-5 p-4 overflow-auto">
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-1 rounded-lg bg-zinc-900/60 border border-zinc-800 px-2 py-3">
          <span className="text-xs text-zinc-500">Result</span>
          <span className="text-lg font-black text-white">{result}</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-zinc-900/60 border border-zinc-800 px-2 py-3">
          <span className="text-xs text-zinc-500">Total Goals</span>
          <span className="text-lg font-black text-white tabular-nums">{totalGoals}</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-zinc-900/60 border border-zinc-800 px-2 py-3">
          <span className="text-xs text-zinc-500">BTTS</span>
          <span className={cn("text-lg font-black", btts ? "text-[#4ade80]" : "text-red-400")}>
            {btts ? "Yes" : "No"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col items-center gap-1 rounded-lg bg-zinc-900/60 border border-zinc-800 px-2 py-3">
          <span className="text-xs text-zinc-500">Over 2.5</span>
          <span className={cn("text-lg font-black", over25 ? "text-[#4ade80]" : "text-red-400")}>
            {over25 ? "Yes" : "No"}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-zinc-900/60 border border-zinc-800 px-2 py-3">
          <span className="text-xs text-zinc-500">HT Score</span>
          <span className="text-lg font-black text-white tabular-nums">
            {fixture.score.ht ? `${fixture.score.ht.home} - ${fixture.score.ht.away}` : "N/A"}
          </span>
        </div>
      </div>

      {pm && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Predicted vs Actual</p>
          <div className="flex flex-col gap-2">
            {[
              {
                label: "Result",
                predicted: predicted ?? "N/A",
                actual: result,
                correct: predicted === result,
              },
              {
                label: "BTTS",
                predicted: pm.forecastProbs.homeWin > 0 ? "Likely" : "Unlikely",
                actual: btts ? "Yes" : "No",
                correct: null,
              },
              {
                label: "xG Home",
                predicted: formatNumber(pm.xgModel.home, 2),
                actual: fixture.stats ? formatNumber(fixture.stats.home.xg, 2) : "N/A",
                correct: null,
              },
              {
                label: "xG Away",
                predicted: formatNumber(pm.xgModel.away, 2),
                actual: fixture.stats ? formatNumber(fixture.stats.away.xg, 2) : "N/A",
                correct: null,
              },
            ].map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[1fr_1fr_1fr] items-center gap-2 py-1.5 border-b border-zinc-800/50 last:border-0"
              >
                <span className="text-xs text-zinc-500 uppercase tracking-wider">{row.label}</span>
                <span className="text-sm text-zinc-400 text-center">{row.predicted}</span>
                <span
                  className={cn(
                    "text-sm font-bold text-center",
                    row.correct === true ? "text-[#4ade80]" : row.correct === false ? "text-red-400" : "text-zinc-200",
                  )}
                >
                  {row.actual}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pre-Match Tab (NS fixtures: forecast, weather, injuries, form) ─────────

function PreMatchTab({ fixture }: { fixture: Fixture }) {
  const pm = fixture.preMatch;
  if (!pm) {
    return (
      <div className="flex items-center justify-center py-16 text-base text-zinc-500 px-4 text-center">
        Pre-match data available for upcoming fixtures only
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4 overflow-auto">
      {/* Model Probabilities */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
          <TrendingUp className="size-3" />
          Model forecast
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: fixture.home.shortName, prob: pm.forecastProbs.homeWin },
            { label: "Draw", prob: pm.forecastProbs.draw },
            { label: fixture.away.shortName, prob: pm.forecastProbs.awayWin },
          ].map(({ label, prob }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 rounded-lg bg-zinc-900/60 border border-zinc-800 px-2 py-3"
            >
              <span className="text-xs text-zinc-500">{label}</span>
              <span className="text-xl font-black text-white tabular-nums">{formatPercent(prob, 0)}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center gap-1 rounded-lg bg-zinc-900/60 border border-zinc-800 px-2 py-3">
            <span className="text-xs text-zinc-500">xG Home</span>
            <span className="text-lg font-black text-[#22d3ee] tabular-nums">{formatNumber(pm.xgModel.home, 2)}</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg bg-zinc-900/60 border border-zinc-800 px-2 py-3">
            <span className="text-xs text-zinc-500">xG Away</span>
            <span className="text-lg font-black text-[#a78bfa] tabular-nums">{formatNumber(pm.xgModel.away, 2)}</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Recent form (last 5)</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{fixture.home.shortName}</span>
            <FormDots form={pm.homeForm} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{fixture.away.shortName}</span>
            <FormDots form={pm.awayForm} />
          </div>
        </div>
      </div>

      {/* Weather */}
      {pm.weather && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
            <CloudSun className="size-3" />
            Weather
          </p>
          <div className="flex items-center gap-3 rounded-lg bg-zinc-900/60 border border-zinc-800 px-4 py-3">
            <span className="text-2xl font-black text-white tabular-nums">{pm.weather.tempC}°C</span>
            <span className="text-sm text-zinc-400 capitalize">{pm.weather.condition}</span>
          </div>
        </div>
      )}

      {/* Injuries */}
      {pm.injuries.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
            <ShieldAlert className="size-3" />
            Injuries & absences ({pm.injuries.length})
          </p>
          <div className="flex flex-col gap-1">
            {pm.injuries.map((inj, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-zinc-800/50 last:border-0">
                <span
                  className={cn(
                    "text-xs font-bold uppercase w-10 text-center",
                    inj.team === "home" ? "text-[#22d3ee]" : "text-[#a78bfa]",
                  )}
                >
                  {inj.team === "home" ? fixture.home.shortName : fixture.away.shortName}
                </span>
                <span className="text-sm text-zinc-200">{inj.player}</span>
                <span className="text-xs text-zinc-500 ml-auto">{inj.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── In-page panel (no overlay — sits beside fixture list on lg+) ───────────

export interface FixtureDetailPanelProps {
  fixture: Fixture;
  initialTab?: "stats" | "pre-match" | "results" | "odds-history" | "replay";
  onClose?: () => void;
  /** When false, omit header X (e.g. dialog already has a close control). */
  showHeaderClose?: boolean;
  className?: string;
}

export function FixtureDetailPanel({
  fixture,
  initialTab = "stats",
  onClose,
  showHeaderClose = true,
  className,
}: FixtureDetailPanelProps) {
  const completed = isCompleted(fixture.status);
  const hasProgressiveData = (fixture.progressiveOdds?.length ?? 0) > 0;
  const hasPreMatch = !!fixture.preMatch;

  const [tab, setTab] = React.useState(initialTab);
  React.useEffect(() => {
    setTab(initialTab);
  }, [initialTab, fixture.id]);

  return (
    <div className={cn("flex flex-col min-h-0 h-full bg-[#0a0a0b] border-zinc-800", className)}>
      <div className="relative border-b border-zinc-800 bg-[#0d0d0d] shrink-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#22d3ee]/40 to-transparent" />
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <LeagueBadge league={fixture.league} />
            <span className="text-sm text-zinc-500">{fixture.round}</span>
            <StatusPill status={fixture.status} minute={fixture.minute} className="ml-auto" />
            {onClose && showHeaderClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-zinc-500 hover:text-white p-1 rounded-md hover:bg-zinc-800"
                aria-label="Close details"
              >
                <X className="size-5" />
              </button>
            )}
          </div>

          {fixture.score ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-zinc-100 truncate">{fixture.home.name}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-4xl font-black text-white tabular-nums">{fixture.score.home}</span>
                <span className="text-2xl text-zinc-600">-</span>
                <span className="text-4xl font-black text-white tabular-nums">{fixture.score.away}</span>
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p className="text-base font-bold text-zinc-100 truncate">{fixture.away.name}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <p className="text-base font-bold text-zinc-100 truncate">{fixture.home.name}</p>
              <span className="text-sm text-zinc-600 font-bold shrink-0">vs</span>
              <p className="text-base font-bold text-zinc-100 truncate text-right">{fixture.away.name}</p>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm text-zinc-500 mt-2">
            <span>{fixture.venue}</span>
            {fixture.referee && (
              <>
                <span className="text-zinc-700">·</span>
                <span className="flex items-center gap-1">
                  <Users className="size-3" />
                  {fixture.referee}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex flex-col flex-1 min-h-0">
        <div className="border-b border-zinc-800 px-2 shrink-0">
          <TabsList className="h-11 bg-transparent gap-0 p-0 w-full flex flex-wrap">
            <TabsTrigger
              value="stats"
              className="flex-1 min-w-[4.5rem] text-sm font-bold data-[state=active]:border-b-2 data-[state=active]:border-[#22d3ee] data-[state=active]:text-[#22d3ee] data-[state=active]:bg-transparent rounded-none h-11 px-2"
            >
              Stats
            </TabsTrigger>
            {hasPreMatch && (
              <TabsTrigger
                value="pre-match"
                className="flex-1 min-w-[5.5rem] text-sm font-bold data-[state=active]:border-b-2 data-[state=active]:border-[#4ade80] data-[state=active]:text-[#4ade80] data-[state=active]:bg-transparent rounded-none h-11 px-2"
              >
                Pre-Match
              </TabsTrigger>
            )}
            {completed && (
              <TabsTrigger
                value="results"
                className="flex-1 min-w-[5rem] text-sm font-bold data-[state=active]:border-b-2 data-[state=active]:border-[#4ade80] data-[state=active]:text-[#4ade80] data-[state=active]:bg-transparent rounded-none h-11 px-2"
              >
                Results
              </TabsTrigger>
            )}
            {completed && (
              <TabsTrigger
                value="odds-history"
                className="flex-1 min-w-[5rem] text-sm font-bold data-[state=active]:border-b-2 data-[state=active]:border-[#22d3ee] data-[state=active]:text-[#22d3ee] data-[state=active]:bg-transparent rounded-none h-11 px-2"
              >
                Odds
              </TabsTrigger>
            )}
            {completed && hasProgressiveData && (
              <TabsTrigger
                value="replay"
                className="flex-1 min-w-[4.5rem] text-sm font-bold data-[state=active]:border-b-2 data-[state=active]:border-amber-400 data-[state=active]:text-amber-400 data-[state=active]:bg-transparent rounded-none h-11 px-2"
              >
                Replay
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          <TabsContent value="stats" className="mt-0 h-full">
            <StatsTab fixture={fixture} />
          </TabsContent>
          {hasPreMatch && (
            <TabsContent value="pre-match" className="mt-0 h-full">
              <PreMatchTab fixture={fixture} />
            </TabsContent>
          )}
          {completed && (
            <TabsContent value="results" className="mt-0 h-full">
              <ResultsTab fixture={fixture} />
            </TabsContent>
          )}
          {completed && (
            <TabsContent value="odds-history" className="mt-0 h-full">
              <OddsHistoryTab fixture={fixture} />
            </TabsContent>
          )}
          {completed && hasProgressiveData && (
            <TabsContent value="replay" className="mt-0 h-full">
              <ReplayTab fixture={fixture} />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
