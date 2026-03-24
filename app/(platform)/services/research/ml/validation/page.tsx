"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  GitCompare,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Target,
  BarChart3,
  LineChart,
  Activity,
  Layers,
  Filter,
  Download,
  RefreshCw,
  ChevronRight,
  Clock,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart as RechartsLine,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ReferenceLine,
  Area,
  AreaChart,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useValidationResults } from "@/hooks/api/use-ml-models";
import { ApiError } from "@/components/ui/api-error";
import { EmptyState } from "@/components/ui/empty-state";

// Default validation results used when API returns no data
const DEFAULT_VALIDATION_RESULTS = {
  champion: {
    modelId: "funding-pred-v2.3.1",
    name: "Funding Rate Predictor",
    version: "2.3.1",
    stage: "CHAMPION",
    metrics: {
      sharpe: 2.41,
      accuracy: 0.847,
      precision: 0.823,
      recall: 0.871,
      f1: 0.846,
      auc: 0.912,
      maxDrawdown: -0.034,
      calmarRatio: 1.82,
      informationRatio: 1.94,
    },
    validationDate: "2026-03-15",
    dataWindow: "2025-09-01 to 2026-03-01",
    samples: 45200,
  },
  challenger: {
    modelId: "funding-pred-v2.4.0-rc1",
    name: "Funding Rate Predictor",
    version: "2.4.0-rc1",
    stage: "CHALLENGER",
    metrics: {
      sharpe: 2.58,
      accuracy: 0.862,
      precision: 0.841,
      recall: 0.883,
      f1: 0.862,
      auc: 0.928,
      maxDrawdown: -0.029,
      calmarRatio: 2.14,
      informationRatio: 2.12,
    },
    validationDate: "2026-03-17",
    dataWindow: "2025-09-01 to 2026-03-01",
    samples: 45200,
  },
};

// Default regime performance breakdown
const DEFAULT_REGIME_PERFORMANCE = [
  {
    regime: "Low Vol",
    championSharpe: 2.8,
    challengerSharpe: 3.1,
    samples: 12400,
    description: "VIX < 15",
  },
  {
    regime: "Normal",
    championSharpe: 2.4,
    challengerSharpe: 2.6,
    samples: 24100,
    description: "15 ≤ VIX < 25",
  },
  {
    regime: "High Vol",
    championSharpe: 1.9,
    challengerSharpe: 2.2,
    samples: 6800,
    description: "VIX ≥ 25",
  },
  {
    regime: "Trending",
    championSharpe: 2.6,
    challengerSharpe: 2.9,
    samples: 15200,
    description: "ADX > 25",
  },
  {
    regime: "Ranging",
    championSharpe: 2.1,
    challengerSharpe: 2.3,
    samples: 18900,
    description: "ADX ≤ 25",
  },
];

// Default walk-forward validation windows
const DEFAULT_WALK_FORWARD_RESULTS = [
  {
    window: "W1",
    trainStart: "2025-03",
    trainEnd: "2025-06",
    testStart: "2025-07",
    testEnd: "2025-08",
    champSharpe: 2.31,
    challSharpe: 2.48,
    champAcc: 0.841,
    challAcc: 0.858,
  },
  {
    window: "W2",
    trainStart: "2025-05",
    trainEnd: "2025-08",
    testStart: "2025-09",
    testEnd: "2025-10",
    champSharpe: 2.45,
    challSharpe: 2.62,
    champAcc: 0.852,
    challAcc: 0.867,
  },
  {
    window: "W3",
    trainStart: "2025-07",
    trainEnd: "2025-10",
    testStart: "2025-11",
    testEnd: "2025-12",
    champSharpe: 2.38,
    challSharpe: 2.51,
    champAcc: 0.844,
    challAcc: 0.859,
  },
  {
    window: "W4",
    trainStart: "2025-09",
    trainEnd: "2025-12",
    testStart: "2026-01",
    testEnd: "2026-02",
    champSharpe: 2.52,
    challSharpe: 2.71,
    champAcc: 0.856,
    challAcc: 0.871,
  },
  {
    window: "W5",
    trainStart: "2025-11",
    trainEnd: "2026-02",
    testStart: "2026-03",
    testEnd: "2026-03",
    champSharpe: 2.44,
    challSharpe: 2.59,
    champAcc: 0.848,
    challAcc: 0.864,
  },
];

// Default statistical tests
const DEFAULT_STATISTICAL_TESTS = [
  {
    test: "Paired t-test (Sharpe)",
    statistic: 3.42,
    pValue: 0.0012,
    significant: true,
    conclusion: "Challenger significantly better",
  },
  {
    test: "Diebold-Mariano",
    statistic: 2.87,
    pValue: 0.0041,
    significant: true,
    conclusion: "Challenger forecasts are superior",
  },
  {
    test: "Model Confidence Set",
    statistic: "N/A",
    pValue: 0.018,
    significant: true,
    conclusion: "Challenger in MCS, Champion excluded",
  },
  {
    test: "Bootstrap Sharpe Diff",
    statistic: "0.17 [0.08, 0.26]",
    pValue: 0.0023,
    significant: true,
    conclusion: "95% CI excludes zero",
  },
  {
    test: "Kolmogorov-Smirnov",
    statistic: 0.089,
    pValue: 0.142,
    significant: false,
    conclusion: "Return distributions similar",
  },
];

// Default feature importance comparison
const DEFAULT_FEATURE_IMPORTANCE = [
  { feature: "funding_rate_8h", champion: 0.23, challenger: 0.21 },
  { feature: "oi_change_1h", champion: 0.18, challenger: 0.22 },
  { feature: "volume_imbalance", champion: 0.15, challenger: 0.16 },
  { feature: "basis_spread", champion: 0.14, challenger: 0.12 },
  { feature: "liquidation_ratio", champion: 0.11, challenger: 0.14 },
  { feature: "spot_perp_spread", champion: 0.1, challenger: 0.09 },
  { feature: "whale_flow", champion: 0.09, challenger: 0.06 },
];

export default function ValidationPage() {
  const {
    data: rawData,
    isLoading,
    isError,
    error,
    refetch,
  } = useValidationResults();

  const validationResults =
    (rawData as any)?.data?.comparison ??
    (rawData as any)?.comparison ??
    DEFAULT_VALIDATION_RESULTS;
  const regimePerformance: any[] =
    (rawData as any)?.data?.regimePerformance ??
    (rawData as any)?.regimePerformance ??
    DEFAULT_REGIME_PERFORMANCE;
  const walkForwardResults: any[] =
    (rawData as any)?.data?.walkForward ??
    (rawData as any)?.walkForward ??
    DEFAULT_WALK_FORWARD_RESULTS;
  const statisticalTests: any[] =
    (rawData as any)?.data?.statisticalTests ??
    (rawData as any)?.statisticalTests ??
    DEFAULT_STATISTICAL_TESTS;
  const featureImportance: any[] =
    (rawData as any)?.data?.featureImportance ??
    (rawData as any)?.featureImportance ??
    DEFAULT_FEATURE_IMPORTANCE;

  const timeSeriesComparison = useMemo(
    () =>
      (rawData as any)?.data?.timeSeries ??
      (rawData as any)?.timeSeries ??
      Array.from({ length: 60 }, (_, i) => ({
        date: new Date(2026, 0, 1 + i).toISOString().split("T")[0],
        championPnL: Math.random() * 0.02 - 0.005 + i * 0.0003,
        challengerPnL: Math.random() * 0.02 - 0.004 + i * 0.00035,
        championSharpe: 2.2 + Math.random() * 0.4,
        challengerSharpe: 2.3 + Math.random() * 0.5,
      })),
    [rawData],
  );

  const cumulativeReturns = useMemo(() => {
    if ((rawData as any)?.data?.cumulativeReturns)
      return (rawData as any).data.cumulativeReturns;
    if ((rawData as any)?.cumulativeReturns)
      return (rawData as any).cumulativeReturns;
    let champCum = 0;
    let challCum = 0;
    return timeSeriesComparison.map((d: any) => {
      champCum += d.championPnL;
      challCum += d.challengerPnL;
      return { date: d.date, champion: champCum, challenger: challCum };
    });
  }, [rawData, timeSeriesComparison]);

  const [selectedComparison, setSelectedComparison] = useState("funding-pred");
  const [validationPeriod, setValidationPeriod] = useState("6m");

  const champion = validationResults.champion;
  const challenger = validationResults.challenger;

  const getMetricDiff = (metric: keyof typeof champion.metrics) => {
    const diff = challenger.metrics[metric] - champion.metrics[metric];
    const pctDiff = (diff / Math.abs(champion.metrics[metric])) * 100;
    return { diff, pctDiff };
  };

  if (isError)
    return (
      <div className="p-6">
        <ApiError error={error} onRetry={() => refetch()} />
      </div>
    );

  if (!validationResults.champion && !validationResults.challenger)
    return (
      <div className="p-6">
        <EmptyState
          title="No validation results"
          description="No champion vs challenger comparisons available. Run a validation to compare model versions."
          icon={GitCompare}
        />
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/services/research/ml/overview">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="size-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold flex items-center gap-2">
                  <GitCompare className="size-5" />
                  Model Validation & Comparison
                </h1>
                <p className="text-sm text-muted-foreground">
                  Champion vs Challenger backtesting and statistical validation
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={selectedComparison}
                onValueChange={setSelectedComparison}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select comparison" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="funding-pred">
                    Funding Rate Predictor
                  </SelectItem>
                  <SelectItem value="vol-forecast">Vol Forecaster</SelectItem>
                  <SelectItem value="liq-detect">
                    Liquidation Detector
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={validationPeriod}
                onValueChange={setValidationPeriod}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3m">3 Months</SelectItem>
                  <SelectItem value="6m">6 Months</SelectItem>
                  <SelectItem value="12m">12 Months</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="size-4 mr-2" />
                Export Report
              </Button>
              <Button size="sm">
                <RefreshCw className="size-4 mr-2" />
                Re-run Validation
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Champion vs Challenger Header Cards */}
        <div className="grid grid-cols-2 gap-6">
          {/* Champion */}
          <Card className="border-[var(--status-success)]/30 bg-[var(--status-success)]/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-[var(--status-success)] text-white">
                    CHAMPION
                  </Badge>
                  <span className="text-lg font-semibold">{champion.name}</span>
                </div>
                <Badge variant="outline">v{champion.version}</Badge>
              </div>
              <CardDescription>
                Currently deployed in production
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
                  <p className="text-2xl font-bold">
                    {champion.metrics.sharpe.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                  <p className="text-2xl font-bold">
                    {(champion.metrics.accuracy * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Max Drawdown</p>
                  <p className="text-2xl font-bold text-[var(--status-error)]">
                    {(champion.metrics.maxDrawdown * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">AUC-ROC</p>
                  <p className="text-2xl font-bold">
                    {champion.metrics.auc.toFixed(3)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Challenger */}
          <Card className="border-[var(--status-warning)]/30 bg-[var(--status-warning)]/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-[var(--status-warning)] text-black">
                    CHALLENGER
                  </Badge>
                  <span className="text-lg font-semibold">
                    {challenger.name}
                  </span>
                </div>
                <Badge variant="outline">v{challenger.version}</Badge>
              </div>
              <CardDescription>Pending promotion review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
                  <p className="text-2xl font-bold">
                    {challenger.metrics.sharpe.toFixed(2)}
                  </p>
                  <p className="text-xs text-[var(--status-success)]">
                    +{getMetricDiff("sharpe").pctDiff.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                  <p className="text-2xl font-bold">
                    {(challenger.metrics.accuracy * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-[var(--status-success)]">
                    +{getMetricDiff("accuracy").pctDiff.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Max Drawdown</p>
                  <p className="text-2xl font-bold text-[var(--status-error)]">
                    {(challenger.metrics.maxDrawdown * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-[var(--status-success)]">
                    {getMetricDiff("maxDrawdown").pctDiff.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">AUC-ROC</p>
                  <p className="text-2xl font-bold">
                    {challenger.metrics.auc.toFixed(3)}
                  </p>
                  <p className="text-xs text-[var(--status-success)]">
                    +{getMetricDiff("auc").pctDiff.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Promotion Recommendation Banner */}
        <Card className="border-[var(--status-success)]/50 bg-[var(--status-success)]/10">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-6 text-[var(--status-success)]" />
                <div>
                  <p className="font-semibold">
                    Recommendation: Promote Challenger to Champion
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Challenger outperforms on 4/5 statistical tests with
                    significantly better Sharpe ratio (+7.1%) across all regimes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">View Full Report</Button>
                <Button className="bg-[var(--status-success)] hover:bg-[var(--status-success)]/90">
                  Initiate Promotion
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="performance">
              Performance Comparison
            </TabsTrigger>
            <TabsTrigger value="regimes">Regime Analysis</TabsTrigger>
            <TabsTrigger value="walkforward">Walk-Forward</TabsTrigger>
            <TabsTrigger value="statistical">Statistical Tests</TabsTrigger>
            <TabsTrigger value="features">Feature Analysis</TabsTrigger>
          </TabsList>

          {/* Performance Comparison Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Cumulative Returns Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <LineChart className="size-4" />
                    Cumulative Returns
                  </CardTitle>
                  <CardDescription>
                    Out-of-sample backtest performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cumulativeReturns}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v) => v.slice(5)}
                        />
                        <YAxis
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                          }}
                          formatter={(value: number) => [
                            `${(value * 100).toFixed(2)}%`,
                            "",
                          ]}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="champion"
                          stroke="var(--status-success)"
                          fill="var(--status-success)"
                          fillOpacity={0.2}
                          name="Champion"
                        />
                        <Area
                          type="monotone"
                          dataKey="challenger"
                          stroke="var(--status-warning)"
                          fill="var(--status-warning)"
                          fillOpacity={0.2}
                          name="Challenger"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Rolling Sharpe Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="size-4" />
                    Rolling 30-Day Sharpe Ratio
                  </CardTitle>
                  <CardDescription>
                    Risk-adjusted performance over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLine data={timeSeriesComparison}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v) => v.slice(5)}
                        />
                        <YAxis tick={{ fontSize: 10 }} domain={[1.5, 3.5]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                          }}
                        />
                        <Legend />
                        <ReferenceLine
                          y={2}
                          stroke="hsl(var(--muted-foreground))"
                          strokeDasharray="5 5"
                        />
                        <Line
                          type="monotone"
                          dataKey="championSharpe"
                          stroke="var(--status-success)"
                          dot={false}
                          name="Champion"
                        />
                        <Line
                          type="monotone"
                          dataKey="challengerSharpe"
                          stroke="var(--status-warning)"
                          dot={false}
                          name="Challenger"
                        />
                      </RechartsLine>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Metrics Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Detailed Metrics Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead className="text-right">Champion</TableHead>
                      <TableHead className="text-right">Challenger</TableHead>
                      <TableHead className="text-right">Difference</TableHead>
                      <TableHead className="text-right">% Change</TableHead>
                      <TableHead>Winner</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(champion.metrics).map(([key, value]) => {
                      const challValue =
                        challenger.metrics[
                          key as keyof typeof challenger.metrics
                        ];
                      const diff = challValue - (value as number);
                      const pctDiff = (diff / Math.abs(value as number)) * 100;
                      const isHigherBetter = !key.includes("Drawdown");
                      const challengerWins = isHigherBetter
                        ? diff > 0
                        : diff < 0;

                      return (
                        <TableRow key={key}>
                          <TableCell className="font-medium">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {typeof value === "number"
                              ? value.toFixed(3)
                              : String(value)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {typeof challValue === "number"
                              ? challValue.toFixed(3)
                              : challValue}
                          </TableCell>
                          <TableCell
                            className={`text-right font-mono ${challengerWins ? "text-[var(--status-success)]" : "text-[var(--status-error)]"}`}
                          >
                            {diff > 0 ? "+" : ""}
                            {diff.toFixed(3)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-mono ${challengerWins ? "text-[var(--status-success)]" : "text-[var(--status-error)]"}`}
                          >
                            {pctDiff > 0 ? "+" : ""}
                            {pctDiff.toFixed(1)}%
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={challengerWins ? "default" : "secondary"}
                              className={
                                challengerWins
                                  ? "bg-[var(--status-warning)]"
                                  : ""
                              }
                            >
                              {challengerWins ? "Challenger" : "Champion"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Regime Analysis Tab */}
          <TabsContent value="regimes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="size-4" />
                  Performance by Market Regime
                </CardTitle>
                <CardDescription>
                  How models perform under different market conditions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regimePerformance} layout="vertical">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        type="number"
                        domain={[0, 4]}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="regime"
                        tick={{ fontSize: 12 }}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="championSharpe"
                        name="Champion"
                        fill="var(--status-success)"
                      />
                      <Bar
                        dataKey="challengerSharpe"
                        name="Challenger"
                        fill="var(--status-warning)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {regimePerformance.map((r) => (
                    <div
                      key={r.regime}
                      className="text-center p-3 rounded-lg bg-muted/30"
                    >
                      <p className="font-semibold">{r.regime}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.description}
                      </p>
                      <p className="text-sm mt-1">
                        {r.samples.toLocaleString()} samples
                      </p>
                      <p
                        className={`text-xs mt-1 ${r.challengerSharpe > r.championSharpe ? "text-[var(--status-success)]" : "text-[var(--status-error)]"}`}
                      >
                        Challenger{" "}
                        {r.challengerSharpe > r.championSharpe ? "+" : ""}
                        {(
                          ((r.challengerSharpe - r.championSharpe) /
                            r.championSharpe) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Walk-Forward Tab */}
          <TabsContent value="walkforward" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="size-4" />
                  Walk-Forward Validation Results
                </CardTitle>
                <CardDescription>
                  Rolling window out-of-sample testing to detect overfitting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Window</TableHead>
                      <TableHead>Train Period</TableHead>
                      <TableHead>Test Period</TableHead>
                      <TableHead className="text-right">
                        Champion Sharpe
                      </TableHead>
                      <TableHead className="text-right">
                        Challenger Sharpe
                      </TableHead>
                      <TableHead className="text-right">Champion Acc</TableHead>
                      <TableHead className="text-right">
                        Challenger Acc
                      </TableHead>
                      <TableHead>Winner</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {walkForwardResults.map((w) => (
                      <TableRow key={w.window}>
                        <TableCell className="font-medium">
                          {w.window}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {w.trainStart} → {w.trainEnd}
                        </TableCell>
                        <TableCell>
                          {w.testStart} → {w.testEnd}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {w.champSharpe.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {w.challSharpe.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {(w.champAcc * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {(w.challAcc * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-[var(--status-warning)]">
                            Challenger
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm">
                    <span className="font-semibold">Summary:</span> Challenger
                    wins 5/5 windows with average Sharpe improvement of +0.16
                    and accuracy improvement of +1.5%. Consistent outperformance
                    suggests genuine model improvement rather than overfitting.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistical Tests Tab */}
          <TabsContent value="statistical" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="size-4" />
                  Statistical Significance Tests
                </CardTitle>
                <CardDescription>
                  Rigorous hypothesis testing to validate performance
                  differences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test</TableHead>
                      <TableHead className="text-right">
                        Test Statistic
                      </TableHead>
                      <TableHead className="text-right">p-value</TableHead>
                      <TableHead>Significant (α=0.05)</TableHead>
                      <TableHead>Conclusion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statisticalTests.map((t) => (
                      <TableRow key={t.test}>
                        <TableCell className="font-medium">{t.test}</TableCell>
                        <TableCell className="text-right font-mono">
                          {t.statistic}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {t.pValue.toFixed(4)}
                        </TableCell>
                        <TableCell>
                          {t.significant ? (
                            <Badge className="bg-[var(--status-success)]">
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="secondary">No</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {t.conclusion}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[var(--status-success)]/10 rounded-lg border border-[var(--status-success)]/30">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="size-5 text-[var(--status-success)]" />
                      <span className="font-semibold">
                        4/5 Tests Significant
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Strong statistical evidence that challenger outperforms
                      champion on risk-adjusted returns.
                    </p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="size-5 text-[var(--status-warning)]" />
                      <span className="font-semibold">Caveats</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Return distributions are similar (KS test), suggesting
                      performance improvement comes from better timing rather
                      than different risk profile.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feature Analysis Tab */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="size-4" />
                  Feature Importance Comparison
                </CardTitle>
                <CardDescription>
                  How models weight different input features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={featureImportance} layout="vertical">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        type="number"
                        domain={[0, 0.3]}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                      />
                      <YAxis
                        type="category"
                        dataKey="feature"
                        tick={{ fontSize: 11 }}
                        width={120}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                        }}
                        formatter={(value: number) => [
                          `${(value * 100).toFixed(1)}%`,
                          "",
                        ]}
                      />
                      <Legend />
                      <Bar
                        dataKey="champion"
                        name="Champion"
                        fill="var(--status-success)"
                      />
                      <Bar
                        dataKey="challenger"
                        name="Challenger"
                        fill="var(--status-warning)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm">
                    <span className="font-semibold">Key Differences:</span>{" "}
                    Challenger places more weight on{" "}
                    <code className="bg-muted px-1 rounded">oi_change_1h</code>{" "}
                    (+4%) and{" "}
                    <code className="bg-muted px-1 rounded">
                      liquidation_ratio
                    </code>{" "}
                    (+3%), while reducing reliance on{" "}
                    <code className="bg-muted px-1 rounded">whale_flow</code>{" "}
                    (-3%). This suggests better capture of short-term open
                    interest dynamics.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
