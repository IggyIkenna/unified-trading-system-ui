"use client";

import {
  X,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  AlertCircle,
  Terminal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  StopCircle,
  Play,
  Square,
  CheckSquare,
  Edit2,
  Check,
  Tag,
  List,
  Layers,
  ChevronRight,
  FolderOpen,
  Folder,
  GitCommit,
  FileText,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatDateTime } from "@/lib/utils";
import { VM_EVENT_TYPES } from "@/lib/types/deployment";
import { StatBox } from "./stat-box";
import { ShardRow } from "./shard-row";
import { DeploymentStatusBadge } from "./deployment-status-badge";
import { useDeploymentDetailsModelContext } from "./deployment-details-context";

export function DeploymentDetailsInlineSummary() {
  const dd = useDeploymentDetailsModelContext();
  const {
    deploymentId,
    onClose,
    status,
    logs,
    logsMessage,
    logsHoursBack,
    setLogsHoursBack,
    logsLoading,
    showAllShards,
    setShowAllShards,
    viewMode,
    setViewMode,
    expandedCategories,
    allShards,
    shardsLoading,
    shardStatusFilter,
    setShardStatusFilter,
    shardSearchText,
    setShardSearchText,
    shardPage,
    shardPageLoading,
    fetchShardPage,
    actionLoading,
    actionError,
    actionSuccess,
    setActionSuccess,
    selectedShards,
    editingTag,
    setEditingTag,
    tagValue,
    setTagValue,
    report,
    reportLoading,
    rerunCommands,
    events,
    eventsLoading,
    eventsExpanded,
    setEventsExpanded,
    liveHealth,
    selectedShardForLogs,
    shardLogs,
    shardLogsLoading,
    shardLogsMessage,
    vmLogShardId,
    setVmLogShardId,
    logSearch,
    setLogSearch,
    logSeverityFilter,
    setLogSeverityFilter,
    followLogs,
    setFollowLogs,
    logsContainerRef,
    fetchStatus,
    handleCancelDeployment,
    handleResumeDeployment,
    handleRetryFailed,
    handleRollback,
    handleVerifyCompletion,
    handleCancelShard,
    handleCancelSelectedShards,
    handleSaveTag,
    fetchEvents,
    fetchLogs,
    fetchReport,
    fetchShardLogs,
    openShardLogs,
    closeShardLogs,
    toggleShardSelection,
    selectAllRunningShards,
    groupShardsByCategory,
    getCategoryStats,
    loadAllShards,
    toggleCategory,
    filteredShards,
    shardsForDisplay,
    displayShards,
    CLASSIFICATION_FILTERS,
  } = dd;

  if (!status) return null;

  return (
    <>
      {/* Error Message Banner */}
      {status.status === "failed" && status.error_message && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--color-status-error-bg)] border border-[var(--color-status-error-border-strong)]">
          <AlertCircle className="h-5 w-5 text-[var(--color-accent-red)] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[var(--color-accent-red)]">Deployment Failed</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1 font-mono">{status.error_message}</p>
          </div>
        </div>
      )}

      {/* Log Analysis - Errors and Warnings Summary */}
      {status.log_analysis && (status.log_analysis.error_count > 0 || status.log_analysis.warning_count > 0) && (
        <div className="space-y-3">
          {/* Completed with issues alert */}
          {status.status_detail === "completed_with_errors" && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-status-warning-bg-alt)] border border-[var(--color-status-warning-border-alt)]">
              <AlertCircle className="h-5 w-5 text-[var(--color-accent-amber)] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[var(--color-accent-amber)]">
                  Completed with Errors - Data may be unreliable
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  This deployment completed but had {status.log_analysis.error_count} error(s) in the logs. Review
                  before considering data reliable.
                </p>
              </div>
            </div>
          )}

          {status.status_detail === "completed_with_warnings" && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-status-warning-bg-alt)] border border-[var(--color-status-warning-border-alt)]">
              <AlertCircle className="h-5 w-5 text-[var(--color-accent-amber)] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[var(--color-accent-amber)]">Completed with Warnings</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  This deployment completed but had {status.log_analysis.warning_count} warning(s). Review recommended.
                </p>
              </div>
            </div>
          )}

          {/* Errors Panel */}
          {status.log_analysis.error_count > 0 && (
            <div className="p-3 rounded-lg bg-[var(--color-status-error-bg)] border border-[var(--color-status-error-border-strong)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[var(--color-accent-red)] flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  {status.log_analysis.error_count} Error(s) in Logs
                </span>
                {status.log_analysis.has_stack_traces && (
                  <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-accent-red)] text-white">
                    Has Stack Traces
                  </span>
                )}
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {status.log_analysis.errors.slice(0, 5).map((err, idx) => (
                  <div key={idx} className="text-xs font-mono text-[var(--color-text-secondary)] truncate">
                    <span className="text-[var(--color-accent-purple)]">[{err.shard_id}]</span> {err.message}
                  </div>
                ))}
                {status.log_analysis.error_count > 5 && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    ... and {status.log_analysis.error_count - 5} more errors
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Warnings Panel */}
          {status.log_analysis.warning_count > 0 && (
            <div className="p-3 rounded-lg bg-[var(--color-status-warning-bg)] border border-[var(--color-status-warning-border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[var(--color-accent-amber)] flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {status.log_analysis.warning_count} Warning(s) in Logs
                </span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {status.log_analysis.warnings.slice(0, 5).map((warn, idx) => (
                  <div key={idx} className="text-xs font-mono text-[var(--color-text-secondary)] truncate">
                    <span className="text-[var(--color-accent-purple)]">[{warn.shard_id}]</span> {warn.message}
                  </div>
                ))}
                {status.log_analysis.warning_count > 5 && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    ... and {status.log_analysis.warning_count - 5} more warnings
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress Stats — click any stat to filter the shard list */}
      <div className="grid grid-cols-5 gap-3">
        <StatBox
          label="Total"
          value={status.total_shards}
          color="var(--color-text-primary)"
          onClick={() => setShardStatusFilter("all")}
        />
        <StatBox
          label="Completed"
          value={status.completed_shards}
          color="var(--color-accent-green)"
          onClick={() => setShardStatusFilter("succeeded")}
        />
        <StatBox
          label="Running"
          value={status.running_shards}
          color="var(--color-accent-cyan)"
          onClick={() => setShardStatusFilter("running")}
        />
        <StatBox
          label="Failed"
          value={status.failed_shards}
          color="var(--color-accent-red)"
          onClick={() => setShardStatusFilter("failed")}
        />
        <StatBox
          label="Pending"
          value={status.pending_shards}
          color="var(--color-text-muted)"
          onClick={() => setShardStatusFilter("pending")}
        />
      </div>

      {/* Shard Classification Breakdown */}
      {status.classification_counts ? (
        <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
          <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">Shard Classification</p>

          {/* Data Verification (Tier 3) */}
          {(status.completed_shards ?? 0) > 0 && (
            <div className="mb-2">
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                Data Verification
              </p>
              <div className="grid grid-cols-5 gap-2">
                {(
                  [
                    {
                      key: "VERIFIED",
                      label: "Verified",
                      color: "var(--color-class-verified)",
                    },
                    {
                      key: "EXPECTED_SKIP",
                      label: "Expected Skip",
                      color: "var(--color-class-expected-skip)",
                    },
                    {
                      key: "DATA_STALE",
                      label: "Data Stale",
                      color: "var(--color-class-data-stale)",
                    },
                    {
                      key: "DATA_MISSING",
                      label: "Data Missing",
                      color: "var(--color-class-data-missing)",
                    },
                    {
                      key: "UNVERIFIED",
                      label: "Unverified",
                      color: "var(--color-class-unverified)",
                    },
                  ] as const
                ).map((c) => {
                  const count = status.classification_counts?.[c.key] ?? 0;
                  return count > 0 ? (
                    <StatBox
                      key={c.key}
                      label={c.label}
                      value={count}
                      color={c.color}
                      onClick={() => setShardStatusFilter(c.key)}
                    />
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Log Quality (Tier 2) */}
          {((status.classification_counts?.COMPLETED_WITH_ERRORS ?? 0) > 0 ||
            (status.classification_counts?.COMPLETED_WITH_WARNINGS ?? 0) > 0) && (
            <div className="mb-2">
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Log Quality</p>
              <div className="grid grid-cols-5 gap-2">
                {(
                  [
                    {
                      key: "COMPLETED_WITH_ERRORS",
                      label: "With Errors",
                      color: "var(--color-class-error)",
                    },
                    {
                      key: "COMPLETED_WITH_WARNINGS",
                      label: "With Warnings",
                      color: "var(--color-class-warning)",
                    },
                  ] as const
                ).map((c) => {
                  const count = status.classification_counts?.[c.key] ?? 0;
                  return count > 0 ? (
                    <StatBox
                      key={c.key}
                      label={c.label}
                      value={count}
                      color={c.color}
                      onClick={() => setShardStatusFilter(c.key)}
                    />
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Job Lifecycle Failures (Tier 1) */}
          {((status.classification_counts?.INFRA_FAILURE ?? 0) > 0 ||
            (status.classification_counts?.TIMEOUT_FAILURE ?? 0) > 0 ||
            (status.classification_counts?.CODE_FAILURE ?? 0) > 0 ||
            (status.classification_counts?.VM_DIED ?? 0) > 0 ||
            (status.classification_counts?.NEVER_RAN ?? 0) > 0) && (
            <div className="mb-2">
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Job Failures</p>
              <div className="grid grid-cols-5 gap-2">
                {(
                  [
                    {
                      key: "INFRA_FAILURE",
                      label: "Infra Failure",
                      color: "var(--color-class-warning)",
                    },
                    {
                      key: "TIMEOUT_FAILURE",
                      label: "Timeout",
                      color: "var(--color-class-warning)",
                    },
                    {
                      key: "CODE_FAILURE",
                      label: "Code Failure",
                      color: "var(--color-class-error)",
                    },
                    {
                      key: "VM_DIED",
                      label: "VM Died",
                      color: "var(--color-class-error)",
                    },
                    {
                      key: "NEVER_RAN",
                      label: "Never Ran",
                      color: "var(--color-class-unverified)",
                    },
                  ] as const
                ).map((c) => {
                  const count = status.classification_counts?.[c.key] ?? 0;
                  return count > 0 ? (
                    <StatBox
                      key={c.key}
                      label={c.label}
                      value={count}
                      color={c.color}
                      onClick={() => setShardStatusFilter(c.key)}
                    />
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Still running / cancelled (informational) */}
          {((status.classification_counts?.STILL_RUNNING ?? 0) > 0 ||
            (status.classification_counts?.CANCELLED ?? 0) > 0) && (
            <div className="mb-2">
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">In Progress</p>
              <div className="grid grid-cols-5 gap-2">
                {(
                  [
                    {
                      key: "STILL_RUNNING",
                      label: "Running",
                      color: "var(--color-class-expected-skip)",
                    },
                    {
                      key: "CANCELLED",
                      label: "Cancelled",
                      color: "var(--color-class-unverified)",
                    },
                  ] as const
                ).map((c) => {
                  const count = status.classification_counts?.[c.key] ?? 0;
                  return count > 0 ? (
                    <StatBox
                      key={c.key}
                      label={c.label}
                      value={count}
                      color={c.color}
                      onClick={() => setShardStatusFilter(c.key)}
                    />
                  ) : null;
                })}
              </div>
            </div>
          )}

          <div className="mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleVerifyCompletion((status.completed_with_verification ?? null) != null)}
              disabled={actionLoading === "verify"}
            >
              {actionLoading === "verify" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  {(status.completed_with_verification ?? null) != null ? "Re-verify" : "Verify"}
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (status.completed_shards ?? 0) > 0 ? (
        /* Fallback: old-style stat boxes when classification is not yet available */
        <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
          <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">Completed shards</p>
          <div className="grid grid-cols-4 gap-3">
            <StatBox
              label="Verified"
              value={status.completed_with_verification != null ? status.completed_with_verification : "—"}
              color="var(--color-accent-green)"
            />
            <StatBox
              label="With warnings"
              value={status.completed_with_warnings != null ? status.completed_with_warnings : "—"}
              color="var(--color-accent-amber)"
            />
            <StatBox
              label="With errors"
              value={status.completed_with_errors != null ? status.completed_with_errors : "—"}
              color="var(--color-accent-red)"
            />
            <StatBox
              label="Other"
              value={status.completed != null ? status.completed : "—"}
              color="var(--color-text-muted)"
            />
          </div>
          {(status.completed_with_verification ?? null) == null && (
            <p className="text-xs text-[var(--color-text-muted)] mt-2">
              {(status.running_shards ?? 0) === 0 && (status.pending_shards ?? 0) === 0
                ? "Verification is running automatically in the background. Refresh in a moment, or click Verify."
                : "Click Verify to check how many completed shards have created output files."}
            </p>
          )}
          <div className="mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleVerifyCompletion((status.completed_with_verification ?? null) != null)}
              disabled={actionLoading === "verify"}
            >
              {actionLoading === "verify" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  {(status.completed_with_verification ?? null) != null ? "Re-verify" : "Verify"}
                </>
              )}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Retry Stats Banner */}
      {status.retry_stats && status.retry_stats.total_retries > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-status-warning-bg)] border border-[var(--color-status-warning-border)]">
          <RotateCcw className="h-4 w-4 text-[var(--color-accent-amber)]" />
          <span className="text-sm text-[var(--color-text-secondary)]">
            <span className="text-[var(--color-accent-amber)] font-medium">
              {status.retry_stats.total_retries} retries
            </span>
            {status.retry_stats.succeeded_after_retry > 0 && (
              <span className="text-[var(--color-accent-green)]">
                {" "}
                • {status.retry_stats.succeeded_after_retry} succeeded after retry
              </span>
            )}
            {status.retry_stats.failed_after_retry > 0 && (
              <span className="text-[var(--color-accent-red)]">
                {" "}
                • {status.retry_stats.failed_after_retry} failed after retry
              </span>
            )}
          </span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--color-text-secondary)]">Progress</span>
          <span className="font-mono text-[var(--color-text-primary)]">{status.progress_percentage}%</span>
        </div>
        <div className="h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-accent-green)] transition-all duration-300"
            style={{ width: `${status.progress_percentage}%` }}
          />
        </div>
      </div>
    </>
  );
}
