"use client";

import { PageHeader } from "@/components/platform/page-header";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Clock, DollarSign, TrendingUp, Calendar, Plus, Lock, Unlock, CheckCircle2 } from "lucide-react";
import { formatNumber } from "@/lib/utils/formatters";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SAFTRecord {
  id: string;
  token: string;
  round: "Seed" | "Series A" | "Strategic" | "Private";
  committedAmount: number;
  tokenPrice: number;
  tokensAllocated: number;
  vestedPct: number;
  cliffDate: string;
  fullVestDate: string;
  currentPrice: number;
  currentValue: number;
  npv: number;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_SAFTS: SAFTRecord[] = [
  {
    id: "SAFT-001",
    token: "Protocol X (PX)",
    round: "Seed",
    committedAmount: 500000,
    tokenPrice: 0.08,
    tokensAllocated: 6250000,
    vestedPct: 45,
    cliffDate: "2025-09-01",
    fullVestDate: "2027-09-01",
    currentPrice: 0.14,
    currentValue: 875000,
    npv: 742500,
  },
  {
    id: "SAFT-002",
    token: "Protocol Y (PY)",
    round: "Series A",
    committedAmount: 750000,
    tokenPrice: 0.25,
    tokensAllocated: 3000000,
    vestedPct: 30,
    cliffDate: "2026-01-15",
    fullVestDate: "2028-01-15",
    currentPrice: 0.42,
    currentValue: 1260000,
    npv: 1050000,
  },
  {
    id: "SAFT-003",
    token: "DeFi Chain (DFC)",
    round: "Strategic",
    committedAmount: 400000,
    tokenPrice: 1.2,
    tokensAllocated: 333333,
    vestedPct: 65,
    cliffDate: "2025-06-01",
    fullVestDate: "2027-06-01",
    currentPrice: 2.85,
    currentValue: 950000,
    npv: 855000,
  },
  {
    id: "SAFT-004",
    token: "ZK Layer (ZKL)",
    round: "Seed",
    committedAmount: 350000,
    tokenPrice: 0.015,
    tokensAllocated: 23333333,
    vestedPct: 20,
    cliffDate: "2026-03-01",
    fullVestDate: "2028-09-01",
    currentPrice: 0.028,
    currentValue: 653333,
    npv: 522667,
  },
  {
    id: "SAFT-005",
    token: "Cross Bridge (XBR)",
    round: "Private",
    committedAmount: 400000,
    tokenPrice: 0.5,
    tokensAllocated: 800000,
    vestedPct: 55,
    cliffDate: "2025-07-15",
    fullVestDate: "2027-07-15",
    currentPrice: 0.82,
    currentValue: 656000,
    npv: 557600,
  },
];

const TOTAL_COMMITTED = MOCK_SAFTS.reduce((acc, s) => acc + s.committedAmount, 0);
const TOTAL_VESTED_VALUE = MOCK_SAFTS.reduce((acc, s) => acc + (s.currentValue * s.vestedPct) / 100, 0);

// Next unlock calculation — find the SAFT with nearest cliff that hasn't fully vested
const now = new Date("2026-03-28");
const nextUnlock = MOCK_SAFTS.filter((s) => s.vestedPct < 100)
  .map((s) => {
    const cliff = new Date(s.cliffDate);
    const diffDays = Math.ceil((cliff.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { ...s, daysToUnlock: diffDays };
  })
  .filter((s) => s.daysToUnlock > 0)
  .sort((a, b) => a.daysToUnlock - b.daysToUnlock)[0];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${formatNumber(v / 1_000_000, 2)}M`;
  if (abs >= 1_000) return `$${v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  return `$${formatNumber(v, 2)}`;
}

function formatTokens(v: number): string {
  if (v >= 1_000_000) return `${formatNumber(v / 1_000_000, 2)}M`;
  if (v >= 1_000) return `${formatNumber(v / 1_000, 0)}K`;
  return formatNumber(v, 0);
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

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function dateLabel(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days < 0) return `${Math.abs(days)}d ago`;
  if (days === 0) return "Today";
  return `in ${days}d`;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function SAFTPage() {
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);

  return (
    <main className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader title="SAFT & Token Warrants" description="Simple Agreement for Future Tokens tracking" />
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAddDialogOpen(true)}>
          <Plus className="size-3.5" />
          Add SAFT
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold font-mono">{MOCK_SAFTS.length}</p>
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
                <p className="text-2xl font-semibold font-mono">{formatCurrency(TOTAL_COMMITTED)}</p>
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
                <p className="text-2xl font-semibold font-mono">{formatCurrency(TOTAL_VESTED_VALUE)}</p>
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

      {/* SAFT Table */}
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
              {MOCK_SAFTS.map((saft) => (
                <TableRow key={saft.id}>
                  <TableCell className="text-sm font-medium">{saft.token}</TableCell>
                  <TableCell>{roundBadge(saft.round)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCurrency(saft.committedAmount)}</TableCell>
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
                      {daysUntil(saft.cliffDate) <= 0 ? (
                        <Unlock className="size-3 text-[var(--status-live)]" />
                      ) : (
                        <Lock className="size-3" />
                      )}
                      <span>{saft.cliffDate}</span>
                      <span className="text-[10px]">({dateLabel(saft.cliffDate)})</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      <span>{saft.fullVestDate}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-[var(--pnl-positive)]">
                    {formatCurrency(saft.currentValue)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCurrency(saft.npv)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Vesting Timeline Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Vesting Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {MOCK_SAFTS.map((saft) => {
              const cliffDays = daysUntil(saft.cliffDate);
              const vestDays = daysUntil(saft.fullVestDate);
              // Normalize timeline: earliest date is 2025-06-01, latest is 2028-09-01
              // Total span ~1188 days
              const timelineStart = new Date("2025-06-01").getTime();
              const timelineEnd = new Date("2028-09-01").getTime();
              const totalSpan = timelineEnd - timelineStart;

              const cliffTime = new Date(saft.cliffDate).getTime();
              const vestTime = new Date(saft.fullVestDate).getTime();
              const nowTime = now.getTime();

              const cliffPct = ((cliffTime - timelineStart) / totalSpan) * 100;
              const vestPct = ((vestTime - timelineStart) / totalSpan) * 100;
              const nowPct = Math.min(((nowTime - timelineStart) / totalSpan) * 100, 100);
              const vestedWidth = Math.min(nowPct - cliffPct, vestPct - cliffPct);

              return (
                <div key={saft.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{saft.token}</span>
                    <span className="text-muted-foreground font-mono">{saft.vestedPct}% vested</span>
                  </div>
                  <div className="relative h-5 rounded bg-muted overflow-hidden">
                    {/* Cliff region (locked) */}
                    <div
                      className="absolute h-full bg-muted-foreground/20 rounded-l"
                      style={{ left: 0, width: `${cliffPct}%` }}
                    />
                    {/* Vested portion */}
                    {vestedWidth > 0 && (
                      <div
                        className={`absolute h-full ${vestingColor(saft.vestedPct)} rounded`}
                        style={{ left: `${cliffPct}%`, width: `${Math.max(vestedWidth, 0)}%` }}
                      />
                    )}
                    {/* Full vest target */}
                    <div
                      className="absolute h-full border-r-2 border-dashed border-muted-foreground/40"
                      style={{ left: `${vestPct}%` }}
                    />
                    {/* Now marker */}
                    <div className="absolute h-full w-0.5 bg-primary" style={{ left: `${nowPct}%` }} title="Now" />
                  </div>
                </div>
              );
            })}
            {/* Legend */}
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-2">
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

      {/* Add SAFT Dialog */}
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
    </main>
  );
}
