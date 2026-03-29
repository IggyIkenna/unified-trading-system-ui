"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/spinner";
import { TabsContent } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";
import { useDeploymentDetailsModelContext } from "./deployment-details-context";

export function DeploymentDetailsReportTabPanel() {
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
    <TabsContent value="report" className="mt-4">
      {reportLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner className="h-6 w-6 text-[var(--color-accent-cyan)]" />
          <span className="ml-2 text-sm text-[var(--color-text-secondary)]">Loading report...</span>
        </div>
      ) : report ? (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] text-center">
              <div className="text-xl font-mono font-bold text-[var(--color-accent-green)]">
                {report.summary.success_rate}%
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">Success Rate</div>
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] text-center">
              <div className="text-xl font-mono font-bold text-[var(--color-accent-amber)]">
                {report.summary.total_retries}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">Total Retries</div>
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] text-center">
              <div className="text-xl font-mono font-bold text-[var(--color-accent-purple)]">
                {report.retry_stats?.total_zone_switches}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">Zone Switches</div>
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] text-center">
              <div className="text-xl font-mono font-bold text-[var(--color-accent-cyan)]">
                {report.retry_stats?.total_region_switches}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">Region Switches</div>
            </div>
          </div>

          {/* Failure Breakdown */}
          {Object.keys(report.failure_breakdown ?? {}).length > 0 && (
            <div className="p-3 rounded-lg bg-[var(--color-status-error-bg)] border border-[var(--color-status-error-border-strong)]">
              <h4 className="text-sm font-medium text-[var(--color-accent-red)] mb-2">Failure Breakdown</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(report.failure_breakdown ?? {}).map(([category, count]) => (
                  <div key={category} className="flex justify-between text-xs">
                    <span className="text-[var(--color-text-secondary)]">{category}</span>
                    <span className="font-mono text-[var(--color-accent-red)]">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Zone Usage */}
          {Object.keys(report.zone_usage ?? {}).length > 0 && (
            <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Zone Usage</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(report.zone_usage ?? {}).map(([zone, count]) => (
                  <div key={zone} className="flex justify-between text-xs">
                    <span className="text-[var(--color-text-secondary)]">{zone}</span>
                    <span className="font-mono text-[var(--color-accent-cyan)]">{count} shards</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Infrastructure Issues */}
          {(report.infrastructure_issues?.length ?? 0) > 0 && (
            <div className="p-3 rounded-lg bg-[var(--color-status-warning-bg)] border border-[var(--color-status-warning-border)]">
              <h4 className="text-sm font-medium text-[var(--color-accent-amber)] mb-2">
                Infrastructure Issues ({report.infrastructure_issues?.length})
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {(report.infrastructure_issues ?? []).slice(0, 10).map(
                  (
                    issue: {
                      shard_id?: string;
                      zone?: string;
                      category?: string;
                    },
                    idx: number,
                  ) => (
                    <div key={idx} className="text-xs">
                      <span className="text-[var(--color-accent-purple)]">[{issue.shard_id}]</span>
                      <span className="text-[var(--color-text-muted)]"> {issue.zone} - </span>
                      <span className="text-[var(--color-accent-amber)]">{issue.category}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {/* Rerun Commands */}
          {rerunCommands && (rerunCommands.total_commands ?? 0) > 0 && (
            <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Rerun Commands ({rerunCommands.total_commands} failed)
              </h4>
              {rerunCommands.combined_retry_command && (
                <div className="mb-2 p-2 rounded bg-[var(--color-bg-secondary)] font-mono text-xs text-[var(--color-accent-green)]">
                  {rerunCommands.combined_retry_command}
                </div>
              )}
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {rerunCommands.commands.slice(0, 5).map((cmd, idx) => (
                  <div key={idx} className="text-xs font-mono text-[var(--color-text-secondary)] truncate">
                    # {cmd.shard_id}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={fetchReport} className="w-full">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh Report
          </Button>
        </div>
      ) : (
        <div className="text-center py-8">
          <Button onClick={fetchReport} variant="outline">
            Load Infrastructure Report
          </Button>
        </div>
      )}
    </TabsContent>
  );
}
