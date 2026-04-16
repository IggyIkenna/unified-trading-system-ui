"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";

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

const MOCK_BASIS_DATA: BasisRow[] = [
  { pair: "ETH/USDT", spotVenue: "Uniswap V3", perpVenue: "Hyperliquid", spotPrice: 3842.5, perpPrice: 3861.2, basisBps: 49, fundingRate8h: 0.0042, annualisedYield: 15.3, direction: "LONG_SPOT" },
  { pair: "BTC/USDT", spotVenue: "Uniswap V3", perpVenue: "Hyperliquid", spotPrice: 68420.0, perpPrice: 68612.5, basisBps: 28, fundingRate8h: 0.0031, annualisedYield: 11.3, direction: "LONG_SPOT" },
  { pair: "SOL/USDT", spotVenue: "Raydium", perpVenue: "Drift", spotPrice: 178.4, perpPrice: 179.8, basisBps: 78, fundingRate8h: 0.0065, annualisedYield: 23.7, direction: "LONG_SPOT" },
  { pair: "ARB/USDT", spotVenue: "Uniswap V3", perpVenue: "Hyperliquid", spotPrice: 1.24, perpPrice: 1.252, basisBps: 97, fundingRate8h: 0.0082, annualisedYield: 29.9, direction: "LONG_SPOT" },
  { pair: "AVAX/USDT", spotVenue: "TraderJoe", perpVenue: "Hyperliquid", spotPrice: 38.9, perpPrice: 39.12, basisBps: 57, fundingRate8h: 0.0048, annualisedYield: 17.5, direction: "LONG_SPOT" },
  { pair: "LINK/USDT", spotVenue: "Uniswap V3", perpVenue: "Hyperliquid", spotPrice: 15.82, perpPrice: 15.91, basisBps: 57, fundingRate8h: 0.0047, annualisedYield: 17.2, direction: "LONG_SPOT" },
];

function formatPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(4);
}

export function EnhancedBasisWidget(_props: WidgetComponentProps) {
  const bestOpportunity = MOCK_BASIS_DATA.reduce((best, row) => (row.annualisedYield > best.annualisedYield ? row : best), MOCK_BASIS_DATA[0]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Enhanced Basis Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2 flex items-center justify-between">
          <div className="text-xs text-blue-400">
            <span className="font-medium">Best Opportunity:</span> {bestOpportunity.pair} ({bestOpportunity.spotVenue} / {bestOpportunity.perpVenue})
          </div>
          <Badge variant="success" className="text-[10px]">
            {bestOpportunity.annualisedYield.toFixed(1)}% APY
          </Badge>
        </div>

        <div className="overflow-auto max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">Pair</TableHead>
                <TableHead className="text-[10px]">Spot Venue</TableHead>
                <TableHead className="text-[10px]">Perp Venue</TableHead>
                <TableHead className="text-[10px] text-right">Spot</TableHead>
                <TableHead className="text-[10px] text-right">Perp</TableHead>
                <TableHead className="text-[10px] text-right">Basis</TableHead>
                <TableHead className="text-[10px] text-right">Funding 8h</TableHead>
                <TableHead className="text-[10px] text-right">APY</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_BASIS_DATA.map((row) => (
                <TableRow
                  key={row.pair}
                  className={row.annualisedYield > 20 ? "bg-emerald-500/5" : ""}
                >
                  <TableCell className="text-xs font-medium">{row.pair}</TableCell>
                  <TableCell className="text-xs">{row.spotVenue}</TableCell>
                  <TableCell className="text-xs">{row.perpVenue}</TableCell>
                  <TableCell className="text-xs font-mono text-right">{formatPrice(row.spotPrice)}</TableCell>
                  <TableCell className="text-xs font-mono text-right">{formatPrice(row.perpPrice)}</TableCell>
                  <TableCell className="text-xs font-mono text-right">
                    <Badge variant={row.basisBps > 50 ? "success" : "secondary"} className="text-[10px]">
                      {row.basisBps} bps
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right">{(row.fundingRate8h * 100).toFixed(3)}%</TableCell>
                  <TableCell className="text-xs font-mono text-right">
                    <span className={row.annualisedYield > 20 ? "text-emerald-400 font-semibold" : ""}>
                      {row.annualisedYield.toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
