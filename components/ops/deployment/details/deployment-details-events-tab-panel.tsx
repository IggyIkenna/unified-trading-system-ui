"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TabsContent } from "@/components/ui/tabs";
import { VM_EVENT_TYPES } from "@/lib/types/deployment";
import { formatDateTime } from "@/lib/utils";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { useDeploymentDetailsModelContext } from "./deployment-details-context";

export function DeploymentDetailsEventsTabPanel() {
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
    <TabsContent value="events" className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">Shard Event Timeline</p>
        <Button size="sm" variant="outline" onClick={fetchEvents} disabled={eventsLoading}>
          {eventsLoading ? <Spinner size="sm" className="h-3 w-3 mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
          Refresh
        </Button>
      </div>

      {eventsLoading && events.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Spinner className="h-5 w-5 text-[var(--color-accent-cyan)]" />
          <span className="ml-2 text-sm text-[var(--color-text-muted)]">Loading events...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-[var(--color-text-muted)]">No events recorded for this deployment.</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Events are emitted by VM/Cloud Run backends during execution.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {[...events]
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .map((ev, idx) => {
              const isVm = VM_EVENT_TYPES.has(ev.event_type);
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-2 rounded text-xs bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)]"
                >
                  <span className="text-[var(--color-text-muted)] font-mono whitespace-nowrap shrink-0">
                    {formatDateTime(ev.timestamp)}
                  </span>
                  <code className="text-[var(--color-text-muted)] truncate shrink-0 max-w-[180px]">{ev.shard_id}</code>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                      isVm
                        ? "bg-[var(--color-status-warning-bg-tag)] text-[var(--color-accent-amber)]"
                        : "bg-[var(--color-status-running-bg-alt)] text-[var(--color-accent-cyan)]"
                    }`}
                  >
                    {ev.event_type.replace(/_/g, " ")}
                  </span>
                  <span className="text-[var(--color-text-secondary)] flex-1 min-w-0 truncate">{ev.message}</span>
                </div>
              );
            })}
        </div>
      )}

      {/* Collapsible: aggregate VM error summary */}
      {events.filter((e) => VM_EVENT_TYPES.has(e.event_type)).length > 0 && (
        <div className="mt-4">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] h-auto p-0"
            onClick={() => setEventsExpanded((v) => !v)}
          >
            {eventsExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            VM Event Summary ({events.filter((e) => VM_EVENT_TYPES.has(e.event_type)).length} events)
          </Button>
          {eventsExpanded && (
            <div className="mt-2 pl-4 space-y-1">
              {Object.entries(
                events
                  .filter((e) => VM_EVENT_TYPES.has(e.event_type))
                  .reduce<Record<string, number>>((acc, e) => {
                    acc[e.event_type] = (acc[e.event_type] ?? 0) + 1;
                    return acc;
                  }, {}),
              ).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2 text-xs">
                  <span className="text-[var(--color-accent-amber)]">{type.replace(/_/g, " ")}</span>
                  <span className="text-[var(--color-text-muted)]">×{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </TabsContent>
  );
}
