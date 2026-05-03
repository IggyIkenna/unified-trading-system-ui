"use client";

import { CategoricalMatrix, type CategoricalMatrixCell } from "@/components/widgets/_primitives";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useAssetGroupData } from "@/lib/hooks/use-asset-group-data";
import * as React from "react";

interface FundingRateMatrixResponse {
  /** Asset symbols (rows). */
  assets: ReadonlyArray<string>;
  /** Venue identifiers (cols). */
  venues: ReadonlyArray<string>;
  /** Cell map indexed by asset → venue → funding rate (decimal, e.g. 0.0001 = 1bp). */
  cells: Readonly<Record<string, Readonly<Record<string, number | null>>>>;
}

/**
 * Coinglass-style funding-rate matrix — rows=asset, cols=venue, cells=8h
 * funding rate. Click a cell to drill into funding history.
 *
 * P1 vertical slice that exercises the full DART terminal stack end-to-end:
 *  - useAssetGroupData hook resolves /api/market-data/funding-rate-matrix
 *    against the active asset_group from global-scope-store
 *  - CategoricalMatrix primitive (P0.3) renders the colour-coded matrix
 *  - Diverging colour scale centred at zero (positive funding = longs pay
 *    shorts; negative = shorts pay longs)
 *  - Mock-mode fallback via lib/api/mock-handler.ts when
 *    NEXT_PUBLIC_MOCK_API=true (Tier-0 dev SSOT)
 *
 * Plan: ~/.claude/plans/i-guess-we-can-jazzy-eagle.md P1.1.
 */
export function FundingRateMatrixWidget(_props: WidgetComponentProps) {
  const { data, isLoading, isError } = useAssetGroupData<FundingRateMatrixResponse>("funding-rate-matrix", {
    assetGroup: "CEFI",
    staleTime: 30_000,
  });

  const matrixCells = React.useMemo<Record<string, Record<string, CategoricalMatrixCell>>>(() => {
    if (!data) return {};
    const out: Record<string, Record<string, CategoricalMatrixCell>> = {};
    for (const asset of data.assets) {
      out[asset] = {};
      const row = data.cells[asset] ?? {};
      for (const venue of data.venues) {
        const v = row[venue];
        out[asset][venue] = {
          value: v ?? null,
          label: v == null ? undefined : `${(v * 10000).toFixed(1)}bp`,
        };
      }
    }
    return out;
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Loading funding rates…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-xs text-muted-foreground">
        <span>Funding rate data unavailable.</span>
        <span className="text-[10px] mt-1 text-muted-foreground/60">
          Endpoint: /api/market-data/funding-rate-matrix?asset_group=cefi (P1 backend prereq)
        </span>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-2">
      <CategoricalMatrix
        rows={data.assets}
        cols={data.venues}
        cells={matrixCells}
        scale="diverging"
        rowLabel="Asset"
        colLabel="Venue"
        format={(v) => `${(v * 10000).toFixed(1)}bp`}
      />
    </div>
  );
}
