"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Database,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Filter,
  FolderOpen,
  Layers,
  Clock,
  Cpu,
  FileCode,
  Calendar,
  Rocket,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CloudConfigBrowser } from "@/components/ops/deployment/CloudConfigBrowser";
// Infer cloud provider from path prefix (gs:// = GCP, s3:// = AWS)
function inferCloudProvider(path: string | null): "gcp" | "aws" | null {
  if (!path) return null;
  if (path.startsWith("s3://")) return "aws";
  if (path.startsWith("gs://")) return "gcp";
  return null;
}
import {
  getExecutionMissingShards,
  type ExecutionMissingShardsResponse,
} from "@/hooks/deployment/_api-stub";

interface ExecutionDataStatusProps {
  serviceName: string;
}

interface ConfigInfo {
  config_file: string;
  algo_name: string;
  result_strategy_id: string;
  has_results: boolean;
  result_dates: string[];
  // Day breakdown fields (when include_dates_list=true)
  dates_found_count?: number;
  dates_found_list?: string[];
  dates_found_list_tail?: string[];
  dates_found_truncated?: boolean;
  dates_missing_count?: number;
  dates_missing_list?: string[];
  dates_missing_list_tail?: string[];
  dates_missing_truncated?: boolean;
  completion_pct?: number;
}

interface TimeframeStatus {
  timeframe: string;
  total: number;
  with_results: number;
  completion_pct: number;
  missing_configs: Array<{ config_file: string; algo_name: string }>;
  configs: ConfigInfo[];
}

interface ModeStatus {
  mode: string;
  total: number;
  with_results: number;
  completion_pct: number;
  timeframes: TimeframeStatus[];
}

interface StrategyStatus {
  strategy: string;
  total: number;
  with_results: number;
  completion_pct: number;
  result_dates: string[];
  result_date_count: number;
  modes: ModeStatus[];
}

interface BreakdownItem {
  total: number;
  with_results: number;
  missing_count: number;
  completion_pct: number;
  missing_samples: string[];
}

interface ExecutionDataStatusResponse {
  config_path: string;
  version: string;
  total_configs: number;
  configs_with_results: number;
  missing_count: number;
  completion_pct: number;
  strategy_count: number;
  strategies: StrategyStatus[];
  breakdown_by_mode: Record<string, BreakdownItem>;
  breakdown_by_timeframe: Record<string, BreakdownItem>;
  breakdown_by_algo: Record<string, BreakdownItem>;
  date_filter?: {
    start: string | null;
    end: string | null;
  };
  error?: string;
}

type ViewMode = "hierarchy" | "by_mode" | "by_timeframe" | "by_algo";

export function ExecutionDataStatus({ serviceName }: ExecutionDataStatusProps) {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  });

  const [cloudConfigPath, setCloudConfigPath] = useState<string | null>(null);
  const [_discoveredConfigCount, setDiscoveredConfigCount] = useState<
    number | null
  >(null);
  const [data, setData] = useState<ExecutionDataStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("hierarchy");

  // Expansion state for hierarchy view
  const [expandedStrategies, setExpandedStrategies] = useState<Set<string>>(
    new Set(),
  );
  const [expandedModes, setExpandedModes] = useState<Set<string>>(new Set());
  const [expandedTimeframes, setExpandedTimeframes] = useState<Set<string>>(
    new Set(),
  );
  const [expandedBreakdowns, setExpandedBreakdowns] = useState<Set<string>>(
    new Set(),
  );
  const [expandedConfigs, setExpandedConfigs] = useState<Set<string>>(
    new Set(),
  );

  // Deploy Missing state
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [missingShardsData, setMissingShardsData] =
    useState<ExecutionMissingShardsResponse | null>(null);
  const [loadingMissingShards, setLoadingMissingShards] = useState(false);
  const [deployingMissing, setDeployingMissing] = useState(false);

  // Region validation (backend storage region for cross-region egress warning)
  const [deployRegion, setDeployRegion] = useState<string>("asia-northeast1");
  const [backendRegion, setBackendRegion] = useState<string>("asia-northeast1");
  const [showDeployRegionWarning, setShowDeployRegionWarning] = useState(false);

  useEffect(() => {
    fetch("/api/config/region")
      .then((r) => r.json())
      .then((data) => {
        const region =
          data.storage_region ?? data.gcs_region ?? "asia-northeast1";
        setBackendRegion(region);
        setDeployRegion(region);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setShowDeployRegionWarning(deployRegion !== backendRegion);
  }, [deployRegion, backendRegion]);

  const handleCloudConfigSelected = useCallback(
    (path: string, configCount: number) => {
      setCloudConfigPath(path);
      setDiscoveredConfigCount(configCount);
    },
    [],
  );

  const fetchData = useCallback(async () => {
    if (!cloudConfigPath) {
      setError("Please select a config path first");
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(
        `/api/service-status/execution-services/data-status?` +
          `config_path=${encodeURIComponent(cloudConfigPath)}` +
          `&start_date=${startDate}` +
          `&end_date=${endDate}` +
          `&include_dates_list=true`,
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ExecutionDataStatusResponse = await response.json();

      if (result.error) {
        setError(result.error);
      } else {
        setData(result);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch data status",
      );
    } finally {
      setLoading(false);
    }
  }, [cloudConfigPath, startDate, endDate]);

  // Clear data when config path changes
  useEffect(() => {
    setData(null);
    setError(null);
  }, [cloudConfigPath]);

  const fetchMissingShards = useCallback(async () => {
    if (!cloudConfigPath) return;

    setLoadingMissingShards(true);
    try {
      const result = await getExecutionMissingShards({
        config_path: cloudConfigPath,
        start_date: startDate,
        end_date: endDate,
      });
      setMissingShardsData(result);
      setShowDeployModal(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch missing shards",
      );
    } finally {
      setLoadingMissingShards(false);
    }
  }, [cloudConfigPath, startDate, endDate]);

  const handleDeployMissing = useCallback(async () => {
    if (!missingShardsData || missingShardsData.total_missing === 0) return;

    setDeployingMissing(true);
    try {
      // Create deployment request for the missing shards
      // This calls the existing deployment API with the missing shards
      const response = await fetch("/api/deployments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: "execution-services",
          compute: "cloud_run",
          region: deployRegion,
          start_date: startDate,
          end_date: endDate,
          // Pass config paths and dates for the missing shards
          custom_shards: missingShardsData.missing_shards.map((s) => {
            const path = s.config_path ?? s.config_gcs ?? "";
            const isS3 = path.startsWith("s3://");
            return {
              ...(isS3 ? { config_path: path } : { config_gcs: path }),
              start_date: s.date,
              end_date: s.date,
            };
          }),
        }),
      });

      if (!response.ok) {
        throw new Error(`Deployment failed: ${response.statusText}`);
      }

      const result = await response.json();
      // Close modal and show success
      setShowDeployModal(false);
      setMissingShardsData(null);
      // Optionally navigate to deployment or show success message
      alert(`Deployment created: ${result.deployment_id || "Success"}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deployment failed");
    } finally {
      setDeployingMissing(false);
    }
  }, [missingShardsData, startDate, endDate, deployRegion]);

  const toggleStrategy = (key: string) => {
    setExpandedStrategies((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleMode = (key: string) => {
    setExpandedModes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleTimeframe = (key: string) => {
    setExpandedTimeframes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleBreakdown = (key: string) => {
    setExpandedBreakdowns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleConfig = (key: string) => {
    setExpandedConfigs((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Helper to render truncated dates list
  const renderDatesList = (
    dates: string[] | undefined,
    tailDates: string[] | undefined,
    truncated: boolean | undefined,
    totalCount: number | undefined,
    colorClass: string,
    label: string,
  ) => {
    if (!dates || dates.length === 0) return null;

    const allDates =
      truncated && tailDates ? [...dates, "...", ...tailDates] : dates;

    return (
      <div className="mt-2">
        <p className={`text-xs font-medium ${colorClass} mb-1`}>
          {label} ({totalCount ?? dates.length}):
        </p>
        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
          {allDates.map((date, i) => (
            <span
              key={i}
              className={cn(
                "text-[10px] font-mono px-1.5 py-0.5 rounded",
                date === "..."
                  ? "text-[var(--color-text-muted)]"
                  : colorClass.includes("green")
                    ? "status-success"
                    : "status-error",
              )}
            >
              {date}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const getCompletionColor = (percent: number) => {
    if (percent >= 100) return "var(--color-accent-green)";
    if (percent >= 80) return "var(--color-accent-cyan)";
    if (percent >= 50) return "var(--color-accent-amber)";
    return "var(--color-accent-red)";
  };

  const getCompletionBadgeClass = (percent: number) => {
    if (percent >= 100) return "status-success";
    if (percent >= 80) return "status-running";
    if (percent >= 50) return "status-warning";
    return "status-error";
  };

  // Render breakdown view (by mode, timeframe, or algo)
  const renderBreakdownView = (
    breakdown: Record<string, BreakdownItem>,
    label: string,
    icon: React.ReactNode,
  ) => (
    <div className="space-y-2">
      {Object.entries(breakdown).map(([name, item]) => {
        const key = `${label}-${name}`;
        const isExpanded = expandedBreakdowns.has(key);
        const isComplete = item.completion_pct >= 100;

        return (
          <div
            key={name}
            className="border border-[var(--color-border-subtle)] rounded-lg overflow-hidden"
          >
            <Button
              variant="ghost"
              onClick={() => toggleBreakdown(key)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--color-bg-secondary)] transition-colors h-auto"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                )}
                {icon}
                <span className="font-medium font-mono">{name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--color-text-muted)]">
                  {item.with_results} / {item.total}
                </span>
                {!isComplete && item.missing_count > 0 && (
                  <Badge variant="outline" className="status-error">
                    {item.missing_count} missing
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={getCompletionBadgeClass(item.completion_pct)}
                >
                  {item.completion_pct.toFixed(0)}%
                </Badge>
                <div className="w-20 h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${item.completion_pct}%`,
                      backgroundColor: getCompletionColor(item.completion_pct),
                    }}
                  />
                </div>
              </div>
            </Button>

            {isExpanded && item.missing_samples.length > 0 && (
              <div className="bg-[var(--color-bg-secondary)] px-4 py-3">
                <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
                  Missing configs (sample of {Math.min(5, item.missing_count)}):
                </p>
                <div className="space-y-1">
                  {item.missing_samples.map((path, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs font-mono bg-[var(--color-bg-tertiary)] px-2 py-1 rounded"
                    >
                      <XCircle className="h-3 w-3 text-[var(--color-accent-red)] shrink-0" />
                      <span className="truncate" title={path}>
                        {path}
                      </span>
                    </div>
                  ))}
                  {item.missing_count > 5 && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-2">
                      ... and {item.missing_count - 5} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {isExpanded && item.missing_samples.length === 0 && (
              <div className="bg-[var(--color-bg-secondary)] px-4 py-6 text-center">
                <CheckCircle2 className="h-6 w-6 text-[var(--color-accent-green)] mx-auto mb-2" />
                <p className="text-sm text-[var(--color-text-muted)]">
                  All configs have results
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Config Path Selection */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-[var(--color-text-muted)]" />
            <CardTitle className="text-base">Config Path</CardTitle>
            {cloudConfigPath && inferCloudProvider(cloudConfigPath) && (
              <Badge variant="outline" className="text-[10px]">
                {inferCloudProvider(cloudConfigPath) === "gcp" ? "GCP" : "AWS"}
              </Badge>
            )}
          </div>
          <CardDescription>
            Select the cloud config directory (GCS or S3) to check for results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CloudConfigBrowser
            serviceName={serviceName}
            onPathSelected={handleCloudConfigSelected}
          />
        </CardContent>
      </Card>

      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[var(--color-text-muted)]" />
              <CardTitle className="text-base">
                Date Range Filter (Optional)
              </CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading || !cloudConfigPath}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Check Status
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">
                Start Date (filter results)
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">
                End Date (filter results)
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
            Filter which result dates to check. Leave as-is to check all
            available dates.
          </p>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent-cyan)]" />
              <p className="text-sm text-[var(--color-text-muted)]">
                Checking execution results against configs...
              </p>
              <div className="flex items-center gap-2">
                {cloudConfigPath && inferCloudProvider(cloudConfigPath) && (
                  <Badge variant="outline" className="text-[10px]">
                    {inferCloudProvider(cloudConfigPath) === "gcp"
                      ? "GCP"
                      : "AWS"}
                  </Badge>
                )}
                <p className="text-xs text-[var(--color-text-muted)] font-mono">
                  {cloudConfigPath}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-3 text-[var(--color-accent-red)]">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {data && !loading && (
        <>
          {/* Summary Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl font-mono flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Execution Results Status
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {data.version} • {data.strategy_count} strategies •{" "}
                    {data.total_configs} configs
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div
                    className="text-3xl font-mono font-bold"
                    style={{ color: getCompletionColor(data.completion_pct) }}
                  >
                    {data.completion_pct.toFixed(1)}%
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {data.configs_with_results} / {data.total_configs} configs
                    have results
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Progress bar */}
              <div className="h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${data.completion_pct}%`,
                    backgroundColor: getCompletionColor(data.completion_pct),
                  }}
                />
              </div>

              {/* Status message */}
              {data.completion_pct >= 100 ? (
                <div className="mt-4 flex items-center justify-center p-3 rounded-lg bg-[var(--color-status-success-bg)] border border-[var(--color-status-success-border)]">
                  <CheckCircle2 className="h-4 w-4 text-[var(--color-accent-green)] mr-2" />
                  <span className="text-sm text-[var(--color-accent-green)]">
                    All configs have execution results
                  </span>
                </div>
              ) : (
                <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-[var(--color-status-error-bg)] border border-[var(--color-status-error-border)]">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-[var(--color-accent-red)]" />
                    <span className="text-sm">
                      <strong>{data.missing_count}</strong> configs missing
                      results
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchMissingShards}
                    disabled={loadingMissingShards}
                    className="border-[var(--color-accent-red)] text-[var(--color-accent-red)] hover:bg-[var(--color-status-error-bg)]"
                  >
                    {loadingMissingShards ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Rocket className="h-4 w-4 mr-2" />
                    )}
                    Deploy Missing
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--color-text-muted)]">
              Drill down by attribute to diagnose patterns in missing results
            </p>
            <div className="flex items-center bg-[var(--color-bg-tertiary)] rounded-lg p-1">
              {[
                {
                  id: "hierarchy",
                  label: "Hierarchy",
                  icon: <Layers className="h-3.5 w-3.5" />,
                },
                {
                  id: "by_mode",
                  label: "Mode",
                  icon: <FileCode className="h-3.5 w-3.5" />,
                },
                {
                  id: "by_timeframe",
                  label: "Timeframe",
                  icon: <Clock className="h-3.5 w-3.5" />,
                },
                {
                  id: "by_algo",
                  label: "Algorithm",
                  icon: <Cpu className="h-3.5 w-3.5" />,
                },
              ].map(({ id, label, icon }) => (
                <Button
                  key={id}
                  variant={viewMode === id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode(id as ViewMode)}
                  className="flex items-center gap-1.5 text-xs font-medium"
                >
                  {icon}
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Breakdown Views */}
          {viewMode === "by_mode" && data.breakdown_by_mode && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  Breakdown by Mode
                </CardTitle>
                <CardDescription>
                  Compare SCE vs HUF or other execution modes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderBreakdownView(
                  data.breakdown_by_mode,
                  "mode",
                  <FileCode className="h-4 w-4 text-[var(--color-accent-purple)]" />,
                )}
              </CardContent>
            </Card>
          )}

          {viewMode === "by_timeframe" && data.breakdown_by_timeframe && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Breakdown by Timeframe
                </CardTitle>
                <CardDescription>Compare 5M vs 15M vs 1H etc.</CardDescription>
              </CardHeader>
              <CardContent>
                {renderBreakdownView(
                  data.breakdown_by_timeframe,
                  "timeframe",
                  <Clock className="h-4 w-4 text-[var(--color-accent-cyan)]" />,
                )}
              </CardContent>
            </Card>
          )}

          {viewMode === "by_algo" && data.breakdown_by_algo && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  Breakdown by Algorithm
                </CardTitle>
                <CardDescription>
                  Compare TWAP vs VWAP vs Iceberg etc. - identify algo-specific
                  issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderBreakdownView(
                  data.breakdown_by_algo,
                  "algo",
                  <Cpu className="h-4 w-4 text-[var(--color-accent-amber)]" />,
                )}
              </CardContent>
            </Card>
          )}

          {/* Hierarchy View (Strategy -> Mode -> Timeframe -> Configs) */}
          {viewMode === "hierarchy" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Strategy Hierarchy
                </CardTitle>
                <CardDescription>
                  Drill down: Strategy → Mode → Timeframe → Config files
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-[var(--color-border-subtle)]">
                  {data.strategies.map((strategy) => {
                    const strategyKey = strategy.strategy;
                    const isStrategyExpanded =
                      expandedStrategies.has(strategyKey);
                    const isComplete = strategy.completion_pct >= 100;

                    return (
                      <div key={strategyKey}>
                        {/* Strategy Row */}
                        <Button
                          variant="ghost"
                          onClick={() => toggleStrategy(strategyKey)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--color-bg-secondary)] transition-colors h-auto"
                        >
                          <div className="flex items-center gap-3">
                            {isStrategyExpanded ? (
                              <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                            )}
                            <Database className="h-4 w-4 text-[var(--color-accent-purple)]" />
                            <span className="font-medium font-mono text-sm">
                              {strategy.strategy}
                            </span>
                            <span className="text-xs text-[var(--color-text-muted)]">
                              ({strategy.modes.length} modes, {strategy.total}{" "}
                              configs)
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {!isComplete && (
                              <Badge variant="outline" className="status-error">
                                {strategy.total - strategy.with_results} missing
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={getCompletionBadgeClass(
                                strategy.completion_pct,
                              )}
                            >
                              {strategy.completion_pct.toFixed(0)}%
                            </Badge>
                            <div className="w-20 h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                              <div
                                className="h-full transition-all"
                                style={{
                                  width: `${strategy.completion_pct}%`,
                                  backgroundColor: getCompletionColor(
                                    strategy.completion_pct,
                                  ),
                                }}
                              />
                            </div>
                          </div>
                        </Button>

                        {/* Modes */}
                        {isStrategyExpanded && (
                          <div className="bg-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-subtle)]">
                            {strategy.modes.map((mode) => {
                              const modeKey = `${strategyKey}/${mode.mode}`;
                              const isModeExpanded = expandedModes.has(modeKey);
                              // isModeComplete is retained for future visual distinction
                              void (mode.completion_pct >= 100);

                              return (
                                <div key={modeKey}>
                                  <Button
                                    variant="ghost"
                                    onClick={() => toggleMode(modeKey)}
                                    className="w-full px-6 py-2 flex items-center justify-between hover:bg-[var(--color-bg-tertiary)] transition-colors h-auto"
                                  >
                                    <div className="flex items-center gap-3">
                                      {isModeExpanded ? (
                                        <ChevronDown className="h-3 w-3 text-[var(--color-text-muted)]" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3 text-[var(--color-text-muted)]" />
                                      )}
                                      <FileCode className="h-3 w-3 text-[var(--color-accent-cyan)]" />
                                      <span className="font-mono text-sm">
                                        {mode.mode}
                                      </span>
                                      <span className="text-xs text-[var(--color-text-muted)]">
                                        ({mode.timeframes.length} timeframes)
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-[var(--color-text-muted)]">
                                        {mode.with_results}/{mode.total}
                                      </span>
                                      <span
                                        className="text-xs font-mono"
                                        style={{
                                          color: getCompletionColor(
                                            mode.completion_pct,
                                          ),
                                        }}
                                      >
                                        {mode.completion_pct.toFixed(0)}%
                                      </span>
                                    </div>
                                  </Button>

                                  {/* Timeframes */}
                                  {isModeExpanded && (
                                    <div className="bg-[var(--color-bg-tertiary)] divide-y divide-[var(--color-border-subtle)]">
                                      {mode.timeframes.map((tf) => {
                                        const tfKey = `${modeKey}/${tf.timeframe}`;
                                        const isTfExpanded =
                                          expandedTimeframes.has(tfKey);
                                        const isTfComplete =
                                          tf.completion_pct >= 100;

                                        return (
                                          <div key={tfKey}>
                                            <Button
                                              variant="ghost"
                                              onClick={() =>
                                                toggleTimeframe(tfKey)
                                              }
                                              className="w-full px-8 py-2 flex items-center justify-between hover:bg-[var(--color-bg-primary)] transition-colors h-auto"
                                            >
                                              <div className="flex items-center gap-3">
                                                {isTfExpanded ? (
                                                  <ChevronDown className="h-3 w-3 text-[var(--color-text-muted)]" />
                                                ) : (
                                                  <ChevronRight className="h-3 w-3 text-[var(--color-text-muted)]" />
                                                )}
                                                <Clock className="h-3 w-3 text-[var(--color-accent-amber)]" />
                                                <span className="font-mono text-sm">
                                                  {tf.timeframe}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                {!isTfComplete &&
                                                  tf.missing_configs.length >
                                                    0 && (
                                                    <Badge
                                                      variant="outline"
                                                      className="text-[10px] bg-[var(--color-status-error-bg)] text-[var(--color-accent-red)] border-[var(--color-status-error-border-strong)]"
                                                    >
                                                      {
                                                        tf.missing_configs
                                                          .length
                                                      }{" "}
                                                      missing
                                                    </Badge>
                                                  )}
                                                <span className="text-xs text-[var(--color-text-muted)]">
                                                  {tf.with_results}/{tf.total}
                                                </span>
                                                {isTfComplete ? (
                                                  <CheckCircle2 className="h-3 w-3 text-[var(--color-accent-green)]" />
                                                ) : (
                                                  <span
                                                    className="text-xs font-mono"
                                                    style={{
                                                      color: getCompletionColor(
                                                        tf.completion_pct,
                                                      ),
                                                    }}
                                                  >
                                                    {tf.completion_pct.toFixed(
                                                      0,
                                                    )}
                                                    %
                                                  </span>
                                                )}
                                              </div>
                                            </Button>

                                            {/* Config Files */}
                                            {isTfExpanded && (
                                              <div className="bg-[var(--color-bg-primary)] px-10 py-3 space-y-2">
                                                {tf.missing_configs.length >
                                                  0 && (
                                                  <>
                                                    <p className="text-xs font-medium text-[var(--color-accent-red)] mb-2">
                                                      Missing configs (
                                                      {
                                                        tf.missing_configs
                                                          .length
                                                      }
                                                      ):
                                                    </p>
                                                    {tf.missing_configs.map(
                                                      (cfg, i) => {
                                                        // Find full config info to get day breakdown
                                                        const fullConfig =
                                                          tf.configs.find(
                                                            (c) =>
                                                              c.config_file ===
                                                              cfg.config_file,
                                                          );
                                                        const configKey = `${tfKey}/missing/${cfg.config_file}`;
                                                        const isConfigExpanded =
                                                          expandedConfigs.has(
                                                            configKey,
                                                          );
                                                        const hasDayBreakdown =
                                                          fullConfig &&
                                                          (fullConfig.dates_found_count !==
                                                            undefined ||
                                                            fullConfig.dates_missing_count !==
                                                              undefined);

                                                        return (
                                                          <div
                                                            key={i}
                                                            className="border border-[var(--color-status-error-border)] rounded overflow-hidden"
                                                          >
                                                            <Button
                                                              variant="ghost"
                                                              onClick={() =>
                                                                hasDayBreakdown &&
                                                                toggleConfig(
                                                                  configKey,
                                                                )
                                                              }
                                                              className={cn(
                                                                "w-full flex items-center gap-2 text-xs font-mono bg-[var(--color-status-error-bg-subtle)] px-2 py-1.5 h-auto",
                                                                hasDayBreakdown &&
                                                                  "hover:bg-[var(--color-status-error-bg)]",
                                                              )}
                                                            >
                                                              {hasDayBreakdown &&
                                                                (isConfigExpanded ? (
                                                                  <ChevronDown className="h-3 w-3 text-[var(--color-text-muted)] shrink-0" />
                                                                ) : (
                                                                  <ChevronRight className="h-3 w-3 text-[var(--color-text-muted)] shrink-0" />
                                                                ))}
                                                              <XCircle className="h-3 w-3 text-[var(--color-accent-red)] shrink-0" />
                                                              <span className="text-[var(--color-accent-amber)] font-medium shrink-0">
                                                                {cfg.algo_name}
                                                              </span>
                                                              <span
                                                                className="truncate text-[var(--color-text-muted)]"
                                                                title={
                                                                  cfg.config_file
                                                                }
                                                              >
                                                                {
                                                                  cfg.config_file
                                                                }
                                                              </span>
                                                              {fullConfig?.dates_missing_count !==
                                                                undefined && (
                                                                <span className="text-[10px] text-[var(--color-accent-red)] ml-auto shrink-0 flex items-center gap-1">
                                                                  <Calendar className="h-3 w-3" />
                                                                  {
                                                                    fullConfig.dates_missing_count
                                                                  }{" "}
                                                                  days missing
                                                                </span>
                                                              )}
                                                            </Button>

                                                            {/* Day breakdown dropdown */}
                                                            {isConfigExpanded &&
                                                              hasDayBreakdown &&
                                                              fullConfig && (
                                                                <div className="bg-[var(--color-bg-secondary)] px-3 py-2 border-t border-[var(--color-status-error-border)]">
                                                                  {renderDatesList(
                                                                    fullConfig.dates_found_list,
                                                                    fullConfig.dates_found_list_tail,
                                                                    fullConfig.dates_found_truncated,
                                                                    fullConfig.dates_found_count,
                                                                    "text-[var(--color-accent-green)]",
                                                                    "Available Days",
                                                                  )}
                                                                  {renderDatesList(
                                                                    fullConfig.dates_missing_list,
                                                                    fullConfig.dates_missing_list_tail,
                                                                    fullConfig.dates_missing_truncated,
                                                                    fullConfig.dates_missing_count,
                                                                    "text-[var(--color-accent-red)]",
                                                                    "Missing Days",
                                                                  )}
                                                                </div>
                                                              )}
                                                          </div>
                                                        );
                                                      },
                                                    )}
                                                  </>
                                                )}

                                                {tf.configs.filter(
                                                  (c) => c.has_results,
                                                ).length > 0 && (
                                                  <>
                                                    <p className="text-xs font-medium text-[var(--color-accent-green)] mt-3 mb-2">
                                                      Completed (
                                                      {
                                                        tf.configs.filter(
                                                          (c) => c.has_results,
                                                        ).length
                                                      }
                                                      ):
                                                    </p>
                                                    {tf.configs
                                                      .filter(
                                                        (c) => c.has_results,
                                                      )
                                                      .map((cfg, i) => {
                                                        const configKey = `${tfKey}/${cfg.config_file}`;
                                                        const isConfigExpanded =
                                                          expandedConfigs.has(
                                                            configKey,
                                                          );
                                                        const hasDayBreakdown =
                                                          cfg.dates_found_count !==
                                                            undefined ||
                                                          cfg.dates_missing_count !==
                                                            undefined;

                                                        return (
                                                          <div
                                                            key={i}
                                                            className="border border-[var(--color-status-success-border)] rounded overflow-hidden"
                                                          >
                                                            <Button
                                                              variant="ghost"
                                                              onClick={() =>
                                                                hasDayBreakdown &&
                                                                toggleConfig(
                                                                  configKey,
                                                                )
                                                              }
                                                              className={cn(
                                                                "w-full flex items-center gap-2 text-xs font-mono bg-[var(--color-status-success-bg-subtle)] px-2 py-1.5 h-auto",
                                                                hasDayBreakdown &&
                                                                  "hover:bg-[var(--color-status-success-bg)]",
                                                              )}
                                                            >
                                                              {hasDayBreakdown &&
                                                                (isConfigExpanded ? (
                                                                  <ChevronDown className="h-3 w-3 text-[var(--color-text-muted)] shrink-0" />
                                                                ) : (
                                                                  <ChevronRight className="h-3 w-3 text-[var(--color-text-muted)] shrink-0" />
                                                                ))}
                                                              <CheckCircle2 className="h-3 w-3 text-[var(--color-accent-green)] shrink-0" />
                                                              <span className="text-[var(--color-accent-cyan)] font-medium shrink-0">
                                                                {cfg.algo_name}
                                                              </span>
                                                              <span
                                                                className="truncate text-[var(--color-text-muted)]"
                                                                title={
                                                                  cfg.config_file
                                                                }
                                                              >
                                                                {
                                                                  cfg.config_file
                                                                }
                                                              </span>
                                                              <span className="text-[10px] text-[var(--color-text-muted)] ml-auto shrink-0 flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {cfg.dates_found_count ??
                                                                  cfg
                                                                    .result_dates
                                                                    .length}
                                                                /
                                                                {(cfg.dates_found_count ??
                                                                  0) +
                                                                  (cfg.dates_missing_count ??
                                                                    0) ||
                                                                  cfg
                                                                    .result_dates
                                                                    .length}{" "}
                                                                days
                                                                {cfg.completion_pct !==
                                                                  undefined && (
                                                                  <span
                                                                    className={
                                                                      cfg.completion_pct >=
                                                                      100
                                                                        ? "text-[var(--color-accent-green)]"
                                                                        : "text-[var(--color-accent-amber)]"
                                                                    }
                                                                  >
                                                                    (
                                                                    {
                                                                      cfg.completion_pct
                                                                    }
                                                                    %)
                                                                  </span>
                                                                )}
                                                              </span>
                                                            </Button>

                                                            {/* Day breakdown dropdown */}
                                                            {isConfigExpanded &&
                                                              hasDayBreakdown && (
                                                                <div className="bg-[var(--color-bg-secondary)] px-3 py-2 border-t border-[var(--color-status-success-border)]">
                                                                  {renderDatesList(
                                                                    cfg.dates_found_list,
                                                                    cfg.dates_found_list_tail,
                                                                    cfg.dates_found_truncated,
                                                                    cfg.dates_found_count,
                                                                    "text-[var(--color-accent-green)]",
                                                                    "Available Days",
                                                                  )}
                                                                  {renderDatesList(
                                                                    cfg.dates_missing_list,
                                                                    cfg.dates_missing_list_tail,
                                                                    cfg.dates_missing_truncated,
                                                                    cfg.dates_missing_count,
                                                                    "text-[var(--color-accent-red)]",
                                                                    "Missing Days",
                                                                  )}
                                                                </div>
                                                              )}
                                                          </div>
                                                        );
                                                      })}
                                                  </>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* No config path selected */}
      {!cloudConfigPath && !loading && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-3 text-[var(--color-text-muted)]">
              <FolderOpen className="h-8 w-8" />
              <p className="text-sm">
                Select a config path above to check execution results
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deploy Missing Modal */}
      {showDeployModal && missingShardsData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-[var(--color-accent-cyan)]" />
                    Deploy Missing Shards
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {missingShardsData.total_missing} missing config×date
                    combinations
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDeployModal(false);
                    setMissingShardsData(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[var(--color-bg-secondary)] p-3 rounded-lg">
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Total Configs
                  </p>
                  <p className="text-lg font-mono font-bold">
                    {missingShardsData.total_configs}
                  </p>
                </div>
                <div className="bg-[var(--color-bg-secondary)] p-3 rounded-lg">
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Total Dates
                  </p>
                  <p className="text-lg font-mono font-bold">
                    {missingShardsData.total_dates}
                  </p>
                </div>
                <div className="bg-[var(--color-status-error-bg)] p-3 rounded-lg border border-[var(--color-status-error-border)]">
                  <p className="text-xs text-[var(--color-accent-red)]">
                    Missing Shards
                  </p>
                  <p className="text-lg font-mono font-bold text-[var(--color-accent-red)]">
                    {missingShardsData.total_missing}
                  </p>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-3">
                <p className="text-sm font-medium">Breakdown</p>

                {/* By Strategy */}
                {Object.keys(missingShardsData.breakdown?.by_strategy ?? {})
                  .length > 0 && (
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] mb-1">
                      By Strategy:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(
                        missingShardsData.breakdown?.by_strategy ?? {},
                      ).map(([name, count]) => (
                        <Badge key={name} variant="outline" className="text-xs">
                          {name}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* By Mode */}
                {Object.keys(missingShardsData.breakdown?.by_mode ?? {})
                  .length > 0 && (
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] mb-1">
                      By Mode:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(
                        missingShardsData.breakdown?.by_mode ?? {},
                      ).map(([name, count]) => (
                        <Badge key={name} variant="outline" className="text-xs">
                          {name}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* By Timeframe */}
                {Object.keys(missingShardsData.breakdown?.by_timeframe ?? {})
                  .length > 0 && (
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] mb-1">
                      By Timeframe:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(
                        missingShardsData.breakdown?.by_timeframe ?? {},
                      ).map(([name, count]) => (
                        <Badge key={name} variant="outline" className="text-xs">
                          {name}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* By Algorithm */}
                {Object.keys(missingShardsData.breakdown?.by_algo ?? {})
                  .length > 0 && (
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] mb-1">
                      By Algorithm:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(
                        missingShardsData.breakdown?.by_algo ?? {},
                      ).map(([name, count]) => (
                        <Badge key={name} variant="outline" className="text-xs">
                          {name}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* By Date (show first 10) */}
                {Object.keys(missingShardsData.breakdown?.by_date ?? {})
                  .length > 0 && (
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] mb-1">
                      By Date (
                      {
                        Object.keys(missingShardsData.breakdown?.by_date ?? {})
                          .length
                      }{" "}
                      dates):
                    </p>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {Object.entries(
                        missingShardsData.breakdown?.by_date ?? {},
                      )
                        .slice(0, 10)
                        .map(([date, count]) => (
                          <Badge
                            key={date}
                            variant="outline"
                            className="text-xs font-mono"
                          >
                            {date}: {count}
                          </Badge>
                        ))}
                      {Object.keys(missingShardsData.breakdown?.by_date ?? {})
                        .length > 10 && (
                        <Badge variant="outline" className="text-xs">
                          +
                          {Object.keys(
                            missingShardsData.breakdown?.by_date ?? {},
                          ).length - 10}{" "}
                          more dates
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Region (with cross-region egress warning) */}
              <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)] space-y-2">
                <Label className="flex items-center gap-2">Region</Label>
                <Select value={deployRegion} onValueChange={setDeployRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region..." />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      {
                        value: "asia-northeast1",
                        label: "asia-northeast1 (Tokyo)",
                      },
                      {
                        value: "asia-northeast2",
                        label: "asia-northeast2 (Osaka)",
                      },
                      {
                        value: "asia-southeast1",
                        label: "asia-southeast1 (Singapore)",
                      },
                      { value: "us-central1", label: "us-central1 (Iowa)" },
                      { value: "us-east1", label: "us-east1 (South Carolina)" },
                      { value: "us-west1", label: "us-west1 (Oregon)" },
                      {
                        value: "europe-west1",
                        label: "europe-west1 (Belgium)",
                      },
                      { value: "europe-west2", label: "europe-west2 (London)" },
                    ].map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {showDeployRegionWarning && (
                  <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800 dark:text-amber-200">
                        <p className="font-semibold">
                          Cross-Region Egress Warning
                        </p>
                        <p className="mt-1">
                          Selected region ({deployRegion}) differs from
                          configured storage region ({backendRegion}). This may
                          incur significant egress costs.
                        </p>
                        <p className="mt-1 font-medium">
                          Recommendation: Use {backendRegion} to avoid egress
                          charges. Zone failover (1a → 1b → 1c) provides high
                          availability within the region.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>

            {/* Actions */}
            <div className="flex-shrink-0 p-4 border-t border-[var(--color-border-subtle)] flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeployModal(false);
                  setMissingShardsData(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeployMissing}
                disabled={
                  deployingMissing || missingShardsData.total_missing === 0
                }
                className="bg-[var(--color-accent-cyan)] hover:bg-[var(--color-accent-cyan)]/90"
              >
                {deployingMissing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Rocket className="h-4 w-4 mr-2" />
                )}
                Deploy {missingShardsData.total_missing} Shards
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
