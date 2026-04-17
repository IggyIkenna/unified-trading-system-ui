"use client";

import * as React from "react";
import type { Prediction } from "@/components/trading/sports/types";
import { MOCK_PREDICTIONS } from "@/lib/mocks/fixtures/sports-data";
import { Spinner } from "@/components/shared/spinner";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { cn } from "@/lib/utils";
import { useSportsData } from "./sports-data-context";

function ProbBar({ label, prob, color }: { label: string; prob: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-zinc-500 w-8 text-right">{label}</span>
      <div className="flex-1 h-4 bg-zinc-800 rounded-sm overflow-hidden relative">
        <div className={cn("h-full rounded-sm", color)} style={{ width: `${prob * 100}%` }} />
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-white">
          {(prob * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function PredictionCard({ pred, fixtureLeague }: { pred: Prediction; fixtureLeague?: string }) {
  const [hoursUntil, setHoursUntil] = React.useState<number>(0);
  React.useEffect(() => {
    const kickoff = new Date(pred.kickoffUtc);
    setHoursUntil(Math.max(0, (kickoff.getTime() - Date.now()) / (1000 * 60 * 60)));
  }, [pred.kickoffUtc]);

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-200">
            {pred.homeTeam} vs {pred.awayTeam}
          </span>
          {fixtureLeague && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{fixtureLeague}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500">
            {hoursUntil < 24 ? `${hoursUntil.toFixed(0)}h` : `${(hoursUntil / 24).toFixed(0)}d`}
          </span>
          {pred.confidence != null && (
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded font-mono font-bold",
                pred.confidence >= 0.7
                  ? "bg-emerald-900/40 text-emerald-400"
                  : pred.confidence >= 0.5
                    ? "bg-amber-900/40 text-amber-400"
                    : "bg-red-900/40 text-red-400",
              )}
            >
              {(pred.confidence * 100).toFixed(0)}% conf
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <ProbBar label="H" prob={pred.homeWinProb} color="bg-blue-600" />
        <ProbBar label="D" prob={pred.drawProb} color="bg-zinc-500" />
        <ProbBar label="A" prob={pred.awayWinProb} color="bg-orange-600" />
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="text-center">
          <div className="text-[10px] text-zinc-500">xG H</div>
          <div className="text-xs font-mono font-bold text-zinc-200">{pred.xgHome.toFixed(1)}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-zinc-500">xG A</div>
          <div className="text-xs font-mono font-bold text-zinc-200">{pred.xgAway.toFixed(1)}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-zinc-500">O2.5</div>
          <div className="text-xs font-mono font-bold text-emerald-400">{(pred.over25Prob * 100).toFixed(0)}%</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-zinc-500">BTTS</div>
          <div className="text-xs font-mono font-bold text-emerald-400">{(pred.bttsProb * 100).toFixed(0)}%</div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
        <span className="text-[10px] text-zinc-600">{pred.source}</span>
        <span className="text-[10px] font-mono text-zinc-600">{pred.modelVersion}</span>
      </div>
    </div>
  );
}

export function SportsPredictionsWidget(_props: WidgetComponentProps) {
  const { filters, allFixtures, wsStatus } = useSportsData();

  if (wsStatus === "connecting") {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Spinner size="sm" className="text-muted-foreground" />
      </div>
    );
  }

  if (wsStatus === "error" || wsStatus === "disconnected") {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-destructive">Prediction data unavailable — connection error</p>
      </div>
    );
  }

  const allPredictions = Object.values(MOCK_PREDICTIONS);
  const filtered = allPredictions.filter((p) => {
    if (filters.leagues.length > 0) {
      const fixture = allFixtures.find((f) => f.id === p.fixtureId);
      if (fixture && !filters.leagues.includes(fixture.league)) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 shrink-0">
        <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Model Predictions</span>
        <span className="ml-auto text-[10px] text-zinc-600">{filtered.length} upcoming</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-xs text-zinc-600">
            No predictions for current filter
          </div>
        ) : (
          filtered.map((pred) => {
            const fixture = allFixtures.find((f) => f.id === pred.fixtureId);
            return <PredictionCard key={pred.fixtureId} pred={pred} fixtureLeague={fixture?.league} />;
          })
        )}
      </div>
    </div>
  );
}
