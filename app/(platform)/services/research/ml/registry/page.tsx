"use client";

import { PageHeader } from "@/components/shared/page-header";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Crown,
  GitCompare,
  Layers,
  Rocket,
  Shield,
  X,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useTabParam } from "@/hooks/use-tab-param";

import { ApiError } from "@/components/shared/api-error";
import { EmptyState } from "@/components/shared/empty-state";
import { DataFreshnessStrip } from "@/components/shared/data-freshness-strip";
import type { DataSource } from "@/components/shared/data-freshness-strip";
import { ComparisonPanel, DriftPanel, BatchDetailDrawer } from "@/components/batch-workspace";
import type { ComparisonEntity, MetricDefinition } from "@/components/batch-workspace/comparison-panel";
import type { DriftMetric } from "@/components/batch-workspace/drift-panel";
import type { DetailSection } from "@/components/batch-workspace/batch-detail-drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { useMLDeployments, useModelFamilies, useModelVersions } from "@/hooks/api/use-ml-models";
import type { ModelVersion } from "@/lib/types/ml";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function versionStatusColor(status: ModelVersion["status"]) {
  switch (status) {
    case "live":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "shadow":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "validated":
      return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
    case "validating":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case "registered":
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
    case "deprecated":
      return "bg-red-500/15 text-red-400 border-red-500/30";
    case "archived":
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
    default:
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
  }
}

function fmtPct(v: number) {
  return `${formatPercent(v * 100, 1)}`;
}

function fmtNum(v: number, decimals = 2) {
  return formatNumber(v, decimals);
}

function fmtLatency(v: number) {
  return `${formatNumber(v, 1)}ms`;
}

// ---------------------------------------------------------------------------
// Shared batch-workspace metric definitions
// ---------------------------------------------------------------------------

const ML_VERSION_METRICS: MetricDefinition[] = [
  { key: "accuracy", label: "Accuracy", format: "percent", higherIsBetter: true, group: "Performance" },
  { key: "sharpe", label: "Sharpe Ratio", format: "number", higherIsBetter: true, group: "Performance" },
  { key: "directionalAccuracy", label: "Dir. Accuracy", format: "percent", higherIsBetter: true, group: "Performance" },
  { key: "calibration", label: "Calibration", format: "percent", higherIsBetter: true, group: "Performance" },
  { key: "maxDrawdown", label: "Max Drawdown", format: "percent", higherIsBetter: false, group: "Risk" },
  { key: "inferenceLatencyP50", label: "Latency P50", format: "duration", higherIsBetter: false, group: "Operational" },
  { key: "inferenceLatencyP99", label: "Latency P99", format: "duration", higherIsBetter: false, group: "Operational" },
  { key: "predictionCount", label: "Predictions", format: "number", higherIsBetter: true, group: "Operational" },
];

function versionToComparisonEntity(ver: ModelVersion, familyName: string): ComparisonEntity {
  return {
    id: ver.id,
    name: `v${ver.version}`,
    version: ver.version,
    platform: "ml",
    metrics: {
      accuracy: ver.metrics.accuracy,
      sharpe: ver.metrics.sharpe,
      directionalAccuracy: ver.metrics.directionalAccuracy,
      calibration: ver.metrics.calibration,
      maxDrawdown: ver.metrics.maxDrawdown,
      inferenceLatencyP50: ver.metrics.inferenceLatencyP50 / 1000, // ms → s for duration format
      inferenceLatencyP99: ver.metrics.inferenceLatencyP99 / 1000,
      predictionCount: ver.metrics.predictionCount,
    },
    metadata: { family: familyName, status: ver.status },
  };
}

function versionToDetailSections(ver: ModelVersion): DetailSection[] {
  return [
    {
      title: "Performance",
      items: [
        { label: "Accuracy", value: ver.metrics.accuracy, format: "percent" },
        { label: "Sharpe Ratio", value: ver.metrics.sharpe, format: "number" },
        { label: "Dir. Accuracy", value: ver.metrics.directionalAccuracy, format: "percent" },
        { label: "Calibration", value: ver.metrics.calibration, format: "percent" },
        { label: "Max Drawdown", value: ver.metrics.maxDrawdown, format: "percent" },
      ],
    },
    {
      title: "Operational",
      items: [
        { label: "Latency P50", value: `${fmtLatency(ver.metrics.inferenceLatencyP50)}`, format: "mono" },
        { label: "Latency P99", value: `${fmtLatency(ver.metrics.inferenceLatencyP99)}`, format: "mono" },
        { label: "Predictions", value: ver.metrics.predictionCount.toLocaleString(), format: "mono" },
      ],
    },
    {
      title: "Lineage",
      items: [
        { label: "Dataset", value: ver.lineage.datasetSnapshotId, format: "mono" },
        { label: "Feature Set", value: ver.lineage.featureSetVersionId, format: "mono" },
        { label: "Config Hash", value: ver.lineage.trainingConfigHash, format: "mono" },
        { label: "Code Commit", value: ver.lineage.codeCommitHash, format: "mono" },
      ],
    },
  ];
}

function championChallengerDriftMetrics(pair: {
  comparisonMetrics: {
    championAccuracy: number;
    challengerAccuracy: number;
    championSharpe: number;
    challengerSharpe: number;
  };
}): DriftMetric[] {
  return [
    {
      key: "accuracy",
      label: "Accuracy",
      baselineValue: pair.comparisonMetrics.championAccuracy,
      currentValue: pair.comparisonMetrics.challengerAccuracy,
      higherIsBetter: true,
      warningThreshold: 0.02,
      criticalThreshold: 0.05,
      format: "percent",
    },
    {
      key: "sharpe",
      label: "Sharpe Ratio",
      baselineValue: pair.comparisonMetrics.championSharpe,
      currentValue: pair.comparisonMetrics.challengerSharpe,
      higherIsBetter: true,
      warningThreshold: 0.1,
      criticalThreshold: 0.25,
      format: "number",
    },
  ];
}

type SortField = "accuracy" | "sharpe" | "maxDrawdown" | "latencyP50";

function RegistrySortIcon({
  field,
  currentField,
  dir,
}: {
  field: SortField;
  currentField: SortField;
  dir: "asc" | "desc";
}) {
  if (currentField !== field) return <ArrowUpDown className="size-3 opacity-30" />;
  return dir === "desc" ? <ChevronDown className="size-3" /> : <ChevronUp className="size-3" />;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RegistryPage() {
  const {
    data: versionsData,
    isLoading: verLoading,
    isError: verIsError,
    error: verError,
    refetch: verRefetch,
  } = useModelVersions();
  const { data: familiesData, isLoading: famLoading } = useModelFamilies();
  const { data: deploymentsData, isLoading: depLoading } = useMLDeployments();

  const modelVersionsFromApi = React.useMemo(
    () => ((versionsData as { data?: ModelVersion[] })?.data ?? []) as ModelVersion[],
    [versionsData],
  );
  const MODEL_FAMILIES: Array<any> = React.useMemo(() => (familiesData as any)?.data ?? [], [familiesData]);
  const CHAMPION_CHALLENGER_PAIRS: Array<any> = (deploymentsData as any)?.championChallengerPairs ?? [];

  const isLoading = verLoading || famLoading || depLoading;

  const [versions, setVersions] = React.useState<ModelVersion[]>([]);

  // Sync API data into local state for mutation (deploy actions)
  React.useEffect(() => {
    if (modelVersionsFromApi.length > 0) setVersions(modelVersionsFromApi);
  }, [modelVersionsFromApi]);
  const [familyFilter, setFamilyFilter] = React.useState("");
  const [sortField, setSortField] = React.useState<SortField>("sharpe");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [compareSet, setCompareSet] = React.useState<Set<string>>(new Set());
  const [deployDialog, setDeployDialog] = React.useState<string | null>(null);
  const [deployTarget, setDeployTarget] = React.useState<"shadow" | "live">("shadow");
  const [detailVersionId, setDetailVersionId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = useTabParam("registry");

  const detailVersion = detailVersionId ? versions.find((v) => v.id === detailVersionId) : null;
  const detailFamily = detailVersion
    ? MODEL_FAMILIES.find((f: { id: string }) => f.id === detailVersion.modelFamilyId)
    : null;

  const dataSources = React.useMemo<DataSource[]>(
    () => [
      { label: "Registry", source: "batch" as const, asOf: new Date().toISOString(), staleAfterSeconds: 300 },
      { label: "Deployments", source: "live" as const, asOf: new Date().toISOString(), staleAfterSeconds: 60 },
    ],
    [],
  );

  // Filter
  const filtered = versions.filter((v) => {
    if (familyFilter && v.modelFamilyId !== familyFilter) return false;
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const aM = a.metrics;
    const bM = b.metrics;
    let aV: number, bV: number;
    switch (sortField) {
      case "accuracy":
        aV = aM.accuracy;
        bV = bM.accuracy;
        break;
      case "sharpe":
        aV = aM.sharpe;
        bV = bM.sharpe;
        break;
      case "maxDrawdown":
        aV = aM.maxDrawdown;
        bV = bM.maxDrawdown;
        break;
      case "latencyP50":
        aV = aM.inferenceLatencyP50;
        bV = bM.inferenceLatencyP50;
        break;
    }
    return sortDir === "desc" ? bV - aV : aV - bV;
  });

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDir(field === "maxDrawdown" || field === "latencyP50" ? "asc" : "desc");
    }
  }

  function toggleCompare(id: string) {
    setCompareSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleDeploy() {
    if (!deployDialog) return;
    setVersions((prev) =>
      prev.map((v) => {
        if (v.id !== deployDialog) return v;
        return {
          ...v,
          status: deployTarget as ModelVersion["status"],
          approvedAt: new Date().toISOString(),
          approvedBy: "current_user",
        };
      }),
    );
    setDeployDialog(null);
  }

  const compareVersions = versions.filter((v) => compareSet.has(v.id));

  const comparisonEntities = React.useMemo(
    () =>
      compareVersions.map((v) => {
        const fam = MODEL_FAMILIES.find((f: { id: string; name: string }) => f.id === v.modelFamilyId);
        return versionToComparisonEntity(v, (fam as { name: string })?.name ?? v.modelFamilyId);
      }),
    [compareVersions, MODEL_FAMILIES],
  );

  if (isLoading)
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );

  if (verIsError)
    return (
      <div className="p-6">
        <ApiError error={verError} onRetry={() => verRefetch()} />
      </div>
    );

  if (modelVersionsFromApi.length === 0)
    return (
      <div className="p-6">
        <EmptyState
          title="No model versions"
          description="No models have been registered yet. Train and register a model to see it here."
          icon={Layers}
        />
      </div>
    );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="platform-page-width space-y-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-2">
            <Link href="/services/research/ml" className="mt-1 shrink-0">
              <Button variant="ghost" size="icon" className="size-8">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <PageHeader
              className="min-w-0 flex-1 space-y-0.5"
              title="Model Registry"
              description={`${versions.length} registered versions · ${versions.filter((v) => v.status === "live").length} live`}
            />
          </div>
          <div className="flex items-center gap-3">
            <DataFreshnessStrip sources={dataSources} />
            <Select value={familyFilter} onValueChange={(v) => setFamilyFilter(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-56 shrink-0">
                <SelectValue placeholder="Filter by family..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Families</SelectItem>
                {MODEL_FAMILIES.map((fam: { id: string; name: string }) => (
                  <SelectItem key={fam.id} value={fam.id}>
                    {fam.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Narrative summary */}
        {versions.length > 0 && (
          <div className="px-4 py-3 rounded-lg border border-border/30 bg-muted/5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground/80">Registry Status</span>:{" "}
              <span className="font-mono">{versions.length}</span> registered versions across{" "}
              <span className="font-mono">{MODEL_FAMILIES.length}</span> families.{" "}
              <span className="font-mono text-emerald-400">{versions.filter((v) => v.status === "live").length}</span>{" "}
              live,{" "}
              <span className="font-mono text-blue-400">{versions.filter((v) => v.status === "shadow").length}</span>{" "}
              shadow,{" "}
              <span className="font-mono text-amber-400">
                {versions.filter((v) => v.status === "validating").length}
              </span>{" "}
              validating.
              {CHAMPION_CHALLENGER_PAIRS.length > 0 && (
                <>
                  {" "}
                  <span className="font-mono">{CHAMPION_CHALLENGER_PAIRS.length}</span> champion/challenger evaluation
                  {CHAMPION_CHALLENGER_PAIRS.length !== 1 ? "s" : ""} active.
                </>
              )}
            </p>
          </div>
        )}

        {/* Tabs: Registry | Compare | Drift */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-8">
            <TabsTrigger value="registry" className="text-xs">
              Registry
            </TabsTrigger>
            <TabsTrigger value="compare" className="text-xs">
              Compare
              {compareSet.size >= 2 && (
                <Badge variant="secondary" className="ml-1.5 text-[9px] px-1.5 py-0">
                  {compareSet.size}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="drift" className="text-xs">
              Champion/Challenger
              {CHAMPION_CHALLENGER_PAIRS.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[9px] px-1.5 py-0">
                  {CHAMPION_CHALLENGER_PAIRS.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* --- Registry Tab --- */}
          <TabsContent value="registry" className="space-y-6 mt-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers className="size-4" />
                  Registered Versions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WidgetScroll axes="horizontal" scrollbarSize="thin">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="text-xs text-muted-foreground w-8"></TableHead>
                        <TableHead className="text-xs text-muted-foreground">Version</TableHead>
                        <TableHead className="text-xs text-muted-foreground">Family</TableHead>
                        <TableHead className="text-xs text-muted-foreground">Status</TableHead>
                        <TableHead className="text-xs text-muted-foreground">Role</TableHead>
                        <TableHead
                          className="text-xs text-muted-foreground cursor-pointer select-none"
                          onClick={() => handleSort("accuracy")}
                        >
                          <span className="flex items-center gap-1">
                            Accuracy <RegistrySortIcon field="accuracy" currentField={sortField} dir={sortDir} />
                          </span>
                        </TableHead>
                        <TableHead
                          className="text-xs text-muted-foreground cursor-pointer select-none"
                          onClick={() => handleSort("sharpe")}
                        >
                          <span className="flex items-center gap-1">
                            Sharpe <RegistrySortIcon field="sharpe" currentField={sortField} dir={sortDir} />
                          </span>
                        </TableHead>
                        <TableHead
                          className="text-xs text-muted-foreground cursor-pointer select-none"
                          onClick={() => handleSort("maxDrawdown")}
                        >
                          <span className="flex items-center gap-1">
                            Max DD <RegistrySortIcon field="maxDrawdown" currentField={sortField} dir={sortDir} />
                          </span>
                        </TableHead>
                        <TableHead
                          className="text-xs text-muted-foreground cursor-pointer select-none"
                          onClick={() => handleSort("latencyP50")}
                        >
                          <span className="flex items-center gap-1">
                            Latency P50 <RegistrySortIcon field="latencyP50" currentField={sortField} dir={sortDir} />
                          </span>
                        </TableHead>
                        <TableHead className="text-xs text-muted-foreground">Predictions</TableHead>
                        <TableHead className="text-xs text-muted-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sorted.map((ver) => {
                        const family = MODEL_FAMILIES.find(
                          (f: { id: string; name: string }) => f.id === ver.modelFamilyId,
                        );
                        return (
                          <TableRow
                            key={ver.id}
                            className={`border-border/30 cursor-pointer ${compareSet.has(ver.id) ? "bg-blue-500/5" : ""}`}
                            onClick={() => setDetailVersionId(ver.id)}
                          >
                            <TableCell>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCompare(ver.id);
                                }}
                                className="p-0.5 rounded hover:bg-muted"
                              >
                                <GitCompare
                                  className={`size-3.5 ${compareSet.has(ver.id) ? "text-blue-400" : "text-muted-foreground"}`}
                                />
                              </button>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono font-medium text-sm">v{ver.version}</span>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {(family as { name: string })?.name ?? ver.modelFamilyId}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={versionStatusColor(ver.status)}>
                                {ver.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {ver.isChampion && (
                                <Badge
                                  variant="outline"
                                  className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]"
                                >
                                  <Crown className="size-3 mr-0.5" />
                                  champion
                                </Badge>
                              )}
                              {ver.isChallenger && (
                                <Badge
                                  variant="outline"
                                  className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px]"
                                >
                                  <Shield className="size-3 mr-0.5" />
                                  challenger
                                </Badge>
                              )}
                              {!ver.isChampion && !ver.isChallenger && (
                                <span className="text-muted-foreground text-xs">--</span>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-sm">{fmtPct(ver.metrics.accuracy)}</TableCell>
                            <TableCell className="font-mono text-sm">{fmtNum(ver.metrics.sharpe)}</TableCell>
                            <TableCell className="font-mono text-sm text-red-400">
                              {fmtPct(ver.metrics.maxDrawdown)}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {fmtLatency(ver.metrics.inferenceLatencyP50)}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {ver.metrics.predictionCount.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {ver.status !== "live" && ver.status !== "deprecated" && ver.status !== "archived" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeployDialog(ver.id);
                                  }}
                                >
                                  <Rocket className="size-3" />
                                  Deploy
                                </Button>
                              )}
                              {ver.status === "live" && (
                                <span className="text-xs text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="size-3" />
                                  Deployed
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </WidgetScroll>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- Compare Tab --- */}
          <TabsContent value="compare" className="space-y-6 mt-4">
            <ComparisonPanel
              entities={comparisonEntities}
              metricDefinitions={ML_VERSION_METRICS}
              onRemove={(id) => {
                setCompareSet((prev) => {
                  const next = new Set(prev);
                  next.delete(id);
                  return next;
                });
              }}
              highlightBest
              className="border-border/50"
            />
          </TabsContent>

          {/* --- Champion/Challenger Drift Tab --- */}
          <TabsContent value="drift" className="space-y-6 mt-4">
            {CHAMPION_CHALLENGER_PAIRS.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Crown className="size-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No active champion/challenger pairs. Deploy a model as challenger to start an evaluation.
                  </p>
                </CardContent>
              </Card>
            ) : (
              CHAMPION_CHALLENGER_PAIRS.map(
                (pair: {
                  id: string;
                  modelFamilyId: string;
                  championId: string;
                  challengerId: string;
                  trafficSplit: { champion: number; challenger: number };
                  startedAt: string;
                  status: string;
                  comparisonMetrics: {
                    championAccuracy: number;
                    challengerAccuracy: number;
                    championSharpe: number;
                    challengerSharpe: number;
                    significanceLevel: number;
                  };
                }) => {
                  const champion = versions.find((v) => v.id === pair.championId);
                  const challenger = versions.find((v) => v.id === pair.challengerId);
                  const family = MODEL_FAMILIES.find((f: { id: string; name: string }) => f.id === pair.modelFamilyId);

                  if (!champion || !challenger) return null;

                  return (
                    <div key={pair.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Crown className="size-5 text-amber-400" />
                          <span className="font-semibold">{(family as { name: string })?.name}</span>
                          <Badge
                            variant="outline"
                            className={
                              pair.status === "active"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            }
                          >
                            {pair.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            Traffic: {pair.trafficSplit.champion}% / {pair.trafficSplit.challenger}%
                          </span>
                          <span>Significance: {fmtPct(pair.comparisonMetrics.significanceLevel)}</span>
                          <span>Since {new Date(pair.startedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Champion card */}
                        <Card className="border-emerald-500/20 bg-emerald-500/5">
                          <CardContent className="pt-0 pb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Crown className="size-4 text-emerald-400" />
                              <span className="font-mono text-sm font-medium">v{champion.version}</span>
                              <Badge
                                variant="outline"
                                className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]"
                              >
                                champion
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Accuracy</span>
                                <p className="font-mono font-medium">
                                  {fmtPct(pair.comparisonMetrics.championAccuracy)}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Sharpe</span>
                                <p className="font-mono font-medium">{fmtNum(pair.comparisonMetrics.championSharpe)}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Challenger card */}
                        <Card className="border-blue-500/20 bg-blue-500/5">
                          <CardContent className="pt-0 pb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Shield className="size-4 text-blue-400" />
                              <span className="font-mono text-sm font-medium">v{challenger.version}</span>
                              <Badge
                                variant="outline"
                                className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px]"
                              >
                                challenger
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Accuracy</span>
                                <p className="font-mono font-medium">
                                  {fmtPct(pair.comparisonMetrics.challengerAccuracy)}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Sharpe</span>
                                <p className="font-mono font-medium">
                                  {fmtNum(pair.comparisonMetrics.challengerSharpe)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* DriftPanel: champion baseline vs challenger current */}
                      <DriftPanel
                        title="Challenger Drift from Champion"
                        metrics={championChallengerDriftMetrics(pair)}
                        baselineLabel="Champion"
                        currentLabel="Challenger"
                        className="border-border/50"
                      />
                    </div>
                  );
                },
              )
            )}
          </TabsContent>
        </Tabs>

        {/* BatchDetailDrawer for model version inspection */}
        {detailVersion && (
          <BatchDetailDrawer
            open={detailVersionId !== null}
            onClose={() => setDetailVersionId(null)}
            entityName={`v${detailVersion.version}`}
            entityVersion={detailVersion.version}
            entityType="model_version"
            platform="ml"
            status={detailVersion.status}
            lastUpdated={detailVersion.registeredAt ? new Date(detailVersion.registeredAt).toLocaleString() : undefined}
            updatedBy={detailVersion.registeredBy}
            sections={versionToDetailSections(detailVersion)}
            onAddToBasket={() => {
              toggleCompare(detailVersion.id);
              setActiveTab("compare");
            }}
            onOpenFullPage={() => setDeployDialog(detailVersion.id)}
          >
            {/* Domain-specific: registration & approval info */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Registration</h4>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-muted-foreground">Registered</span>
                  <span className="text-xs font-mono">
                    {detailVersion.registeredAt ? new Date(detailVersion.registeredAt).toLocaleDateString() : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-muted-foreground">By</span>
                  <span className="text-xs">{detailVersion.registeredBy}</span>
                </div>
                {detailVersion.approvedAt && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-muted-foreground">Approved</span>
                    <span className="text-xs font-mono">
                      {new Date(detailVersion.approvedAt).toLocaleDateString()} by {detailVersion.approvedBy}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-muted-foreground">Family</span>
                  <span className="text-xs">
                    {(detailFamily as { name: string })?.name ?? detailVersion.modelFamilyId}
                  </span>
                </div>
                {detailVersion.isChampion && (
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]"
                  >
                    <Crown className="size-3 mr-0.5" />
                    Current Champion
                  </Badge>
                )}
                {detailVersion.isChallenger && (
                  <Badge variant="outline" className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px]">
                    <Shield className="size-3 mr-0.5" />
                    Current Challenger
                  </Badge>
                )}
              </div>
            </div>
          </BatchDetailDrawer>
        )}

        {/* Deploy Dialog */}
        <Dialog
          open={deployDialog !== null}
          onOpenChange={(open) => {
            if (!open) setDeployDialog(null);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Deploy Model</DialogTitle>
              <DialogDescription>
                {deployDialog && (
                  <>
                    Deploy{" "}
                    <span className="font-mono font-medium">
                      v{versions.find((v) => v.id === deployDialog)?.version}
                    </span>{" "}
                    to production.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-2">
                <Label>Deployment Target</Label>
                <Select value={deployTarget} onValueChange={(v) => setDeployTarget(v as "shadow" | "live")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shadow">Shadow (challenger)</SelectItem>
                    <SelectItem value="live">Live (champion)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {deployTarget === "live" && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <p className="text-xs text-amber-300">
                    Deploying to live will replace the current champion model. This action will immediately route 100%
                    of traffic to this version.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeployDialog(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleDeploy}
                className={deployTarget === "live" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
              >
                <Rocket className="size-4" />
                Deploy to {deployTarget === "live" ? "Live" : "Shadow"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
