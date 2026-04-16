"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";

interface AtRiskPosition {
  protocol: string;
  collateral: string;
  collateralUsd: number;
  debt: string;
  debtUsd: number;
  healthFactor: number;
  liquidationPrice: number;
  distancePct: number;
}

const MOCK_POSITIONS: AtRiskPosition[] = [
  { protocol: "Aave V3", collateral: "WETH", collateralUsd: 2_450_000, debt: "USDC", debtUsd: 1_850_000, healthFactor: 1.18, liquidationPrice: 2720, distancePct: 3.2 },
  { protocol: "Morpho Blue", collateral: "wstETH", collateralUsd: 5_100_000, debt: "USDC", debtUsd: 3_200_000, healthFactor: 1.42, liquidationPrice: 2580, distancePct: 8.1 },
  { protocol: "Compound V3", collateral: "WETH", collateralUsd: 1_200_000, debt: "USDC", debtUsd: 950_000, healthFactor: 1.08, liquidationPrice: 2780, distancePct: 1.1 },
  { protocol: "Aave V3", collateral: "WBTC", collateralUsd: 8_300_000, debt: "USDT", debtUsd: 4_100_000, healthFactor: 1.95, liquidationPrice: 58200, distancePct: 12.8 },
  { protocol: "Kamino", collateral: "SOL", collateralUsd: 3_800_000, debt: "USDC", debtUsd: 2_900_000, healthFactor: 1.25, liquidationPrice: 112, distancePct: 4.5 },
  { protocol: "Morpho Blue", collateral: "WETH", collateralUsd: 6_200_000, debt: "DAI", debtUsd: 4_800_000, healthFactor: 1.12, liquidationPrice: 2740, distancePct: 2.5 },
  { protocol: "Aave V3", collateral: "WETH", collateralUsd: 950_000, debt: "USDT", debtUsd: 830_000, healthFactor: 1.02, liquidationPrice: 2800, distancePct: 0.4 },
  { protocol: "Compound V3", collateral: "WBTC", collateralUsd: 4_500_000, debt: "USDC", debtUsd: 2_100_000, healthFactor: 2.15, liquidationPrice: 52100, distancePct: 21.9 },
];

function hfColor(hf: number): string {
  if (hf > 2.0) return "text-emerald-400";
  if (hf >= 1.5) return "text-amber-400";
  return "text-red-400";
}

function hfBadgeVariant(hf: number): "success" | "warning" | "error" {
  if (hf > 2.0) return "success";
  if (hf >= 1.5) return "warning";
  return "error";
}

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function LiquidationMonitorWidget(_props: WidgetComponentProps) {
  const atRiskCount = MOCK_POSITIONS.filter((p) => p.healthFactor < 1.5).length;
  const cascadeZone = "$2,740";
  const liquidated24h = "$4.2M";

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Liquidation Cascade Monitor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-md border px-3 py-2 text-center">
            <div className="text-[10px] text-muted-foreground">At Risk</div>
            <div className="text-lg font-mono font-semibold text-red-400">{atRiskCount}</div>
          </div>
          <div className="rounded-md border px-3 py-2 text-center">
            <div className="text-[10px] text-muted-foreground">Cascade Zone</div>
            <div className="text-lg font-mono font-semibold text-amber-400">{cascadeZone}</div>
          </div>
          <div className="rounded-md border px-3 py-2 text-center">
            <div className="text-[10px] text-muted-foreground">24h Liquidated</div>
            <div className="text-lg font-mono font-semibold">{liquidated24h}</div>
          </div>
        </div>

        <div className="overflow-auto max-h-[350px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">Protocol</TableHead>
                <TableHead className="text-[10px]">Collateral</TableHead>
                <TableHead className="text-[10px]">Debt</TableHead>
                <TableHead className="text-[10px] text-right">HF</TableHead>
                <TableHead className="text-[10px] text-right">Liq. Price</TableHead>
                <TableHead className="text-[10px] text-right">Distance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_POSITIONS.map((pos, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs">{pos.protocol}</TableCell>
                  <TableCell className="text-xs">
                    <span className="font-mono">{pos.collateral}</span>
                    <span className="text-muted-foreground ml-1 text-[10px]">{formatUsd(pos.collateralUsd)}</span>
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="font-mono">{pos.debt}</span>
                    <span className="text-muted-foreground ml-1 text-[10px]">{formatUsd(pos.debtUsd)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={hfBadgeVariant(pos.healthFactor)} className="text-[10px] font-mono">
                      {pos.healthFactor.toFixed(2)}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-xs font-mono text-right ${hfColor(pos.healthFactor)}`}>
                    {pos.liquidationPrice < 1000 ? `$${pos.liquidationPrice}` : `$${pos.liquidationPrice.toLocaleString()}`}
                  </TableCell>
                  <TableCell className={`text-xs font-mono text-right ${pos.distancePct < 3 ? "text-red-400" : "text-muted-foreground"}`}>
                    {pos.distancePct.toFixed(1)}%
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
