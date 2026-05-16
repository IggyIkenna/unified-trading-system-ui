"use client";

import { RankingListPreset, type RankingListItem } from "@/components/widgets/_primitives";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useAssetGroupData } from "@/lib/hooks/use-asset-group-data";
import * as React from "react";

interface YieldFarmRankingResponse {
  items: ReadonlyArray<{
    protocol: string;
    chain: string;
    pool: string;
    apy: number;
    tvl_usd: number;
    risk_score: number;
  }>;
}

/**
 * DefiLlama-style yields ranking. PARTIAL per the plan — Aave-only initially;
 * Morpho / Fluid / concentrated-liquidity yields follow in P7.
 */
export function YieldFarmRankingWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<YieldFarmRankingResponse>("yield-farm-ranking", {
    assetGroup: "DEFI",
    staleTime: 60_000,
  });

  const items = React.useMemo<ReadonlyArray<RankingListItem>>(
    () =>
      data?.items.map((row) => ({
        id: `${row.protocol}/${row.pool}@${row.chain}`,
        name: row.pool,
        subname: row.protocol,
        value: row.tvl_usd,
        change24h: row.apy / 100,
        source: row.chain,
        extra: { apy: `${row.apy.toFixed(2)}%`, risk: row.risk_score.toFixed(1) },
      })) ?? [],
    [data],
  );

  if (isLoading || !data) {
    return <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading yields…</div>;
  }
  return (
    <div className="h-full w-full p-2">
      <RankingListPreset
        items={items}
        title="Yield farms"
        valueLabel="TVL ($)"
        extraColumns={[
          { id: "apy", label: "APY", align: "right", type: "percent" },
          { id: "risk", label: "Risk", align: "right", type: "number" },
        ]}
        enableSearch
      />
    </div>
  );
}
