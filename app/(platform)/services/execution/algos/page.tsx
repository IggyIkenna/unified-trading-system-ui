"use client";

import { ExecutionNav } from "@/components/execution-platform/execution-nav";
import { PageHeader } from "@/components/platform/page-header";
import { StatusBadge } from "@/components/trading/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlgos, useExecutionBacktests } from "@/hooks/api/use-orders";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/formatters";
import { pnlColorClass } from "@/lib/utils/pnl";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertCircle, Cpu, GitCompare, RefreshCw } from "lucide-react";
import * as React from "react";

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

export default function ExecutionAlgosPage() {
  const { data: algosData, isLoading: algosLoading, error: algosError, refetch: refetchAlgos } = useAlgos();
  const { data: backtestsData, isLoading: btLoading, error: btError, refetch: refetchBt } = useExecutionBacktests();
  const MOCK_EXECUTION_ALGOS: AlgoListRow[] = ((algosData as { data?: AlgoListRow[] })?.data ?? []) as AlgoListRow[];
  const MOCK_ALGO_BACKTESTS: Array<any> = (backtestsData as any)?.data ?? [];

  const [selectedAlgos, setSelectedAlgos] = React.useState<string[]>([]);
  const [compareMode, setCompareMode] = React.useState(false);

  const isLoading = algosLoading || btLoading;

  const toggleAlgo = React.useCallback((id: string) => {
    setSelectedAlgos((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }, []);

  const selectedAlgoData = MOCK_EXECUTION_ALGOS.filter((a: any) => selectedAlgos.includes(a.id));

  const hasError = algosError || btError;
  const refetchAll = () => {
    refetchAlgos();
    refetchBt();
  };

  const algoColumns = React.useMemo<ColumnDef<AlgoListRow>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <Checkbox
            checked={MOCK_EXECUTION_ALGOS.length > 0 && selectedAlgos.length === MOCK_EXECUTION_ALGOS.length}
            onCheckedChange={(checked) => setSelectedAlgos(checked ? MOCK_EXECUTION_ALGOS.map((a) => a.id) : [])}
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
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="max-w-[200px] truncate text-xs text-muted-foreground">{row.original.description}</div>
          </div>
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
    [MOCK_EXECUTION_ALGOS, selectedAlgos, toggleAlgo],
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
      <div className="p-6 flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <AlertCircle className="size-8 text-destructive" />
        <p>Failed to load algorithm data</p>
        <Button variant="outline" size="sm" onClick={refetchAll}>
          <RefreshCw className="size-3.5 mr-1.5" />
          Retry
        </Button>
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
        <PageHeader
          title={
            <span className="flex items-center gap-3">
              <Cpu className="size-6" />
              Algo Comparison
            </span>
          }
          description="Compare execution algorithms across performance metrics and market conditions"
        >
          {selectedAlgos.length >= 2 && (
            <Button onClick={() => setCompareMode(!compareMode)}>
              <GitCompare className="mr-2 size-4" />
              {compareMode ? "Exit Compare" : `Compare (${selectedAlgos.length})`}
            </Button>
          )}
        </PageHeader>

        {/* Comparison View */}
        {compareMode && selectedAlgoData.length >= 2 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Side-by-Side Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Metric</th>
                      {selectedAlgoData.map((algo) => (
                        <th key={algo.id} className="text-center p-2 font-medium min-w-[140px]">
                          <div>{algo.name}</div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {algo.type}
                          </Badge>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 text-muted-foreground">Avg Slippage (bps)</td>
                      {selectedAlgoData.map((algo) => {
                        const best = Math.min(...selectedAlgoData.map((a) => a.metrics.avgSlippage));
                        const isBest = algo.metrics.avgSlippage === best;
                        return (
                          <td
                            key={algo.id}
                            className={cn("text-center p-2 font-mono", isBest && "text-emerald-500 font-bold")}
                          >
                            {formatNumber(algo.metrics.avgSlippage, 2)}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 text-muted-foreground">Fill Rate (%)</td>
                      {selectedAlgoData.map((algo) => {
                        const best = Math.max(...selectedAlgoData.map((a) => a.metrics.avgFillRate));
                        const isBest = algo.metrics.avgFillRate === best;
                        return (
                          <td
                            key={algo.id}
                            className={cn("text-center p-2 font-mono", isBest && "text-emerald-500 font-bold")}
                          >
                            {formatNumber(algo.metrics.avgFillRate, 1)}%
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 text-muted-foreground">Latency (ms)</td>
                      {selectedAlgoData.map((algo) => {
                        const best = Math.min(...selectedAlgoData.map((a) => a.metrics.avgLatency));
                        const isBest = algo.metrics.avgLatency === best;
                        return (
                          <td
                            key={algo.id}
                            className={cn("text-center p-2 font-mono", isBest && "text-emerald-500 font-bold")}
                          >
                            {algo.metrics.avgLatency}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 text-muted-foreground">Cost vs Benchmark (bps)</td>
                      {selectedAlgoData.map((algo) => {
                        const best = Math.min(...selectedAlgoData.map((a) => a.metrics.costVsBenchmark));
                        const isBest = algo.metrics.costVsBenchmark === best;
                        return (
                          <td
                            key={algo.id}
                            className={cn("text-center p-2 font-mono", isBest && "text-emerald-500 font-bold")}
                          >
                            {algo.metrics.costVsBenchmark >= 0 ? "+" : ""}
                            {formatNumber(algo.metrics.costVsBenchmark, 2)}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 text-muted-foreground">Aggressiveness</td>
                      {selectedAlgoData.map((algo) => (
                        <td key={algo.id} className="text-center p-2">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary rounded-full h-2"
                              style={{
                                width: `${(algo.params?.aggressiveness ?? 0) * 100}%`,
                              }}
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-2 text-muted-foreground">Supported Venues</td>
                      {selectedAlgoData.map((algo) => (
                        <td key={algo.id} className="text-center p-2">
                          {algo.supportedVenues.length}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Algo Grid */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Execution Algorithms</CardTitle>
            <CardDescription>Select algorithms to compare their performance characteristics</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={algoColumns}
              data={MOCK_EXECUTION_ALGOS}
              enableColumnVisibility={false}
              emptyMessage="No execution algorithms configured. Algorithms will appear here once deployed."
            />
          </CardContent>
        </Card>

        {/* Backtest Results */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Backtests</CardTitle>
            <CardDescription>Historical performance analysis across market conditions</CardDescription>
          </CardHeader>
          <CardContent>
            {MOCK_ALGO_BACKTESTS.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No backtest results available yet</p>
            )}
            <div className="grid grid-cols-2 gap-4">
              {MOCK_ALGO_BACKTESTS.map((bt) => {
                const algo = MOCK_EXECUTION_ALGOS.find((a) => a.id === bt.algoId);
                return (
                  <div key={bt.id} className="p-4 rounded-lg border">
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
                      {bt.testPeriod.numOrders.toLocaleString()} orders • {bt.instruments.join(", ")}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
