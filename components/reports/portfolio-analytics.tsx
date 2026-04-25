"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { PnLValue } from "@/components/trading/pnl-value";
import { useClients, usePerformanceSummary, useCoinBreakdown } from "@/hooks/api/use-performance";
import { formatCurrency, formatPercent } from "@/lib/utils/formatters";
import { PieChart as PieChartIcon, Grid3X3, ShieldAlert, Layers3 } from "lucide-react";
import { AllocatorStrategyOverlay } from "@/components/reports/allocator-strategy-overlay";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444", "#10b981"];

// ── Correlation matrix data ────────────────────────────────────────────────
const CORRELATION_COINS = ["BTC", "ETH", "SOL", "USDT"] as const;
type CorrCoin = (typeof CORRELATION_COINS)[number];

const CORRELATION_MATRIX: Record<CorrCoin, Record<CorrCoin, number>> = {
  BTC: { BTC: 1.0, ETH: 0.85, SOL: 0.72, USDT: -0.05 },
  ETH: { BTC: 0.85, ETH: 1.0, SOL: 0.78, USDT: -0.03 },
  SOL: { BTC: 0.72, ETH: 0.78, SOL: 1.0, USDT: -0.08 },
  USDT: { BTC: -0.05, ETH: -0.03, SOL: -0.08, USDT: 1.0 },
};

function getCorrelationColor(value: number): string {
  const abs = Math.abs(value);
  if (value === 1) return "bg-muted";
  if (abs >= 0.8) return "bg-red-500/30 dark:bg-red-500/25";
  if (abs >= 0.6) return "bg-orange-500/25 dark:bg-orange-500/20";
  if (abs >= 0.4) return "bg-yellow-500/20 dark:bg-yellow-500/15";
  if (abs >= 0.2) return "bg-emerald-500/15 dark:bg-emerald-500/10";
  return "bg-green-500/10 dark:bg-green-500/10";
}

// ── Mock risk metrics ──────────────────────────────────────────────────────
interface RiskMetric {
  label: string;
  value: string;
  description: string;
}

const MOCK_RISK_METRICS: RiskMetric[] = [
  { label: "VaR (95%)", value: "-2.34%", description: "1-day parametric" },
  { label: "VaR (99%)", value: "-4.12%", description: "1-day parametric" },
  { label: "Expected Shortfall", value: "-5.87%", description: "CVaR at 99%" },
  { label: "Beta to BTC", value: "0.78", description: "60-day rolling" },
  { label: "Sortino Ratio", value: "2.41", description: "Annualized" },
  { label: "Information Ratio", value: "1.15", description: "vs BTC benchmark" },
];

export function PortfolioAnalytics() {
  const [selectedClientId, setSelectedClientId] = React.useState<string | null>(null);
  const [familyFilter, setFamilyFilter] = React.useState<string>("all");
  const [archetypeFilter, setArchetypeFilter] = React.useState<string>("all");
  const { data: clientsData, isLoading: clientsLoading } = useClients();
  const { data: summary } = usePerformanceSummary(selectedClientId);
  const { data: coinsData } = useCoinBreakdown(selectedClientId);

  const allClients = clientsData?.clients ?? [];
  const strategies = clientsData?.strategies ?? [];

  const families = React.useMemo(() => {
    const s = new Set<string>();
    for (const st of strategies) if (st.family) s.add(st.family);
    return Array.from(s).sort();
  }, [strategies]);

  const archetypesForFamily = React.useMemo(() => {
    const s = new Set<string>();
    for (const st of strategies) {
      if (!st.archetype) continue;
      if (familyFilter === "all" || st.family === familyFilter) s.add(st.archetype);
    }
    return Array.from(s).sort();
  }, [strategies, familyFilter]);

  const clients = React.useMemo(() => {
    if (familyFilter === "all" && archetypeFilter === "all") return allClients;
    const matchingIds = new Set(
      strategies
        .filter((st) => (familyFilter === "all" || st.family === familyFilter))
        .filter((st) => (archetypeFilter === "all" || st.archetype === archetypeFilter))
        .map((st) => st.id),
    );
    return allClients.filter((c) => c.strategy_id && matchingIds.has(c.strategy_id));
  }, [allClients, strategies, familyFilter, archetypeFilter]);

  React.useEffect(() => {
    if (archetypeFilter !== "all" && !archetypesForFamily.includes(archetypeFilter)) {
      setArchetypeFilter("all");
    }
  }, [archetypeFilter, archetypesForFamily]);

  // Auto-select first client (reset when cascade filter shrinks list)
  React.useEffect(() => {
    if (clients.length > 0 && (!selectedClientId || !clients.some((c) => c.id === selectedClientId))) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  const coins = coinsData?.coins ?? [];

  // Allocation pie data
  const allocationData = React.useMemo(() => {
    return coins.map((c) => ({
      name: c.symbol,
      value: Math.round((c.allocation_pct ?? 0) * 100),
      marketValue: c.market_value_usd ?? 0,
      costBasis: c.cost_basis_usd ?? 0,
      pnl: c.total_pnl ?? 0,
      pnlPct: (c.cost_basis_usd ?? 0) > 0 ? ((c.total_pnl ?? 0) / (c.cost_basis_usd ?? 1)) * 100 : 0,
    }));
  }, [coins]);

  // Totals for allocation table
  const allocationTotals = React.useMemo(() => {
    return {
      marketValue: coins.reduce((s, c) => s + (c.market_value_usd ?? 0), 0),
      costBasis: coins.reduce((s, c) => s + (c.cost_basis_usd ?? 0), 0),
      pnl: coins.reduce((s, c) => s + (c.total_pnl ?? 0), 0),
    };
  }, [coins]);

  // Rolling volatility from equity curve
  const equityCurve = summary?.equity_curve;
  const rollingVolatilityData = React.useMemo(() => {
    if (!equityCurve) return [];
    const curve = equityCurve;
    const window = 30;
    const points: Array<{ date: string; volatility: number }> = [];

    for (let i = window; i < curve.length; i++) {
      const returns: number[] = [];
      for (let j = i - window + 1; j <= i; j++) {
        const prevEq = curve[j - 1].equity_usd;
        const currEq = curve[j].equity_usd;
        if (prevEq > 0) {
          returns.push((currEq - prevEq) / prevEq);
        }
      }
      const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
      const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
      const dailyVol = Math.sqrt(variance);
      const annualizedVol = dailyVol * Math.sqrt(365) * 100;

      points.push({
        date: new Date(curve[i].timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        volatility: Math.round(annualizedVol * 100) / 100,
      });
    }

    // Downsample to ~90 points
    const step = Math.max(1, Math.floor(points.length / 90));
    return points.filter((_, i) => i % step === 0 || i === points.length - 1);
  }, [equityCurve]);

  if (clientsLoading) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header with client selector */}
        <PageHeader
          title="Portfolio Analytics"
          description="Allocation breakdown, correlation analysis, and risk metrics"
        >
          {families.length > 0 && (
            <Select value={familyFilter} onValueChange={setFamilyFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Families" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Families</SelectItem>
                {families.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {archetypesForFamily.length > 0 && (
            <Select value={archetypeFilter} onValueChange={setArchetypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Archetypes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Archetypes</SelectItem>
                {archetypesForFamily.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={selectedClientId ?? ""} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="flex items-center gap-2">
                    {c.name}
                    <span className="text-xs text-muted-foreground">{c.venue}</span>
                    {c.is_underwater && (
                      <Badge variant="destructive" className="text-[9px] px-1 py-0">
                        UW
                      </Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PageHeader>

        {/* Tabs */}
        <Tabs defaultValue="allocation" className="space-y-6">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="allocation" className="gap-2">
              <PieChartIcon className="size-4" />
              Allocation
            </TabsTrigger>
            <TabsTrigger value="allocator" className="gap-2">
              <Layers3 className="size-4" />
              Allocator View
            </TabsTrigger>
            <TabsTrigger value="correlation" className="gap-2">
              <Grid3X3 className="size-4" />
              Correlation
            </TabsTrigger>
            <TabsTrigger value="risk" className="gap-2">
              <ShieldAlert className="size-4" />
              Risk Metrics
            </TabsTrigger>
          </TabsList>

          {/* ── Allocation Tab ────────────────────────────────────────── */}
          <TabsContent value="allocation">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pie chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Allocation by Coin</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={allocationData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, value }: { name: string; value: number }) => `${name} ${value}%`}
                          labelLine={false}
                        >
                          {allocationData.map((_, idx) => (
                            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                          formatter={(value: number) => [`${value}%`, "Allocation"]}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Allocation table */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Allocation Detail</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead className="text-right">Allocation %</TableHead>
                        <TableHead className="text-right">Market Value</TableHead>
                        <TableHead className="text-right">Cost Basis</TableHead>
                        <TableHead className="text-right">P&L</TableHead>
                        <TableHead className="text-right">P&L %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allocationData.map((row) => (
                        <TableRow key={row.name}>
                          <TableCell className="font-medium font-mono">{row.name}</TableCell>
                          <TableCell className="text-right font-mono">{formatPercent(row.value, 0)}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(row.marketValue ?? 0, "USD", 0)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(row.costBasis ?? 0, "USD", 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            <PnLValue value={row.pnl ?? 0} size="sm" showSign />
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            <span
                              className={row.pnlPct >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"}
                            >
                              {row.pnlPct >= 0 ? "+" : ""}
                              {formatPercent(row.pnlPct, 2)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Total row */}
                      <TableRow className="border-t-2 border-border font-semibold">
                        <TableCell className="font-bold">Total</TableCell>
                        <TableCell className="text-right font-mono">100%</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(allocationTotals.marketValue, "USD", 0)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(allocationTotals.costBasis, "USD", 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          <PnLValue value={allocationTotals.pnl} size="sm" showSign />
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          <span
                            className={
                              allocationTotals.pnl >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"
                            }
                          >
                            {allocationTotals.costBasis > 0
                              ? `${allocationTotals.pnl >= 0 ? "+" : ""}${formatPercent((allocationTotals.pnl / allocationTotals.costBasis) * 100, 2)}`
                              : "0.00%"}
                          </span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Allocator View Tab — Plan C per-strategy per-venue 3-way overlay ── */}
          <TabsContent value="allocator">
            <AllocatorStrategyOverlay clientId={selectedClientId} />
          </TabsContent>

          {/* ── Correlation Tab ───────────────────────────────────────── */}
          <TabsContent value="correlation">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Correlation Matrix</CardTitle>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded bg-green-500/10" /> Low
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded bg-yellow-500/20" /> Medium
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded bg-red-500/30" /> High
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <WidgetScroll axes="horizontal" scrollbarSize="thin">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]" />
                        {CORRELATION_COINS.map((coin) => (
                          <TableHead key={coin} className="text-center font-mono font-semibold w-[100px]">
                            {coin}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {CORRELATION_COINS.map((rowCoin) => (
                        <TableRow key={rowCoin}>
                          <TableCell className="font-mono font-semibold">{rowCoin}</TableCell>
                          {CORRELATION_COINS.map((colCoin) => {
                            const val = CORRELATION_MATRIX[rowCoin][colCoin];
                            return (
                              <TableCell key={colCoin} className="text-center p-0">
                                <div className={`py-3 px-2 font-mono text-sm ${getCorrelationColor(val)}`}>
                                  {val.toFixed(2)}
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </WidgetScroll>
                <p className="mt-4 text-xs text-muted-foreground">
                  60-day rolling pairwise Pearson correlation of daily log returns. Values near 1.0 indicate strong
                  positive correlation; near 0.0 indicates low correlation.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Risk Metrics Tab ──────────────────────────────────────── */}
          <TabsContent value="risk">
            <div className="space-y-6">
              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {MOCK_RISK_METRICS.map((metric) => (
                  <Card key={metric.label} className="border-border/50">
                    <CardContent className="pt-5 pb-4 space-y-1">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        {metric.label}
                      </p>
                      <p className="text-2xl font-semibold tabular-nums tracking-tight font-mono">{metric.value}</p>
                      <p className="text-[10px] text-muted-foreground/60">{metric.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Rolling volatility chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Rolling 30-day Volatility (Annualized)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    {rollingVolatilityData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={rollingVolatilityData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                          <YAxis
                            tick={{ fontSize: 10 }}
                            tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                            className="text-muted-foreground"
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: 8,
                              fontSize: 12,
                            }}
                            formatter={(value: number) => [`${value.toFixed(2)}%`, "Volatility"]}
                          />
                          <Area
                            type="monotone"
                            dataKey="volatility"
                            stroke="#f59e0b"
                            fill="#f59e0b"
                            fillOpacity={0.1}
                            name="Volatility"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                        Select a client to view rolling volatility
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
