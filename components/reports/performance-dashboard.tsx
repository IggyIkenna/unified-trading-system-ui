"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { ApiError } from "@/components/shared/api-error";
import { PnLChange, PnLValue } from "@/components/trading/pnl-value";
import {
  useClients,
  usePerformanceSummary,
  useOpenPositions,
  useCoinBreakdown,
  useBalanceBreakdown,
} from "@/hooks/api/use-performance";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils/formatters";
import {
  BarChart3,
  Download,
  TrendingUp,
  TrendingDown,
  Wallet,
  Activity,
  Target,
  Layers,
  PieChart,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444", "#10b981"];

export function PerformanceDashboard() {
  const [selectedClientId, setSelectedClientId] = React.useState<string | null>(null);
  const [familyFilter, setFamilyFilter] = React.useState<string>("all");
  const [archetypeFilter, setArchetypeFilter] = React.useState<string>("all");
  const [strategyFilter, setStrategyFilter] = React.useState<string>("all");
  const { data: clientsData, isLoading: clientsLoading } = useClients();
  const { data: summary, isLoading: summaryLoading, isError: summaryError, error: summaryErr, refetch: refetchSummary } = usePerformanceSummary(selectedClientId);
  const { data: positionsData } = useOpenPositions(selectedClientId);
  const { data: coinsData } = useCoinBreakdown(selectedClientId);
  const { data: balancesData } = useBalanceBreakdown(selectedClientId);

  const allClients = clientsData?.clients ?? [];
  const organisations = clientsData?.organisations ?? [];
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

  const strategiesForArchetype = React.useMemo(() => {
    return strategies.filter((st) => {
      if (familyFilter !== "all" && st.family !== familyFilter) return false;
      if (archetypeFilter !== "all" && st.archetype !== archetypeFilter) return false;
      return true;
    });
  }, [strategies, familyFilter, archetypeFilter]);

  React.useEffect(() => {
    if (archetypeFilter !== "all" && !archetypesForFamily.includes(archetypeFilter)) {
      setArchetypeFilter("all");
    }
  }, [archetypeFilter, archetypesForFamily]);

  React.useEffect(() => {
    if (strategyFilter !== "all" && !strategiesForArchetype.some((s) => s.id === strategyFilter)) {
      setStrategyFilter("all");
    }
  }, [strategyFilter, strategiesForArchetype]);

  // Filter clients by (family/archetype/strategy) cascade
  const filteredClients = React.useMemo(() => {
    const strategyIds = new Set(strategiesForArchetype.map((s) => s.id));
    return allClients.filter((c) => {
      if (strategyFilter !== "all") return c.strategy_id === strategyFilter;
      if (familyFilter === "all" && archetypeFilter === "all") return true;
      return c.strategy_id ? strategyIds.has(c.strategy_id) : false;
    });
  }, [allClients, familyFilter, archetypeFilter, strategyFilter, strategiesForArchetype]);

  // Group clients by organisation for the selector
  const clientsByOrg = React.useMemo(() => {
    const groups: Record<string, typeof filteredClients> = {};
    for (const c of filteredClients) {
      const orgName = c.organisation_name ?? "Other";
      if (!groups[orgName]) groups[orgName] = [];
      groups[orgName].push(c);
    }
    return groups;
  }, [filteredClients]);

  // Auto-select first client
  React.useEffect(() => {
    if (filteredClients.length > 0 && (!selectedClientId || !filteredClients.some((c) => c.id === selectedClientId))) {
      setSelectedClientId(filteredClients[0].id);
    }
  }, [filteredClients, selectedClientId]);

  const positions = positionsData?.positions ?? [];
  const coins = coinsData?.coins ?? [];
  const balances = balancesData?.balances ?? [];

  // Downsample equity curve for chart (max 90 points)
  // Handles both mock format (timestamp, hwm_usd, drawdown_pct)
  // and live format (date: "YYYY-MM-DD", equity_usd)
  const equityCurveData = React.useMemo(() => {
    if (!summary?.equity_curve || summary.equity_curve.length === 0) return [];
    const curve = summary.equity_curve;
    const step = Math.max(1, Math.floor(curve.length / 90));

    // Compute running HWM and drawdown if not provided
    let runningHwm = 0;
    return curve
      .filter((_: Record<string, unknown>, i: number) => i % step === 0 || i === curve.length - 1)
      .map((p: Record<string, unknown>) => {
        const equity = Number(p.equity_usd ?? 0);
        runningHwm = Math.max(runningHwm, equity);
        const drawdown = runningHwm > 0 ? ((runningHwm - equity) / runningHwm) * 100 : 0;
        // Parse date from either "timestamp" (ISO) or "date" (YYYY-MM-DD) field
        const dateStr = String(p.timestamp ?? p.date ?? "");
        const dateLabel = dateStr.length === 10
          ? new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return {
          date: dateLabel,
          equity,
          hwm: p.hwm_usd != null ? Number(p.hwm_usd) : runningHwm,
          drawdown: p.drawdown_pct != null ? Math.abs(Number(p.drawdown_pct) * 100) : drawdown,
        };
      });
  }, [summary?.equity_curve]);

  // Monthly returns bar data — handles both mock and live formats
  const monthlyBarData = React.useMemo(() => {
    if (!summary?.monthly_returns || summary.monthly_returns.length === 0) return [];
    return summary.monthly_returns.map((m: Record<string, unknown>) => {
      // Mock format: { month: 1, year: 2026, return_pct: 0.05 }
      // Live format: { month: "2026-01", return_pct: -0.01 }
      const monthStr = String(m.month ?? "");
      let label: string;
      if (monthStr.includes("-")) {
        const [yr, mo] = monthStr.split("-");
        label = `${MONTH_NAMES[parseInt(mo, 10) - 1]} ${yr}`;
      } else {
        label = `${MONTH_NAMES[Number(m.month) - 1]} ${m.year}`;
      }
      const retPct = Number(m.return_pct ?? 0);
      // Mock uses decimal (0.05 = 5%), live already in percent (-0.01 = -0.01%)
      const displayPct = monthStr.includes("-") ? retPct : Math.round(retPct * 10000) / 100;
      return {
        label,
        return_pct: displayPct,
        pnl: Number(m.pnl_usd ?? 0),
      };
    });
  }, [summary?.monthly_returns]);

  // Allocation pie data
  const allocationData = React.useMemo(() => {
    return coins.map((c) => ({
      name: c.symbol,
      value: Math.round((c.allocation_pct ?? 0) * 100),
    }));
  }, [coins]);

  if (clientsLoading) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (summaryError) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto">
        <ApiError error={summaryErr instanceof Error ? summaryErr : new Error("Failed to load performance data")} onRetry={() => refetchSummary()} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header with client selector */}
        <PageHeader
          title="Client Performance"
          description="Equity curves, monthly returns, stats, positions, and coin breakdowns"
        >
          {families.length > 0 && (
            <Select value={familyFilter} onValueChange={setFamilyFilter}>
              <SelectTrigger className="w-[180px]">
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
              <SelectTrigger className="w-[200px]">
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
          {strategiesForArchetype.length > 0 && (
            <Select value={strategyFilter} onValueChange={setStrategyFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Strategies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Strategies</SelectItem>
                {strategiesForArchetype.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={selectedClientId ?? ""} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(clientsByOrg).map(([orgName, orgClients]) => (
                <React.Fragment key={orgName}>
                  {Object.keys(clientsByOrg).length > 1 && (
                    <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{orgName}</div>
                  )}
                  {orgClients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        {c.name}
                        <span className="text-xs text-muted-foreground">{c.venue}</span>
                        {c.is_underwater && <Badge variant="destructive" className="text-[9px] px-1 py-0">UW</Badge>}
                      </span>
                    </SelectItem>
                  ))}
                </React.Fragment>
              ))}
            </SelectContent>
          </Select>
          <ExportDropdown
            data={coins.map((c) => ({ ...c }))}
            columns={[
              { key: "symbol", header: "Symbol" },
              { key: "total_pnl", header: "Total P&L" },
              { key: "allocation_pct", header: "Allocation %" },
            ]}
            filename={`${selectedClientId}_performance`}
          />
          <Button variant="outline" size="sm" className="gap-2" onClick={() => {
            if (selectedClientId) {
              window.open(`/api/reporting/exports/trades?client_id=${selectedClientId}`, "_blank");
            }
          }}>
            <Download className="size-4" />
            Export CSV
          </Button>
        </PageHeader>

        {summaryLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="pt-4"><Skeleton className="h-16" /></CardContent></Card>)}
          </div>
        ) : summary ? (
          <>
            {/* KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-5 pb-4 space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Current Equity</p>
                  <p className="text-2xl font-semibold tabular-nums tracking-tight font-mono">
                    {formatCurrency(summary.current_equity_usd, "USD", 0)}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    {summary.position_count ?? 0} positions
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-5 pb-4 space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Return</p>
                  <p className={`text-2xl font-semibold tabular-nums tracking-tight font-mono ${(summary.stats?.total_return_pct ?? 0) >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"}`}>
                    {(summary.stats?.total_return_pct ?? 0) >= 0 ? "+" : ""}{formatNumber(summary.stats?.total_return_pct ?? 0, 2)}%
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    Ann: {formatNumber(summary.stats?.annualized_return_pct ?? 0, 1)}%
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-5 pb-4 space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Sharpe Ratio</p>
                  <p className="text-2xl font-semibold tabular-nums tracking-tight font-mono">
                    {formatNumber(summary.stats?.sharpe_ratio ?? 0, 2)}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    Annualized
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-5 pb-4 space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Max Drawdown</p>
                  <p className="text-2xl font-semibold tabular-nums tracking-tight font-mono text-[var(--pnl-negative)]">
                    -{formatNumber(summary.stats?.max_drawdown_pct ?? 0, 2)}%
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    HWM: {formatCurrency(summary.stats?.high_water_mark_usd ?? 0, "USD", 0)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-5 pb-4 space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Unrealized P&L</p>
                  <p className={`text-2xl font-semibold tabular-nums tracking-tight font-mono ${(summary.unrealized_pnl_usd ?? 0) >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"}`}>
                    {(summary.unrealized_pnl_usd ?? 0) >= 0 ? "+" : ""}{formatCurrency(summary.unrealized_pnl_usd ?? 0, "USD", 2)}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    Free: {formatCurrency(summary.free_balance_usd ?? 0, "USD", 0)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-5 pb-4 space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Equity Days</p>
                  <p className="text-2xl font-semibold tabular-nums tracking-tight font-mono">
                    {summary.stats?.equity_curve_days ?? summary.equity_curve?.length ?? 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    {summary.equity_source === "binance_income" ? "Binance Ledger" : summary.equity_source === "okx_bills" ? "OKX Bills" : summary.trade_count ? `${summary.trade_count} trades` : `${summary.asset_count ?? 0} assets`}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main content tabs */}
            <Tabs defaultValue="equity" className="space-y-6">
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="equity" className="gap-2"><TrendingUp className="size-4" />Equity Curve</TabsTrigger>
                <TabsTrigger value="monthly" className="gap-2"><BarChart3 className="size-4" />Monthly Returns</TabsTrigger>
                <TabsTrigger value="stats" className="gap-2"><Activity className="size-4" />Stats</TabsTrigger>
                <TabsTrigger value="positions" className="gap-2"><Target className="size-4" />Positions</TabsTrigger>
                <TabsTrigger value="coins" className="gap-2"><Layers className="size-4" />Coin Breakdown</TabsTrigger>
                <TabsTrigger value="balances" className="gap-2"><Wallet className="size-4" />Balances</TabsTrigger>
              </TabsList>

              {/* Equity Curve Tab */}
              <TabsContent value="equity">
                <Card>
                  <CardHeader><CardTitle className="text-base">Equity Curve &amp; Drawdown</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={equityCurveData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                          <YAxis
                            yAxisId="equity"
                            tick={{ fontSize: 10 }}
                            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                            className="text-muted-foreground"
                          />
                          <YAxis
                            yAxisId="dd"
                            orientation="right"
                            tick={{ fontSize: 10 }}
                            tickFormatter={(v: number) => `${v.toFixed(1)}%`}
                            className="text-muted-foreground"
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                            formatter={(value: number, name: string) => {
                              if (name === "equity") return [formatCurrency(value, "USD", 0), "Equity"];
                              if (name === "hwm") return [formatCurrency(value, "USD", 0), "HWM"];
                              return [`${value.toFixed(2)}%`, "Drawdown"];
                            }}
                          />
                          <Legend />
                          <Area yAxisId="equity" type="monotone" dataKey="equity" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} name="Equity" strokeWidth={2} />
                          <Area yAxisId="equity" type="monotone" dataKey="hwm" stroke="#6b7280" fill="none" strokeDasharray="5 5" name="HWM" strokeWidth={1} />
                          <Area yAxisId="dd" type="monotone" dataKey="drawdown" stroke="#ef4444" fill="#ef4444" fillOpacity={0.05} name="Drawdown %" strokeWidth={1} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Monthly Returns Tab */}
              <TabsContent value="monthly">
                <Card>
                  <CardHeader><CardTitle className="text-base">Monthly Returns</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyBarData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}%`} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                            formatter={(value: number, name: string) => {
                              if (name === "return_pct") return [`${value.toFixed(2)}%`, "Return"];
                              return [formatCurrency(value, "USD", 0), "P&L"];
                            }}
                          />
                          <Bar dataKey="return_pct" name="Return %" radius={[4, 4, 0, 0]}>
                            {monthlyBarData.map((entry, idx) => (
                              <Cell key={idx} fill={entry.return_pct >= 0 ? "#22c55e" : "#ef4444"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Monthly returns table */}
                    <Table className="mt-4">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Period</TableHead>
                          <TableHead className="text-right">Return</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthlyBarData.map((m, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{m.label}</TableCell>
                            <TableCell className="text-right"><PnLChange value={m.return_pct} size="sm" /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Stats Grid Tab */}
              <TabsContent value="stats">
                {summary.stats && Object.keys(summary.stats).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="text-base">Return Metrics</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          ["Total Return", `${formatNumber(summary.stats.total_return_pct ?? 0, 2)}%`],
                          ["Annualized Return", `${formatNumber(summary.stats.annualized_return_pct ?? 0, 2)}%`],
                          ["Equity Curve Days", `${summary.stats.equity_curve_days ?? 0}`],
                          ["Start Date", summary.stats.start_date ?? "N/A"],
                          ["End Date", summary.stats.end_date ?? "N/A"],
                        ].map(([label, val]) => (
                          <div key={label} className="flex justify-between items-center py-1 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">{label}</span>
                            <span className="font-mono font-medium text-sm">{val}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-base">Risk Metrics</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          ["Sharpe Ratio", formatNumber(summary.stats.sharpe_ratio ?? 0, 2)],
                          ["Max Drawdown", `-${formatNumber(summary.stats.max_drawdown_pct ?? 0, 2)}%`],
                          ["High Water Mark", formatCurrency(summary.stats.high_water_mark_usd ?? 0, "USD", 0)],
                          ["Trade Count", `${summary.trade_count ?? 0}`],
                          ["Data Source", summary.equity_source === "binance_income" ? "Binance Income Ledger" : summary.equity_source === "okx_bills" ? "OKX Bills Ledger" : "Trade Fees (Legacy)"],
                        ].map(([label, val]) => (
                          <div key={label} className="flex justify-between items-center py-1 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">{label}</span>
                            <span className="font-mono font-medium text-sm">{val}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    <Activity className="size-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Stats will be computed once more historical data is available.</p>
                    <p className="text-xs mt-1">Current data: {summary.equity_curve?.length ?? 0} equity curve points, {summary.monthly_returns?.length ?? 0} monthly returns</p>
                  </CardContent>
                </Card>
                )}
              </TabsContent>

              {/* Positions Tab */}
              <TabsContent value="positions">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Open Positions</CardTitle>
                      <span className="text-xs text-muted-foreground font-mono">{positions.length} position{positions.length !== 1 ? "s" : ""}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Side</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Entry</TableHead>
                          <TableHead className="text-right">Mark</TableHead>
                          <TableHead className="text-right">Unrealized P&L</TableHead>
                          <TableHead className="text-right">Lev</TableHead>
                          <TableHead className="text-right">Notional</TableHead>
                          <TableHead className="text-right">Liq. Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {positions.map((p) => (
                          <TableRow key={p.symbol}>
                            <TableCell className="font-medium font-mono">{p.symbol}</TableCell>
                            <TableCell>
                              <Badge variant={p.side === "long" ? "default" : "destructive"} className="text-xs">
                                {p.side === "long" ? <TrendingUp className="size-3 mr-1" /> : <TrendingDown className="size-3 mr-1" />}
                                {p.side}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">{p.quantity}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(p.entry_price, "USD", 2)}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(p.mark_price, "USD", 2)}</TableCell>
                            <TableCell className="text-right"><PnLValue value={p.unrealized_pnl} size="sm" showSign /></TableCell>
                            <TableCell className="text-right font-mono">{p.leverage}x</TableCell>
                            <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(p.notional_usd, "USD", 0)}</TableCell>
                            <TableCell className="text-right font-mono text-[var(--pnl-negative)]">{formatCurrency(p.liquidation_price, "USD", 0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Coin Breakdown Tab */}
              <TabsContent value="coins">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader><CardTitle className="text-base">Per-Coin P&L</CardTitle></CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Coin</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Market Value</TableHead>
                            <TableHead className="text-right">Alloc</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {coins.map((c) => (
                            <TableRow key={c.symbol}>
                              <TableCell className="font-medium font-mono">{c.symbol}</TableCell>
                              <TableCell className="text-right font-mono">{formatNumber(c.quantity, c.quantity < 10 ? 4 : 0)}</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(c.market_value_usd ?? c.current_price ?? 0, "USD", 2)}</TableCell>
                              <TableCell className="text-right font-mono">{formatPercent((c.allocation_pct ?? 0) * 100, 1)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-base">Portfolio Allocation</CardTitle></CardHeader>
                    <CardContent>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={allocationData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              dataKey="value"
                              nameKey="name"
                              label={({ name, value }: { name: string; value: number }) => `${name} ${value}%`}
                              labelLine={false}
                            >
                              {allocationData.map((_, idx) => (
                                <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => [`${value}%`, "Allocation"]} />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Balances Tab */}
              <TabsContent value="balances">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Balance Breakdown</CardTitle>
                      <span className="font-mono font-semibold text-sm">Total: {formatCurrency(balancesData?.total_equity_usd ?? 0, "USD", 0)}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Currency</TableHead>
                          <TableHead className="text-right">Free</TableHead>
                          <TableHead className="text-right">Locked</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">USD Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {balances.map((b) => (
                          <TableRow key={b.currency}>
                            <TableCell className="font-medium font-mono">{b.currency}</TableCell>
                            <TableCell className="text-right font-mono text-[var(--pnl-positive)]">{b.free}</TableCell>
                            <TableCell className="text-right font-mono text-muted-foreground">{b.locked}</TableCell>
                            <TableCell className="text-right font-mono font-medium">{b.total}</TableCell>
                            <TableCell className="text-right font-mono">${formatNumber(parseFloat(b.usd_value), 2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </div>
    </div>
  );
}
