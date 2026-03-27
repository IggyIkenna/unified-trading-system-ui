"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Play, Pause, RotateCcw } from "lucide-react";
import type { Fixture, OddsMarket } from "./types";
import { isCompleted, getStatusLabel } from "./helpers";
import {
  LeagueBadge,
  StatusPill,
  MatchStatsPanel,
  DualStatBar,
} from "./shared";

// ─── Stats Tab ────────────────────────────────────────────────────────────────

function StatsTab({ fixture }: { fixture: Fixture }) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Full stat bars */}
      {fixture.stats ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className="truncate">{fixture.home.name}</span>
            <span className="text-muted-foreground text-[10px]">
              Full Time Stats
            </span>
            <span className="truncate text-right">{fixture.away.name}</span>
          </div>
          <MatchStatsPanel
            home={fixture.stats.home}
            away={fixture.stats.away}
            compact={false}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">
          No stats available yet
        </p>
      )}

      {/* Key events */}
      {fixture.events && fixture.events.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Key Events
          </p>
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
              <div key={i} className="flex items-center gap-2 text-xs">
                <Badge
                  variant="outline"
                  className="text-[9px] w-10 shrink-0 justify-center"
                >
                  {ev.minute}&apos;
                </Badge>
                <span>{icons[ev.type]}</span>
                <span
                  className={cn(
                    "flex-1",
                    ev.type === "goal" && "font-semibold",
                  )}
                >
                  {ev.player}
                </span>
                {ev.detail && (
                  <span className="text-muted-foreground">{ev.detail}</span>
                )}
                <span className="text-muted-foreground/60 capitalize text-[10px]">
                  {ev.team}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Lineups */}
      {fixture.lineups && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Lineups — {fixture.lineups.home.formation} vs{" "}
            {fixture.lineups.away.formation}
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="font-semibold mb-1 text-[10px]">
                {fixture.home.name}
              </p>
              {fixture.lineups.home.startingXI.map((p, i) => (
                <p
                  key={i}
                  className="text-muted-foreground py-0.5 border-b border-border/30 last:border-0"
                >
                  {p}
                </p>
              ))}
              <p className="mt-1 text-[10px] text-muted-foreground uppercase tracking-wider">
                Subs
              </p>
              {fixture.lineups.home.subs.map((p, i) => (
                <p key={i} className="text-muted-foreground/60">
                  {p}
                </p>
              ))}
            </div>
            <div>
              <p className="font-semibold mb-1 text-[10px]">
                {fixture.away.name}
              </p>
              {fixture.lineups.away.startingXI.map((p, i) => (
                <p
                  key={i}
                  className="text-muted-foreground py-0.5 border-b border-border/30 last:border-0"
                >
                  {p}
                </p>
              ))}
              <p className="mt-1 text-[10px] text-muted-foreground uppercase tracking-wider">
                Subs
              </p>
              {fixture.lineups.away.subs.map((p, i) => (
                <p key={i} className="text-muted-foreground/60">
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

// ─── Odds History Tab ─────────────────────────────────────────────────────────

const ODDS_HISTORY_MARKETS: OddsMarket[] = ["FT Result", "Over/Under 2.5"];

function OddsHistoryTab({ fixture }: { fixture: Fixture }) {
  const [selectedMarket, setSelectedMarket] =
    React.useState<OddsMarket>("FT Result");

  if (!fixture.progressiveOdds || fixture.progressiveOdds.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground p-4">
        Odds history only available for completed matches
      </div>
    );
  }

  const data = fixture.progressiveOdds.map((snap) => ({
    minute: snap.minuteDecimal,
    home: snap.odds1x2.home,
    draw: snap.odds1x2.draw,
    away: snap.odds1x2.away,
    over: snap.ouOver,
    under: snap.ouUnder,
  }));

  const goalMinutes =
    fixture.events?.filter((e) => e.type === "goal").map((e) => e.minute) ?? [];

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Market selector */}
      <div className="flex items-center gap-1">
        {ODDS_HISTORY_MARKETS.map((m) => (
          <button
            key={m}
            onClick={() => setSelectedMarket(m)}
            className={cn(
              "px-2.5 py-1 text-xs rounded-full border transition-colors",
              selectedMarket === m
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="text-[10px] text-muted-foreground">
        Odds movement across {fixture.progressiveOdds.length} snapshots (30s
        intervals)
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart
          data={data}
          margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
        >
          <XAxis
            dataKey="minute"
            tickFormatter={(v: number) => `${Math.round(v)}'`}
            tick={{ fontSize: 9 }}
            tickCount={10}
          />
          <YAxis tick={{ fontSize: 9 }} domain={["auto", "auto"]} />
          <Tooltip
            formatter={(v: number, name: string) => [v.toFixed(2), name]}
            labelFormatter={(v: number) => `Minute ${Math.round(v)}'`}
            contentStyle={{ fontSize: 11 }}
          />
          {goalMinutes.map((min, i) => (
            <ReferenceLine
              key={i}
              x={min}
              stroke="var(--color-emerald-500)"
              strokeDasharray="3 3"
            />
          ))}
          {selectedMarket === "FT Result" ? (
            <>
              <Line
                dataKey="home"
                name="Home Win"
                dot={false}
                stroke="hsl(var(--primary))"
                strokeWidth={1.5}
              />
              <Line
                dataKey="draw"
                name="Draw"
                dot={false}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1}
                strokeDasharray="4 2"
              />
              <Line
                dataKey="away"
                name="Away Win"
                dot={false}
                stroke="hsl(var(--destructive))"
                strokeWidth={1.5}
              />
            </>
          ) : (
            <>
              <Line
                dataKey="over"
                name="Over 2.5"
                dot={false}
                stroke="hsl(var(--primary))"
                strokeWidth={1.5}
              />
              <Line
                dataKey="under"
                name="Under 2.5"
                dot={false}
                stroke="hsl(var(--destructive))"
                strokeWidth={1.5}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>

      <p className="text-[9px] text-muted-foreground">
        Vertical lines mark goal events. Data from external provider.
      </p>
    </div>
  );
}

// ─── Replay Tab ───────────────────────────────────────────────────────────────

function ReplayTab({ fixture }: { fixture: Fixture }) {
  const snapshots = fixture.progressiveStats;
  const oddsSnapshots = fixture.progressiveOdds;

  const [sliderIdx, setSliderIdx] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSnaps = snapshots?.length ?? 0;

  // Auto-advance at 2s per step (simulating ~30s real match time per tick)
  React.useEffect(() => {
    if (playing && totalSnaps > 0) {
      intervalRef.current = setInterval(() => {
        setSliderIdx((prev) => {
          if (prev >= totalSnaps - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 500); // 0.5s per step = smooth replay
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, totalSnaps]);

  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground p-4">
        Replay only available for completed matches with progressive data
      </div>
    );
  }

  const currentStats = snapshots[sliderIdx];
  const currentOdds = oddsSnapshots?.[sliderIdx];

  function reset() {
    setPlaying(false);
    setSliderIdx(0);
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* As-Of banner */}
      <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
        <span className="font-semibold">Simulated As-Of</span>
        <span>
          — showing match state at minute{" "}
          {Math.floor(currentStats.minuteDecimal)}&apos;
        </span>
        <span className="ml-auto text-amber-300/60">{currentStats.timer}</span>
      </div>

      {/* Playback controls */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={reset}
        >
          <RotateCcw className="size-3" />
        </Button>
        <Button
          size="sm"
          variant={playing ? "secondary" : "default"}
          className="h-7 px-3 text-xs"
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? (
            <>
              <Pause className="size-3 mr-1" />
              Pause
            </>
          ) : (
            <>
              <Play className="size-3 mr-1" />
              Play
            </>
          )}
        </Button>
        <span className="text-xs text-muted-foreground ml-auto tabular-nums">
          {currentStats.timer} / {snapshots[snapshots.length - 1]?.timer}
        </span>
      </div>

      {/* Slider */}
      <Slider
        min={0}
        max={totalSnaps - 1}
        step={1}
        value={[sliderIdx]}
        onValueChange={([v]) => {
          setPlaying(false);
          setSliderIdx(v);
        }}
        className="w-full"
      />

      {/* Tick marks for events */}
      {fixture.events && (
        <div className="relative h-2 w-full">
          {fixture.events.map((ev, i) => {
            const pct =
              (ev.minute / (snapshots[totalSnaps - 1]?.minuteDecimal ?? 90)) *
              100;
            return (
              <span
                key={i}
                className="absolute top-0 -translate-x-1/2 text-[8px]"
                style={{ left: `${pct}%` }}
                title={`${ev.minute}' ${ev.player}`}
              >
                {ev.type === "goal" ? "⚽" : ev.type === "red_card" ? "🟥" : ""}
              </span>
            );
          })}
        </div>
      )}

      {/* Current stats at this minute */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span>{fixture.home.shortName}</span>
          <span className="text-muted-foreground text-[10px]">
            Stats at {currentStats.timer}
          </span>
          <span>{fixture.away.shortName}</span>
        </div>
        <MatchStatsPanel
          home={currentStats.home}
          away={currentStats.away}
          compact={false}
        />
      </div>

      {/* Odds at this minute */}
      {currentOdds && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Odds at {currentOdds.timer}
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: "Home Win", value: currentOdds.odds1x2.home },
              { label: "Draw", value: currentOdds.odds1x2.draw },
              { label: "Away Win", value: currentOdds.odds1x2.away },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-0.5 rounded-md bg-muted/30 px-2 py-1.5"
              >
                <span className="text-[9px] text-muted-foreground">
                  {label}
                </span>
                <span className="text-sm font-bold tabular-nums">
                  {value.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="flex flex-col items-center gap-0.5 rounded-md bg-muted/30 px-2 py-1.5">
              <span className="text-[9px] text-muted-foreground">
                Over {currentOdds.ouLine}
              </span>
              <span className="text-sm font-bold tabular-nums">
                {currentOdds.ouOver.toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5 rounded-md bg-muted/30 px-2 py-1.5">
              <span className="text-[9px] text-muted-foreground">
                Under {currentOdds.ouLine}
              </span>
              <span className="text-sm font-bold tabular-nums">
                {currentOdds.ouUnder.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Drawer Shell ─────────────────────────────────────────────────────────────

interface FixturesDetailDrawerProps {
  fixture: Fixture | null;
  initialTab?: "stats" | "odds-history" | "replay";
  open: boolean;
  onClose: () => void;
}

export function FixturesDetailDrawer({
  fixture,
  initialTab = "stats",
  open,
  onClose,
}: FixturesDetailDrawerProps) {
  const completed = fixture ? isCompleted(fixture.status) : false;
  const hasProgressiveData = (fixture?.progressiveOdds?.length ?? 0) > 0;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full max-w-md p-0 flex flex-col">
        {fixture && (
          <>
            <SheetHeader className="px-4 pt-4 pb-2 border-b shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <LeagueBadge league={fixture.league} />
                <span className="text-xs text-muted-foreground">
                  {fixture.round}
                </span>
                <StatusPill
                  status={fixture.status}
                  minute={fixture.minute}
                  className="ml-auto"
                />
              </div>
              <SheetTitle className="text-sm font-semibold mt-1">
                {fixture.home.name} vs {fixture.away.name}
              </SheetTitle>
              {fixture.score && (
                <p className="text-2xl font-bold tabular-nums">
                  {fixture.score.home} — {fixture.score.away}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground">
                {fixture.venue}
              </p>
            </SheetHeader>

            <Tabs
              defaultValue={initialTab}
              className="flex-1 min-h-0 flex flex-col"
            >
              <TabsList className="mx-4 mt-2 mb-0 h-8 bg-muted/40 shrink-0">
                <TabsTrigger value="stats" className="text-xs flex-1">
                  Stats
                </TabsTrigger>
                {completed && (
                  <TabsTrigger value="odds-history" className="text-xs flex-1">
                    Odds History
                  </TabsTrigger>
                )}
                {completed && hasProgressiveData && (
                  <TabsTrigger value="replay" className="text-xs flex-1">
                    Replay
                  </TabsTrigger>
                )}
              </TabsList>

              <div className="flex-1 overflow-auto">
                <TabsContent value="stats" className="mt-0 h-full">
                  <StatsTab fixture={fixture} />
                </TabsContent>
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
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
