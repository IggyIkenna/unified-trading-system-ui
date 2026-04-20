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
import type { PnlAttributionRow } from "@/lib/signal-broadcast";

interface PnlAttributionPanelProps {
  /**
   * Feature flag wired at the counterparty level (UAC
   * `Counterparty.pnl_reporting_enabled`). If false this component renders
   * `null` — reporting-back ingestion is an explicit post-Sept-2026 follow-up
   * in the signal_leasing plan, so hiding is the default.
   */
  readonly enabled: boolean;
  readonly rows: readonly PnlAttributionRow[];
}

function fmtUsd(x: number): string {
  return `$${x.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export function PnlAttributionPanel({
  enabled,
  rows,
}: PnlAttributionPanelProps) {
  if (!enabled) {
    return null;
  }

  return (
    <Card data-testid="signal-broadcast-pnl-attribution-panel">
      <CardHeader>
        <CardTitle className="text-lg">P&amp;L attribution (reported)</CardTitle>
        <CardDescription>
          P&amp;L attribution requires you to report fills back to Odum. This
          surface reflects your own self-reported numbers.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Slot</TableHead>
              <TableHead className="text-right">Reported P&amp;L</TableHead>
              <TableHead className="text-right">Signals received</TableHead>
              <TableHead className="text-right">Window</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow
                key={r.slot_label}
                data-testid={`pnl-row-${r.slot_label}`}
              >
                <TableCell className="max-w-[280px] truncate font-mono text-xs">
                  {r.slot_label}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {fmtUsd(r.reported_pnl_usd)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {r.reported_signal_count}
                </TableCell>
                <TableCell className="text-right font-mono text-xs text-muted-foreground">
                  {fmtDate(r.reporting_window_start)} —{" "}
                  {fmtDate(r.reporting_window_end)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
