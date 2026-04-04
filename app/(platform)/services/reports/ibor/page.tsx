"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  AlertTriangle,
  Clock,
  FileText,
  ChevronDown,
  ChevronRight,
  Database,
  CheckCircle2,
  Search,
  XCircle,
} from "lucide-react";
import { formatNumber } from "@/lib/utils/formatters";
import {
  MOCK_BREAKS,
  MOCK_JOURNAL,
  MOCK_POSITIONS,
  MOCK_SNAPSHOTS,
  type AuditEntry,
  type JournalEntry,
  type Position,
  type PositionBreak,
  type Snapshot,
} from "@/lib/mocks/fixtures/reports-ibor";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${formatNumber(v / 1_000_000, 2)}M`;
  if (abs >= 1_000) return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${formatNumber(v, 2)}`;
}

function formatQuantity(v: number): string {
  if (Math.abs(v) >= 1_000) return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (Math.abs(v) < 1 && v !== 0) return formatNumber(v, 4);
  return formatNumber(v, 2);
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sourceBadge(source: Position["source"]) {
  const styles: Record<Position["source"], string> = {
    Exchange: "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-[var(--accent-blue)]/20",
    OTC: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    Manual: "bg-[var(--status-warning)]/10 text-[var(--status-warning)] border-[var(--status-warning)]/20",
    DeFi: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${styles[source]}`}>
      {source}
    </Badge>
  );
}

function entryTypeBadge(type: JournalEntry["entryType"]) {
  const styles: Record<JournalEntry["entryType"], string> = {
    Trade: "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-[var(--accent-blue)]/20",
    Transfer: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "Corporate Action": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Adjustment: "bg-[var(--status-warning)]/10 text-[var(--status-warning)] border-[var(--status-warning)]/20",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${styles[type]}`}>
      {type}
    </Badge>
  );
}

function breakStatusBadge(status: PositionBreak["status"]) {
  const styles: Record<PositionBreak["status"], string> = {
    Open: "bg-[var(--pnl-negative)]/10 text-[var(--pnl-negative)] border-[var(--pnl-negative)]/20",
    Investigating: "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-[var(--accent-blue)]/20",
    Resolved: "bg-[var(--status-live)]/10 text-[var(--status-live)] border-[var(--status-live)]/20",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${styles[status]}`}>
      {status}
    </Badge>
  );
}

function pnlColor(v: number): string {
  if (v > 0) return "text-[var(--pnl-positive)]";
  if (v < 0) return "text-[var(--pnl-negative)]";
  return "text-muted-foreground";
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function IBORPage() {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
  const [snapshotDate, setSnapshotDate] = React.useState("2026-03-28");

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedSnapshot = MOCK_SNAPSHOTS.find((s) => s.date === snapshotDate);

  return (
    <main className="flex-1 p-6 space-y-6">
      <PageHeader
        title="Investment Book of Records"
        description={<>Last snapshot: {formatTime("2026-03-28T14:32:00Z")}</>}
      >
        <Button variant="outline" size="sm" className="gap-1.5">
          <Database className="size-3.5" />
          Force Snapshot
        </Button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold font-mono">247</p>
                <p className="text-xs text-muted-foreground">Total Positions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--pnl-negative)]/10">
                <AlertTriangle className="size-5" style={{ color: "var(--pnl-negative)" }} />
              </div>
              <div>
                <p className="text-2xl font-semibold font-mono">3</p>
                <p className="text-xs text-muted-foreground">Position Breaks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--accent-blue)]/10">
                <FileText className="size-5" style={{ color: "var(--accent-blue)" }} />
              </div>
              <div>
                <p className="text-2xl font-semibold font-mono">42</p>
                <p className="text-xs text-muted-foreground">Journal Entries Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--status-live)]/10">
                <Clock className="size-5" style={{ color: "var(--status-live)" }} />
              </div>
              <div>
                <p className="text-2xl font-semibold font-mono">&lt; 5 min</p>
                <p className="text-xs text-muted-foreground">Snapshot Age</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="positions">
        <TabsList>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="journal">Journal</TabsTrigger>
          <TabsTrigger value="breaks">Breaks</TabsTrigger>
          <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
        </TabsList>

        {/* Positions Tab */}
        <TabsContent value="positions">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Instrument</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Cost Basis</TableHead>
                    <TableHead className="text-right">Market Value</TableHead>
                    <TableHead className="text-right">Unrealised P&L</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_POSITIONS.map((pos) => (
                    <React.Fragment key={pos.id}>
                      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleRow(pos.id)}>
                        <TableCell className="w-8">
                          {expandedRows.has(pos.id) ? (
                            <ChevronDown className="size-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="size-3.5 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm font-medium">{pos.instrument}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {pos.venue}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatQuantity(pos.quantity)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(pos.costBasis)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCurrency(pos.marketValue)}
                        </TableCell>
                        <TableCell className={`text-right font-mono text-sm ${pnlColor(pos.unrealisedPnl)}`}>
                          {pos.unrealisedPnl > 0 ? "+" : ""}
                          {formatCurrency(pos.unrealisedPnl)}
                        </TableCell>
                        <TableCell>{sourceBadge(pos.source)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatTime(pos.lastUpdated)}</TableCell>
                      </TableRow>
                      {expandedRows.has(pos.id) && (
                        <TableRow>
                          <TableCell colSpan={9} className="bg-muted/20 p-0">
                            <div className="px-8 py-3 space-y-1.5">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Audit Trail</p>
                              {pos.auditTrail.map((entry, i) => (
                                <div key={i} className="flex items-center gap-3 text-xs">
                                  <span className="font-mono text-muted-foreground w-36 shrink-0">
                                    {formatTime(entry.timestamp)}
                                  </span>
                                  <Badge variant="outline" className="text-[10px] shrink-0">
                                    {entry.action}
                                  </Badge>
                                  <span className="text-muted-foreground">{entry.detail}</span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Journal Tab */}
        <TabsContent value="journal">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Trade Journal Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Entry Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>Counterparty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_JOURNAL.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {formatTime(entry.timestamp)}
                      </TableCell>
                      <TableCell>{entryTypeBadge(entry.entryType)}</TableCell>
                      <TableCell className="text-sm">{entry.description}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {entry.quantity !== 0 ? formatQuantity(entry.quantity) : "--"}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-sm ${pnlColor(entry.value)}`}>
                        {entry.value > 0 ? "+" : ""}
                        {formatCurrency(entry.value)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{entry.counterparty}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breaks Tab */}
        <TabsContent value="breaks">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Position Discrepancies</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instrument</TableHead>
                    <TableHead className="text-right">Our Qty</TableHead>
                    <TableHead className="text-right">Venue Qty</TableHead>
                    <TableHead className="text-right">Difference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Age</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_BREAKS.map((brk) => (
                    <TableRow key={brk.id}>
                      <TableCell className="font-mono text-sm font-medium">{brk.instrument}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatQuantity(brk.ourQty)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatQuantity(brk.venueQty)}</TableCell>
                      <TableCell className={`text-right font-mono text-sm ${pnlColor(brk.difference)}`}>
                        {brk.difference > 0 ? "+" : ""}
                        {formatQuantity(brk.difference)}
                      </TableCell>
                      <TableCell>{breakStatusBadge(brk.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{brk.age}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Snapshots Tab */}
        <TabsContent value="snapshots">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Daily Position Snapshots</CardTitle>
                <Input
                  type="date"
                  value={snapshotDate}
                  onChange={(e) => setSnapshotDate(e.target.value)}
                  className="w-[180px] h-8 text-xs"
                />
              </div>
            </CardHeader>
            <CardContent>
              {selectedSnapshot ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground">Positions</p>
                      <p className="text-lg font-semibold font-mono">{selectedSnapshot.totalPositions}</p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground">Market Value</p>
                      <p className="text-lg font-semibold font-mono">
                        {formatCurrency(selectedSnapshot.totalMarketValue)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground">Unrealised P&L</p>
                      <p className={`text-lg font-semibold font-mono ${pnlColor(selectedSnapshot.totalUnrealisedPnl)}`}>
                        +{formatCurrency(selectedSnapshot.totalUnrealisedPnl)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground">Breaks</p>
                      <p className="text-lg font-semibold font-mono">{selectedSnapshot.breakCount}</p>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Positions</TableHead>
                        <TableHead className="text-right">Market Value</TableHead>
                        <TableHead className="text-right">Unrealised P&L</TableHead>
                        <TableHead className="text-right">Breaks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MOCK_SNAPSHOTS.map((snap) => (
                        <TableRow key={snap.date} className={snap.date === snapshotDate ? "bg-muted/50" : ""}>
                          <TableCell className="font-mono text-sm">{snap.date}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{snap.totalPositions}</TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatCurrency(snap.totalMarketValue)}
                          </TableCell>
                          <TableCell className={`text-right font-mono text-sm ${pnlColor(snap.totalUnrealisedPnl)}`}>
                            +{formatCurrency(snap.totalUnrealisedPnl)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {snap.breakCount > 0 ? (
                              <span className="text-[var(--pnl-negative)]">{snap.breakCount}</span>
                            ) : (
                              <CheckCircle2 className="size-3.5 text-[var(--status-live)] inline" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <Search className="size-6" />
                  <p className="text-sm">No snapshot found for {snapshotDate}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
