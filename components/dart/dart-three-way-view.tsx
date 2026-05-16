"use client";

/**
 * DartThreeWayView — pvl-p23a.
 *
 * Renders a side-by-side comparison of batch / paper / live strategy
 * runs for a given strategy_id. Each lane reads from the real backend
 * via GET /api/strategy/{id}/runs?mode={batch|paper|live}.
 *
 * Layout:
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │  [Batch]          [Paper]          [Live]                       │
 *   │  PnL: $xxx        PnL: $xxx        PnL: $xxx                   │
 *   │  Fills: N         Fills: N         Fills: N                     │
 *   │  Slippage: X bps  Slippage: X bps  Slippage: X bps             │
 *   │  Latency P99: Xms Latency P99: Xms Latency P99: Xms            │
 *   └─────────────────────────────────────────────────────────────────┘
 *
 * Shared filter scope: the strategy_id + limit apply across all three
 * lanes simultaneously. The dart-scope-bar.tsx archetype / instrument
 * filters compose via the strategy_id prop.
 *
 * Reference plan:
 *   unified-trading-pm/plans/active/master_to_live_defi_2026_05_23.md
 *   Group G Item 23 — pvl-p23a
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchStrategyRuns } from "@/lib/api/dart-client";
import type { RunRecord, RunMode, StrategyRunsResponse } from "@/lib/api/dart-client";
import { useAuth } from "@/hooks/use-auth";
import * as React from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const MODES: readonly RunMode[] = ["batch", "paper", "live"];
const POLL_INTERVAL_MS = 30_000;
const DEFAULT_LIMIT = 14;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatUsd(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function formatBps(n: number): string {
  return `${n.toFixed(1)} bps`;
}

function formatMs(n: number): string {
  return `${n.toFixed(0)} ms`;
}

function modeVariant(mode: RunMode): "default" | "secondary" | "outline" {
  if (mode === "live") return "default";
  if (mode === "paper") return "secondary";
  return "outline";
}

// ─── Lane card ───────────────────────────────────────────────────────────────

interface LaneCardProps {
  readonly mode: RunMode;
  readonly data: StrategyRunsResponse | null;
  readonly loading: boolean;
  readonly error: string | null;
}

function LaneCard({ mode, data, loading, error }: LaneCardProps) {
  const latestRun: RunRecord | null = data?.runs[0] ?? null;

  return (
    <Card className="flex-1 min-w-0" data-testid={`dart-three-way-lane-${mode}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Badge variant={modeVariant(mode)} className="capitalize">
            {mode}
          </Badge>
          {data && (
            <span className="text-xs text-muted-foreground font-normal">
              {data.total_count} run{data.total_count !== 1 ? "s" : ""}
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {loading && (
          <p className="text-xs text-muted-foreground animate-pulse" data-testid="dart-three-way-loading">
            Loading…
          </p>
        )}
        {!loading && error && (
          <p className="text-xs text-destructive" data-testid="dart-three-way-error">
            {error}
          </p>
        )}
        {!loading && !error && !latestRun && (
          <p className="text-xs text-muted-foreground" data-testid="dart-three-way-empty">
            No {mode} runs in the selected window.
          </p>
        )}
        {!loading && !error && latestRun && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs" data-testid={`dart-three-way-metrics-${mode}`}>
            <dt className="text-muted-foreground">Realized P&amp;L</dt>
            <dd className="font-mono font-medium" data-testid={`dart-three-way-pnl-${mode}`}>
              {formatUsd(latestRun.realized_pnl)}
            </dd>

            <dt className="text-muted-foreground">Fill count</dt>
            <dd className="font-mono" data-testid={`dart-three-way-fills-${mode}`}>
              {latestRun.fill_count}
            </dd>

            <dt className="text-muted-foreground">Avg slippage</dt>
            <dd className="font-mono" data-testid={`dart-three-way-slippage-${mode}`}>
              {formatBps(latestRun.slippage_bps_avg)}
            </dd>

            <dt className="text-muted-foreground">Latency P99</dt>
            <dd className="font-mono" data-testid={`dart-three-way-latency-${mode}`}>
              {formatMs(latestRun.order_latency_p99_ms)}
            </dd>

            <dt className="text-muted-foreground col-span-2 mt-1 border-t pt-1">Latest run</dt>
            <dd className="font-mono col-span-2 text-muted-foreground">{latestRun.run_date}</dd>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface DartThreeWayViewProps {
  /** Strategy ID to fetch runs for (shared filter scope). */
  readonly strategyId: string;
  /** Max runs per mode (1–90). Defaults to 14. */
  readonly limit?: number;
  /** Test-injection: override fetch per mode. */
  readonly fetcher?: (
    strategyId: string,
    mode: RunMode,
    limit: number,
    token: string | null,
  ) => Promise<StrategyRunsResponse>;
}

type LaneState = {
  data: StrategyRunsResponse | null;
  loading: boolean;
  error: string | null;
};

export function DartThreeWayView({
  strategyId,
  limit = DEFAULT_LIMIT,
  fetcher = fetchStrategyRuns,
}: DartThreeWayViewProps) {
  const { token } = useAuth();

  const [lanes, setLanes] = React.useState<Record<RunMode, LaneState>>({
    batch: { data: null, loading: true, error: null },
    paper: { data: null, loading: true, error: null },
    live: { data: null, loading: true, error: null },
  });

  const fetchAll = React.useCallback(async () => {
    setLanes((prev) => ({
      batch: { ...prev.batch, loading: true, error: null },
      paper: { ...prev.paper, loading: true, error: null },
      live: { ...prev.live, loading: true, error: null },
    }));

    await Promise.all(
      MODES.map(async (mode) => {
        try {
          const data = await fetcher(strategyId, mode, limit, token);
          setLanes((prev) => ({
            ...prev,
            [mode]: { data, loading: false, error: null },
          }));
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Failed to load";
          setLanes((prev) => ({
            ...prev,
            [mode]: { data: null, loading: false, error: msg },
          }));
        }
      }),
    );
  }, [strategyId, limit, token, fetcher]);

  React.useEffect(() => {
    void fetchAll();
    const id = setInterval(() => {
      void fetchAll();
    }, POLL_INTERVAL_MS);
    return () => {
      clearInterval(id);
    };
  }, [fetchAll]);

  return (
    <section data-testid="dart-three-way-view">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        3-Way comparison — batch / paper / live
      </h2>
      <div className="flex gap-4">
        {MODES.map((mode) => (
          <LaneCard
            key={mode}
            mode={mode}
            data={lanes[mode].data}
            loading={lanes[mode].loading}
            error={lanes[mode].error}
          />
        ))}
      </div>
    </section>
  );
}
