"use client";

/**
 * DataFreshnessStrip — compact indicator showing data source and freshness.
 *
 * Required by UX_OPERATING_RULES.md Rule F:
 * "Any serious metric needs: source, as-of timestamp, freshness indicator.
 *  Stale data must be visually distinct from fresh data."
 */

import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Clock, Radio, Database, AlertTriangle } from "lucide-react";

export interface DataSource {
  label: string;
  source: "live" | "batch" | "cache";
  asOf?: string;
  /** Staleness threshold in seconds — data older than this is flagged */
  staleAfterSeconds?: number;
}

interface DataFreshnessStripProps {
  sources: DataSource[];
  compact?: boolean;
  className?: string;
}

function getAge(asOf: string): number {
  return (Date.now() - new Date(asOf).getTime()) / 1000;
}

function formatAge(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`;
  return `${Math.round(seconds / 86400)}d ago`;
}

const sourceIcons = {
  live: Radio,
  batch: Database,
  cache: Clock,
};

const sourceColors = {
  live: "text-[var(--status-live)]",
  batch: "text-primary",
  cache: "text-muted-foreground",
};

export function DataFreshnessStrip({
  sources,
  compact = true,
  className,
}: DataFreshnessStripProps) {
  const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);

  // Re-render every 10s to update age displays
  React.useEffect(() => {
    const interval = setInterval(forceUpdate, 10_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("flex items-center gap-3 text-[10px]", className)}>
      {sources.map((source) => {
        const Icon = sourceIcons[source.source];
        const isStale =
          source.asOf && source.staleAfterSeconds
            ? getAge(source.asOf) > source.staleAfterSeconds
            : false;
        const age = source.asOf ? getAge(source.asOf) : null;

        return (
          <TooltipProvider key={source.label} delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "flex items-center gap-1",
                    isStale ? "text-[var(--status-warning)]" : sourceColors[source.source],
                  )}
                >
                  {isStale ? (
                    <AlertTriangle className="size-3" />
                  ) : (
                    <Icon className={cn("size-3", source.source === "live" && "animate-pulse")} />
                  )}
                  {!compact && <span>{source.label}</span>}
                  {age !== null && <span className="font-mono">{formatAge(age)}</span>}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <div>
                  <strong>{source.label}</strong>
                </div>
                <div>Source: {source.source}</div>
                {source.asOf && <div>As of: {new Date(source.asOf).toLocaleString()}</div>}
                {isStale && <div className="text-[var(--status-warning)]">Data may be stale</div>}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}
