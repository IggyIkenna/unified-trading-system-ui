"use client";

import { ExecutionNav } from "@/components/execution-platform/execution-nav";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataFreshnessStrip } from "@/components/shared/data-freshness-strip";
import type { DataSource } from "@/components/shared/data-freshness-strip";
import {
  ComparisonPanel,
  BatchDetailDrawer,
} from "@/components/batch-workspace";
import type { ComparisonEntity, MetricDefinition } from "@/components/batch-workspace/comparison-panel";
import type { DetailSection } from "@/components/batch-workspace/batch-detail-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/shared/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAlgos, useExecutionBacktests } from "@/hooks/api/use-orders";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/formatters";
import { pnlColorClass } from "@/lib/utils/pnl";
import type { ColumnDef } from "@tanstack/react-table";
import { ApiError } from "@/components/shared/api-error";
import { EmptyState } from "@/components/shared/empty-state";
import { Cpu, GitCompare } from "lucide-react";
import * as React from "react";
import { useTabParam } from "@/hooks/use-tab-param";

type AlgoListRow = {
  id: string;
  name: string;
  description: string;
  type: string;
  version: string;
  metrics: {
    avgSlippage: number;
    avgFillRate: number;
    avgLatency: number;
    costVsBenchmark: number;
  };
  params?: { aggressiveness: number };
  supportedVenues: string[];
  status: string;
};

const ALGO_METRICS: MetricDefinition[] = [
  { key: "avgSlippage", label: "Avg Slippage (bps)", format: "number", higherIsBetter: false, group: "Performance" },
  { key: "avgFillRate", label: "Fill Rate (%)", format: "percent", higherIsBetter: true, group: "Performance" },
  { key: "avgLatency", label: "Latency (ms)", format: "duration", higherIsBetter: false, group: "Operational" },
  { key: "costVsBenchmark", label: "Cost vs VWAP (bps)", format: "number", higherIsBetter: false, group: "Performance" },
];

function algoToComparisonEntity(algo: AlgoListRow): ComparisonEntity {
  return {
    id: algo.id,
    name: algo.name,
    version: algo.version,
    platform: "execution",
    metrics: {
      avgSlippage: algo.metrics.avgSlippage,
      avgFillRate: algo.metrics.avgFillRate / 100, // normalize to 0-1 for percent format
      avgLatency: algo.metrics.avgLatency / 1000, // ms → s for duration format
      costVsBenchmark: algo.metrics.costVsBenchmark,
    },
    metadata: { type: algo.type, status: algo.status },
  };
}

function algoToDetailSections(algo: AlgoListRow): DetailSection[] {
  return [
    {
      title: "Performance",
      items: [
        { label: "Avg Slippage", value: `${formatNumber(algo.metrics.avgSlippage, 2)} bps`, format: "mono" },
        { label: "Fill Rate", value: `${formatNumber(algo.metrics.avgFillRate, 1)}%`, format: "mono" },
        { label: "Cost vs VWAP", value: `${algo.metrics.costVsBenchmark >= 0 ? "+" : ""}${formatNumber(algo.metrics.costVsBenchmark, 2)} bps`, format: "mono" },
        { label: "Avg Latency", value: `${algo.metrics.avgLatency}ms`, format: "mono" },
      ],
    },
    {
      title: "Configuration",
      items: [
        { label: "Type", value: algo.type, format: "text" },
        { label: "Version", value: algo.version, format: "mono" },
        { label: "Supported Venues", value: algo.supportedVenues.join(", "), format: "text" },
        ...(algo.params?.aggressiveness !== undefined
          ? [{ label: "Aggressiveness", value: `${formatNumber(algo.params.aggressiveness * 100, 0)}%` as string, format: "mono" as const }]
          : []),
      ],
    },
  ];
}

export default function ExecutionAlgosPage() {
  const { data: algosData, isLoading: algosLoading, error: algosError, refetch: refetchAlgos } = useAlgos();
  const { data: backtestsData, isLoading: btLoading, error: btError, refetch: refetchBt } = useExecutionBacktests();
  const mockExecutionAlgos = React.useMemo(
    () => ((algosData as { data?: AlgoListRow[] })?.data ?? []) as AlgoListRow[],
    [algosData],
  );
  const MOCK_ALGO_BACKTESTS: Array<any> = (backtestsData as any)?.data ?? [];

  const [selectedAlgos, setSelectedAlgos] = React.useState<string[]>([]);
  const [activeTab, setActiveTab] = useTabParam("algos");
  const [detailAlgoId, setDetailAlgoId] = React.useState<string | null>(null);

  const detailAlgo = detailAlgoId ? mockExecutionAlgos.find((a) => a.id === detailAlgoId) : null;

  const dataSources = React.useMemo<DataSource[]>(
    () => [
      { label: "Algo Registry", source: "batch" as const, asOf: new Date().toISOString(), staleAfterSeconds: 300 },
      { label: "Backtests", source: "batch" as const, asOf: new Date().toISOString(), staleAfterSeconds: 600 },
    ],
    [],
  );

  const isLoading = algosLoading || btLoading;

  const toggleAlgo = React.useCallback((id: string) => {
    setSelectedAlgos((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }, []);

  const selectedAlgoData = mockExecutionAlgos.filter((a: AlgoListRow) => selectedAlgos.includes(a.id));

  const comparisonEntities = React.useMemo(
    () => selectedAlgoData.map(algoToComparisonEntity),
    [selectedAlgoData],
  );

  const hasError = algosError || btError;
  const refetchAll = () => {
    void refetchAlgos();
    void refetchBt();
  };

  const algoColumns = React.useMemo<ColumnDef<AlgoListRow>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <Checkbox
            checked={mockExecutionAlgos.length > 0 && selectedAlgos.length === mockExecutionAlgos.length}
            onCheckedChange={(checked) => setSelectedAlgos(checked ? mockExecutionAlgos.map((a) => a.id) : [])}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedAlgos.includes(row.original.id)}
            onCheckedChange={() => toggleAlgo(row.original.id)}
          />
        ),
        enableSorting: false,
      },
      {
        id: "algorithm",
        header: "Algorithm",
        cell: ({ row }) => (
          <button
            className="text-left hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              setDetailAlgoId(row.original.id);
            }}
          >
            <div className="font-medium">{row.original.name}</div>
            <div className="max-w-[200px] truncate text-xs text-muted-foreground">{row.original.description}</div>
          </button>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
      },
      {
        accessorKey: "version",
        header: "Version",
        cell: ({ row }) => <span className="font-mono text-muted-foreground">{row.original.version}</span>,
      },
      {
        id: "slippage",
        header: () => <span className="block text-right">Slippage</span>,
        cell: ({ row }) => (
          <span className="block text-right font-mono">{formatNumber(row.original.metrics.avgSlippage, 2)} bps</span>
        ),
      },
      {
        id: "fillRate",
        header: () => <span className="block text-right">Fill Rate</span>,
        cell: ({ row }) => (
          <span className="block text-right font-mono">{formatNumber(row.original.metrics.avgFillRate, 1)}%</span>
        ),
      },
      {
        id: "latency",
        header: () => <span className="block text-right">Latency</span>,
        cell: ({ row }) => <span className="block text-right font-mono">{row.original.metrics.avgLatency}ms</span>,
      },
      {
        id: "costVsBenchmark",
        header: () => <span className="block text-right">Cost vs VWAP</span>,
        cell: ({ row }) => {
          const v = row.original.metrics.costVsBenchmark;
          return (
            <span className={cn("block text-right font-mono", pnlColorClass(-v))}>
              {v >= 0 ? "+" : ""}
              {formatNumber(v, 2)}
            </span>
          );
        },
      },
      {
        id: "venues",
        header: "Venues",
        cell: ({ row }) => <span>{row.original.supportedVenues.length}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const s = row.original.status;
          const mapped = s === "live" ? "live" : s === "testing" ? "testing" : "idle";
          return <StatusBadge status={mapped} label={s} showDot />;
        },
      },
    ],
    [mockExecutionAlgos, selectedAlgos, toggleAlgo],
  );

  if (isLoading)
    return (
      <div className="platform-page-width space-y-3 p-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );

  if (hasError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="platform-page-width px-6 py-3">
            <ExecutionNav />
          </div>
        </div>
        <div className="platform-page-width p-6">
          <ApiError
            error={(algosError ?? btError) as Error}
            onRetry={refetchAll}
            title="Failed to load algorithm data"
          />
        </div>
      </div>
    );
  }

  if (!isLoading && mockExecutionAlgos.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="platform-page-width px-6 py-3">
            <ExecutionNav />
          </div>
        </div>
        <div className="platform-page-width p-6">
          <EmptyState title="No algorithms" description="No execution algorithms are registered yet." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="platform-page-width px-6 py-3">
          <ExecutionNav />
        </div>
      </div>

      <div className="platform-page-width p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <PageHeader
            title={
              <span className="flex items-center gap-3">
                <Cpu className="size-6" />
                Algo Comparison
              </span>
            }
            description="Compare execution algorithms across performance metrics and market conditions"
          />
          <DataFreshnessStrip sources={dataSources} />
        </div>

        {/* Narrative summary */}
        {mockExecutionAlgos.length > 0 && (
          <div className="px-4 py-3 rounded-lg border border-border/30 bg-muted/5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground/80">Algo Fleet</span> —{" "}
              <span className="font-mono">{mockExecutionAlgos.length}</span> algorithms registered.{" "}
              <span className="font-mono text-emerald-400">
                {mockExecutionAlgos.filter((a) => a.status === "live").length}
              </span> live,{" "}
              <span className="font-mono text-amber-400">
                {mockExecutionAlgos.filter((a) => a.status === "testing").length}
              </span> testing.
              {" "}Avg slippage{" "}
              <span className="font-mono">
                {formatNumber(mockExecutionAlgos.reduce((s, a) => s + a.metrics.avgSlippage, 0) / mockExecutionAlgos.length, 2)} bps
              </span>,{" "}avg fill{" "}
              <span className="font-mono">
                {formatNumber(mockExecutionAlgos.reduce((s, a) => s + a.metrics.avgFillRate, 0) / mockExecutionAlgos.length, 1)}%
              </span>.
              {MOCK_ALGO_BACKTESTS.length > 0 && (
                <> <span className="font-mono">{MOCK_ALGO_BACKTESTS.length}</span> backtest{MOCK_ALGO_BACKTESTS.length !== 1 ? "s" : ""} available.</>
              )}
            </p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-8">
            <TabsTrigger value="algos" className="text-xs">Algorithms</TabsTrigger>
            <TabsTrigger value="compare" className="text-xs">
              Compare
              {selectedAlgos.length >= 2 && (
                <Badge variant="secondary" className="ml-1.5 text-[9px] px-1.5 py-0">
                  {selectedAlgos.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="backtests" className="text-xs">Backtests</TabsTrigger>
          </TabsList>

          {/* --- Algorithms Tab --- */}
          <TabsContent value="algos" className="space-y-6 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold tracking-tight">Execution Algorithms</CardTitle>
                <CardDescription>Select algorithms to compare, click a row to inspect</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={algoColumns}
                  data={mockExecutionAlgos}
                  enableColumnVisibility={false}
                  emptyMessage="No execution algorithms configured. Algorithms will appear here once deployed."
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- Compare Tab --- */}
          <TabsContent value="compare" className="space-y-6 mt-4">
            <ComparisonPanel
              entities={comparisonEntities}
              metricDefinitions={ALGO_METRICS}
              onRemove={(id) => setSelectedAlgos((prev) => prev.filter((a) => a !== id))}
              highlightBest
              className="border-border/50"
            />
          </TabsContent>

          {/* --- Backtests Tab --- */}
          <TabsContent value="backtests" className="space-y-6 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold tracking-tight">Recent Backtests</CardTitle>
                <CardDescription>Historical performance analysis across market conditions</CardDescription>
              </CardHeader>
              <CardContent>
                {MOCK_ALGO_BACKTESTS.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No backtest results available yet</p>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {MOCK_ALGO_BACKTESTS.map((bt: {
                    id: string;
                    algoId: string;
                    algoVersion: string;
                    status: string;
                    metrics: { avgSlippage: number; avgFillRate: number; costVsVWAP: number };
                    testPeriod: { numOrders: number };
                    instruments: string[];
                  }) => {
                    const algo = mockExecutionAlgos.find((a) => a.id === bt.algoId);
                    return (
                      <div key={bt.id} className="p-4 rounded-lg border border-border/50 hover:bg-muted/10 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="font-medium">{algo?.name || bt.algoId}</div>
                            <div className="text-xs text-muted-foreground">v{bt.algoVersion}</div>
                          </div>
                          <StatusBadge
                            status={
                              bt.status === "live"
                                ? "live"
                                : bt.status === "completed" || bt.status === "done"
                                  ? "done"
                                  : "running"
                            }
                            label={bt.status}
                            showDot
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="p-2 rounded bg-muted/50">
                            <div className="text-xs text-muted-foreground">Avg Slippage</div>
                            <div className="font-mono font-medium">{formatNumber(bt.metrics.avgSlippage, 2)} bps</div>
                          </div>
                          <div className="p-2 rounded bg-muted/50">
                            <div className="text-xs text-muted-foreground">Fill Rate</div>
                            <div className="font-mono font-medium">{formatNumber(bt.metrics.avgFillRate, 1)}%</div>
                          </div>
                          <div className="p-2 rounded bg-muted/50">
                            <div className="text-xs text-muted-foreground">vs VWAP</div>
                            <div className={cn("font-mono font-medium", pnlColorClass(-bt.metrics.costVsVWAP))}>
                              {bt.metrics.costVsVWAP >= 0 ? "+" : ""}
                              {formatNumber(bt.metrics.costVsVWAP, 2)}
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {bt.testPeriod.numOrders.toLocaleString()} orders · {bt.instruments.join(", ")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Detail Drawer */}
        {detailAlgo && (
          <BatchDetailDrawer
            open={detailAlgoId !== null}
            onClose={() => setDetailAlgoId(null)}
            entityName={detailAlgo.name}
            entityVersion={detailAlgo.version}
            entityType="execution_algo"
            platform="execution"
            status={detailAlgo.status}
            sections={algoToDetailSections(detailAlgo)}
            onAddToBasket={() => {
              if (!selectedAlgos.includes(detailAlgo.id)) {
                setSelectedAlgos((prev) => [...prev, detailAlgo.id]);
              }
              setActiveTab("compare");
            }}
          >
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Supported Venues</h4>
              <div className="flex flex-wrap gap-1.5">
                {detailAlgo.supportedVenues.map((v) => (
                  <Badge key={v} variant="outline" className="text-[10px] font-mono">
                    {v}
                  </Badge>
                ))}
              </div>
            </div>
          </BatchDetailDrawer>
        )}
      </div>
    </div>
  );
}
