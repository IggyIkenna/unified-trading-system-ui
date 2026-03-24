"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Briefcase,
  FileText,
  Download,
  Calendar,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  Sparkles,
  Send,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

// Mock data for executive dashboard
const navHistory = [
  { date: "Jan", nav: 22.1, benchmark: 21.5 },
  { date: "Feb", nav: 22.8, benchmark: 21.8 },
  { date: "Mar", nav: 23.2, benchmark: 22.0 },
  { date: "Apr", nav: 22.9, benchmark: 22.2 },
  { date: "May", nav: 23.8, benchmark: 22.5 },
  { date: "Jun", nav: 24.5, benchmark: 22.8 },
];

// Available strategies with their performance data
const availableStrategies = [
  {
    id: "arbitrage",
    name: "Crypto Arbitrage",
    aum: 4.2,
    pnl: 312,
    pnlPct: 7.4,
    sharpe: 2.8,
    allocation: 35,
    color: "#4ade80",
  },
  {
    id: "market-making",
    name: "DeFi Market Making",
    aum: 3.1,
    pnl: 198,
    pnlPct: 6.4,
    sharpe: 2.2,
    allocation: 25,
    color: "#60a5fa",
  },
  {
    id: "directional",
    name: "Momentum Long/Short",
    aum: 2.5,
    pnl: 145,
    pnlPct: 5.8,
    sharpe: 1.9,
    allocation: 20,
    color: "#f472b6",
  },
  {
    id: "yield",
    name: "DeFi Yield",
    aum: 1.9,
    pnl: 87,
    pnlPct: 4.6,
    sharpe: 3.1,
    allocation: 15,
    color: "#fbbf24",
  },
  {
    id: "sports",
    name: "Sports Arbitrage",
    aum: 0.6,
    pnl: 42,
    pnlPct: 7.0,
    sharpe: 2.4,
    allocation: 5,
    color: "#94a3b8",
  },
];

const monthlyPnL = [
  { month: "Jan", pnl: 420, target: 400 },
  { month: "Feb", pnl: 380, target: 400 },
  { month: "Mar", pnl: 510, target: 400 },
  { month: "Apr", pnl: 290, target: 400 },
  { month: "May", pnl: 480, target: 400 },
  { month: "Jun", pnl: 620, target: 400 },
];

const clientSummary = [
  { name: "Odum Capital", aum: 12.5, pnl: 842, pnlPct: 6.7, status: "active" },
  { name: "Meridian Fund", aum: 8.2, pnl: 512, pnlPct: 6.2, status: "active" },
  { name: "Apex Partners", aum: 5.1, pnl: 198, pnlPct: 3.9, status: "active" },
  {
    name: "Nova Ventures",
    aum: 3.8,
    pnl: -42,
    pnlPct: -1.1,
    status: "warning",
  },
];

// Demo NL query response data
const nlDemoQuestions = [
  "What was the Sharpe of my DeFi basis strategy in Q4 excluding periods when funding rate was below 3%?",
  "Show me the top 3 performing strategies by risk-adjusted return since inception",
  "What is the current drawdown vs max drawdown for each strategy?",
];

const nlDemoResponse = {
  question:
    "What was the Sharpe of my DeFi basis strategy in Q4 excluding periods when funding rate was below 3%?",
  answer: `**Analysis: DeFi Basis Strategy Q4 Performance (Funding Rate > 3%)**

The DeFi Basis strategy achieved a **Sharpe ratio of 2.84** during Q4 2025 when filtering for periods where the funding rate exceeded 3%.

**Key Findings:**
- Total trading days in Q4: 92
- Days with funding rate > 3%: 67 (72.8%)
- Annualised return during filtered period: 24.3%
- Annualised volatility: 8.6%
- Maximum drawdown during period: 3.2%

**Comparison:**
- Full Q4 Sharpe (unfiltered): 2.21
- Filtered Sharpe improvement: +28.5%

This confirms that the strategy performs significantly better in high-funding-rate environments, suggesting potential for dynamic position sizing based on funding rate levels.`,
  chartData: [
    { month: "Oct", sharpe: 2.6, funding: 4.2 },
    { month: "Nov", sharpe: 3.1, funding: 5.1 },
    { month: "Dec", sharpe: 2.8, funding: 3.8 },
  ],
};

interface ExecutiveDashboardProps {
  className?: string;
}

export function ExecutiveDashboard({ className }: ExecutiveDashboardProps) {
  const [reportPeriod, setReportPeriod] = React.useState("ytd");
  const [selectedStrategies, setSelectedStrategies] = React.useState<string[]>(
    availableStrategies.map((s) => s.id), // All selected by default
  );

  // Natural language query state
  const [nlQuery, setNlQuery] = React.useState(nlDemoQuestions[0]);
  const [nlResponse, setNlResponse] = React.useState<
    typeof nlDemoResponse | null
  >(null);
  const [nlLoading, setNlLoading] = React.useState(false);

  const handleNlQuery = async () => {
    setNlLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setNlResponse(nlDemoResponse);
    setNlLoading(false);
  };

  // Auto-trigger demo on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      handleNlQuery();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Compute aggregated metrics based on selected strategies
  const selectedStrategyData = React.useMemo(() => {
    const selected = availableStrategies.filter((s) =>
      selectedStrategies.includes(s.id),
    );
    const totalAum = selected.reduce((sum, s) => sum + s.aum, 0);
    const totalPnl = selected.reduce((sum, s) => sum + s.pnl, 0);
    const weightedSharpe =
      selected.length > 0
        ? selected.reduce((sum, s) => sum + s.sharpe * s.aum, 0) / totalAum
        : 0;
    const pnlPct = totalAum > 0 ? (totalPnl / (totalAum * 10)) * 100 : 0; // Simplified calculation

    // Recalculate allocation percentages for selected strategies
    const totalAllocation = selected.reduce((sum, s) => sum + s.allocation, 0);
    const strategyAllocation = selected.map((s) => ({
      name: s.name,
      value: Math.round((s.allocation / totalAllocation) * 100),
      color: s.color,
    }));

    return {
      totalAum,
      totalPnl,
      weightedSharpe,
      pnlPct,
      strategyAllocation,
      count: selected.length,
    };
  }, [selectedStrategies]);

  const toggleStrategy = (strategyId: string) => {
    setSelectedStrategies((prev) =>
      prev.includes(strategyId)
        ? prev.filter((id) => id !== strategyId)
        : [...prev, strategyId],
    );
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Executive Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Portfolio performance and investor reporting
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={reportPeriod} onValueChange={setReportPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mtd">MTD</SelectItem>
              <SelectItem value="qtd">QTD</SelectItem>
              <SelectItem value="ytd">YTD</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
              <SelectItem value="inception">Since Inception</SelectItem>
            </SelectContent>
          </Select>

          {/* Strategy Multi-Select */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-48 justify-between">
                <span className="truncate">
                  {selectedStrategies.length === availableStrategies.length
                    ? "All Strategies"
                    : `${selectedStrategies.length} Strategies`}
                </span>
                <Badge variant="secondary" className="ml-2">
                  {selectedStrategies.length}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Select Strategies</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableStrategies.map((strategy) => (
                <DropdownMenuCheckboxItem
                  key={strategy.id}
                  checked={selectedStrategies.includes(strategy.id)}
                  onCheckedChange={() => toggleStrategy(strategy.id)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="size-2 rounded-full"
                      style={{ backgroundColor: strategy.color }}
                    />
                    {strategy.name}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={
                  selectedStrategies.length === availableStrategies.length
                }
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedStrategies(availableStrategies.map((s) => s.id));
                  } else {
                    setSelectedStrategies([]);
                  }
                }}
              >
                Select All
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm">
            <Download className="size-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Natural Language Query Section */}
      <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="size-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">
                Ask Your Portfolio
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Natural language queries across all your data
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              placeholder="Ask anything about your portfolio performance..."
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleNlQuery()}
            />
            <Button onClick={handleNlQuery} disabled={nlLoading}>
              {nlLoading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </span>
              ) : (
                <>
                  <Send className="size-4 mr-2" />
                  Ask
                </>
              )}
            </Button>
          </div>

          {/* Example questions */}
          <div className="flex flex-wrap gap-2">
            {nlDemoQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => {
                  setNlQuery(q);
                  setNlResponse(null);
                }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  nlQuery === q
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {q.length > 60 ? q.slice(0, 60) + "..." : q}
              </button>
            ))}
          </div>

          {/* Response */}
          {nlResponse && (
            <div className="mt-4 p-4 rounded-lg border border-border bg-card">
              <div className="flex items-start gap-3">
                <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <MessageSquare className="size-3 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="prose prose-sm prose-invert max-w-none">
                    {nlResponse.answer.split("\n").map((line, i) => {
                      if (line.startsWith("**") && line.endsWith("**")) {
                        return (
                          <h4
                            key={i}
                            className="text-sm font-semibold text-foreground mt-3 mb-1"
                          >
                            {line.replace(/\*\*/g, "")}
                          </h4>
                        );
                      }
                      if (line.startsWith("- ")) {
                        return (
                          <p
                            key={i}
                            className="text-sm text-muted-foreground ml-4"
                          >
                            {line}
                          </p>
                        );
                      }
                      if (line.includes("**")) {
                        const parts = line.split(/\*\*/);
                        return (
                          <p key={i} className="text-sm text-muted-foreground">
                            {parts.map((part, j) =>
                              j % 2 === 1 ? (
                                <strong
                                  key={j}
                                  className="text-primary font-semibold"
                                >
                                  {part}
                                </strong>
                              ) : (
                                part
                              ),
                            )}
                          </p>
                        );
                      }
                      return line.trim() ? (
                        <p key={i} className="text-sm text-muted-foreground">
                          {line}
                        </p>
                      ) : null;
                    })}
                  </div>

                  {/* Chart */}
                  <div className="mt-4 p-3 rounded-lg border border-border bg-muted/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                      Q4 Monthly Sharpe vs Funding Rate
                    </p>
                    <div className="h-[120px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={nlResponse.chartData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border)"
                          />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 10 }}
                            stroke="var(--muted-foreground)"
                          />
                          <YAxis
                            yAxisId="left"
                            tick={{ fontSize: 10 }}
                            stroke="var(--muted-foreground)"
                            domain={[0, 4]}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 10 }}
                            stroke="var(--muted-foreground)"
                            domain={[0, 6]}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "var(--popover)",
                              border: "1px solid var(--border)",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                          />
                          <Bar
                            yAxisId="left"
                            dataKey="sharpe"
                            name="Sharpe Ratio"
                            fill="var(--surface-trading)"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            yAxisId="right"
                            dataKey="funding"
                            name="Funding Rate %"
                            fill="var(--surface-strategy)"
                            radius={[4, 4, 0, 0]}
                            fillOpacity={0.5}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI Cards - Dynamic based on selected strategies */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Total AUM
                </p>
                <p className="text-2xl font-semibold mt-1">
                  ${selectedStrategyData.totalAum.toFixed(1)}M
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {selectedStrategyData.count} of {availableStrategies.length}{" "}
                    strategies
                  </span>
                </div>
              </div>
              <div className="size-10 rounded-lg bg-[var(--surface-trading)]/10 flex items-center justify-center">
                <DollarSign className="size-5 text-[var(--surface-trading)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  YTD P&L
                </p>
                <p
                  className={`text-2xl font-semibold mt-1 ${selectedStrategyData.totalPnl >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"}`}
                >
                  {selectedStrategyData.totalPnl >= 0 ? "+" : ""}$
                  {Math.abs(selectedStrategyData.totalPnl)}K
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {selectedStrategyData.totalPnl >= 0 ? (
                    <ArrowUpRight className="size-3 text-[var(--pnl-positive)]" />
                  ) : (
                    <ArrowDownRight className="size-3 text-[var(--pnl-negative)]" />
                  )}
                  <span
                    className={`text-xs ${selectedStrategyData.totalPnl >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"}`}
                  >
                    {selectedStrategyData.pnlPct.toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">return</span>
                </div>
              </div>
              <div className="size-10 rounded-lg bg-[var(--pnl-positive)]/10 flex items-center justify-center">
                <TrendingUp className="size-5 text-[var(--pnl-positive)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Active Strategies
                </p>
                <p className="text-2xl font-semibold mt-1">
                  {selectedStrategyData.count}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">
                    selected for analysis
                  </span>
                </div>
              </div>
              <div className="size-10 rounded-lg bg-[var(--surface-strategy)]/10 flex items-center justify-center">
                <PieChart className="size-5 text-[var(--surface-strategy)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Avg Sharpe Ratio
                </p>
                <p className="text-2xl font-semibold mt-1">
                  {selectedStrategyData.weightedSharpe.toFixed(2)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">
                    AUM-weighted
                  </span>
                </div>
              </div>
              <div className="size-10 rounded-lg bg-[var(--surface-markets)]/10 flex items-center justify-center">
                <BarChart3 className="size-5 text-[var(--surface-markets)]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">Client Reports</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {/* NAV Chart */}
            <Card className="col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  NAV Performance vs Benchmark
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={navHistory}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        stroke="var(--muted-foreground)"
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        stroke="var(--muted-foreground)"
                        domain={[20, 26]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="nav"
                        name="NAV ($M)"
                        stroke="var(--surface-trading)"
                        fill="var(--surface-trading)"
                        fillOpacity={0.2}
                      />
                      <Area
                        type="monotone"
                        dataKey="benchmark"
                        name="Benchmark"
                        stroke="var(--muted-foreground)"
                        fill="var(--muted-foreground)"
                        fillOpacity={0.1}
                        strokeDasharray="5 5"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Strategy Allocation Pie */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Strategy Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  {selectedStrategyData.strategyAllocation.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={selectedStrategyData.strategyAllocation}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {selectedStrategyData.strategyAllocation.map(
                            (entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ),
                          )}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--popover)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      Select strategies to view allocation
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {selectedStrategyData.strategyAllocation.map((s) => (
                    <div
                      key={s.name}
                      className="flex items-center gap-2 text-xs"
                    >
                      <div
                        className="size-2 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="text-muted-foreground truncate">
                        {s.name}
                      </span>
                      <span className="ml-auto font-medium">{s.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly P&L */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly P&L vs Target
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyPnL}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11 }}
                      stroke="var(--muted-foreground)"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="var(--muted-foreground)"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`$${value}K`, ""]}
                    />
                    <Legend />
                    <Bar
                      dataKey="pnl"
                      name="P&L ($K)"
                      fill="var(--surface-trading)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="target"
                      name="Target"
                      fill="var(--muted-foreground)"
                      radius={[4, 4, 0, 0]}
                      fillOpacity={0.3}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Client Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {clientSummary.map((client) => (
                  <div
                    key={client.name}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-[var(--surface-strategy)]/10 flex items-center justify-center">
                        <Briefcase className="size-5 text-[var(--surface-strategy)]" />
                      </div>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-xs text-muted-foreground">
                          AUM: ${client.aum}M
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={
                          client.pnl >= 0
                            ? "text-[var(--pnl-positive)] font-medium"
                            : "text-[var(--pnl-negative)] font-medium"
                        }
                      >
                        {client.pnl >= 0 ? "+" : ""}${Math.abs(client.pnl)}K
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {client.pnlPct >= 0 ? "+" : ""}
                        {client.pnlPct}% YTD
                      </p>
                    </div>
                    <Badge
                      variant={
                        client.status === "active" ? "default" : "secondary"
                      }
                      className={
                        client.status === "active"
                          ? "bg-[var(--status-live)]/10 text-[var(--status-live)]"
                          : "bg-[var(--status-warning)]/10 text-[var(--status-warning)]"
                      }
                    >
                      {client.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <FileText className="size-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocation">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center py-12">
                Detailed allocation breakdown and rebalancing tools
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Recent Documents
                </CardTitle>
                <Button variant="outline" size="sm">
                  <FileText className="size-4 mr-2" />
                  New Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  {
                    name: "Q2 2024 Investor Letter",
                    date: "Jun 30, 2024",
                    type: "PDF",
                  },
                  {
                    name: "Monthly Performance Report - June",
                    date: "Jul 5, 2024",
                    type: "PDF",
                  },
                  {
                    name: "Risk Committee Presentation",
                    date: "Jun 15, 2024",
                    type: "PPTX",
                  },
                  {
                    name: "Strategy Allocation Memo",
                    date: "Jun 1, 2024",
                    type: "PDF",
                  },
                ].map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="size-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{doc.type}</Badge>
                      <Button variant="ghost" size="icon">
                        <Download className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
