"use client";

/**
 * /services/data/processing — Processed candle data status.
 * FinderBrowser layout: Category → Venue → Instrument Type → Timeframe
 * Shows completion % per timeframe (1m → 5m → 15m → 1h → 4h → 1d).
 */

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  RefreshCw,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { FinderBrowser } from "@/components/shared/finder";
import type { FinderSelections } from "@/components/shared/finder";
import {
  PROCESSING_COLUMNS,
  getProcessingContextStats,
} from "@/components/data/processing-finder-config";
import {
  MOCK_PIPELINE_STAGES,
  MOCK_TIMEFRAME_STATUS,
} from "@/lib/data-service-mock-data";
import type { Timeframe } from "@/lib/data-service-types";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  "1m": "1 min",
  "5m": "5 min",
  "15m": "15 min",
  "1h": "1 hour",
  "4h": "4 hour",
  "1d": "Daily",
};

const ALL_TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "1h", "4h", "1d"];

// ─── Detail panel ─────────────────────────────────────────────────────────────

function ProcessingDetail({ selections }: { selections: FinderSelections }) {
  const tfItem = selections["timeframe"];
  const folderData = selections["folder"]?.data as
    | { folder: string; venue: string; cat: string }
    | undefined;

  if (tfItem) {
    const { tf, venue, folder, completionPct } = tfItem.data as {
      tf: Timeframe;
      venue: string;
      folder: string;
      completionPct: number;
    };
    const color =
      completionPct >= 50
        ? "text-emerald-400"
        : completionPct >= 20
          ? "text-yellow-400"
          : "text-red-400";
    const barColor =
      completionPct >= 50
        ? "bg-emerald-400"
        : completionPct >= 20
          ? "bg-yellow-400"
          : "bg-red-400";

    const isBlocked = completionPct < 5;

    return (
      <div className="p-4 space-y-4">
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Timeframe
          </p>
          <p className="text-sm font-semibold font-mono">{tf}</p>
          <p className="text-xs text-muted-foreground">
            {venue.replace(/_/g, " ")} / {folder.replace(/_/g, " ")} /{" "}
            {TIMEFRAME_LABELS[tf]} candles
          </p>
        </div>

        {isBlocked && (
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-medium mb-1">
              <AlertTriangle className="size-3" />
              Blocked upstream
            </div>
            <p className="text-muted-foreground">
              Processing requires raw data to be ingested first. Raw data
              completion for this venue is currently low.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Completion</span>
            <span className={cn("font-mono font-bold", color)}>
              {completionPct}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", barColor)}
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Status</p>
            <div className="flex items-center gap-1 mt-0.5">
              {completionPct >= 50 ? (
                <>
                  <CheckCircle2 className="size-3 text-emerald-400" />
                  <span className="text-emerald-400">Processing</span>
                </>
              ) : completionPct >= 5 ? (
                <>
                  <Clock className="size-3 text-amber-400" />
                  <span className="text-amber-400">Partial</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="size-3 text-red-400" />
                  <span className="text-red-400">Blocked</span>
                </>
              )}
            </div>
          </div>
          <div>
            <p className="text-muted-foreground">Bar interval</p>
            <p className="font-mono">{TIMEFRAME_LABELS[tf]}</p>
          </div>
        </div>

        <Button size="sm" className="w-full gap-2">
          <Cpu className="size-3" /> Configure Processing
        </Button>
      </div>
    );
  }

  if (folderData) {
    return (
      <div className="p-4 space-y-3">
        <p className="text-sm font-semibold capitalize">
          {folderData.folder.replace(/_/g, " ")}
        </p>
        <p className="text-xs text-muted-foreground">
          Select a timeframe to see completion details
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <Cpu className="size-8 mb-2 opacity-20" />
      <p className="text-sm font-medium text-muted-foreground">
        No timeframe selected
      </p>
      <p className="text-xs text-muted-foreground/60 mt-1">
        Drill down to see OHLCV completion per timeframe
      </p>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ProcessingPage() {
  const processingStage = MOCK_PIPELINE_STAGES.find(
    (s) => s.stage === "processing",
  );

  const timeframeAgg = ALL_TIMEFRAMES.map((tf) => {
    const entries = MOCK_TIMEFRAME_STATUS.filter((t) => t.timeframe === tf);
    const avg =
      entries.length > 0
        ? entries.reduce((s, e) => s + e.completionPct, 0) / entries.length
        : 0;
    return { tf, pct: Math.round(avg * 10) / 10 };
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-border/50">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Processing</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {processingStage
              ? `${processingStage.completionPct.toFixed(1)}% overall · raw ticks → OHLCV candles`
              : "Processed candle status — raw ticks converted to OHLCV timeframes"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {processingStage && processingStage.failedShards > 0 && (
            <Badge
              variant="outline"
              className="text-xs gap-1.5 border-red-400/30 text-red-400"
            >
              <AlertTriangle className="size-3" />
              {processingStage.failedShards} failed
            </Badge>
          )}
          {processingStage && processingStage.inProgressShards > 0 && (
            <Badge
              variant="outline"
              className="text-xs gap-1.5 border-blue-400/30 text-blue-400"
            >
              {processingStage.inProgressShards} active
            </Badge>
          )}
          <Button variant="outline" size="sm">
            <RefreshCw className="size-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Timeframe summary strip */}
      <div className="flex items-center gap-3 px-6 py-2.5 border-b border-border/30 bg-muted/10 overflow-x-auto">
        {timeframeAgg.map(({ tf, pct }) => (
          <div key={tf} className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono text-muted-foreground">
              {tf}
            </span>
            <div className="w-14 h-1.5 rounded-full bg-muted/60 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full",
                  pct >= 95
                    ? "bg-emerald-400"
                    : pct >= 80
                      ? "bg-yellow-400"
                      : "bg-red-400",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span
              className={cn(
                "text-xs font-mono",
                pct >= 95
                  ? "text-emerald-400"
                  : pct >= 80
                    ? "text-yellow-400"
                    : "text-red-400",
              )}
            >
              {pct.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>

      {/* FinderBrowser */}
      <FinderBrowser
        columns={PROCESSING_COLUMNS}
        detailPanel={(selections) => (
          <ProcessingDetail selections={selections} />
        )}
        contextStats={getProcessingContextStats}
        detailPanelTitle="Timeframe Detail"
        emptyState={
          <div className="text-center">
            <Cpu className="size-8 mb-2 opacity-20 mx-auto" />
            <p className="text-sm font-medium">Select a category</p>
            <p className="text-xs opacity-60 mt-1">
              Browse OHLCV candle completion by venue and timeframe
            </p>
          </div>
        }
      />
    </div>
  );
}
