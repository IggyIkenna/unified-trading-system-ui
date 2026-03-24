"use client";

import * as React from "react";
import { use } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PnLValue } from "@/components/trading/pnl-value";
import { EntityLink } from "@/components/trading/entity-link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Download,
  Calendar,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PNL_FACTORS } from "@/lib/reference-data";

interface FactorBreakdown {
  strategyId: string;
  strategyName: string;
  pnl: number;
  percentage: number;
  exposure: string;
  trades: number;
}

// Mock data for factor drill-down by strategy
const factorBreakdowns: Record<string, FactorBreakdown[]> = {
  funding: [
    {
      strategyId: "btc-basis-v3",
      strategyName: "BTC Basis v3",
      pnl: 245000,
      percentage: 59.5,
      exposure: "$4.2m",
      trades: 142,
    },
    {
      strategyId: "eth-staked-basis",
      strategyName: "ETH Staked Basis",
      pnl: 128000,
      percentage: 31.1,
      exposure: "$2.8m",
      trades: 87,
    },
    {
      strategyId: "aave-lending",
      strategyName: "AAVE Lending",
      pnl: 39000,
      percentage: 9.4,
      exposure: "$1.1m",
      trades: 23,
    },
  ],
  carry: [
    {
      strategyId: "eth-staked-basis",
      strategyName: "ETH Staked Basis",
      pnl: 198000,
      percentage: 55.8,
      exposure: "$2.8m",
      trades: 87,
    },
    {
      strategyId: "btc-basis-v3",
      strategyName: "BTC Basis v3",
      pnl: 112000,
      percentage: 31.5,
      exposure: "$4.2m",
      trades: 142,
    },
    {
      strategyId: "aave-recursive",
      strategyName: "AAVE Recursive",
      pnl: 45000,
      percentage: 12.7,
      exposure: "$0.9m",
      trades: 45,
    },
  ],
  basis: [
    {
      strategyId: "btc-basis-v3",
      strategyName: "BTC Basis v3",
      pnl: 142000,
      percentage: 75.5,
      exposure: "$4.2m",
      trades: 142,
    },
    {
      strategyId: "eth-staked-basis",
      strategyName: "ETH Staked Basis",
      pnl: 46000,
      percentage: 24.5,
      exposure: "$2.8m",
      trades: 87,
    },
  ],
  delta: [
    {
      strategyId: "ml-directional",
      strategyName: "ML Directional BTC",
      pnl: -42000,
      percentage: -68.9,
      exposure: "$1.2m",
      trades: 341,
    },
    {
      strategyId: "spy-momentum",
      strategyName: "SPY Momentum",
      pnl: 68000,
      percentage: 111.5,
      exposure: "$0.8m",
      trades: 124,
    },
    {
      strategyId: "btc-mm-binance",
      strategyName: "BTC Market Making",
      pnl: 35000,
      percentage: 57.4,
      exposure: "$1.5m",
      trades: 892,
    },
  ],
  gamma: [
    {
      strategyId: "eth-options-mm",
      strategyName: "ETH Options MM",
      pnl: 18000,
      percentage: 75.0,
      exposure: "Δ:-0.12",
      trades: 234,
    },
    {
      strategyId: "btc-basis-v3",
      strategyName: "BTC Basis v3",
      pnl: 6000,
      percentage: 25.0,
      exposure: "Δ:-0.02",
      trades: 142,
    },
  ],
  vega: [
    {
      strategyId: "eth-options-mm",
      strategyName: "ETH Options MM",
      pnl: -8000,
      percentage: 100.0,
      exposure: "v: 12.4k",
      trades: 234,
    },
  ],
  theta: [
    {
      strategyId: "eth-options-mm",
      strategyName: "ETH Options MM",
      pnl: -12000,
      percentage: 100.0,
      exposure: "θ: -1.2k",
      trades: 234,
    },
  ],
  slippage: [
    {
      strategyId: "ml-directional",
      strategyName: "ML Directional BTC",
      pnl: -28000,
      percentage: 45.9,
      exposure: "12 bps",
      trades: 341,
    },
    {
      strategyId: "btc-mm-binance",
      strategyName: "BTC Market Making",
      pnl: -18000,
      percentage: 29.5,
      exposure: "4 bps",
      trades: 892,
    },
    {
      strategyId: "cross-exchange-arb",
      strategyName: "Cross-Exchange Arb",
      pnl: -15000,
      percentage: 24.6,
      exposure: "8 bps",
      trades: 567,
    },
  ],
  fees: [
    {
      strategyId: "btc-mm-binance",
      strategyName: "BTC Market Making",
      pnl: -22000,
      percentage: 50.0,
      exposure: "-",
      trades: 892,
    },
    {
      strategyId: "ml-directional",
      strategyName: "ML Directional BTC",
      pnl: -12000,
      percentage: 27.3,
      exposure: "-",
      trades: 341,
    },
    {
      strategyId: "cross-exchange-arb",
      strategyName: "Cross-Exchange Arb",
      pnl: -10000,
      percentage: 22.7,
      exposure: "-",
      trades: 567,
    },
  ],
  rebates: [
    {
      strategyId: "btc-mm-binance",
      strategyName: "BTC Market Making",
      pnl: 14000,
      percentage: 77.8,
      exposure: "-",
      trades: 892,
    },
    {
      strategyId: "cross-exchange-arb",
      strategyName: "Cross-Exchange Arb",
      pnl: 4000,
      percentage: 22.2,
      exposure: "-",
      trades: 567,
    },
  ],
};

// Factor totals
const factorTotals: Record<string, number> = {
  funding: 412000,
  carry: 355000,
  basis: 188000,
  delta: 61000,
  gamma: 24000,
  vega: -8000,
  theta: -12000,
  slippage: -61000,
  fees: -44000,
  rebates: 18000,
};

export default function PnLDetailPage() {
  const [selectedFactor, setSelectedFactor] = React.useState("funding");
  const [dateRange, setDateRange] = React.useState("today");

  const breakdown = factorBreakdowns[selectedFactor] || [];
  const total = factorTotals[selectedFactor] || 0;
  const factorInfo = PNL_FACTORS.find((f) => f.id === selectedFactor);

  return (
    <div className="p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/services/data/markets">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="size-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold">P&L Attribution Detail</h1>
              <p className="text-sm text-muted-foreground">
                Drill down into P&L components by strategy
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="size-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="wtd">Week to Date</SelectItem>
                <SelectItem value="mtd">Month to Date</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="size-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Factor Selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">P&L Factor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {PNL_FACTORS.map((factor) => {
                const total = factorTotals[factor.id] || 0;
                const isPositive = total >= 0;
                const isSelected = selectedFactor === factor.id;

                return (
                  <Button
                    key={factor.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFactor(factor.id)}
                    className={cn(
                      "gap-2",
                      isSelected &&
                        "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    )}
                  >
                    {isPositive ? (
                      <TrendingUp className="size-3.5 text-[var(--pnl-positive)]" />
                    ) : (
                      <TrendingDown className="size-3.5 text-[var(--pnl-negative)]" />
                    )}
                    {factor.label}
                    <span
                      className={cn(
                        "font-mono text-xs",
                        isPositive
                          ? "text-[var(--pnl-positive)]"
                          : "text-[var(--pnl-negative)]",
                      )}
                    >
                      {isPositive ? "+" : ""}
                      {(total / 1000).toFixed(0)}k
                    </span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Factor Detail */}
        <div className="grid grid-cols-12 gap-6">
          {/* Strategy Breakdown Table */}
          <Card className="col-span-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {factorInfo?.label || selectedFactor} Breakdown
                    <Badge variant="outline" className="font-mono">
                      {breakdown.length} strategies
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {factorInfo?.description || "P&L attribution by strategy"}
                  </CardDescription>
                </div>
                <PnLValue value={total} size="lg" showSign />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Strategy</TableHead>
                    <TableHead className="text-right">P&L</TableHead>
                    <TableHead className="text-right">% of Factor</TableHead>
                    <TableHead className="text-right">Exposure</TableHead>
                    <TableHead className="text-right">Trades</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breakdown.map((row) => (
                    <TableRow
                      key={row.strategyId}
                      className="cursor-pointer hover:bg-muted/30"
                    >
                      <TableCell>
                        <EntityLink
                          type="strategy"
                          id={row.strategyId}
                          label={row.strategyName}
                          className="font-medium"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <PnLValue value={row.pnl} size="sm" showSign />
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        <span
                          className={cn(
                            row.percentage >= 0
                              ? "text-[var(--pnl-positive)]"
                              : "text-[var(--pnl-negative)]",
                          )}
                        >
                          {row.percentage >= 0 ? "+" : ""}
                          {row.percentage.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {row.exposure}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {row.trades}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/services/trading/strategies/${row.strategyId}`}
                        >
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="size-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Factor Summary */}
          <div className="col-span-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Factor Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">
                    Total P&L
                  </span>
                  <PnLValue value={total} size="md" showSign />
                </div>
                <div className="flex items-center justify-between py-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    % of Net P&L
                  </span>
                  <span className="font-mono font-medium">
                    {((total / 933000) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    Strategies
                  </span>
                  <span className="font-mono font-medium">
                    {breakdown.length}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    Total Trades
                  </span>
                  <span className="font-mono font-medium">
                    {breakdown.reduce((sum, r) => sum + r.trades, 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Time Series</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground text-center">
                    {factorInfo?.label || selectedFactor} P&L over time
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Filter className="size-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Filter Tip</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use the Context Bar above to filter by client, strategy,
                      or underlying to see factor attribution for specific
                      segments.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
