"use client";

import * as React from "react";
import type { Prediction } from "@/components/trading/sports/types";
import { Spinner } from "@/components/shared/spinner";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { cn } from "@/lib/utils";
import { useSportsData } from "./sports-data-context";

function ProbBar({ label, prob, color }: { label: string; prob: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-micro text-muted-foreground w-8 text-right">{label}</span>
      <div className="flex-1 h-4 bg-muted rounded-sm overflow-hidden relative">
        <div className={cn("h-full rounded-sm", color)} style={{ width: `${prob * 100}%` }} />
        <span className="absolute inset-0 flex items-center justify-center text-micro font-mono font-bold text-foreground">
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
    <div className="rounded-md border border-border bg-card/60 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-micro font-bold text-foreground">
            {pred.homeTeam} vs {pred.awayTeam}
          </span>
          {fixtureLeague && (
            <span className="text-micro px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{fixtureLeague}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-micro text-muted-foreground">
            {hoursUntil < 24 ? `${hoursUntil.toFixed(0)}h` : `${(hoursUntil / 24).toFixed(0)}d`}
          </span>
          {pred.confidence != null && (
            <span
              className={cn(
                "text-micro px-1.5 py-0.5 rounded font-mono font-bold",
                pred.confidence >= 0.7
                  ? "bg-[var(--risk-healthy)]/20 text-[var(--status-live)]"
                  : pred.confidence >= 0.5
                    ? "bg-[var(--status-warning)]/20 text-[var(--status-warning)]"
                    : "bg-[var(--status-critical)]/20 text-[var(--status-critical)]",
              )}
            >
              {(pred.confidence * 100).toFixed(0)}% conf
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <ProbBar label="H" prob={pred.homeWinProb} color="bg-blue-600" />
        <ProbBar label="D" prob={pred.drawProb} color="bg-muted-foreground/60" />
        <ProbBar label="A" prob={pred.awayWinProb} color="bg-orange-600" />
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="text-center">
          <div className="text-micro text-muted-foreground">xG H</div>
          <div className="text-micro font-mono font-bold text-foreground">{pred.xgHome.toFixed(1)}</div>
        </div>
        <div className="text-center">
          <div className="text-micro text-muted-foreground">xG A</div>
          <div className="text-micro font-mono font-bold text-foreground">{pred.xgAway.toFixed(1)}</div>
        </div>
        <div className="text-center">
          <div className="text-micro text-muted-foreground">O2.5</div>
          <div className="text-micro font-mono font-bold text-[var(--pnl-positive)]">
            {(pred.over25Prob * 100).toFixed(0)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-micro text-muted-foreground">BTTS</div>
          <div className="text-micro font-mono font-bold text-[var(--pnl-positive)]">
            {(pred.bttsProb * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border/50">
        <span className="text-nano text-muted-foreground/60">{pred.source}</span>
        <span className="text-nano font-mono text-muted-foreground/60">{pred.modelVersion}</span>
      </div>
    </div>
  );
}

export function SportsPredictionsWidget(_props: WidgetComponentProps) {
  const { filters, allFixtures, wsStatus, predictions } = useSportsData();

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

  const allPredictions = Object.values(predictions);
  const filtered = allPredictions.filter((p) => {
    if (filters.leagues.length > 0) {
      const fixture = allFixtures.find((f) => f.id === p.fixtureId);
      if (fixture && !filters.leagues.includes(fixture.league)) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Model Predictions</span>
        <span className="ml-auto text-nano text-muted-foreground/60">{filtered.length} upcoming</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
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
