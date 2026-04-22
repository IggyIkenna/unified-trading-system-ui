"use client";

/**
 * <PerformanceOverlay> — Plan C continuous backtest / paper / live
 * timeline primitive for a single strategy instance.
 *
 * Rendered on:
 *   - FOMO tearsheet cards (stitched mode)
 *   - DART terminal Performance tab (overlay mode)
 *   - Reports IM allocator subsection (split mode, per_venue)
 *
 * SSOT: unified-trading-pm/codex/09-strategy/architecture-v2/performance-overlay.md.
 *
 * Source of truth — the API resolves `live` to odum-live's
 * representative-account run (never a real client's flow). See
 * memory/project_fomo_tearsheets_show_live_is_odum_own_run_2026_04_21.md.
 *
 * Missing-view fallback: if the backing series is empty or absent, the
 * corresponding toggle is disabled with a tooltip explaining why. Per
 * the codex "silent omission" rule — no error states for missing series.
 */

import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePerformanceOverlay } from "@/hooks/api/use-performance-overlay";
import type {
  PerformancePerViewSeries,
  PerformanceSeriesPoint,
  PerformanceSeriesResponse,
  PerformanceView,
} from "@/lib/api/performance-overlay";

import { PerformanceOverlayStats } from "./PerformanceOverlayStats";

export type PerformanceOverlayMode = "overlay" | "stitched" | "split";

export interface PerformanceOverlayProps {
  readonly instanceId: string;
  readonly mode: PerformanceOverlayMode;
  readonly views: readonly PerformanceView[];
  readonly from?: string;
  readonly to?: string;
  readonly perVenue?: boolean;
  readonly showPhaseMarkers?: boolean;
  readonly showStats?: boolean;
  readonly showViewToggles?: boolean;
  readonly heightClass?: string;
  readonly className?: string;
  /**
   * Test / server-render override: inject a pre-fetched response to skip
   * the network hook entirely. Used in vitest (no QueryClientProvider)
   * and in any surface that already has the data in scope.
   */
  readonly seriesOverride?: PerformanceSeriesResponse;
}

interface ViewStyle {
  readonly label: string;
  readonly stroke: string;
  readonly fill: string;
  readonly description: string;
}

const VIEW_STYLES: Record<PerformanceView, ViewStyle> = {
  backtest: {
    label: "Backtest",
    stroke: "#8AA4C7",
    fill: "rgba(138, 164, 199, 0.18)",
    description: "Historical simulation",
  },
  paper: {
    label: "Paper",
    stroke: "#E0A84A",
    fill: "rgba(224, 168, 74, 0.18)",
    description: "odum-paper matching-engine fills",
  },
  live: {
    label: "Live",
    stroke: "#27AE60",
    fill: "rgba(39, 174, 96, 0.22)",
    description: "odum-live real-venue fills",
  },
};

const PHASE_BADGE_TONE: Record<string, string> = {
  paper_1d: "bg-amber-500/20 text-amber-200 border-amber-500/40",
  paper_14d: "bg-amber-500/20 text-amber-200 border-amber-500/40",
  paper_stable: "bg-violet-500/20 text-violet-200 border-violet-500/40",
  live_early: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
  live_stable: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
};

interface OverlayPoint extends Record<string, number | string | null> {
  readonly t: string;
  readonly tMs: number;
}

function toMs(iso: string): number {
  return new Date(iso).getTime();
}

function formatDateTick(value: number): string {
  if (!Number.isFinite(value)) return "";
  const d = new Date(value);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

/**
 * Reshape per-view series into a single time-merged list of rows suitable
 * for recharts (one row per unique timestamp, one column per view).
 */
function mergeSeriesForOverlay(
  response: PerformanceSeriesResponse,
  views: readonly PerformanceView[],
): OverlayPoint[] {
  const byTime = new Map<number, OverlayPoint>();
  for (const view of views) {
    const series = response.series[view];
    if (!series) continue;
    for (const point of series.aggregate) {
      const ms = toMs(point.t);
      const existing = byTime.get(ms);
      if (existing) {
        existing[view] = point.pnl;
      } else {
        const row: OverlayPoint = {
          t: point.t,
          tMs: ms,
          backtest: null,
          paper: null,
          live: null,
        };
        row[view] = point.pnl;
        byTime.set(ms, row);
      }
    }
  }
  return Array.from(byTime.values()).sort((a, b) => a.tMs - b.tMs);
}

/**
 * Stitched-mode reshape: single column `pnl` whose value comes from
 * backtest → paper → live in precedence order (later views shadow
 * earlier). Preserves the "single continuous line" story.
 */
function stitchSeries(
  response: PerformanceSeriesResponse,
  views: readonly PerformanceView[],
): OverlayPoint[] {
  const merged = mergeSeriesForOverlay(response, views);
  const priority: PerformanceView[] = ["live", "paper", "backtest"];
  for (const row of merged) {
    for (const view of priority) {
      if (views.includes(view) && typeof row[view] === "number") {
        row.pnl = row[view];
        row.activeView = view;
        break;
      }
    }
  }
  return merged;
}

function viewHasData(series: PerformancePerViewSeries | undefined): boolean {
  return !!series && series.aggregate.length > 0;
}

interface ChartFrameProps {
  readonly heightClass?: string;
  readonly children: React.ReactNode;
}

function ChartFrame({ heightClass = "h-60", children }: ChartFrameProps) {
  return <div className={`w-full ${heightClass}`}>{children}</div>;
}

export function PerformanceOverlay({
  instanceId,
  mode,
  views,
  from,
  to,
  perVenue = false,
  showPhaseMarkers = true,
  showStats = true,
  showViewToggles = true,
  heightClass,
  className,
  seriesOverride,
}: PerformanceOverlayProps) {
  if (seriesOverride !== undefined) {
    // Render the pure view — no network, no React Query context needed.
    return (
      <PerformanceOverlayView
        instanceId={instanceId}
        mode={mode}
        views={views}
        perVenue={perVenue}
        showPhaseMarkers={showPhaseMarkers}
        showStats={showStats}
        showViewToggles={showViewToggles}
        heightClass={heightClass}
        className={className}
        response={seriesOverride}
        isLoading={false}
        isError={false}
      />
    );
  }
  return (
    <PerformanceOverlayFetching
      instanceId={instanceId}
      mode={mode}
      views={views}
      from={from}
      to={to}
      perVenue={perVenue}
      showPhaseMarkers={showPhaseMarkers}
      showStats={showStats}
      showViewToggles={showViewToggles}
      heightClass={heightClass}
      className={className}
    />
  );
}

function PerformanceOverlayFetching(
  props: Omit<PerformanceOverlayProps, "seriesOverride">,
): React.ReactElement {
  const { instanceId, views, from, to, perVenue } = props;
  const query = usePerformanceOverlay(instanceId, { views, from, to, perVenue });
  return (
    <PerformanceOverlayView
      {...props}
      response={query.data}
      isLoading={query.isLoading}
      isError={query.isError}
    />
  );
}

interface PerformanceOverlayViewProps
  extends Omit<PerformanceOverlayProps, "seriesOverride" | "from" | "to"> {
  readonly response: PerformanceSeriesResponse | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export function PerformanceOverlayView({
  instanceId,
  mode,
  views,
  perVenue = false,
  showPhaseMarkers = true,
  showStats = true,
  showViewToggles = true,
  heightClass,
  className,
  response,
  isLoading,
  isError,
}: PerformanceOverlayViewProps) {
  const [activeViews, setActiveViews] = useState<readonly PerformanceView[]>(views);

  const availableViews = useMemo<PerformanceView[]>(() => {
    if (!response || !response.series) return [];
    return views.filter((v) => viewHasData(response.series[v]));
  }, [response, views]);

  const effectiveViews = useMemo<PerformanceView[]>(() => {
    if (activeViews.length === 0) return availableViews;
    return availableViews.filter((v) => activeViews.includes(v));
  }, [activeViews, availableViews]);

  if (isLoading) {
    return (
      <div
        className={`rounded-md border bg-muted/10 p-3 ${className ?? ""}`}
        data-testid="performance-overlay-loading"
      >
        <Skeleton className={`w-full ${heightClass ?? "h-60"}`} />
      </div>
    );
  }

  if (isError || !response) {
    return (
      <div
        className={`rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive ${className ?? ""}`}
        data-testid="performance-overlay-error"
      >
        Performance series unavailable for {instanceId}.
      </div>
    );
  }

  if (availableViews.length === 0) {
    return (
      <div
        className={`rounded-md border bg-muted/10 p-3 text-xs text-muted-foreground ${className ?? ""}`}
        data-testid="performance-overlay-empty"
      >
        No performance series recorded for this instance yet.
      </div>
    );
  }

  const paperAt = response.transition_markers.paper_started_at;
  const liveAt = response.transition_markers.live_started_at;

  return (
    <div
      className={`flex flex-col gap-3 ${className ?? ""}`}
      data-testid="performance-overlay"
      data-instance-id={instanceId}
      data-mode={mode}
    >
      {showViewToggles ? (
        <ViewToggleBar
          allViews={views}
          availableViews={availableViews}
          activeViews={activeViews}
          onChange={setActiveViews}
        />
      ) : null}

      {mode === "overlay" ? (
        <OverlayChart
          response={response}
          views={effectiveViews}
          paperAt={paperAt}
          liveAt={liveAt}
          showPhaseMarkers={showPhaseMarkers}
          heightClass={heightClass}
        />
      ) : null}
      {mode === "stitched" ? (
        <StitchedChart
          response={response}
          views={effectiveViews}
          paperAt={paperAt}
          liveAt={liveAt}
          showPhaseMarkers={showPhaseMarkers}
          heightClass={heightClass}
        />
      ) : null}
      {mode === "split" ? (
        <SplitCharts
          response={response}
          views={effectiveViews}
          paperAt={paperAt}
          liveAt={liveAt}
          showPhaseMarkers={showPhaseMarkers}
          heightClass={heightClass}
          perVenue={perVenue}
        />
      ) : null}

      {showStats ? (
        <PerformanceOverlayStats
          series={response.series}
          views={effectiveViews.length > 0 ? effectiveViews : availableViews}
        />
      ) : null}
    </div>
  );
}

interface ViewToggleBarProps {
  readonly allViews: readonly PerformanceView[];
  readonly availableViews: readonly PerformanceView[];
  readonly activeViews: readonly PerformanceView[];
  readonly onChange: (next: readonly PerformanceView[]) => void;
}

function ViewToggleBar({
  allViews,
  availableViews,
  activeViews,
  onChange,
}: ViewToggleBarProps) {
  const activeSet = new Set(
    activeViews.length > 0 ? activeViews : availableViews,
  );
  return (
    <div
      className="flex flex-wrap items-center gap-1"
      data-testid="performance-overlay-toggles"
    >
      {allViews.map((view) => {
        const style = VIEW_STYLES[view];
        const available = availableViews.includes(view);
        const active = activeSet.has(view);
        return (
          <Button
            key={view}
            type="button"
            size="sm"
            variant={active ? "default" : "outline"}
            disabled={!available}
            title={
              available ? style.description : `${style.label} series not available yet.`
            }
            onClick={() => {
              const next = new Set(
                activeViews.length > 0 ? activeViews : availableViews,
              );
              if (next.has(view)) {
                next.delete(view);
              } else {
                next.add(view);
              }
              onChange(availableViews.filter((v) => next.has(v)));
            }}
            className="h-7 px-2 text-[10px] font-mono"
            data-view={view}
            data-active={active ? "true" : "false"}
          >
            <span
              className="mr-1 inline-block size-2 rounded-full"
              style={{ backgroundColor: style.stroke }}
              aria-hidden
            />
            {style.label}
          </Button>
        );
      })}
    </div>
  );
}

interface ChartProps {
  readonly response: PerformanceSeriesResponse;
  readonly views: readonly PerformanceView[];
  readonly paperAt: string | null;
  readonly liveAt: string | null;
  readonly showPhaseMarkers: boolean;
  readonly heightClass?: string;
}

interface SplitChartProps extends ChartProps {
  readonly perVenue: boolean;
}

function PhaseMarkers({
  paperAt,
  liveAt,
  showPhaseMarkers,
}: {
  readonly paperAt: string | null;
  readonly liveAt: string | null;
  readonly showPhaseMarkers: boolean;
}) {
  if (!showPhaseMarkers) return null;
  return (
    <>
      {paperAt ? (
        <ReferenceLine
          x={toMs(paperAt)}
          stroke="#E0A84A"
          strokeDasharray="4 3"
          label={{ value: "Paper", position: "top", fontSize: 10, fill: "#E0A84A" }}
        />
      ) : null}
      {liveAt ? (
        <ReferenceLine
          x={toMs(liveAt)}
          stroke="#27AE60"
          strokeDasharray="4 3"
          label={{ value: "Live", position: "top", fontSize: 10, fill: "#27AE60" }}
        />
      ) : null}
    </>
  );
}

function OverlayChart({
  response,
  views,
  paperAt,
  liveAt,
  showPhaseMarkers,
  heightClass,
}: ChartProps) {
  const data = useMemo(() => mergeSeriesForOverlay(response, views), [response, views]);
  return (
    <ChartFrame heightClass={heightClass}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="tMs"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={formatDateTick}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 6,
              fontSize: 11,
            }}
            labelFormatter={(value: number) => formatDateTick(value)}
            formatter={(val: number, key: string) => [formatCurrency(val), VIEW_STYLES[key as PerformanceView]?.label ?? key]}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
          <PhaseMarkers
            paperAt={paperAt}
            liveAt={liveAt}
            showPhaseMarkers={showPhaseMarkers}
          />
          {views.map((view) => (
            <Line
              key={view}
              type="monotone"
              dataKey={view}
              name={VIEW_STYLES[view].label}
              stroke={VIEW_STYLES[view].stroke}
              strokeWidth={2}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

function StitchedChart({
  response,
  views,
  paperAt,
  liveAt,
  showPhaseMarkers,
  heightClass,
}: ChartProps) {
  const data = useMemo(() => stitchSeries(response, views), [response, views]);
  return (
    <ChartFrame heightClass={heightClass}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="stitchedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#27AE60" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#27AE60" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="tMs"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={formatDateTick}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 6,
              fontSize: 11,
            }}
            labelFormatter={(value: number) => formatDateTick(value)}
            formatter={(val: number) => [formatCurrency(val), "P&L"]}
          />
          <PhaseMarkers
            paperAt={paperAt}
            liveAt={liveAt}
            showPhaseMarkers={showPhaseMarkers}
          />
          <Area
            type="monotone"
            dataKey="pnl"
            stroke="#27AE60"
            strokeWidth={2}
            fill="url(#stitchedFill)"
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

function SplitCharts({
  response,
  views,
  paperAt,
  liveAt,
  showPhaseMarkers,
  heightClass,
  perVenue,
}: SplitChartProps) {
  return (
    <div className="flex flex-col gap-2" data-testid="performance-overlay-split">
      {views.map((view) => {
        const series = response.series[view];
        if (!series) return null;
        const data = series.aggregate.map<OverlayPoint>((p: PerformanceSeriesPoint) => ({
          t: p.t,
          tMs: toMs(p.t),
          value: p.pnl,
        }));
        const venueEntries =
          perVenue && series.per_venue
            ? Object.entries(series.per_venue)
            : [];
        const venueData = venueEntries.reduce<Map<number, Record<string, number | string>>>(
          (acc, [venue, points]) => {
            for (const p of points) {
              const ms = toMs(p.t);
              const row = acc.get(ms) ?? { t: p.t, tMs: ms };
              row[venue] = p.pnl;
              acc.set(ms, row);
            }
            return acc;
          },
          new Map(),
        );
        const venueRows = Array.from(venueData.values()).sort(
          (a, b) => Number(a.tMs) - Number(b.tMs),
        );
        return (
          <div key={view} className="rounded-md border bg-card/40 p-2">
            <div className="mb-1 flex items-center gap-2 text-[10px] uppercase text-muted-foreground">
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: VIEW_STYLES[view].stroke }}
                aria-hidden
              />
              <span>{VIEW_STYLES[view].label}</span>
              <span className="font-mono">{VIEW_STYLES[view].description}</span>
            </div>
            <ChartFrame heightClass={heightClass ?? "h-40"}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={venueRows.length > 0 ? venueRows : data}
                  margin={{ top: 6, right: 12, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="tMs"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={formatDateTick}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatCurrency}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 6,
                      fontSize: 11,
                    }}
                    labelFormatter={(value: number) => formatDateTick(value)}
                    formatter={(val: number, key: string) => [formatCurrency(val), key]}
                  />
                  <PhaseMarkers
                    paperAt={paperAt}
                    liveAt={liveAt}
                    showPhaseMarkers={showPhaseMarkers}
                  />
                  {venueRows.length === 0 ? (
                    <Line
                      type="monotone"
                      dataKey="value"
                      name={VIEW_STYLES[view].label}
                      stroke={VIEW_STYLES[view].stroke}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  ) : (
                    venueEntries.map(([venue], idx) => (
                      <Line
                        key={venue}
                        type="monotone"
                        dataKey={venue}
                        name={venue}
                        stroke={VENUE_PALETTE[idx % VENUE_PALETTE.length]}
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    ))
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </ChartFrame>
            {response.phase_annotations.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {response.phase_annotations.map((ann) => (
                  <Badge
                    key={`${view}-${ann.phase}-${ann.at}`}
                    variant="outline"
                    className={`font-mono text-[9px] ${PHASE_BADGE_TONE[ann.phase] ?? ""}`}
                  >
                    {ann.phase}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

const VENUE_PALETTE = [
  "#60a5fa",
  "#a78bfa",
  "#f59e0b",
  "#34d399",
  "#f472b6",
  "#22d3ee",
];
