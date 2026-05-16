"use client";

/**
 * Polymarket-style prediction-market depth widgets (P3a of the DART
 * cross-asset-group market-data terminal plan).
 *
 * Seven widgets in one module so the related types/utilities can co-locate:
 *  - MarketProbabilityCurveWidget (signature view — multi-outcome implied
 *    probability over time)
 *  - OutcomeOrderBookWidget (per-outcome depth book)
 *  - OutcomeVolumeChartWidget (volume by outcome over time)
 *  - TrendingMarketsWidget (24h volume %change vs 7d avg)
 *  - ClosingSoonWidget (markets resolving soonest)
 *  - TopicBrowserWidget (categorical browse tiles)
 *  - ResolutionLedgerWidget (recently-resolved markets)
 *
 * All widgets register on the existing `/services/trading/predictions` tab
 * (no new routes per the no-orphans-all-in-DART constraint). Data hooks
 * resolve to /api/market-data/<view> via useAssetGroupData.
 */

import {
  DepthAreaChart,
  FlowChart,
  RankingListPreset,
  ScatterPlot,
  type FlowChartBucket,
  type RankingListItem,
  type ScatterPlotSeries,
} from "@/components/widgets/_primitives";
import { Button } from "@/components/ui/button";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useAssetGroupData } from "@/lib/hooks/use-asset-group-data";
import { cn } from "@/lib/utils";
import * as React from "react";

// ─── MarketProbabilityCurve — multi-outcome implied prob over time ─────────

interface MarketProbabilityCurveResponse {
  market_id: string;
  market_title: string;
  outcomes: ReadonlyArray<{
    outcome: string;
    series: ReadonlyArray<{ t: number; implied_prob: number }>;
  }>;
}

export function MarketProbabilityCurveWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<MarketProbabilityCurveResponse, { market_id: string }>(
    "market-probability-curve",
    { assetGroup: "PREDICTION", params: { market_id: "default" }, staleTime: 60_000 },
  );
  const series = React.useMemo<ReadonlyArray<ScatterPlotSeries>>(
    () =>
      data?.outcomes.map((o) => ({
        id: o.outcome,
        name: o.outcome,
        data: o.series.map((p) => ({ x: p.t, y: p.implied_prob * 100 })),
        mode: "line" as const,
      })) ?? [],
    [data],
  );
  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Loading probability curve…
      </div>
    );
  }
  return (
    <div className="h-full w-full p-2 flex flex-col gap-2">
      <span className="text-[11px] font-medium text-muted-foreground/90 px-1 truncate">{data.market_title}</span>
      <div className="flex-1 min-h-0">
        <ScatterPlot
          series={series}
          xKind="time"
          yLabel="Implied prob (%)"
          formatY={(v) => `${v.toFixed(0)}%`}
          height="100%"
        />
      </div>
    </div>
  );
}

// ─── OutcomeOrderBook — depth per outcome ─────────────────────────────────

interface OutcomeOrderBookResponse {
  market_id: string;
  market_title: string;
  outcomes: ReadonlyArray<{
    outcome: string;
    bids: ReadonlyArray<{ price: number; size: number }>;
    asks: ReadonlyArray<{ price: number; size: number }>;
  }>;
}

export function OutcomeOrderBookWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<OutcomeOrderBookResponse, { market_id: string }>("outcome-order-book", {
    assetGroup: "PREDICTION",
    params: { market_id: "default" },
    staleTime: 30_000,
  });
  const [activeOutcome, setActiveOutcome] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (data && !activeOutcome) setActiveOutcome(data.outcomes[0]?.outcome ?? null);
  }, [data, activeOutcome]);
  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading outcome book…</div>
    );
  }
  const active = data.outcomes.find((o) => o.outcome === activeOutcome) ?? data.outcomes[0];
  return (
    <div className="h-full w-full p-2 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-muted-foreground/90 truncate">{data.market_title}</span>
        <div className="flex gap-1">
          {data.outcomes.map((o) => (
            <Button
              key={o.outcome}
              size="sm"
              variant={o.outcome === active?.outcome ? "default" : "ghost"}
              onClick={() => setActiveOutcome(o.outcome)}
              className="h-6 px-2 text-[10px]"
            >
              {o.outcome}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <DepthAreaChart
          bids={active?.bids ?? []}
          asks={active?.asks ?? []}
          height="100%"
          formatPrice={(p) => `$${p.toFixed(2)}`}
        />
      </div>
    </div>
  );
}

// ─── OutcomeVolumeChart — volume by outcome over time ──────────────────────

interface OutcomeVolumeResponse {
  market_id: string;
  market_title: string;
  buckets: ReadonlyArray<{ t: number; yes_volume: number; no_volume: number }>;
}

export function OutcomeVolumeChartWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<OutcomeVolumeResponse, { market_id: string }>("outcome-volume", {
    assetGroup: "PREDICTION",
    params: { market_id: "default" },
    staleTime: 60_000,
  });
  const buckets = React.useMemo<ReadonlyArray<FlowChartBucket>>(
    () => data?.buckets.map((b) => ({ t: b.t, inflow: b.yes_volume, outflow: b.no_volume })) ?? [],
    [data],
  );
  if (isLoading || !data) {
    return <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading volume…</div>;
  }
  return (
    <div className="h-full w-full p-2 flex flex-col gap-2">
      <span className="text-[11px] font-medium text-muted-foreground/90 px-1 truncate">{data.market_title}</span>
      <div className="flex-1 min-h-0">
        <FlowChart data={buckets} yLabel="Volume — Yes vs No ($)" showNet height="100%" />
      </div>
    </div>
  );
}

// ─── TrendingMarkets / ClosingSoon — RankingListPreset variants ────────────

interface MarketSummary {
  market_id: string;
  title: string;
  category: string;
  venue: string;
  volume_24h_usd: number;
  volume_7d_avg_usd?: number;
  volume_change_pct?: number;
  hours_to_resolution?: number;
  current_implied_prob?: number;
  sparkline?: ReadonlyArray<number>;
}
interface MarketsResponse {
  items: ReadonlyArray<MarketSummary>;
}

function marketsToItems(markets: ReadonlyArray<MarketSummary>): ReadonlyArray<RankingListItem> {
  return markets.map((m) => ({
    id: m.market_id,
    name: m.title,
    subname: m.category,
    value: m.volume_24h_usd,
    change24h: m.volume_change_pct,
    sparkline: m.sparkline ? [...m.sparkline] : undefined,
    source: m.venue,
    extra: {
      timeToResolve: m.hours_to_resolution != null ? `${Math.round(m.hours_to_resolution)}h` : "—",
      impliedProb: m.current_implied_prob != null ? `${(m.current_implied_prob * 100).toFixed(1)}%` : "—",
    },
  }));
}

export function TrendingMarketsWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<MarketsResponse>("trending-markets", {
    assetGroup: "PREDICTION",
    staleTime: 30_000,
  });
  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading trending…</div>
    );
  }
  return (
    <div className="h-full w-full p-2">
      <RankingListPreset
        items={marketsToItems(data.items)}
        title="Trending — vol vs 7d avg"
        valueLabel="24h volume ($)"
        extraColumns={[{ id: "impliedProb", label: "Now", align: "right", type: "percent" }]}
        enableSearch
      />
    </div>
  );
}

export function ClosingSoonWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<MarketsResponse>("closing-soon", {
    assetGroup: "PREDICTION",
    staleTime: 60_000,
  });
  if (isLoading || !data) {
    return <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading…</div>;
  }
  return (
    <div className="h-full w-full p-2">
      <RankingListPreset
        items={marketsToItems(data.items)}
        title="Closing soon — > $10K vol"
        valueLabel="24h volume"
        extraColumns={[
          { id: "timeToResolve", label: "→ Resolve", align: "right", type: "text" },
          { id: "impliedProb", label: "Now", align: "right", type: "percent" },
        ]}
        enableSearch
      />
    </div>
  );
}

// ─── TopicBrowser — categorised tile entry surface ─────────────────────────

interface TopicBrowserResponse {
  topics: ReadonlyArray<{
    slug: string;
    label: string;
    description: string;
    market_count: number;
    volume_24h_usd: number;
  }>;
}

export function TopicBrowserWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<TopicBrowserResponse>("topic-browser", {
    assetGroup: "PREDICTION",
    staleTime: 60_000,
  });
  if (isLoading || !data) {
    return <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading topics…</div>;
  }
  return (
    <div className="h-full w-full p-2 grid grid-cols-3 gap-2 overflow-auto">
      {data.topics.map((t) => (
        <button
          key={t.slug}
          type="button"
          className={cn(
            "flex flex-col items-start gap-1 p-3 rounded-md border border-border/40 bg-card/30",
            "hover:bg-card hover:border-primary/40 hover:shadow-sm transition-colors text-left",
          )}
        >
          <span className="text-[11px] font-semibold">{t.label}</span>
          <span className="text-[9px] text-muted-foreground/70 line-clamp-2">{t.description}</span>
          <div className="flex items-center justify-between w-full text-[10px] text-muted-foreground tabular-nums font-mono">
            <span>{t.market_count} markets</span>
            <span>${(t.volume_24h_usd / 1_000_000).toFixed(1)}M</span>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── ResolutionLedger — recently-resolved markets ──────────────────────────

interface ResolutionLedgerResponse {
  items: ReadonlyArray<{
    market_id: string;
    title: string;
    venue: string;
    resolved_at: number;
    final_outcome: string;
    final_implied_prob: number;
    payout_usd: number;
  }>;
}

export function ResolutionLedgerWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<ResolutionLedgerResponse>("resolution-ledger", {
    assetGroup: "PREDICTION",
    staleTime: 300_000,
  });
  const items = React.useMemo<ReadonlyArray<RankingListItem>>(
    () =>
      data?.items.map((row) => ({
        id: row.market_id,
        name: row.title,
        subname: row.final_outcome,
        value: row.payout_usd,
        source: row.venue,
        extra: {
          finalProb: `${(row.final_implied_prob * 100).toFixed(1)}%`,
          resolvedAt: new Date(row.resolved_at).toISOString().slice(0, 10),
        },
      })) ?? [],
    [data],
  );
  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading resolutions…</div>
    );
  }
  return (
    <div className="h-full w-full p-2">
      <RankingListPreset
        items={items}
        title="Recently resolved"
        valueLabel="Payout ($)"
        extraColumns={[
          { id: "finalProb", label: "Final", align: "right", type: "percent" },
          { id: "resolvedAt", label: "Resolved", align: "right", type: "text" },
        ]}
        enableSearch
      />
    </div>
  );
}
