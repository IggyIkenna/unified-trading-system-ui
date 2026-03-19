import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Database,
  Rocket,
  Code,
  Wrench,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import * as api from "../api/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { ServiceStatus } from "../types";

interface ServiceStatusTabProps {
  serviceName: string;
}

export function ServiceStatusTab({ serviceName }: ServiceStatusTabProps) {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    setStatus(null); // Clear old data immediately - prevent stale data display

    try {
      const result = await api.getServiceStatus(serviceName);
      setStatus(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch service status",
      );
    } finally {
      setLoading(false);
    }
  }, [serviceName]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const formatTimestamp = (ts: string | null) => {
    if (!ts) return { relative: "Never", absolute: "Never" };
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    let relative = "";
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      relative = `${diffMins}m ago`;
    } else if (diffDays < 1) {
      relative = `${diffHours}h ago`;
    } else if (diffDays < 7) {
      relative = `${diffDays}d ago`;
    } else {
      relative = `${diffDays}d ago`;
    }

    const absolute =
      date.toLocaleString("en-US", {
        timeZone: "UTC",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " UTC";

    return { relative, absolute };
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case "healthy":
        return "var(--color-accent-green)";
      case "warning":
        return "var(--color-accent-amber)";
      case "error":
        return "var(--color-accent-red)";
      case "build_failed":
        return "var(--color-accent-red)";
      default:
        return "var(--color-text-muted)";
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case "healthy":
        return <CheckCircle2 className="h-5 w-5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
      case "error":
        return <XCircle className="h-5 w-5" />;
      case "build_failed":
        return <XCircle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "var(--color-accent-red)";
      case "warning":
        return "var(--color-accent-amber)";
      case "info":
        return "var(--color-accent-cyan)";
      default:
        return "var(--color-text-muted)";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[var(--color-accent-cyan)]" />
              <CardTitle className="text-xl font-mono">
                Service Health Timeline
              </CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStatus}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
          <CardDescription>
            Temporal audit trail: data, deployments, builds, and code
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Loading State */}
      {loading && !status && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent-cyan)]" />
              <p className="text-sm text-[var(--color-text-muted)]">
                Checking {serviceName} health...
              </p>
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

      {/* Status Display */}
      {status && (
        <>
          {/* Anomalies Card - Show FIRST if there are issues */}
          {status.anomalies.length > 0 && (
            <Card
              className="border-2"
              style={{ borderColor: "var(--color-accent-amber)" }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-[var(--color-accent-amber)]" />
                  <CardTitle className="text-base">
                    {status.anomalies.length} Detected Issue
                    {status.anomalies.length > 1 ? "s" : ""}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {status.anomalies.map((anomaly, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg border"
                      style={{
                        borderColor: `${getSeverityColor(anomaly.severity)}40`,
                        backgroundColor: `${getSeverityColor(anomaly.severity)}10`,
                      }}
                    >
                      <AlertCircle
                        className="h-4 w-4 mt-0.5"
                        style={{ color: getSeverityColor(anomaly.severity) }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium capitalize">
                            {anomaly.type.replace(/_/g, " ")}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{
                              color: getSeverityColor(anomaly.severity),
                              borderColor: getSeverityColor(anomaly.severity),
                            }}
                          >
                            {anomaly.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                          {anomaly.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Overall Health Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div style={{ color: getHealthColor(status.health) }}>
                    {getHealthIcon(status.health)}
                  </div>
                  <div>
                    <CardTitle className="text-lg capitalize">
                      {status.health}
                    </CardTitle>
                    <CardDescription>
                      Overall service health status
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Timeline</CardTitle>
              <CardDescription>Most recent activity timestamps</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Data Update */}
                <div className="flex items-start gap-4 p-3 rounded-lg bg-[var(--color-bg-secondary)]">
                  <Database className="h-5 w-5 mt-0.5 text-[var(--color-accent-cyan)]" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Last Data Update</span>
                      <span className="text-sm font-mono font-bold text-[var(--color-text-primary)]">
                        {formatTimestamp(status.last_data_update).relative}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Most recent output file in GCS
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] font-mono">
                        {formatTimestamp(status.last_data_update).absolute}
                      </p>
                    </div>
                    {status.details?.data?.by_category && (
                      <div className="mt-2 pt-2 border-t border-[var(--color-border-subtle)]">
                        <p className="text-xs text-[var(--color-text-muted)] mb-1">
                          By category:
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries(status.details.data.by_category).map(
                            ([cat, info]: [string, { timestamp?: string }]) => (
                              <div key={cat} className="text-xs">
                                <span className="font-medium">{cat}:</span>{" "}
                                <span className="text-[var(--color-text-muted)]">
                                  {info.timestamp
                                    ? formatTimestamp(info.timestamp).relative
                                    : "N/A"}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Deployment */}
                <div className="flex items-start gap-4 p-3 rounded-lg bg-[var(--color-bg-secondary)]">
                  <Rocket className="h-5 w-5 mt-0.5 text-[var(--color-accent-purple)]" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Last Deployment</span>
                      <span className="text-sm font-mono font-bold text-[var(--color-text-primary)]">
                        {formatTimestamp(status.last_deployment).relative}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {status.details?.deployment?.deployment_id ||
                          "Most recent job execution"}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] font-mono">
                        {formatTimestamp(status.last_deployment).absolute}
                      </p>
                    </div>
                    {status.details?.deployment && (
                      <div className="mt-2 pt-2 border-t border-[var(--color-border-subtle)] space-y-2">
                        <div className="flex items-center gap-4 text-xs flex-wrap">
                          <div>
                            <span className="text-[var(--color-text-muted)]">
                              Status:
                            </span>{" "}
                            <Badge variant="outline" className="text-xs">
                              {status.details.deployment.status}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-[var(--color-text-muted)]">
                              Compute:
                            </span>{" "}
                            <span className="font-mono">
                              {status.details.deployment.compute_type}
                            </span>
                          </div>
                          {status.details.deployment.used_force !==
                            undefined && (
                            <div>
                              <span className="text-[var(--color-text-muted)]">
                                Force:
                              </span>{" "}
                              <Badge
                                variant="outline"
                                className="text-xs"
                                style={{
                                  color: status.details.deployment.used_force
                                    ? "var(--color-accent-green)"
                                    : "var(--color-accent-red)",
                                }}
                              >
                                {status.details.deployment.used_force
                                  ? "YES"
                                  : "NO"}
                              </Badge>
                            </div>
                          )}
                          {status.api?.gcs_fuse?.active !== undefined && (
                            <div>
                              <span className="text-[var(--color-text-muted)]">
                                GCS Fuse:
                              </span>{" "}
                              <Badge
                                variant="outline"
                                className="text-xs"
                                style={{
                                  color: status.api.gcs_fuse.active
                                    ? "var(--color-accent-green)"
                                    : "var(--color-accent-red)",
                                }}
                              >
                                {status.api.gcs_fuse.active ? "YES" : "NO"}
                              </Badge>
                            </div>
                          )}
                        </div>
                        {status.details.deployment.tag && (
                          <div className="text-xs">
                            <span className="text-[var(--color-text-muted)]">
                              Tag:
                            </span>{" "}
                            <span className="text-[var(--color-text-secondary)] italic">
                              "{status.details.deployment.tag}"
                            </span>
                          </div>
                        )}
                        {(status.details.deployment.total_shards ?? 0) > 0 && (
                          <div className="text-xs">
                            <span className="text-[var(--color-text-muted)]">
                              Shards:
                            </span>{" "}
                            <span className="font-mono">
                              {status.details.deployment.completed_shards}/
                              {status.details.deployment.total_shards} completed
                              {(status.details.deployment.failed_shards ?? 0) >
                                0 && (
                                <span className="text-[var(--color-accent-red)] ml-2">
                                  ({status.details.deployment.failed_shards}{" "}
                                  failed)
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Build */}
                <div className="flex items-start gap-4 p-3 rounded-lg bg-[var(--color-bg-secondary)]">
                  <Wrench className="h-5 w-5 mt-0.5 text-[var(--color-accent-amber)]" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Last Build</span>
                      <span className="text-sm font-mono font-bold text-[var(--color-text-primary)]">
                        {formatTimestamp(status.last_build).relative}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Cloud Build (Docker image)
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] font-mono">
                        {formatTimestamp(status.last_build).absolute}
                      </p>
                    </div>
                    {status.details?.build && !status.details.build.error && (
                      <div className="mt-2 pt-2 border-t border-[var(--color-border-subtle)] flex items-center gap-4 text-xs flex-wrap">
                        <div>
                          <span className="text-[var(--color-text-muted)]">
                            Status:
                          </span>{" "}
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{
                              color:
                                status.details.build.status === "SUCCESS"
                                  ? "var(--color-accent-green)"
                                  : "var(--color-accent-red)",
                            }}
                          >
                            {status.details.build.status}
                          </Badge>
                        </div>
                        {status.details.build.commit_sha && (
                          <div>
                            <span className="text-[var(--color-text-muted)]">
                              Commit:
                            </span>{" "}
                            <span className="font-mono">
                              {status.details.build.commit_sha}
                            </span>
                          </div>
                        )}
                        {status.details.build.duration_seconds && (
                          <div>
                            <span className="text-[var(--color-text-muted)]">
                              Duration:
                            </span>{" "}
                            <span className="font-mono">
                              {Math.round(
                                status.details.build.duration_seconds,
                              )}
                              s
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Code Push */}
                <div className="flex items-start gap-4 p-3 rounded-lg bg-[var(--color-bg-secondary)]">
                  <Code className="h-5 w-5 mt-0.5 text-[var(--color-accent-green)]" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Last Code Push</span>
                      <span className="text-sm font-mono font-bold text-[var(--color-text-primary)]">
                        {formatTimestamp(status.last_code_push).relative}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[var(--color-text-muted)]">
                        GitHub commit to main
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] font-mono">
                        {formatTimestamp(status.last_code_push).absolute}
                      </p>
                    </div>
                    {status.details?.code && !status.details.code.error && (
                      <div className="mt-2 pt-2 border-t border-[var(--color-border-subtle)]">
                        <div className="flex items-start gap-2 text-xs">
                          <span className="text-[var(--color-text-muted)]">
                            SHA:
                          </span>
                          <span className="font-mono flex-1">
                            {status.details.code.commit_sha}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 text-xs mt-1">
                          <span className="text-[var(--color-text-muted)]">
                            Msg:
                          </span>
                          <span className="flex-1 text-[var(--color-text-secondary)]">
                            {status.details.code.message}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 text-xs mt-1">
                          <span className="text-[var(--color-text-muted)]">
                            By:
                          </span>
                          <span className="text-[var(--color-text-secondary)]">
                            {status.details.code.author}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Context - Checklist and Data Coverage */}
          {(status.checklist_status || status.data_coverage) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Additional Context</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm">
                  {status.checklist_status && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[var(--color-accent-cyan)]" />
                      <span className="text-[var(--color-text-muted)]">
                        Checklist:
                      </span>
                      <span className="font-mono font-medium">
                        {status.checklist_status.percent}% ready
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        ({status.checklist_status.completed}/
                        {status.checklist_status.total} items)
                      </span>
                    </div>
                  )}
                  {status.data_coverage && (
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-[var(--color-accent-green)]" />
                      <span className="text-[var(--color-text-muted)]">
                        Data Coverage:
                      </span>
                      <span className="font-mono font-medium">
                        {status.data_coverage.percent}% complete
                      </span>
                      {status.data_coverage.gaps > 0 && (
                        <span className="text-xs text-[var(--color-text-muted)]">
                          ({status.data_coverage.gaps} gaps)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
