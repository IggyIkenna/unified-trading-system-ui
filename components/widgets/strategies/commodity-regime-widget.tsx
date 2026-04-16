"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useStrategiesData, type CommodityRegime, type CommoditySignal } from "./strategies-data-context";

function regimeBadgeVariant(regime: CommodityRegime): "success" | "warning" | "pending" {
  if (regime === "Trending") return "success";
  if (regime === "Transitioning") return "warning";
  return "pending";
}

function signalBadgeVariant(signal: CommoditySignal): "success" | "error" | "secondary" {
  if (signal === "BULLISH") return "success";
  if (signal === "BEARISH") return "error";
  return "secondary";
}

function formatPnl(n: number): string {
  const prefix = n >= 0 ? "+" : "";
  if (Math.abs(n) >= 1_000) return `${prefix}$${(n / 1_000).toFixed(1)}K`;
  return `${prefix}$${n.toFixed(0)}`;
}

export function CommodityRegimeWidget(_props: WidgetComponentProps) {
  const { commodityRegime, isLoading } = useStrategiesData();
  const { currentRegime, factors, positions } = commodityRegime;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex h-full items-center justify-center py-10">
          <p className="text-sm text-muted-foreground">Loading commodity regime data...</p>
        </CardContent>
      </Card>
    );
  }

  if (factors.length === 0 && positions.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="flex h-full items-center justify-center py-10">
          <p className="text-sm text-muted-foreground">No commodity regime data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Commodity Regime Dashboard</CardTitle>
          <Badge variant={regimeBadgeVariant(currentRegime)}>{currentRegime}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Factor Scores</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">Factor</TableHead>
                <TableHead className="text-[10px] text-right">Score</TableHead>
                <TableHead className="text-[10px]">Signal</TableHead>
                <TableHead className="text-[10px] text-right">Weight</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {factors.map((f) => (
                <TableRow key={f.name}>
                  <TableCell className="text-xs">{f.name}</TableCell>
                  <TableCell
                    className={`text-xs font-mono text-right ${f.score > 0 ? "text-emerald-400" : f.score < 0 ? "text-red-400" : ""}`}
                  >
                    {f.score > 0 ? "+" : ""}
                    {f.score.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={signalBadgeVariant(f.signal)} className="text-[10px]">
                      {f.signal}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right">{f.weight}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Active Positions</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">Commodity</TableHead>
                <TableHead className="text-[10px]">Dir</TableHead>
                <TableHead className="text-[10px] text-right">Entry</TableHead>
                <TableHead className="text-[10px] text-right">Current</TableHead>
                <TableHead className="text-[10px] text-right">P&L</TableHead>
                <TableHead className="text-[10px]">Regime</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((pos) => (
                <TableRow key={pos.commodity}>
                  <TableCell className="text-xs font-medium">{pos.commodity}</TableCell>
                  <TableCell>
                    <Badge variant={pos.direction === "LONG" ? "success" : "error"} className="text-[10px]">
                      {pos.direction}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right">{pos.entry}</TableCell>
                  <TableCell className="text-xs font-mono text-right">{pos.current}</TableCell>
                  <TableCell
                    className={`text-xs font-mono text-right ${pos.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {formatPnl(pos.pnl)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={regimeBadgeVariant(pos.regimeAtEntry)} className="text-[10px]">
                      {pos.regimeAtEntry}
                    </Badge>
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
