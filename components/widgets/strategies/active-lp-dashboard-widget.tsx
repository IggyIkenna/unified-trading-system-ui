"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";

interface LPPosition {
  pool: string;
  rangeLow: number;
  rangeHigh: number;
  inRange: boolean;
  tvl: number;
  fees24h: number;
  ilPct: number;
  lastRebalance: string;
}

const MOCK_LP_POSITIONS: LPPosition[] = [
  { pool: "ETH-USDC", rangeLow: 2800, rangeHigh: 3200, inRange: true, tvl: 1_250_000, fees24h: 3420, ilPct: -0.42, lastRebalance: "2h ago" },
  { pool: "BTC-USDC", rangeLow: 62000, rangeHigh: 68000, inRange: true, tvl: 3_100_000, fees24h: 8150, ilPct: -0.18, lastRebalance: "6h ago" },
  { pool: "SOL-USDC", rangeLow: 110, rangeHigh: 130, inRange: false, tvl: 820_000, fees24h: 1240, ilPct: -1.85, lastRebalance: "1d ago" },
  { pool: "ARB-ETH", rangeLow: 0.00032, rangeHigh: 0.00042, inRange: true, tvl: 450_000, fees24h: 890, ilPct: -0.31, lastRebalance: "4h ago" },
  { pool: "ETH-USDT", rangeLow: 2750, rangeHigh: 3100, inRange: false, tvl: 2_400_000, fees24h: 5680, ilPct: -2.10, lastRebalance: "2d ago" },
  { pool: "MATIC-USDC", rangeLow: 0.45, rangeHigh: 0.65, inRange: true, tvl: 310_000, fees24h: 520, ilPct: -0.55, lastRebalance: "8h ago" },
];

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function formatRange(low: number, high: number): string {
  if (low >= 1000) return `$${low.toLocaleString()} – $${high.toLocaleString()}`;
  if (low >= 1) return `$${low} – $${high}`;
  return `${low} – ${high}`;
}

export function ActiveLPDashboardWidget(_props: WidgetComponentProps) {
  const totalTvl = MOCK_LP_POSITIONS.reduce((sum, p) => sum + p.tvl, 0);
  const totalFees = MOCK_LP_POSITIONS.reduce((sum, p) => sum + p.fees24h, 0);
  const avgIl = MOCK_LP_POSITIONS.reduce((sum, p) => sum + p.ilPct, 0) / MOCK_LP_POSITIONS.length;
  const outOfRangeCount = MOCK_LP_POSITIONS.filter((p) => !p.inRange).length;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Active LP Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-md border px-3 py-2 text-center">
            <div className="text-[10px] text-muted-foreground">Total TVL</div>
            <div className="text-sm font-mono font-semibold">{formatUsd(totalTvl)}</div>
          </div>
          <div className="rounded-md border px-3 py-2 text-center">
            <div className="text-[10px] text-muted-foreground">Active Positions</div>
            <div className="text-sm font-mono font-semibold">{MOCK_LP_POSITIONS.length}</div>
          </div>
          <div className="rounded-md border px-3 py-2 text-center">
            <div className="text-[10px] text-muted-foreground">24h Fees</div>
            <div className="text-sm font-mono font-semibold text-emerald-400">{formatUsd(totalFees)}</div>
          </div>
          <div className="rounded-md border px-3 py-2 text-center">
            <div className="text-[10px] text-muted-foreground">IL MTD</div>
            <div className="text-sm font-mono font-semibold text-red-400">{avgIl.toFixed(2)}%</div>
          </div>
        </div>

        {outOfRangeCount > 0 && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
            <span className="font-medium">Rebalance Needed:</span> {outOfRangeCount} position{outOfRangeCount > 1 ? "s" : ""} out of range
          </div>
        )}

        <div className="overflow-auto max-h-[350px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">Pool</TableHead>
                <TableHead className="text-[10px]">Range</TableHead>
                <TableHead className="text-[10px]">In Range</TableHead>
                <TableHead className="text-[10px] text-right">TVL</TableHead>
                <TableHead className="text-[10px] text-right">Fees 24h</TableHead>
                <TableHead className="text-[10px] text-right">IL %</TableHead>
                <TableHead className="text-[10px]">Rebalance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_LP_POSITIONS.map((pos) => (
                <TableRow key={pos.pool}>
                  <TableCell className="text-xs font-mono font-medium">{pos.pool}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {formatRange(pos.rangeLow, pos.rangeHigh)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={pos.inRange ? "success" : "error"} className="text-[10px]">
                      {pos.inRange ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right">{formatUsd(pos.tvl)}</TableCell>
                  <TableCell className="text-xs font-mono text-right text-emerald-400">{formatUsd(pos.fees24h)}</TableCell>
                  <TableCell className={`text-xs font-mono text-right ${pos.ilPct < -1 ? "text-red-400" : "text-muted-foreground"}`}>
                    {pos.ilPct.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{pos.lastRebalance}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
