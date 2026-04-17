"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Clock, DollarSign, TrendingUp, Calendar, Plus, Lock, Unlock } from "lucide-react";
import { formatNumber, formatCurrency, formatCompact } from "@/lib/utils/formatters";
import { useAccountsData, type SAFTRecord } from "./accounts-data-context";
import { Spinner } from "@/components/shared/spinner";
import type { WidgetComponentProps } from "../widget-registry";

export function SaftPortfolioWidget(_props: WidgetComponentProps) {
  const { saftRecords, isLoading, error } = useAccountsData();
  const now = React.useMemo(() => new Date(), []);

  const TOTAL_COMMITTED = React.useMemo(
    () => saftRecords.reduce((acc, s) => acc + s.committedAmount, 0),
    [saftRecords],
  );
  const TOTAL_VESTED_VALUE = React.useMemo(
    () => saftRecords.reduce((acc, s) => acc + (s.currentValue * s.vestedPct) / 100, 0),
    [saftRecords],
  );

  const nextUnlock = React.useMemo(() => {
    return saftRecords
      .filter((s) => s.vestedPct < 100)
      .map((s) => {
        const cliff = new Date(s.cliffDate);
        const diffDays = Math.ceil((cliff.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { ...s, daysToUnlock: diffDays };
      })
      .filter((s) => s.daysToUnlock > 0)
      .sort((a, b) => a.daysToUnlock - b.daysToUnlock)[0];
  }, [saftRecords, now]);

  const [addDialogOpen, setAddDialogOpen] = React.useState(false);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Spinner className="size-5" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-rose-400">Could not load account data</div>
    );
  }

  if (saftRecords.length === 0) {
    return <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No SAFT records</div>;
  }

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">Simple Agreement for Future Tokens tracking</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => setAddDialogOpen(true)}>
          <Plus className="size-3.5" />
          Add SAFT
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold font-mono">{saftRecords.length}</p>
                <p className="text-xs text-muted-foreground">Total SAFTs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--accent-blue)]/10">
                <DollarSign className="size-5" style={{ color: "var(--accent-blue)" }} />
              </div>
              <div>
                <p className="text-2xl font-semibold font-mono">{formatCurrencyCompact(TOTAL_COMMITTED)}</p>
                <p className="text-xs text-muted-foreground">Total Committed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--pnl-positive)]/10">
                <TrendingUp className="size-5" style={{ color: "var(--pnl-positive)" }} />
              </div>
              <div>
                <p className="text-2xl font-semibold font-mono">{formatCurrencyCompact(TOTAL_VESTED_VALUE)}</p>
                <p className="text-xs text-muted-foreground">Vested Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--status-warning)]/10">
                <Clock className="size-5" style={{ color: "var(--status-warning)" }} />
              </div>
              <div>
                <p className="text-2xl font-semibold font-mono">{nextUnlock ? `${nextUnlock.daysToUnlock}d` : "--"}</p>
                <p className="text-xs text-muted-foreground">Next Unlock</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">SAFT Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token</TableHead>
                <TableHead>Round</TableHead>
                <TableHead className="text-right">Committed</TableHead>
                <TableHead className="text-right">Token Price</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-center">Vested %</TableHead>
                <TableHead>Cliff</TableHead>
                <TableHead>Full Vest</TableHead>
                <TableHead className="text-right">Current Value</TableHead>
                <TableHead className="text-right">NPV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {saftRecords.map((saft) => (
                <TableRow key={saft.id}>
                  <TableCell className="text-sm font-medium">{saft.token}</TableCell>
                  <TableCell>{roundBadge(saft.round)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrencyCompact(saft.committedAmount)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">${formatNumber(saft.tokenPrice, 3)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatTokens(saft.tokensAllocated)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${vestingColor(saft.vestedPct)}`}
                          style={{ width: `${saft.vestedPct}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono w-8 text-right">{saft.vestedPct}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {daysUntil(saft.cliffDate, now) <= 0 ? (
                        <Unlock className="size-3 text-[var(--status-live)]" />
                      ) : (
                        <Lock className="size-3" />
                      )}
                      <span>{saft.cliffDate}</span>
                      <span className="text-[10px]">({dateLabel(saft.cliffDate, now)})</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      <span>{saft.fullVestDate}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-[var(--pnl-positive)]">
                    {formatCurrencyCompact(saft.currentValue)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCurrencyCompact(saft.npv)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Vesting Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {saftRecords.map((saft) => {
              const cliffPct = ((new Date(saft.cliffDate).getTime() - timelineStart) / totalSpan) * 100;
              const vestPct = ((new Date(saft.fullVestDate).getTime() - timelineStart) / totalSpan) * 100;
              const nowTime = now.getTime();
              const nowPct = Math.min(((nowTime - timelineStart) / totalSpan) * 100, 100);
              const vestedWidth = Math.min(nowPct - cliffPct, vestPct - cliffPct);

              return (
                <div key={saft.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{saft.token}</span>
                    <span className="text-muted-foreground font-mono">{saft.vestedPct}% vested</span>
                  </div>
                  <div className="relative h-5 rounded bg-muted overflow-hidden">
                    <div
                      className="absolute h-full bg-muted-foreground/20 rounded-l"
                      style={{ left: 0, width: `${cliffPct}%` }}
                    />
                    {vestedWidth > 0 && (
                      <div
                        className={`absolute h-full ${vestingColor(saft.vestedPct)} rounded`}
                        style={{ left: `${cliffPct}%`, width: `${Math.max(vestedWidth, 0)}%` }}
                      />
                    )}
                    <div
                      className="absolute h-full border-r-2 border-dashed border-muted-foreground/40"
                      style={{ left: `${vestPct}%` }}
                    />
                    <div className="absolute h-full w-0.5 bg-primary" style={{ left: `${nowPct}%` }} title="Now" />
                  </div>
                </div>
              );
            })}
            <div className="flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground pt-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-2 rounded bg-muted-foreground/20" />
                <span>Cliff (locked)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-2 rounded bg-[var(--status-live)]" />
                <span>Vested</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-primary" />
                <span>Today</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0 border-t-2 border-dashed border-muted-foreground/40" />
                <span>Full vest</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add SAFT Agreement</DialogTitle>
            <DialogDescription>Record a new Simple Agreement for Future Tokens.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Token Name</label>
              <Input placeholder="e.g. Protocol Z (PZ)" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Round</label>
              <Select>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select round" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seed">Seed</SelectItem>
                  <SelectItem value="series-a">Series A</SelectItem>
                  <SelectItem value="strategic">Strategic</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Committed Amount ($)</label>
                <Input type="number" placeholder="500000" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Token Price ($)</label>
                <Input type="number" placeholder="0.08" step="0.001" className="h-9" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Cliff Date</label>
                <Input type="date" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Full Vest Date</label>
                <Input type="date" className="h-9" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button disabled>Save SAFT</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const timelineStart = new Date("2025-06-01").getTime();
const timelineEnd = new Date("2028-09-01").getTime();
const totalSpan = timelineEnd - timelineStart;

function formatCurrencyCompact(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${formatCompact(v)}`;
  return formatCurrency(v, "USD", 0);
}

function formatTokens(v: number): string {
  return formatCompact(v);
}

function roundBadge(round: SAFTRecord["round"]) {
  const styles: Record<SAFTRecord["round"], string> = {
    Seed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "Series A": "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-[var(--accent-blue)]/20",
    Strategic: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    Private: "bg-[var(--status-warning)]/10 text-[var(--status-warning)] border-[var(--status-warning)]/20",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${styles[round]}`}>
      {round}
    </Badge>
  );
}

function vestingColor(pct: number): string {
  if (pct >= 75) return "bg-[var(--status-live)]";
  if (pct >= 50) return "bg-[var(--accent-blue)]";
  if (pct >= 25) return "bg-[var(--status-warning)]";
  return "bg-muted-foreground";
}

function daysUntil(dateStr: string, now: Date): number {
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function dateLabel(dateStr: string, now: Date): string {
  const days = daysUntil(dateStr, now);
  if (days < 0) return `${Math.abs(days)}d ago`;
  if (days === 0) return "Today";
  return `in ${days}d`;
}
