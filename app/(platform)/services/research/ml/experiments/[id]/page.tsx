"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntityLink } from "@/components/trading/entity-link";
import { LossCurves } from "@/components/ml/loss-curves";
import {
  Beaker,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  GitBranch,
  Database,
  Cpu,
  BarChart3,
  TrendingUp,
  Activity,
  AlertTriangle,
  Play,
  Pause,
  Copy,
  Settings,
  FileJson,
  Layers,
} from "lucide-react";
import Link from "next/link";
import {
  useExperimentDetail,
  useModelFamilies,
  useDatasets,
  useFeatureProvenance,
  useModelVersions,
} from "@/hooks/api/use-ml-models";
import type {
  ExperimentMetrics,
  Experiment,
  ModelFamily,
  DatasetSnapshot,
  FeatureSetVersion,
  ModelVersion,
} from "@/lib/ml-types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

// Context badge component
function ContextBadge({ context }: { context: "BATCH" | "LIVE" }) {
  return (
    <Badge
      variant="outline"
      className={
        context === "LIVE"
          ? "bg-[var(--status-live)]/10 text-[var(--status-live)] border-[var(--status-live)]/30"
          : "bg-[var(--surface-ml)]/10 text-[var(--surface-ml)] border-[var(--surface-ml)]/30"
      }
    >
      {context}
    </Badge>
  );
}

// Status badge
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    running:
      "bg-[var(--status-running)]/10 text-[var(--status-running)] border-[var(--status-running)]/30",
    completed:
      "bg-[var(--status-live)]/10 text-[var(--status-live)] border-[var(--status-live)]/30",
    failed:
      "bg-[var(--status-critical)]/10 text-[var(--status-critical)] border-[var(--status-critical)]/30",
    queued: "bg-muted text-muted-foreground",
  };

  const icons: Record<string, React.ReactNode> = {
    running: <RefreshCw className="size-3 animate-spin" />,
    completed: <CheckCircle2 className="size-3" />,
    failed: <XCircle className="size-3" />,
    queued: <Clock className="size-3" />,
  };

  return (
    <Badge variant="outline" className={`gap-1 ${colors[status] || ""}`}>
      {icons[status]}
      {status}
    </Badge>
  );
}

// Generate mock validation curves data
function generateValidationCurves(): {
  epoch: number;
  accuracy: number;
  valAccuracy: number;
}[] {
  const data = [];
  for (let i = 0; i <= 100; i += 5) {
    const progress = i / 100;
    const trainAcc =
      0.5 + 0.25 * (1 - Math.exp(-3 * progress)) + (Math.random() - 0.5) * 0.02;
    const valAcc =
      0.5 + 0.22 * (1 - Math.exp(-3 * progress)) + (Math.random() - 0.5) * 0.03;
    data.push({
      epoch: i,
      accuracy: Math.min(0.95, trainAcc),
      valAccuracy: Math.min(0.92, valAcc),
    });
  }
  return data;
}

// Generate mock feature importance data
function generateFeatureImportance(): {
  feature: string;
  importance: number;
}[] {
  return [
    { feature: "price_momentum_1h", importance: 0.18 },
    { feature: "orderbook_imbalance", importance: 0.15 },
    { feature: "funding_rate", importance: 0.14 },
    { feature: "volume_zscore", importance: 0.12 },
    { feature: "volatility_regime", importance: 0.11 },
    { feature: "cross_asset_correlation", importance: 0.09 },
    { feature: "oi_change", importance: 0.08 },
    { feature: "spread_zscore", importance: 0.07 },
    { feature: "time_of_day", importance: 0.04 },
    { feature: "day_of_week", importance: 0.02 },
  ];
}

// Generate regime performance data
function generateRegimePerformance(): {
  regime: string;
  sharpe: number;
  accuracy: number;
  drawdown: number;
}[] {
  return [
    { regime: "Risk-On", sharpe: 2.45, accuracy: 74, drawdown: 6 },
    { regime: "Risk-Off", sharpe: 1.85, accuracy: 71, drawdown: 9 },
    { regime: "High-Vol", sharpe: 2.1, accuracy: 69, drawdown: 12 },
    { regime: "Low-Vol", sharpe: 2.6, accuracy: 76, drawdown: 4 },
    { regime: "Trending", sharpe: 2.8, accuracy: 78, drawdown: 5 },
    { regime: "Ranging", sharpe: 1.5, accuracy: 65, drawdown: 8 },
  ];
}

// Radar chart data for metrics
function generateRadarData(metrics: ExperimentMetrics | null) {
  if (!metrics) return [];
  return [
    { metric: "Sharpe", value: (metrics.sharpe / 3) * 100, fullMark: 100 },
    { metric: "Accuracy", value: metrics.accuracy * 100, fullMark: 100 },
    {
      metric: "Dir. Acc",
      value: metrics.directionalAccuracy * 100,
      fullMark: 100,
    },
    { metric: "Calibration", value: metrics.calibration * 100, fullMark: 100 },
    { metric: "Stability", value: metrics.stabilityScore * 100, fullMark: 100 },
    {
      metric: "1-MaxDD",
      value: (1 - metrics.maxDrawdown) * 100,
      fullMark: 100,
    },
  ];
}

export default function ExperimentDetailPage() {
  const params = useParams();
  const experimentId = params.id as string;

  const { data: experimentData, isLoading: experimentLoading } =
    useExperimentDetail(experimentId);
  const { data: familiesData, isLoading: familiesLoading } = useModelFamilies();
  const { data: datasetsData, isLoading: datasetsLoading } = useDatasets();
  const { data: featuresData, isLoading: featuresLoading } =
    useFeatureProvenance();
  const { data: versionsData, isLoading: versionsLoading } = useModelVersions();

  const experiment: Experiment | undefined =
    (experimentData as any)?.data ??
    (experimentData as any)?.experiment ??
    undefined;
  const allFamilies: ModelFamily[] =
    (familiesData as any)?.data ?? (familiesData as any)?.families ?? [];
  const allDatasets: DatasetSnapshot[] =
    (datasetsData as any)?.data ?? (datasetsData as any)?.datasets ?? [];
  const allFeatureSets: FeatureSetVersion[] =
    (featuresData as any)?.data ?? (featuresData as any)?.features ?? [];
  const allVersions: ModelVersion[] =
    (versionsData as any)?.data ?? (versionsData as any)?.versions ?? [];

  const modelFamily = experiment
    ? allFamilies.find((f) => f.id === experiment.modelFamilyId)
    : null;
  const dataset = experiment
    ? allDatasets.find((d) => d.id === experiment.datasetSnapshotId)
    : null;
  const featureSet = experiment
    ? allFeatureSets.find((f) => f.id === experiment.featureSetVersionId)
    : null;

  // Related models from same family
  const relatedModels = modelFamily
    ? allVersions.filter((m) => m.modelFamilyId === modelFamily.id)
    : [];

  const validationCurves = React.useMemo(() => generateValidationCurves(), []);
  const featureImportance = React.useMemo(
    () => generateFeatureImportance(),
    [],
  );
  const regimePerformance = React.useMemo(
    () => generateRegimePerformance(),
    [],
  );
  const radarData = React.useMemo(
    () => generateRadarData(experiment?.metrics || null),
    [experiment?.metrics],
  );

  const isLoading =
    experimentLoading ||
    familiesLoading ||
    datasetsLoading ||
    featuresLoading ||
    versionsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!experiment) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <AlertTriangle className="size-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Experiment Not Found</h2>
            <p className="text-muted-foreground mt-2">
              The experiment {experimentId} does not exist.
            </p>
            <Link href="/services/research/ml/experiments">
              <Button className="mt-4">Back to Experiments</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {experiment.name}
              </h1>
              <StatusBadge status={experiment.status} />
              <ContextBadge context="BATCH" />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-mono">{experiment.id}</span>
              <span>•</span>
              <span>Created by {experiment.createdBy}</span>
              <span>•</span>
              <span>{new Date(experiment.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {experiment.status === "running" && (
              <Button variant="outline" size="sm" className="gap-2">
                <Pause className="size-4" />
                Pause
              </Button>
            )}
            {experiment.status === "completed" && (
              <Button
                size="sm"
                className="gap-2"
                style={{ backgroundColor: "var(--surface-ml)" }}
              >
                <ArrowUpRight className="size-4" />
                Promote to Validation
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-2">
              <Copy className="size-4" />
              Clone
            </Button>
          </div>
        </div>

        {/* Progress (if running) */}
        {experiment.status === "running" && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Training Progress</span>
              <span className="text-sm text-muted-foreground">
                {experiment.progress}% complete
              </span>
            </div>
            <Progress value={experiment.progress} className="h-2" />
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>
                Started{" "}
                {experiment.startedAt
                  ? new Date(experiment.startedAt).toLocaleTimeString()
                  : "N/A"}
              </span>
              <span>Est. remaining: 2h 15m</span>
            </div>
          </Card>
        )}

        {/* Metrics Overview (if available) */}
        {experiment.metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
              <div
                className={`text-2xl font-semibold font-mono mt-1 ${experiment.metrics.sharpe >= 2.0 ? "text-[var(--status-live)]" : ""}`}
              >
                {experiment.metrics.sharpe.toFixed(2)}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Accuracy</div>
              <div className="text-2xl font-semibold font-mono mt-1">
                {(experiment.metrics.accuracy * 100).toFixed(1)}%
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">
                Directional Accuracy
              </div>
              <div className="text-2xl font-semibold font-mono mt-1">
                {(experiment.metrics.directionalAccuracy * 100).toFixed(1)}%
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Max Drawdown</div>
              <div className="text-2xl font-semibold font-mono mt-1 text-[var(--status-warning)]">
                {(experiment.metrics.maxDrawdown * 100).toFixed(1)}%
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Calibration</div>
              <div className="text-2xl font-semibold font-mono mt-1">
                {(experiment.metrics.calibration * 100).toFixed(0)}%
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">
                Stability Score
              </div>
              <div className="text-2xl font-semibold font-mono mt-1">
                {(experiment.metrics.stabilityScore * 100).toFixed(0)}%
              </div>
            </Card>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="training" className="space-y-6">
          <TabsList>
            <TabsTrigger value="training" className="gap-2">
              <TrendingUp className="size-4" />
              Training Curves
            </TabsTrigger>
            <TabsTrigger value="validation" className="gap-2">
              <BarChart3 className="size-4" />
              Validation
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2">
              <Layers className="size-4" />
              Feature Importance
            </TabsTrigger>
            <TabsTrigger value="regimes" className="gap-2">
              <Activity className="size-4" />
              Regime Analysis
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="size-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="lineage" className="gap-2">
              <GitBranch className="size-4" />
              Lineage
            </TabsTrigger>
          </TabsList>

          {/* Training Curves Tab */}
          <TabsContent value="training" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <LossCurves experimentId={experiment.id} />

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Accuracy Curves</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={validationCurves}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border)"
                          opacity={0.5}
                        />
                        <XAxis
                          dataKey="epoch"
                          tick={{
                            fill: "var(--muted-foreground)",
                            fontSize: 11,
                          }}
                        />
                        <YAxis
                          tick={{
                            fill: "var(--muted-foreground)",
                            fontSize: 11,
                          }}
                          domain={[0.4, 1]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--background)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="accuracy"
                          stroke="var(--surface-ml)"
                          strokeWidth={2}
                          dot={false}
                          name="Train Accuracy"
                        />
                        <Line
                          type="monotone"
                          dataKey="valAccuracy"
                          stroke="var(--status-warning)"
                          strokeWidth={2}
                          dot={false}
                          name="Val Accuracy"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Validation Tab */}
          <TabsContent value="validation" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Metrics Radar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="var(--border)" />
                        <PolarAngleAxis
                          dataKey="metric"
                          tick={{
                            fill: "var(--muted-foreground)",
                            fontSize: 11,
                          }}
                        />
                        <PolarRadiusAxis
                          angle={30}
                          domain={[0, 100]}
                          tick={{
                            fill: "var(--muted-foreground)",
                            fontSize: 10,
                          }}
                        />
                        <Radar
                          name="Performance"
                          dataKey="value"
                          stroke="var(--surface-ml)"
                          fill="var(--surface-ml)"
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Detailed Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  {experiment.metrics && (
                    <div className="space-y-3">
                      {Object.entries(experiment.metrics).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                          >
                            <span className="text-sm text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                            <span className="font-mono font-medium">
                              {typeof value === "number"
                                ? value < 1
                                  ? (value * 100).toFixed(1) + "%"
                                  : value.toFixed(3)
                                : value}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Feature Importance Tab */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Feature Importance (SHAP)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={featureImportance} layout="vertical">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        opacity={0.5}
                      />
                      <XAxis
                        type="number"
                        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                        domain={[0, 0.2]}
                      />
                      <YAxis
                        dataKey="feature"
                        type="category"
                        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                        width={150}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--background)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [
                          (value * 100).toFixed(1) + "%",
                          "Importance",
                        ]}
                      />
                      <Bar dataKey="importance" fill="var(--surface-ml)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Regime Analysis Tab */}
          <TabsContent value="regimes" className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Regime-Specific Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium">
                          Regime
                        </th>
                        <th className="text-right py-3 px-4 font-medium">
                          Sharpe
                        </th>
                        <th className="text-right py-3 px-4 font-medium">
                          Accuracy
                        </th>
                        <th className="text-right py-3 px-4 font-medium">
                          Max DD
                        </th>
                        <th className="text-right py-3 px-4 font-medium">
                          Sample Size
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {regimePerformance.map((regime) => (
                        <tr
                          key={regime.regime}
                          className="border-b border-border/50"
                        >
                          <td className="py-3 px-4 font-medium">
                            {regime.regime}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-mono ${regime.sharpe >= 2.0 ? "text-[var(--status-live)]" : ""}`}
                          >
                            {regime.sharpe.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            {regime.accuracy}%
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[var(--status-warning)]">
                            {regime.drawdown}%
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                            {Math.floor(Math.random() * 500 + 200)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="size-4" />
                    Hyperparameters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(experiment.hyperparameters).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                        >
                          <code className="text-sm">{key}</code>
                          <code className="font-mono font-medium">
                            {String(value)}
                          </code>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Cpu className="size-4" />
                    Training Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">
                        Epochs
                      </span>
                      <code className="font-mono">
                        {experiment.trainingConfig.epochs}
                      </code>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">
                        Batch Size
                      </span>
                      <code className="font-mono">
                        {experiment.trainingConfig.batchSize}
                      </code>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">
                        Optimizer
                      </span>
                      <code className="font-mono">
                        {experiment.trainingConfig.optimizer}
                      </code>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">
                        Loss Function
                      </span>
                      <code className="font-mono text-xs">
                        {experiment.trainingConfig.lossFunction}
                      </code>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">
                        GPU Type
                      </span>
                      <code className="font-mono">
                        {experiment.trainingConfig.gpuType} x
                        {experiment.trainingConfig.numGpus}
                      </code>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground">
                        Early Stopping
                      </span>
                      <Badge variant="outline">
                        {experiment.trainingConfig.earlyStopping
                          ? "Enabled"
                          : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Lineage Tab */}
          <TabsContent value="lineage" className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Database className="size-4" />
                    Dataset Snapshot
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dataset ? (
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Name
                        </span>
                        <p className="font-medium">{dataset.name}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">
                          ID
                        </span>
                        <code className="block text-xs font-mono">
                          {dataset.id}
                        </code>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Date Range
                        </span>
                        <p className="text-sm">
                          {dataset.dateRange.start} to {dataset.dateRange.end}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Rows
                        </span>
                        <p className="font-mono">
                          {dataset.rowCount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Dataset not found
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <GitBranch className="size-4" />
                    Feature Set
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {featureSet ? (
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Name
                        </span>
                        <p className="font-medium">
                          {featureSet.name} v{featureSet.version}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">
                          ID
                        </span>
                        <code className="block text-xs font-mono">
                          {featureSet.id}
                        </code>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Features
                        </span>
                        <p className="font-mono">
                          {featureSet.features.length}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Services
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {featureSet.services.map((s) => (
                            <Badge
                              key={s}
                              variant="outline"
                              className="text-[10px]"
                            >
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Feature set not found
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Beaker className="size-4" />
                    Model Family
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {modelFamily ? (
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Name
                        </span>
                        <p className="font-medium">{modelFamily.name}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Archetype
                        </span>
                        <Badge variant="outline">{modelFamily.archetype}</Badge>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Total Versions
                        </span>
                        <p className="font-mono">{modelFamily.totalVersions}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Linked Strategies
                        </span>
                        <p className="font-mono">
                          {modelFamily.linkedStrategies.length}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Model family not found
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Related Live Strategies */}
            {modelFamily && modelFamily.linkedStrategies.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Related Live Strategies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {modelFamily.linkedStrategies.map((strategyId) => (
                      <EntityLink
                        key={strategyId}
                        type="strategy"
                        id={strategyId}
                        label={strategyId}
                        className="text-sm"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
