"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BacktestVsLiveRow } from "@/lib/signal-broadcast";

interface BacktestComparisonPanelProps {
  readonly rows: readonly BacktestVsLiveRow[];
}

function fmtPct(x: number): string {
  return `${x.toFixed(1)}%`;
}

function fmtHitRate(x: number): string {
  return `${(x * 100).toFixed(1)}%`;
}

export function BacktestComparisonPanel({
  rows,
}: BacktestComparisonPanelProps) {
  return (
    <Card data-testid="signal-broadcast-backtest-comparison-panel">
      <CardHeader>
        <CardTitle className="text-lg">Backtest vs live signals</CardTitle>
        <CardDescription>
          Odum-held backtest numbers vs live signal aggregate. Read-only
          reference — actual P&amp;L depends on your execution stack.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Slot</TableHead>
              <TableHead className="text-right">Backtest Sharpe</TableHead>
              <TableHead className="text-right">Backtest return</TableHead>
              <TableHead className="text-right">Live signals</TableHead>
              <TableHead className="text-right">Live hit rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow
                key={r.slot_label}
                data-testid={`backtest-row-${r.slot_label}`}
              >
                <TableCell className="max-w-[280px] truncate font-mono text-xs">
                  {r.slot_label}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {r.backtest_sharpe.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {fmtPct(r.backtest_return_pct)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {r.live_signal_count}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {fmtHitRate(r.live_signal_hit_rate)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
