import { BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { fmtNum, fmtPct } from "./helpers";
import type { CandidateStrategy } from "./types";

function heatColor(sharpe: number) {
  if (sharpe >= 1.2) return "bg-emerald-500/25 text-emerald-300";
  if (sharpe >= 0.5) return "bg-amber-500/20 text-amber-200";
  if (sharpe >= 0) return "bg-slate-500/20 text-slate-200";
  return "bg-rose-500/20 text-rose-200";
}

export function RegimeAnalysisPanel({
  strategy,
}: {
  strategy: CandidateStrategy;
}) {
  const rows = strategy.regimePerformance;
  const worst = rows.reduce((a, b) => (a.sharpe < b.sharpe ? a : b));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="size-4 text-cyan-400" />
          Regime Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-7 gap-1.5">
          {rows.map((r) => (
            <div key={r.regime} className="text-center space-y-1">
              <div
                className={cn(
                  "rounded-md py-2 px-1 text-[10px] font-mono font-semibold",
                  heatColor(r.sharpe),
                )}
              >
                {fmtNum(r.sharpe)}
              </div>
              <p className="text-[9px] text-muted-foreground leading-tight line-clamp-2">
                {r.regime}
              </p>
            </div>
          ))}
        </div>
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead>Regime</TableHead>
              <TableHead className="text-right">Sharpe</TableHead>
              <TableHead className="text-right">Return</TableHead>
              <TableHead className="text-right">Max DD</TableHead>
              <TableHead className="text-right">Hit</TableHead>
              <TableHead className="text-right">Trades</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.regime} className="text-xs">
                <TableCell className="font-medium">{r.regime}</TableCell>
                <TableCell className="text-right font-mono">
                  {fmtNum(r.sharpe)}
                </TableCell>
                <TableCell className="text-right font-mono text-emerald-400/90">
                  {fmtPct(r.return)}
                </TableCell>
                <TableCell className="text-right font-mono text-rose-400/90">
                  {fmtPct(r.maxDrawdown)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {fmtPct(r.hitRate)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {r.tradeCount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Worst regime:</span>
          <Badge variant="outline" className="font-mono text-[10px]">
            {worst.regime}
          </Badge>
          <span className="font-mono text-rose-400">
            Sharpe {fmtNum(worst.sharpe)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
