"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { useDeFiData } from "@/components/widgets/defi/defi-data-context";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import type { BasisTradeMarketData } from "@/lib/types/defi";

interface BasisRow {
  pair: string;
  spotVenue: string;
  perpVenue: string;
  spotPrice: number;
  perpPrice: number;
  basisBps: number;
  fundingRate8h: number;
  annualisedYield: number;
  direction: "LONG_SPOT" | "SHORT_PERP";
}

/**
 * Display-only venue labels per asset. These are hardcoded because
 * BasisTradeMarketData currently has no per-asset venue routing field —
 * once the context exposes a per-asset spot/perp-venue map, replace these.
 * Tracked in docs/manifest/widget-certification/enhanced-basis.json.
 */
const SPOT_VENUE_LABEL: Record<string, string> = {
  ETH: "Uniswap V3",
  BTC: "Uniswap V3",
  SOL: "Raydium",
  ARB: "Uniswap V3",
  AVAX: "TraderJoe",
  LINK: "Uniswap V3",
};

const PERP_VENUE_LABEL: Record<string, string> = {
  ETH: "Hyperliquid",
  BTC: "Hyperliquid",
  SOL: "Drift",
  ARB: "Hyperliquid",
  AVAX: "Hyperliquid",
  LINK: "Hyperliquid",
};

function toBasisRow(asset: string, data: BasisTradeMarketData): BasisRow {
  return {
    pair: `${asset}/USDT`,
    spotVenue: SPOT_VENUE_LABEL[asset] ?? "DEX",
    perpVenue: PERP_VENUE_LABEL[asset] ?? "Hyperliquid",
    spotPrice: data.spotPrice,
    perpPrice: data.perpPrice,
    basisBps: data.basisBps,
    // fundingRate in context is per-8h period already (0.000125 = 0.0125% per 8h)
    fundingRate8h: data.fundingRate,
    annualisedYield: data.fundingRateAnnualized * 100,
    direction: "LONG_SPOT",
  };
}

function formatPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(4);
}

export function EnhancedBasisWidget(_props: WidgetComponentProps) {
  const { basisTradeAssets, basisTradeMarketData } = useDeFiData();

  // DeFiDataContext is synchronous (mock) — isLoading is always false.
  // When the context adds isLoading + error fields, wire them here.
  const isLoading = false;
  const error: string | null = null;

  if (isLoading) {
    return (
      <Card data-testid="enhanced-basis-widget" className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Enhanced Basis Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <span className="text-xs text-muted-foreground animate-pulse">Loading basis data…</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card data-testid="enhanced-basis-widget" className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Enhanced Basis Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <span className="text-xs text-rose-400">{error}</span>
        </CardContent>
      </Card>
    );
  }

  const rows: BasisRow[] = basisTradeAssets
    .map((asset) => {
      const data = basisTradeMarketData[asset];
      return data ? toBasisRow(asset, data) : null;
    })
    .filter((r): r is BasisRow => r !== null);

  if (rows.length === 0) {
    return (
      <Card data-testid="enhanced-basis-widget" className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Enhanced Basis Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <span className="text-xs text-muted-foreground">No basis opportunities available.</span>
        </CardContent>
      </Card>
    );
  }

  const bestOpportunity = rows.reduce(
    (best, row) => (row.annualisedYield > best.annualisedYield ? row : best),
    rows[0],
  );

  return (
    <Card data-testid="enhanced-basis-widget" className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Enhanced Basis Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2 flex items-center justify-between">
          <div className="text-xs text-blue-400">
            <span className="font-medium">Best Opportunity:</span> {bestOpportunity.pair} ({bestOpportunity.spotVenue} /{" "}
            {bestOpportunity.perpVenue})
          </div>
          <Badge variant="success" className="text-micro">
            {bestOpportunity.annualisedYield.toFixed(1)}% APY
          </Badge>
        </div>

        <WidgetScroll className="min-h-0 max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-micro">Pair</TableHead>
                <TableHead className="text-micro">Spot Venue</TableHead>
                <TableHead className="text-micro">Perp Venue</TableHead>
                <TableHead className="text-micro text-right">Spot</TableHead>
                <TableHead className="text-micro text-right">Perp</TableHead>
                <TableHead className="text-micro text-right">Basis</TableHead>
                <TableHead className="text-micro text-right">Funding 8h</TableHead>
                <TableHead className="text-micro text-right">APY</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.pair} className={row.annualisedYield > 20 ? "bg-emerald-500/5" : ""}>
                  <TableCell className="text-xs font-medium">{row.pair}</TableCell>
                  <TableCell className="text-xs">{row.spotVenue}</TableCell>
                  <TableCell className="text-xs">{row.perpVenue}</TableCell>
                  <TableCell className="text-xs font-mono text-right">{formatPrice(row.spotPrice)}</TableCell>
                  <TableCell className="text-xs font-mono text-right">{formatPrice(row.perpPrice)}</TableCell>
                  <TableCell className="text-xs font-mono text-right">
                    <Badge variant={row.basisBps > 50 ? "success" : "secondary"} className="text-micro">
                      {row.basisBps} bps
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right">
                    {(row.fundingRate8h * 100).toFixed(3)}%
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right">
                    <span className={row.annualisedYield > 20 ? "text-emerald-400 font-semibold" : ""}>
                      {row.annualisedYield.toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </WidgetScroll>
      </CardContent>
    </Card>
  );
}
