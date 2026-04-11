"use client";

import * as React from "react";
import Link from "next/link";
import { BatchWorkspaceShell } from "@/components/batch-workspace";
import { ComparisonPanel, type ComparisonEntity, type MetricDefinition } from "@/components/batch-workspace/comparison-panel";
import { BatchLiveCompare, type BatchLiveMetric } from "@/components/batch-workspace/batch-live-compare";
import { BatchDetailDrawer, type DetailSection } from "@/components/batch-workspace/batch-detail-drawer";
import type { FilterConfig } from "@/components/batch-workspace/batch-filter-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DataSource } from "@/components/shared/data-freshness-strip";
import { Target, Rocket, GitCompare, Clock, CheckCircle2, XCircle, Eye } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";
import { MOCK_CANDIDATES, type CandidateStatus, type StrategyCandidate } from "@/lib/mocks/fixtures/research-pages";

// ---------------------------------------------------------------------------
// Filter config
// ---------------------------------------------------------------------------

const CANDIDATE_FILTERS: FilterConfig[] = [
  {
    key: "status",
    label: "Status",
    placeholder: "All statuses",
    options: [
      { value: "all", label: "All" },
      { value: "pending", label: "Pending" },
      { value: "approved", label: "Approved" },
      { value: "rejected", label: "Rejected" },
    ],
    defaultValue: "all",
  },
  {
    key: "archetype",
    label: "Archetype",
    placeholder: "All archetypes",
    options: [
      { value: "all", label: "All" },
      { value: "BASIS_TRADE", label: "Basis Trade" },
      { value: "MARKET_MAKING", label: "Market Making" },
      { value: "DIRECTIONAL", label: "Directional" },
      { value: "ARBITRAGE", label: "Arbitrage" },
      { value: "YIELD", label: "Yield" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Comparison metric definitions
// ---------------------------------------------------------------------------

const STRATEGY_METRICS: MetricDefinition[] = [
  { key: "sharpe", label: "Sharpe Ratio", group: "Performance", higherIsBetter: true },
  { key: "sortino", label: "Sortino Ratio", group: "Performance", higherIsBetter: true },
  { key: "totalReturn", label: "Total Return", group: "Performance", format: "percent", higherIsBetter: true },
  { key: "maxDrawdown", label: "Max Drawdown", group: "Risk", format: "percent", higherIsBetter: false },
  { key: "winRate", label: "Win Rate", group: "Risk", format: "percent", higherIsBetter: true },
  { key: "profitFactor", label: "Profit Factor", group: "Risk", higherIsBetter: true },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusBadge(status: CandidateStatus) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 gap-1">
          <Clock className="size-3" />
          Pending
        </Badge>
      );
    case "approved":
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1">
          <CheckCircle2 className="size-3" />
          Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 gap-1">
          <XCircle className="size-3" />
          Rejected
        </Badge>
      );
  }
}

function candidateToComparison(c: StrategyCandidate): ComparisonEntity {
  return {
    id: c.id,
    name: c.name,
    version: "1.0",
    platform: "strategy",
    metrics: {
      sharpe: c.sharpe,
      sortino: c.sharpe * 1.1, // mock
      totalReturn: c.totalReturn,
      maxDrawdown: c.maxDrawdown,
      winRate: c.winRate,
      profitFactor: c.sharpe > 1.5 ? 2.1 : 1.4, // mock
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CandidatesPage() {
  const [filters, setFilters] = React.useState<Record<string, string>>({ status: "all" });
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = React.useState("pipeline");
  const [detailCandidate, setDetailCandidate] = React.useState<StrategyCandidate | null>(null);

  const statusFilter = (filters.status ?? "all") as "all" | CandidateStatus;
  const filtered = statusFilter === "all" ? MOCK_CANDIDATES : MOCK_CANDIDATES.filter((c) => c.status === statusFilter);

  const pendingCount = MOCK_CANDIDATES.filter((c) => c.status === "pending").length;
  const approvedCount = MOCK_CANDIDATES.filter((c) => c.status === "approved").length;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((c) => c.id)));
  }

  const selectedCandidates = MOCK_CANDIDATES.filter((c) => selected.has(c.id));
  const comparisonEntities = selectedCandidates.map(candidateToComparison);

  const dataSources = React.useMemo<DataSource[]>(() => [
    { label: "Candidates", source: "batch" as const, asOf: new Date().toISOString(), staleAfterSeconds: 300 },
    { label: "Backtest Results", source: "batch" as const, asOf: new Date(Date.now() - 3600_000).toISOString(), staleAfterSeconds: 7200 },
  ], []);

  // Detail drawer sections
  const detailSections: DetailSection[] = detailCandidate
    ? [
        {
          title: "Performance",
          items: [
            { label: "Sharpe Ratio", value: detailCandidate.sharpe, format: "number" },
            { label: "Max Drawdown", value: detailCandidate.maxDrawdown, format: "percent" },
            { label: "Win Rate", value: detailCandidate.winRate, format: "percent" },
            { label: "Total Return", value: detailCandidate.totalReturn, format: "percent" },
          ],
        },
        {
          title: "Submission",
          items: [
            { label: "Submitted By", value: detailCandidate.submittedBy },
            { label: "Submitted At", value: detailCandidate.submittedAt },
            { label: "Status", value: detailCandidate.status },
          ],
        },
      ]
    : [];

  // Strategy tabs for the batch workspace
  const tabs = (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="h-8">
        <TabsTrigger value="pipeline" className="text-xs">Pipeline</TabsTrigger>
        <TabsTrigger value="compare" className="text-xs" disabled={selected.size < 2}>
          Compare ({selected.size})
        </TabsTrigger>
        <TabsTrigger value="batch-live" className="text-xs">
          Batch vs Live
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );

  return (
    <BatchWorkspaceShell
      platform="strategy"
      title="Strategy Candidates"
      description="Shortlist, compare, and promote strategies to live trading"
      tabs={tabs}
      filters={CANDIDATE_FILTERS}
      onFilterChange={setFilters}
      dataSources={dataSources}
      showCandidateBasket
      actions={
        <Link href="/services/promote">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Rocket className="size-3.5" />
            Promotion Pipeline
          </Button>
        </Link>
      }
    >
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="border-border/50 bg-gradient-to-br from-background to-muted/10">
          <CardContent className="pt-5 pb-4 px-4 space-y-1.5">
            <div className="text-[10px] text-muted-foreground uppercase tracking-[0.1em]">Total</div>
            <div className="text-2xl font-semibold font-mono tabular-nums tracking-tight">{MOCK_CANDIDATES.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-gradient-to-br from-background to-muted/10">
          <CardContent className="pt-5 pb-4 px-4 space-y-1.5">
            <div className="text-[10px] text-muted-foreground uppercase tracking-[0.1em]">Pending Review</div>
            <div className="text-2xl font-semibold font-mono tabular-nums tracking-tight text-amber-400">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-gradient-to-br from-background to-muted/10">
          <CardContent className="pt-5 pb-4 px-4 space-y-1.5">
            <div className="text-[10px] text-muted-foreground uppercase tracking-[0.1em]">Approved</div>
            <div className="text-2xl font-semibold font-mono tabular-nums tracking-tight text-emerald-400">{approvedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tab content */}
      {activeTab === "pipeline" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Candidate Pipeline</CardTitle>
            <CardDescription className="text-xs">
              {filtered.length} strateg{filtered.length === 1 ? "y" : "ies"} shown
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selected.size === filtered.length && filtered.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Strategy</TableHead>
                    <TableHead className="text-right">Sharpe</TableHead>
                    <TableHead className="text-right">Max DD</TableHead>
                    <TableHead className="text-right">Win Rate</TableHead>
                    <TableHead className="text-right">Return</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((candidate) => (
                    <TableRow key={candidate.id} className="cursor-pointer" onClick={() => setDetailCandidate(candidate)}>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selected.has(candidate.id)} onCheckedChange={() => toggleSelect(candidate.id)} />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{candidate.name}</div>
                        <div className="text-[10px] text-muted-foreground">by {candidate.submittedBy}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatNumber(candidate.sharpe, 2)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-400">{formatPercent(candidate.maxDrawdown, 1)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatPercent(candidate.winRate, 1)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-emerald-400">+{formatPercent(candidate.totalReturn, 1)}</TableCell>
                      <TableCell className="text-center">{statusBadge(candidate.status)}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setDetailCandidate(candidate)}>
                            <Eye className="size-3" />
                          </Button>
                          <Link href="/services/promote">
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={candidate.status === "rejected"}>
                              <Rocket className="size-3" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "compare" && (
        <ComparisonPanel
          entities={comparisonEntities}
          metricDefinitions={STRATEGY_METRICS}
          onRemove={(id) => {
            setSelected((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }}
          highlightBest
        />
      )}

      {activeTab === "batch-live" && (
        <BatchLiveCompare
          entityName="Portfolio"
          entityVersion="current"
          batchAsOf="2026-04-05 T+1"
          liveAsOf="2026-04-06 14:30"
          metrics={[
            { key: "sharpe", label: "Sharpe Ratio", batchValue: 2.14, liveValue: 1.98, higherIsBetter: true, driftThreshold: 0.1 },
            { key: "return", label: "Return", batchValue: 0.0342, liveValue: 0.0318, format: "percent", higherIsBetter: true, driftThreshold: 0.1 },
            { key: "drawdown", label: "Max Drawdown", batchValue: -0.048, liveValue: -0.062, format: "percent", higherIsBetter: false, driftThreshold: 0.15 },
            { key: "winRate", label: "Win Rate", batchValue: 0.64, liveValue: 0.61, format: "percent", higherIsBetter: true, driftThreshold: 0.05 },
            { key: "orders", label: "Orders/Day", batchValue: 142, liveValue: 137, higherIsBetter: true, driftThreshold: 0.1 },
            { key: "slippage", label: "Avg Slippage", batchValue: 0.0008, liveValue: 0.0012, format: "percent", higherIsBetter: false, driftThreshold: 0.25 },
          ]}
        />
      )}

      {/* Detail drawer — shared component from batch workspace */}
      <BatchDetailDrawer
        open={!!detailCandidate}
        onClose={() => setDetailCandidate(null)}
        entityName={detailCandidate?.name ?? ""}
        entityVersion="1.0"
        entityType="strategy_config"
        platform="strategy"
        status={detailCandidate?.status}
        lastUpdated={detailCandidate?.submittedAt}
        updatedBy={detailCandidate?.submittedBy}
        sections={detailSections}
      />
    </BatchWorkspaceShell>
  );
}
