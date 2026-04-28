"use client";

import { RankingListPreset, type RankingListItem } from "@/components/widgets/_primitives";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useAssetGroupData } from "@/lib/hooks/use-asset-group-data";
import * as React from "react";

interface OpenInterestRankingResponse {
  items: ReadonlyArray<{
    symbol: string;
    venue: string;
    oi_usd: number;
    change_24h: number;
    change_7d?: number;
    sparkline_7d?: ReadonlyArray<number>;
  }>;
}

/**
 * Coinglass-style Open Interest ranking — assets sorted by 24h OI with
 * sparkline + change columns. Cross-venue aggregation.
 */
export function OpenInterestRankingWidget(_props: WidgetComponentProps) {
  const { data, isLoading, isError } = useAssetGroupData<OpenInterestRankingResponse>("open-interest-ranking", {
    assetGroup: "CEFI",
    staleTime: 60_000,
  });

  const items = React.useMemo<ReadonlyArray<RankingListItem>>(() => {
    if (!data) return [];
    return data.items.map((row) => ({
      id: `${row.symbol}@${row.venue}`,
      name: row.symbol,
      subname: row.venue,
      value: row.oi_usd,
      change24h: row.change_24h,
      change7d: row.change_7d,
      sparkline: row.sparkline_7d ? [...row.sparkline_7d] : undefined,
      source: row.venue,
    }));
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Loading open interest…
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-xs text-muted-foreground">
        <span>Open interest data unavailable.</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-2">
      <RankingListPreset items={items} title="Open interest" valueLabel="OI ($)" enableSearch />
    </div>
  );
}
