"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";

type Regime = "Trending" | "Mean-Reverting" | "Transitioning";
type Signal = "BULLISH" | "BEARISH" | "NEUTRAL";

interface FactorScore {
  name: string;
  score: number;
  signal: Signal;
  weight: number;
}

interface CommodityPosition {
  commodity: string;
  direction: "LONG" | "SHORT";
  entry: number;
  current: number;
  pnl: number;
  regimeAtEntry: Regime;
}

const CURRENT_REGIME: Regime = "Trending";

const MOCK_FACTORS: FactorScore[] = [
  { name: "Rig Count", score: 0.72, signal: "BULLISH", weight: 20 },
  { name: "COT Positioning", score: 0.45, signal: "BULLISH", weight: 25 },
  { name: "Storage Levels", score: -0.31, signal: "BEARISH", weight: 20 },
  { name: "Price Momentum", score: 0.88, signal: "BULLISH", weight: 25 },
  { name: "Weather Impact", score: 0.12, signal: "NEUTRAL", weight: 10 },
];

const MOCK_POSITIONS: CommodityPosition[] = [
  { commodity: "WTI Crude", direction: "LONG", entry: 72.4, current: 78.2, pnl: 58_000, regimeAtEntry: "Trending" },
  { commodity: "Natural Gas", direction: "SHORT", entry: 3.85, current: 3.42, pnl: 34_200, regimeAtEntry: "Mean-Reverting" },
  { commodity: "Gold", direction: "LONG", entry: 2320, current: 2385, pnl: 42_500, regimeAtEntry: "Trending" },
  { commodity: "Copper", direction: "LONG", entry: 4.15, current: 4.02, pnl: -18_400, regimeAtEntry: "Transitioning" },
  { commodity: "Soybeans", direction: "SHORT", entry: 1245, current: 1198, pnl: 22_100, regimeAtEntry: "Trending" },
];

function regimeBadgeVariant(regime: Regime): "success" | "warning" | "pending" {
  if (regime === "Trending") return "success";
  if (regime === "Transitioning") return "warning";
  return "pending";
}

function signalBadgeVariant(signal: Signal): "success" | "error" | "secondary" {
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
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Commodity Regime Dashboard</CardTitle>
          <Badge variant={regimeBadgeVariant(CURRENT_REGIME)}>{CURRENT_REGIME}</Badge>
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
              {MOCK_FACTORS.map((f) => (
                <TableRow key={f.name}>
                  <TableCell className="text-xs">{f.name}</TableCell>
                  <TableCell className={`text-xs font-mono text-right ${f.score > 0 ? "text-emerald-400" : f.score < 0 ? "text-red-400" : ""}`}>
                    {f.score > 0 ? "+" : ""}{f.score.toFixed(2)}
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
              {MOCK_POSITIONS.map((pos) => (
                <TableRow key={pos.commodity}>
                  <TableCell className="text-xs font-medium">{pos.commodity}</TableCell>
                  <TableCell>
                    <Badge variant={pos.direction === "LONG" ? "success" : "error"} className="text-[10px]">
                      {pos.direction}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right">{pos.entry}</TableCell>
                  <TableCell className="text-xs font-mono text-right">{pos.current}</TableCell>
                  <TableCell className={`text-xs font-mono text-right ${pos.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
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
