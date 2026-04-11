"use client";

import { PageHeader } from "@/components/shared/page-header";
import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { StrategyPlatformNav } from "@/components/strategy-platform/strategy-nav";
import {
  Grid3X3,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  Maximize2,
  Layers,
  BarChart3,
  Target,
} from "lucide-react";
import { formatNumber } from "@/lib/utils/formatters";

// Heatmap cell component
function HeatmapCell({
  value,
  min,
  max,
  label,
  onClick,
  isSelected,
}: {
  value: number;
  min: number;
  max: number;
  label: string;
  onClick?: () => void;
  isSelected?: boolean;
}) {
  // Normalize value to 0-1 range
  const normalized = max === min ? 0.5 : (value - min) / (max - min);

  // Color interpolation: red (bad) -> yellow -> green (good)
  const getColor = (n: number) => {
    if (n < 0.5) {
      // Red to yellow
      const t = n * 2;
      return `rgb(${239}, ${Math.round(68 + (191 - 68) * t)}, ${Math.round(68 + (68 - 68) * t)})`;
    } else {
      // Yellow to green
      const t = (n - 0.5) * 2;
      return `rgb(${Math.round(251 - (251 - 34) * t)}, ${Math.round(191 + (197 - 191) * t)}, ${Math.round(36 + (94 - 36) * t)})`;
    }
  };

  const bgColor = getColor(normalized);
  const textColor = normalized > 0.3 && normalized < 0.7 ? "rgb(0,0,0)" : "rgb(255,255,255)";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              "w-full h-12 flex items-center justify-center text-xs font-mono font-medium transition-all",
              isSelected && "ring-2 ring-primary ring-offset-2",
            )}
            style={{ backgroundColor: bgColor, color: textColor }}
          >
            {formatNumber(value, 2)}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">Value: {formatNumber(value, 4)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Generate mock heatmap data
function generateHeatmapData(rows: string[], cols: string[], seed: number = 42) {
  let s = seed;
  const random = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  return rows.map((row) => ({
    label: row,
    values: cols.map((col) => ({
      col,
      value: random() * 2 - 0.5, // Range: -0.5 to 1.5 for Sharpe-like values
    })),
  }));
}

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// Dimension options
const DIMENSIONS = {
  rows: [
    {
      value: "strategy",
      label: "Strategy",
      items: ["ETH_BASIS_1", "ETH_BASIS_2", "BTC_MM_1", "BTC_MM_2", "SOL_ARB_1", "DOGE_MOM_1"],
    },
    {
      value: "regime",
      label: "Regime",
      items: ["Bull", "Bear", "Sideways", "High Vol", "Low Vol", "Trending"],
    },
    {
      value: "venue",
      label: "Venue",
      items: ["Binance", "OKX", "Deribit", "Hyperliquid", "Uniswap", "Aave"],
    },
    {
      value: "timeframe",
      label: "Timeframe",
      items: ["1m", "5m", "15m", "1h", "4h", "1d"],
    },
  ],
  cols: [
    {
      value: "metric",
      label: "Metric",
      items: ["Sharpe", "Sortino", "MaxDD", "Win Rate", "Profit Factor", "Calmar"],
    },
    {
      value: "month",
      label: "Month",
      items: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    },
    {
      value: "regime",
      label: "Regime",
      items: ["Bull", "Bear", "Sideways", "High Vol", "Low Vol", "Trending"],
    },
    {
      value: "instrument",
      label: "Instrument",
      items: ["ETH-PERP", "BTC-PERP", "SOL-PERP", "DOGE-PERP", "ARB-PERP", "OP-PERP"],
    },
  ],
};

export default function StrategyHeatmapPage() {
  const { toast } = useToast();
  const [rowDimension, setRowDimension] = React.useState("strategy");
  const [colDimension, setColDimension] = React.useState("metric");
  const [selectedCell, setSelectedCell] = React.useState<{
    row: string;
    col: string;
  } | null>(null);
  const [colorMetric, setColorMetric] = React.useState("sharpe");

  const rowConfig = DIMENSIONS.rows.find((d) => d.value === rowDimension) || DIMENSIONS.rows[0];
  const colConfig = DIMENSIONS.cols.find((d) => d.value === colDimension) || DIMENSIONS.cols[0];

  const heatmapData = React.useMemo(
    () =>
      generateHeatmapData(rowConfig.items, colConfig.items, rowDimension.charCodeAt(0) * colDimension.charCodeAt(0)),
    [rowDimension, colDimension, rowConfig.items, colConfig.items],
  );

  // Calculate min/max for color scaling
  const allValues = heatmapData.flatMap((row) => row.values.map((v) => v.value));
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);

  // Calculate row and column averages
  const rowAverages = heatmapData.map((row) => ({
    label: row.label,
    avg: row.values.reduce((sum, v) => sum + v.value, 0) / row.values.length,
  }));

  const colAverages = colConfig.items.map((col, colIdx) => ({
    label: col,
    avg: heatmapData.reduce((sum, row) => sum + row.values[colIdx].value, 0) / heatmapData.length,
  }));

  const handleExportHeatmapCsv = () => {
    const colLabels = colConfig.items.map((c) => escapeCsvCell(c));
    const header = ["row", ...colLabels].join(",");
    const body = heatmapData.map((row) =>
      [escapeCsvCell(row.label), ...row.values.map((v) => escapeCsvCell(v.value))].join(","),
    );
    const csv = [header, ...body].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `strategy-heatmap-${rowDimension}-vs-${colDimension}.csv`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Heatmap exported",
      description: `CSV includes ${heatmapData.length} rows × ${colConfig.items.length} columns.`,
    });
  };

  const handleToggleFullscreen = async () => {
    try {
      const el = document.documentElement;
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
        toast({
          title: "Fullscreen",
          description: "Press Esc to exit fullscreen.",
        });
      } else {
        await document.exitFullscreen();
      }
    } catch {
      toast({
        title: "Fullscreen unavailable",
        description: "Your browser blocked or does not support fullscreen.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="platform-page-width px-6 py-3">
          <StrategyPlatformNav />
        </div>
      </div>

      <div className="platform-page-width p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <PageHeader
            title="Strategy Heatmap"
            description="Multi-dimensional performance analysis across strategies, regimes,
              and metrics"
          />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" type="button" onClick={handleExportHeatmapCsv}>
              <Download className="size-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" type="button" onClick={handleToggleFullscreen}>
              <Maximize2 className="size-4 mr-2" />
              Fullscreen
            </Button>
          </div>
        </div>

        {/* Dimension Controls */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="size-4" />
              Dimension Selection
            </CardTitle>
            <CardDescription>Choose which dimensions to display on rows and columns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Rows:</span>
                <Select value={rowDimension} onValueChange={setRowDimension}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIMENSIONS.rows.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Columns:</span>
                <Select value={colDimension} onValueChange={setColDimension}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIMENSIONS.cols.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Color by:</span>
                <Select value={colorMetric} onValueChange={setColorMetric}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sharpe">Sharpe</SelectItem>
                    <SelectItem value="returns">Returns</SelectItem>
                    <SelectItem value="drawdown">Drawdown</SelectItem>
                    <SelectItem value="winrate">Win Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="ml-auto flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Color Scale:</span>
                  <div className="flex items-center">
                    <div className="w-4 h-3 bg-red-500 rounded-l" />
                    <div className="w-4 h-3 bg-yellow-500" />
                    <div className="w-4 h-3 bg-green-500 rounded-r" />
                  </div>
                  <span className="font-mono">
                    {formatNumber(minValue, 2)} — {formatNumber(maxValue, 2)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Heatmap Grid */}
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-sm font-medium p-2 border-b">
                      {rowConfig.label} / {colConfig.label}
                    </th>
                    {colConfig.items.map((col) => (
                      <th key={col} className="text-center text-xs font-medium p-2 border-b min-w-[80px]">
                        {col}
                      </th>
                    ))}
                    <th className="text-center text-xs font-medium p-2 border-b border-l min-w-[80px] bg-muted/50">
                      Avg
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {heatmapData.map((row, rowIdx) => (
                    <tr key={row.label}>
                      <td className="text-sm font-medium p-2 border-b whitespace-nowrap">{row.label}</td>
                      {row.values.map((cell, colIdx) => (
                        <td key={cell.col} className="p-0.5 border-b">
                          <HeatmapCell
                            value={cell.value}
                            min={minValue}
                            max={maxValue}
                            label={`${row.label} × ${cell.col}`}
                            onClick={() => setSelectedCell({ row: row.label, col: cell.col })}
                            isSelected={selectedCell?.row === row.label && selectedCell?.col === cell.col}
                          />
                        </td>
                      ))}
                      <td className="p-0.5 border-b border-l bg-muted/30">
                        <HeatmapCell
                          value={rowAverages[rowIdx].avg}
                          min={minValue}
                          max={maxValue}
                          label={`${row.label} Average`}
                        />
                      </td>
                    </tr>
                  ))}
                  {/* Column averages row */}
                  <tr className="bg-muted/30">
                    <td className="text-sm font-medium p-2 border-t">Avg</td>
                    {colAverages.map((col) => (
                      <td key={col.label} className="p-0.5 border-t">
                        <HeatmapCell value={col.avg} min={minValue} max={maxValue} label={`${col.label} Average`} />
                      </td>
                    ))}
                    <td className="p-0.5 border-t border-l bg-muted/50">
                      <HeatmapCell
                        value={allValues.reduce((a, b) => a + b, 0) / allValues.length}
                        min={minValue}
                        max={maxValue}
                        label="Grand Average"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Selected Cell Detail */}
        {selectedCell && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="size-4" />
                Cell Detail: {selectedCell.row} × {selectedCell.col}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground">Sharpe Ratio</div>
                  <div className="text-xl font-bold font-mono mt-1">1.24</div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground">Total Return</div>
                  <div className="text-xl font-bold font-mono mt-1 text-emerald-500">+18.4%</div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground">Max Drawdown</div>
                  <div className="text-xl font-bold font-mono mt-1 text-red-500">-8.2%</div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground">Win Rate</div>
                  <div className="text-xl font-bold font-mono mt-1">54.2%</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline">
                  View Backtest
                </Button>
                <Button size="sm" variant="outline">
                  Add to Basket
                </Button>
                <Button size="sm">Drill Down</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <TrendingUp className="size-5 text-emerald-500" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Best Performing</div>
                  <div className="font-medium">{rowAverages.sort((a, b) => b.avg - a.avg)[0]?.label}</div>
                  <div className="text-sm text-emerald-500 font-mono">
                    Avg: {formatNumber(rowAverages.sort((a, b) => b.avg - a.avg)[0]?.avg ?? 0, 2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <TrendingDown className="size-5 text-red-500" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Worst Performing</div>
                  <div className="font-medium">{rowAverages.sort((a, b) => a.avg - b.avg)[0]?.label}</div>
                  <div className="text-sm text-red-500 font-mono">
                    Avg: {formatNumber(rowAverages.sort((a, b) => a.avg - b.avg)[0]?.avg ?? 0, 2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <BarChart3 className="size-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Grand Average</div>
                  <div className="text-xl font-bold font-mono">
                    {formatNumber(allValues.reduce((a, b) => a + b, 0) / allValues.length, 3)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10">
                  <Grid3X3 className="size-5 text-violet-500" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Cells Analyzed</div>
                  <div className="text-xl font-bold font-mono">{rowConfig.items.length * colConfig.items.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
