"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BacktestPaperLiveRow } from "@/lib/signal-broadcast";

interface BacktestComparisonPanelProps {
  readonly rows: readonly BacktestPaperLiveRow[];
}

function fmtPct(x: number | null): string {
  if (x === null) return "-";
  return `${x.toFixed(1)}%`;
}

function fmtSharpe(x: number | null): string {
  if (x === null) return "-";
  return x.toFixed(2);
}

function fmtCount(x: number | null): string {
  if (x === null) return "-";
  return x.toString();
}

function fmtHitRate(x: number): string {
  return `${(x * 100).toFixed(1)}%`;
}

function fmtWindow(startIso: string, endIso: string): string {
  const start = startIso.slice(0, 10);
  const end = endIso.slice(0, 10);
  return `${start} → ${end}`;
}

export function BacktestComparisonPanel({ rows }: BacktestComparisonPanelProps) {
  const windowLabel = rows.length > 0 ? fmtWindow(rows[0].window_start, rows[0].window_end) : null;

  return (
    <Card data-testid="signal-broadcast-backtest-comparison-panel">
      <CardHeader>
        <CardTitle className="text-lg">Backtest vs paper vs live (same period)</CardTitle>
        <CardDescription>
          Three-way parity view across the maturity ladder. Paper columns are blank when a slot hasn&apos;t reached the
          PAPER_TRADING stage. Live return is reported only for slots Odum has observed against a paper baseline: your
          counterparty P&amp;L may diverge.
          {windowLabel !== null && (
            <>
              {" "}
              <span className="font-mono text-xs" data-testid="backtest-comparison-window">
                Window: {windowLabel}
              </span>
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2} className="align-bottom">
                Slot
              </TableHead>
              <TableHead colSpan={2} className="border-b border-border/40 text-center">
                Backtest
              </TableHead>
              <TableHead colSpan={3} className="border-b border-border/40 text-center">
                Paper
              </TableHead>
              <TableHead colSpan={3} className="border-b border-border/40 text-center">
                Live
              </TableHead>
            </TableRow>
            <TableRow>
              <TableHead className="text-right">Sharpe</TableHead>
              <TableHead className="text-right">Return</TableHead>
              <TableHead className="text-right">Sharpe</TableHead>
              <TableHead className="text-right">Return</TableHead>
              <TableHead className="text-right">Signals</TableHead>
              <TableHead className="text-right">Signals</TableHead>
              <TableHead className="text-right">Hit rate</TableHead>
              <TableHead className="text-right">Return</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.slot_label} data-testid={`backtest-row-${r.slot_label}`}>
                <TableCell className="max-w-[280px] truncate font-mono text-xs">{r.slot_label}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fmtSharpe(r.backtest_sharpe)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fmtPct(r.backtest_return_pct)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fmtSharpe(r.paper_sharpe)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fmtPct(r.paper_return_pct)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fmtCount(r.paper_signal_count)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{r.live_signal_count}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fmtHitRate(r.live_signal_hit_rate)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fmtPct(r.live_return_pct)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
