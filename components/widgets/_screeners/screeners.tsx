"use client";

/**
 * Cross-asset-group screeners — P5 of the DART terminal plan.
 *
 * Five screener widgets that consume the P0.3 primitives + the same
 * /api/market-data/<view> endpoints exposed earlier. Each screener is a
 * single-column page-style layout that filters + ranks the underlying
 * data with a search header. Widgets register on the relevant
 * asset-group tab (no /screener route — the screener is a widget per the
 * no-orphans-all-in-DART constraint).
 */

import { RankingListPreset, type RankingListItem } from "@/components/widgets/_primitives";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useAssetGroupData } from "@/lib/hooks/use-asset-group-data";
import * as React from "react";

interface ScreenerRow {
  id: string;
  name: string;
  subname?: string;
  primary: number;
  change?: number;
  sparkline?: ReadonlyArray<number>;
  source?: string;
  extra?: Record<string, string | number | null>;
}

interface ScreenerResponse {
  items: ReadonlyArray<ScreenerRow>;
}

function rowsToItems(rows: ReadonlyArray<ScreenerRow>): ReadonlyArray<RankingListItem> {
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    subname: r.subname,
    value: r.primary,
    change24h: r.change,
    sparkline: r.sparkline ? [...r.sparkline] : undefined,
    source: r.source,
    extra: r.extra,
  }));
}

// ─── SportsScreener — top movers + sharp/square split + value bets ────────

export function SportsScreenerWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<ScreenerResponse>("asset-group-screener", {
    assetGroup: "SPORTS",
    staleTime: 30_000,
  });
  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Loading sports screener…
      </div>
    );
  }
  return (
    <div className="h-full w-full p-2">
      <RankingListPreset
        items={rowsToItems(data.items)}
        title="Sports — top movers"
        valueLabel="Line move"
        extraColumns={[
          { id: "sharpPct", label: "Sharp %", align: "right", type: "percent" },
          { id: "valueScore", label: "Value", align: "right", type: "number" },
        ]}
        enableSearch
      />
    </div>
  );
}

// ─── PredictionScreener — composes trending + closing-soon + prob extremes ─

export function PredictionScreenerWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<ScreenerResponse>("asset-group-screener", {
    assetGroup: "PREDICTION",
    staleTime: 30_000,
  });
  if (isLoading || !data) {
    return <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading…</div>;
  }
  return (
    <div className="h-full w-full p-2">
      <RankingListPreset
        items={rowsToItems(data.items)}
        title="Prediction — discovery"
        valueLabel="24h volume"
        extraColumns={[
          { id: "impliedProb", label: "Now", align: "right", type: "percent" },
          { id: "timeToResolve", label: "→ Resolve", align: "right", type: "text" },
        ]}
        enableSearch
      />
    </div>
  );
}

// ─── CryptoScreener — composes market-cap + gainers/losers + filter ───────

export function CryptoScreenerWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<ScreenerResponse>("asset-group-screener", {
    assetGroup: "CEFI",
    staleTime: 30_000,
  });
  if (isLoading || !data) {
    return <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading…</div>;
  }
  return (
    <div className="h-full w-full p-2">
      <RankingListPreset
        items={rowsToItems(data.items)}
        title="Crypto — discovery"
        valueLabel="Market cap"
        extraColumns={[
          { id: "dominance", label: "Dominance", align: "right", type: "percent" },
          { id: "volume24h", label: "Vol 24h", align: "right", type: "currency" },
        ]}
        enableSearch
      />
    </div>
  );
}

// ─── DeFiScreener — composes TVL + yields + DEX volume ────────────────────

export function DeFiScreenerWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<ScreenerResponse>("asset-group-screener", {
    assetGroup: "DEFI",
    staleTime: 30_000,
  });
  if (isLoading || !data) {
    return <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading…</div>;
  }
  return (
    <div className="h-full w-full p-2">
      <RankingListPreset
        items={rowsToItems(data.items)}
        title="DeFi — discovery"
        valueLabel="TVL"
        extraColumns={[
          { id: "apy", label: "APY", align: "right", type: "percent" },
          { id: "volume24h", label: "Vol 24h", align: "right", type: "currency" },
        ]}
        enableSearch
      />
    </div>
  );
}

// ─── TradFiScreener — sector + index + ETF rankings ────────────────────────

export function TradFiScreenerWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<ScreenerResponse>("asset-group-screener", {
    assetGroup: "TRADFI",
    staleTime: 30_000,
  });
  if (isLoading || !data) {
    return <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading…</div>;
  }
  return (
    <div className="h-full w-full p-2">
      <RankingListPreset
        items={rowsToItems(data.items)}
        title="TradFi — discovery"
        valueLabel="Index level"
        extraColumns={[{ id: "yld", label: "Yield", align: "right", type: "percent" }]}
        enableSearch
      />
    </div>
  );
}
