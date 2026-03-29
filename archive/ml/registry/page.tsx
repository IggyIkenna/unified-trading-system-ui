"use client";

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
import {
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
import * as React from "react";

import { ApiError } from "@/components/ui/api-error";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useMLDeployments, useModelFamilies, useModelVersions } from "@/hooks/api/use-ml-models";
import type { ModelVersion } from "@/lib/types/ml";

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
  return `${(v * 100).toFixed(1)}%`;
}

function fmtNum(v: number, decimals = 2) {
  return v.toFixed(decimals);
}

function fmtLatency(v: number) {
  return `${v.toFixed(1)}ms`;
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

  const MODEL_VERSIONS: ModelVersion[] = (versionsData as any)?.data ?? [];
  const MODEL_FAMILIES: Array<any> = (familiesData as any)?.data ?? [];
  const CHAMPION_CHALLENGER_PAIRS: Array<any> = (deploymentsData as any)?.championChallengerPairs ?? [];

  const isLoading = verLoading || famLoading || depLoading;

  const [versions, setVersions] = React.useState<ModelVersion[]>([]);

  // Sync API data into local state for mutation (deploy actions)
  React.useEffect(() => {
    if (MODEL_VERSIONS.length > 0) setVersions(MODEL_VERSIONS);
  }, [MODEL_VERSIONS.length]);
  const [familyFilter, setFamilyFilter] = React.useState("");
  const [sortField, setSortField] = React.useState<SortField>("sharpe");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [compareSet, setCompareSet] = React.useState<Set<string>>(new Set());
  const [deployDialog, setDeployDialog] = React.useState<string | null>(null);
  const [deployTarget, setDeployTarget] = React.useState<"shadow" | "live">("shadow");

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

  if (MODEL_VERSIONS.length === 0)
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
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Model Registry</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {versions.length} registered versions &middot; {versions.filter((v) => v.status === "live").length} live
            </p>
          </div>
          <Select value={familyFilter} onValueChange={(v) => setFamilyFilter(v === "__all__" ? "" : v)}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Filter by family..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Families</SelectItem>
              {MODEL_FAMILIES.map((fam) => (
                <SelectItem key={fam.id} value={fam.id}>
                  {fam.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Champion/Challenger Pairs */}
        {CHAMPION_CHALLENGER_PAIRS.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Crown className="size-5 text-amber-400" />
              Champion vs Challenger
            </h2>
            {CHAMPION_CHALLENGER_PAIRS.map((pair) => {
              const champion = versions.find((v) => v.id === pair.championId);
              const challenger = versions.find((v) => v.id === pair.challengerId);
              const family = MODEL_FAMILIES.find((f) => f.id === pair.modelFamilyId);

              if (!champion || !challenger) return null;

              return (
                <Card key={pair.id} className="border-border/50">
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{family?.name}</span>
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
                        <span className="text-xs text-muted-foreground">
                          Traffic: {pair.trafficSplit.champion}% / {pair.trafficSplit.challenger}%
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Champion */}
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
                          <div className="flex items-center gap-2">
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
                              <p className="font-mono font-medium">{fmtPct(pair.comparisonMetrics.championAccuracy)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Sharpe</span>
                              <p className="font-mono font-medium">{fmtNum(pair.comparisonMetrics.championSharpe)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Challenger */}
                        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 space-y-2">
                          <div className="flex items-center gap-2">
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
                              <p className="font-mono font-medium">{fmtNum(pair.comparisonMetrics.challengerSharpe)}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Significance: {fmtPct(pair.comparisonMetrics.significanceLevel)}</span>
                        <span>Started {new Date(pair.startedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Model Versions Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="size-4" />
              Registered Versions
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                  const family = MODEL_FAMILIES.find((f) => f.id === ver.modelFamilyId);
                  return (
                    <TableRow
                      key={ver.id}
                      className={`border-border/30 ${compareSet.has(ver.id) ? "bg-blue-500/5" : ""}`}
                    >
                      <TableCell>
                        <button onClick={() => toggleCompare(ver.id)} className="p-0.5 rounded hover:bg-muted">
                          <GitCompare
                            className={`size-3.5 ${compareSet.has(ver.id) ? "text-blue-400" : "text-muted-foreground"}`}
                          />
                        </button>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-medium text-sm">v{ver.version}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {family?.name ?? ver.modelFamilyId}
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
                      <TableCell className="font-mono text-sm">{fmtLatency(ver.metrics.inferenceLatencyP50)}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {ver.metrics.predictionCount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {ver.status !== "live" && ver.status !== "deprecated" && ver.status !== "archived" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => setDeployDialog(ver.id)}
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
          </CardContent>
        </Card>

        {/* Version Comparison */}
        {compareVersions.length >= 2 && (
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <GitCompare className="size-4 text-blue-400" />
                  Version Comparison ({compareVersions.length})
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setCompareSet(new Set())}>
                  <X className="size-3" />
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 pr-4 text-xs text-muted-foreground font-medium">Metric</th>
                      {compareVersions.map((ver) => {
                        const family = MODEL_FAMILIES.find((f) => f.id === ver.modelFamilyId);
                        return (
                          <th
                            key={ver.id}
                            className="text-right py-2 px-3 text-xs text-muted-foreground font-medium min-w-[120px]"
                          >
                            <div>
                              <span className="font-mono">v{ver.version}</span>
                              <br />
                              <span className="text-[10px]">{family?.name}</span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        {
                          key: "accuracy",
                          label: "Accuracy",
                          fmt: fmtPct,
                          lower: false,
                        },
                        {
                          key: "sharpe",
                          label: "Sharpe",
                          fmt: (v: number) => fmtNum(v),
                          lower: false,
                        },
                        {
                          key: "maxDrawdown",
                          label: "Max Drawdown",
                          fmt: fmtPct,
                          lower: true,
                        },
                        {
                          key: "directionalAccuracy",
                          label: "Dir. Accuracy",
                          fmt: fmtPct,
                          lower: false,
                        },
                        {
                          key: "calibration",
                          label: "Calibration",
                          fmt: fmtPct,
                          lower: false,
                        },
                        {
                          key: "inferenceLatencyP50",
                          label: "Latency P50",
                          fmt: fmtLatency,
                          lower: true,
                        },
                        {
                          key: "inferenceLatencyP99",
                          label: "Latency P99",
                          fmt: fmtLatency,
                          lower: true,
                        },
                        {
                          key: "predictionCount",
                          label: "Predictions",
                          fmt: (v: number) => v.toLocaleString(),
                          lower: false,
                        },
                      ] as const
                    ).map((metric) => {
                      const values = compareVersions.map(
                        (v) => v.metrics[metric.key as keyof typeof v.metrics] as number,
                      );
                      const best = metric.lower ? Math.min(...values) : Math.max(...values);

                      return (
                        <tr key={metric.key} className="border-b border-border/30">
                          <td className="py-2 pr-4 text-muted-foreground text-xs">{metric.label}</td>
                          {compareVersions.map((ver) => {
                            const val = ver.metrics[metric.key as keyof typeof ver.metrics] as number;
                            const isBest = val === best;
                            return (
                              <td
                                key={ver.id}
                                className={`text-right py-2 px-3 font-mono ${isBest ? "text-emerald-400 font-bold" : ""}`}
                              >
                                {metric.fmt(val)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
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
