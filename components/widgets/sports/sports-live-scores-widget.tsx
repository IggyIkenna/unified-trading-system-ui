"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { isLive } from "@/components/trading/sports/helpers";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useSportsData } from "./sports-data-context";

export function SportsLiveScoresWidget(_props: WidgetComponentProps) {
  const { filteredFixtures, setSelectedFixtureId, wsStatus } = useSportsData();

  const liveRows = React.useMemo(() => {
    return filteredFixtures.filter((f) => isLive(f.status) || f.status === "HT" || f.status === "SUSP");
  }, [filteredFixtures]);

  if (liveRows.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[2rem] px-2 text-micro text-muted-foreground uppercase tracking-wider">
        No live matches
      </div>
    );
  }

  return (
    <div className="flex items-stretch h-full min-h-[2rem] gap-px bg-border/30 rounded border border-border">
      {/* Connection status */}
      <div className="shrink-0 flex items-center px-2 border-r border-border/50">
        <span
          className={cn(
            "size-1.5 rounded-full",
            wsStatus === "connected"
              ? "bg-[var(--status-live)]"
              : wsStatus === "connecting"
                ? "bg-[var(--status-warning)] animate-pulse"
                : "bg-[var(--status-critical)]",
          )}
        />
        <span className="text-pico text-muted-foreground ml-1 uppercase">
          {wsStatus === "connected" ? "live" : (wsStatus ?? "off")}
        </span>
      </div>
      {liveRows.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => setSelectedFixtureId(f.id)}
          className={cn(
            "shrink-0 flex items-center gap-2 px-3 py-1.5 bg-card hover:bg-muted/40 text-left transition-colors",
            (isLive(f.status) || f.status === "HT") && "shadow-[inset_0_-2px_0_0_hsl(var(--primary))]",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full shrink-0",
              f.status === "SUSP" ? "bg-[var(--status-warning)]" : "bg-[var(--status-live)] animate-pulse",
            )}
          />
          <span className="text-micro font-bold text-foreground truncate max-w-[100px]">{f.home.shortName}</span>
          <span className="text-micro font-mono tabular-nums text-muted-foreground">
            {f.score ? `${f.score.home}–${f.score.away}` : "vs"}
          </span>
          <span className="text-micro font-bold text-foreground truncate max-w-[100px]">{f.away.shortName}</span>
          {f.minute != null && <span className="text-nano text-muted-foreground tabular-nums">{f.minute}′</span>}
        </button>
      ))}
    </div>
  );
}
