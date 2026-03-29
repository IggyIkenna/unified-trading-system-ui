"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/shared/spinner";
import { cn } from "@/lib/utils";
import { RefreshCw, Terminal } from "lucide-react";
import { useDeploymentDetailsModelContext } from "./deployment-details-context";

export function DeploymentDetailsShardLogsDialog() {
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

  return (
    <>
      <Dialog
        open={!!selectedShardForLogs}
        onOpenChange={(open) => {
          if (!open) closeShardLogs();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-mono">{selectedShardForLogs?.shard_id} - Logs</DialogTitle>
          </DialogHeader>
          <div>
            {shardLogsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-6 w-6 text-[var(--color-accent-cyan)]" />
                <span className="ml-2 text-sm text-[var(--color-text-muted)]">Loading logs...</span>
              </div>
            ) : shardLogs.length === 0 ? (
              <div className="text-center py-8">
                <Terminal className="h-8 w-8 mx-auto mb-2 text-[var(--color-text-muted)] opacity-50" />
                <p className="text-sm text-[var(--color-text-muted)]">
                  {shardLogsMessage || "No logs available for this shard"}
                </p>
                {selectedShardForLogs?.status === "pending" && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Logs will appear once the shard starts running
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {shardLogsMessage && <p className="text-xs text-[var(--color-text-muted)] mb-2">{shardLogsMessage}</p>}
                <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-3 font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
                  {shardLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "py-1 border-b border-[var(--color-border-subtle)] last:border-0",
                        log.severity === "ERROR" && "text-[var(--color-accent-red)]",
                        log.severity === "WARNING" && "text-[var(--color-accent-amber)]",
                        log.severity === "INFO" && "text-[var(--color-text-secondary)]",
                        log.severity === "DEBUG" && "text-[var(--color-text-muted)]",
                      )}
                    >
                      <span className="text-[var(--color-text-muted)] mr-2">
                        {log.timestamp && new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span
                        className={cn(
                          "px-1 rounded text-xs mr-2",
                          log.severity === "ERROR" && "bg-[var(--color-status-error-bg-tag)]",
                          log.severity === "WARNING" && "bg-[var(--color-status-warning-bg-tag)]",
                          log.severity === "INFO" && "bg-[var(--color-status-success-bg-tag)]",
                        )}
                      >
                        {log.severity}
                      </span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Refresh button */}
            {selectedShardForLogs && (
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchShardLogs(selectedShardForLogs.shard_id)}
                  disabled={shardLogsLoading}
                >
                  {shardLogsLoading ? <Spinner className="h-4 w-4 mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                  Refresh
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
