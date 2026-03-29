"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Play, RefreshCw, Search, Terminal, X } from "lucide-react";
import { useDeploymentDetailsModelContext } from "./deployment-details-context";

export function DeploymentDetailsLogsTabPanel() {
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
    <TabsContent value="logs" className="mt-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {/* Severity filter (structured, not text search) */}
          <Select
            value={logSeverityFilter}
            onValueChange={(v) => setLogSeverityFilter(v as "ALL" | "ERROR" | "WARNING" | "INFO")}
          >
            <SelectTrigger
              className="h-8 text-xs w-32"
              title="Filter by log severity (uses structured severity field, not text matching)"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All levels</SelectItem>
              <SelectItem value="ERROR">ERROR only</SelectItem>
              <SelectItem value="WARNING">WARNING+</SelectItem>
              <SelectItem value="INFO">INFO+</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--color-text-muted)]" />
            <Input
              placeholder="Search log messages... (e.g. timeout, shard name, logger)"
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="h-8 pl-7 text-xs"
            />
            {logSearch && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLogSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] h-5 w-5"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">
            {(() => {
              const sevFiltered =
                logSeverityFilter === "ALL"
                  ? logs
                  : logSeverityFilter === "ERROR"
                    ? logs.filter((l) => l.severity === "ERROR" || l.severity === "CRITICAL")
                    : logSeverityFilter === "WARNING"
                      ? logs.filter(
                          (l) => l.severity === "ERROR" || l.severity === "CRITICAL" || l.severity === "WARNING",
                        )
                      : logs;
              const searchLower = logSearch.toLowerCase().trim();
              const count = searchLower
                ? sevFiltered.filter(
                    (l) =>
                      l.message.toLowerCase().includes(searchLower) ||
                      (l.logger && l.logger.toLowerCase().includes(searchLower)) ||
                      (l.shard && l.shard.toLowerCase().includes(searchLower)),
                  ).length
                : sevFiltered.length;
              return logSearch || logSeverityFilter !== "ALL" ? `${count}/${logs.length}` : `${logs.length} logs`;
            })()}
          </span>

          {/* Time range (Serverless: historical logs; VM: cloud storage logs) */}
          <Select
            value={logsHoursBack != null ? String(logsHoursBack) : ""}
            onValueChange={(v) => {
              const num = v === "" ? null : parseInt(v, 10);
              setLogsHoursBack(num);
              fetchLogs("DEFAULT", false, num);
            }}
          >
            <SelectTrigger
              className="h-8 text-xs w-28"
              title="Time range for serverless logs (VM shows persisted cloud storage logs)"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All time</SelectItem>
              <SelectItem value="24">Last 24h</SelectItem>
              <SelectItem value="72">Last 72h</SelectItem>
              <SelectItem value="168">Last 7d</SelectItem>
            </SelectContent>
          </Select>

          {/* Auto-follow toggle */}
          <Button
            variant={followLogs ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setFollowLogs(!followLogs);
              if (!followLogs) {
                // Starting to follow - do an initial fetch
                fetchLogs("DEFAULT", false, logsHoursBack);
              }
            }}
            className={cn(
              "h-8 text-xs",
              followLogs && "bg-[var(--color-accent-green)] hover:bg-[var(--color-accent-green)]/80",
            )}
            title={followLogs ? "Stop auto-follow" : "Auto-follow (poll every 15s)"}
          >
            {followLogs ? (
              <>
                <Spinner size="sm" className="h-3 w-3 mr-1" />
                Following...
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1" />
                Follow
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchLogs("DEFAULT", false, logsHoursBack)}
            disabled={logsLoading || followLogs}
            title="Manual refresh"
          >
            {logsLoading ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>

        {/* VM shard picker - always visible for VM deployments */}
        {status.compute_type === "vm" && (
          <div className="p-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">View shard:</span>
              {(allShards ?? status?.shards ?? shardPage ?? []).length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto flex-1">
                    {(allShards ?? status?.shards ?? shardPage ?? []).slice(0, 50).map((s) => (
                      <Button
                        key={s.shard_id}
                        size="sm"
                        variant="outline"
                        className="text-[10px] font-mono h-6 px-1.5"
                        onClick={() =>
                          openShardLogs({
                            shard_id: s.shard_id,
                            status: s.status ?? "unknown",
                          })
                        }
                      >
                        {s.shard_id.length > 30 ? `${s.shard_id.slice(0, 27)}…` : s.shard_id}
                      </Button>
                    ))}
                    {(allShards ?? status?.shards ?? shardPage ?? []).length > 50 && (
                      <span className="text-[10px] self-center text-[var(--color-text-muted)]">
                        + more in Shards tab
                      </span>
                    )}
                  </div>
                  {logs.length === 0 && (
                    <Button
                      size="sm"
                      variant="default"
                      className="h-6 text-[10px]"
                      onClick={() => fetchLogs("DEFAULT", false, logsHoursBack)}
                      disabled={logsLoading}
                    >
                      {logsLoading ? <Spinner size="sm" className="h-3 w-3" /> : "Load all logs"}
                    </Button>
                  )}
                </>
              ) : (
                <div className="flex gap-2 items-center flex-1">
                  <Input
                    placeholder="Shard ID (e.g. CEFI_2025-01-15_BINANCE-SPOT)"
                    value={vmLogShardId}
                    onChange={(e) => setVmLogShardId(e.target.value)}
                    className="h-6 text-[10px] font-mono flex-1 min-w-[200px]"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px]"
                    onClick={() => {
                      const id = vmLogShardId.trim();
                      if (id)
                        openShardLogs({
                          shard_id: id,
                          status: "unknown",
                        });
                    }}
                    disabled={!vmLogShardId.trim()}
                  >
                    View logs
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[10px]"
                    onClick={() => fetchShardPage({ offset: 0 })}
                    disabled={shardPageLoading}
                  >
                    {shardPageLoading ? "Loading..." : "Load shard list"}
                  </Button>
                  {logs.length === 0 && (
                    <Button
                      size="sm"
                      variant="default"
                      className="h-6 text-[10px]"
                      onClick={() => fetchLogs("DEFAULT", false, logsHoursBack)}
                      disabled={logsLoading}
                    >
                      {logsLoading ? <Spinner size="sm" className="h-3 w-3" /> : "Load all logs"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {logs.length === 0 ? (
          <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">
            <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No logs found yet</p>
            <p className="text-xs mt-1">
              {logsMessage
                ? logsMessage
                : status.running_shards > 0
                  ? "Logs will appear as VMs start processing..."
                  : "VMs may have completed or not started yet"}
            </p>
          </div>
        ) : (
          <div ref={logsContainerRef} className="log-container max-h-80 overflow-y-auto font-mono text-xs space-y-1">
            {/* Filter logs by structured severity, then by text search on message/logger/shard */}
            {(() => {
              // Step 1: Filter by severity field (structured, not text matching)
              const severityFiltered =
                logSeverityFilter === "ALL"
                  ? logs
                  : logSeverityFilter === "ERROR"
                    ? logs.filter((l) => l.severity === "ERROR" || l.severity === "CRITICAL")
                    : logSeverityFilter === "WARNING"
                      ? logs.filter(
                          (l) => l.severity === "ERROR" || l.severity === "CRITICAL" || l.severity === "WARNING",
                        )
                      : logs; // INFO+ = all

              // Step 2: Text search on message, logger, shard — NOT on severity
              const searchLower = logSearch.toLowerCase().trim();
              const filteredLogs = searchLower
                ? severityFiltered.filter((log) => {
                    return (
                      (log.message && log.message.toLowerCase().includes(searchLower)) ||
                      (log.logger && log.logger.toLowerCase().includes(searchLower)) ||
                      (log.execution_name && log.execution_name.toLowerCase().includes(searchLower)) ||
                      (log.shard && log.shard.toLowerCase().includes(searchLower))
                    );
                  })
                : severityFiltered;

              if (filteredLogs.length === 0 && (logSearch || logSeverityFilter !== "ALL")) {
                return (
                  <div className="text-center py-4 text-sm text-[var(--color-text-muted)]">
                    No logs matching {logSeverityFilter !== "ALL" ? `severity=${logSeverityFilter}` : ""}
                    {logSearch ? ` "${logSearch}"` : ""}
                  </div>
                );
              }

              return filteredLogs.map((log, idx) => {
                // Check for failover-related tags
                const isZoneExhausted = log.message.includes("[ZONE_EXHAUSTED]");
                const isRegionSwitch = log.message.includes("[REGION_SWITCH]");
                const isQuotaExhausted =
                  log.message.includes("[REGIONAL_QUOTA_EXHAUSTED]") ||
                  log.message.includes("[IP_QUOTA_EXCEEDED]") ||
                  log.message.includes("[CPU_QUOTA_EXCEEDED]");
                const isAllExhausted = log.message.includes("[ALL_REGIONS_EXHAUSTED]");
                const isFailoverEvent = isZoneExhausted || isRegionSwitch || isQuotaExhausted || isAllExhausted;

                return (
                  <div
                    key={idx}
                    className={cn(
                      "py-1 px-2 rounded hover:bg-[var(--color-bg-tertiary)]",
                      isRegionSwitch &&
                        "bg-[var(--color-status-tradfi-bg)] border-l-2 border-[var(--color-accent-purple)]",
                      isZoneExhausted && "bg-[var(--color-status-warning-bg-subtle)]",
                      isQuotaExhausted &&
                        "bg-[var(--color-status-warning-bg)] border-l-2 border-[var(--color-accent-amber)]",
                      isAllExhausted && "bg-[var(--color-status-error-bg)] border-l-2 border-[var(--color-accent-red)]",
                    )}
                  >
                    <span
                      className={cn(
                        "font-bold",
                        log.severity === "ERROR" && "text-[var(--color-accent-red)]",
                        log.severity === "WARNING" && "text-[var(--color-accent-amber)]",
                        log.severity === "INFO" && "text-[var(--color-accent-cyan)]",
                      )}
                    >
                      [{log.severity}]
                    </span>{" "}
                    <span className="text-[var(--color-text-muted)]">
                      {log.timestamp?.split("T")[1]?.split(".")[0] || ""}
                    </span>
                    {(log as { shard?: string }).shard && (
                      <span className="text-[var(--color-accent-purple)] ml-1">
                        [{(log as { shard?: string }).shard}]
                      </span>
                    )}
                    {isFailoverEvent && (
                      <>
                        {" "}
                        <span
                          className={cn(
                            "px-1 rounded text-[10px] font-semibold",
                            isRegionSwitch && "bg-[var(--color-accent-purple)] text-white",
                            isZoneExhausted && "bg-[var(--color-accent-amber)] text-black",
                            isQuotaExhausted && "bg-[var(--color-accent-amber)] text-black",
                            isAllExhausted && "bg-[var(--color-accent-red)] text-white",
                          )}
                        >
                          {isRegionSwitch
                            ? "REGION SWITCH"
                            : isQuotaExhausted
                              ? "QUOTA HIT"
                              : isAllExhausted
                                ? "CRITICAL"
                                : "ZONE RETRY"}
                        </span>
                      </>
                    )}
                    {log.logger && (
                      <>
                        {" "}
                        <span className="text-[var(--color-text-muted)] opacity-60 text-[10px]">{log.logger}</span>
                      </>
                    )}
                    {log.shard && (
                      <>
                        {" "}
                        <span className="text-[var(--color-accent-purple)]">[{log.shard}]</span>
                      </>
                    )}{" "}
                    <span className="text-[var(--color-text-secondary)]">{log.message}</span>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    </TabsContent>
  );
}
