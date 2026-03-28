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

export function DeploymentDetailsShardsTabPanel() {
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
    <TabsContent value="shards" className="mt-4">
      {/* Show provisioning message when all shards are pending */}
      {status.pending_shards === status.total_shards && status.total_shards > 0 && (
        <div className="flex items-center gap-2 p-3 mb-3 rounded-lg bg-[var(--color-status-running-bg)] border border-[var(--color-status-running-border)]">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--color-accent-cyan)]" />
          <span className="text-sm text-[var(--color-accent-cyan)]">
            {status.compute_type === "vm"
              ? `Provisioning ${status.total_shards} VMs across available zones...`
              : `Starting ${status.total_shards} shards (serverless)...`}
          </span>
        </div>
      )}

      {/* Shard loading & filtering */}
      {status.total_shards > 0 && (
        <div className="p-3 mb-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)]">
          {!allShards && !status.shards ? (
            // Shards not yet loaded - show load button
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {status.total_shards} shards in this deployment
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Load to inspect, search, and filter individual shards.
                </p>
              </div>
              <Button variant="default" size="sm" onClick={loadAllShards} disabled={shardsLoading}>
                {shardsLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Loading…
                  </>
                ) : (
                  <>
                    <List className="h-3 w-3 mr-1" />
                    Load Shards
                  </>
                )}
              </Button>
            </div>
          ) : (
            // Shards loaded - show status toggle + search
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {/* Status filter: All / Succeeded / Failed / Running / Pending */}
                <div className="flex items-center border border-[var(--color-border-subtle)] rounded-md overflow-hidden">
                  {[
                    {
                      key: "all" as const,
                      label: "All",
                      color: "var(--color-accent-purple)",
                      count: (allShards ?? status?.shards ?? []).length,
                    },
                    {
                      key: "succeeded" as const,
                      label: "Succeeded",
                      color: "var(--color-accent-green)",
                      count: (allShards ?? status?.shards ?? []).filter(
                        (s) => s.status === "succeeded" || s.status === "completed",
                      ).length,
                    },
                    {
                      key: "failed" as const,
                      label: "Failed",
                      color: "var(--color-accent-red)",
                      count: (allShards ?? status?.shards ?? []).filter((s) => s.status === "failed").length,
                    },
                    {
                      key: "running" as const,
                      label: "Running",
                      color: "var(--color-accent-cyan)",
                      count: (allShards ?? status?.shards ?? []).filter((s) => s.status === "running").length,
                    },
                    {
                      key: "pending" as const,
                      label: "Pending",
                      color: "var(--color-text-muted)",
                      count: (allShards ?? status?.shards ?? []).filter((s) => s.status === "pending").length,
                    },
                  ]
                    .filter((f) => f.key === "all" || f.count > 0)
                    .map((f) => (
                      <Button
                        key={f.key}
                        variant={shardStatusFilter === f.key ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setShardStatusFilter(f.key)}
                        className={cn(
                          "px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap h-auto",
                          shardStatusFilter === f.key ? "text-white" : "text-[var(--color-text-secondary)]",
                        )}
                        style={shardStatusFilter === f.key ? { backgroundColor: f.color } : undefined}
                      >
                        {f.label} ({f.count})
                      </Button>
                    ))}
                </div>

                {/* Text search */}
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--color-text-muted)]" />
                  <Input
                    placeholder="Search shards… (venue, date, category, status)"
                    value={shardSearchText}
                    onChange={(e) => setShardSearchText(e.target.value)}
                    className="h-7 text-xs pl-7"
                  />
                </div>

                {/* Refresh button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7"
                  onClick={loadAllShards}
                  disabled={shardsLoading}
                  title="Refresh shard list"
                >
                  {shardsLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                </Button>
              </div>

              {/* Active classification filter banner */}
              {CLASSIFICATION_FILTERS.includes(shardStatusFilter as (typeof CLASSIFICATION_FILTERS)[number]) && (
                <div className="flex items-center gap-2 px-2 py-1 rounded bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Filtered by classification:{" "}
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {shardStatusFilter.replace(/_/g, " ")}
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShardStatusFilter("all")}
                    className="text-xs text-[var(--color-accent-cyan)] hover:underline h-auto p-0"
                  >
                    Clear
                  </Button>
                </div>
              )}

              {/* Result count */}
              <div className="text-xs text-[var(--color-text-muted)]">
                {shardSearchText.trim() || shardStatusFilter !== "all" ? (
                  <span>
                    Showing {filteredShards.length} of {(allShards ?? status?.shards ?? []).length} shards
                    {shardSearchText.trim() && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShardSearchText("")}
                        className="ml-2 text-[var(--color-accent-cyan)] hover:underline h-auto p-0"
                      >
                        Clear search
                      </Button>
                    )}
                    {shardStatusFilter !== "all" &&
                      !CLASSIFICATION_FILTERS.includes(
                        shardStatusFilter as (typeof CLASSIFICATION_FILTERS)[number],
                      ) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShardStatusFilter("all")}
                          className="ml-2 text-[var(--color-accent-cyan)] hover:underline h-auto p-0"
                        >
                          Clear filter
                        </Button>
                      )}
                  </span>
                ) : (
                  <span>{filteredShards.length} shards loaded</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* View mode toggle and selection controls */}
      <div className="flex items-center justify-between mb-3 p-2 rounded-lg bg-[var(--color-bg-tertiary)]">
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center border border-[var(--color-border-subtle)] rounded-md overflow-hidden">
            <Button
              variant={viewMode === "grouped" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grouped")}
              className="h-7 w-7"
              title="Group by category"
            >
              <Layers className="h-3 w-3" />
            </Button>
            <Button
              variant={viewMode === "flat" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("flat")}
              className="h-7 w-7"
              title="Flat list"
            >
              <List className="h-3 w-3" />
            </Button>
          </div>

          {/* Shard selection controls */}
          {status.running_shards > 0 && (allShards || status.shards) && (
            <>
              <div className="w-px h-4 bg-[var(--color-border-subtle)]" />
              <Button variant="ghost" size="sm" onClick={selectAllRunningShards} className="h-7 text-xs">
                {selectedShards.size > 0 ? (
                  <CheckSquare className="h-3 w-3 mr-1" />
                ) : (
                  <Square className="h-3 w-3 mr-1" />
                )}
                {selectedShards.size === status.running_shards ? "Deselect All" : "Select Running"}
              </Button>
              {selectedShards.size > 0 && (
                <span className="text-xs text-[var(--color-accent-cyan)]">{selectedShards.size} selected</span>
              )}
            </>
          )}
        </div>
        {selectedShards.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleCancelSelectedShards}
            disabled={actionLoading === "cancel-selected"}
            className="h-7 text-xs"
          >
            {actionLoading === "cancel-selected" ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <StopCircle className="h-3 w-3 mr-1" />
            )}
            Cancel Selected ({selectedShards.size})
          </Button>
        )}
      </div>

      <div className="border border-[var(--color-border-default)] rounded-lg overflow-hidden">
        {shardsForDisplay.length === 0 && (allShards || status?.shards) ? (
          // No results after filtering
          <div className="p-6 text-center text-sm text-[var(--color-text-muted)]">
            {shardSearchText.trim() ? (
              <>
                No shards matching &ldquo;{shardSearchText}&rdquo;
                {shardStatusFilter !== "all" ? ` (in ${shardStatusFilter} shards)` : ""}
              </>
            ) : shardStatusFilter !== "all" ? (
              <>No {shardStatusFilter} shards</>
            ) : (
              <>No shards found</>
            )}
          </div>
        ) : viewMode === "grouped" && shardsForDisplay.length > 0 ? (
          // Grouped view by category
          <div className="max-h-[500px] overflow-y-auto">
            {Object.entries(groupShardsByCategory(shardsForDisplay)).map(([category, categoryShards]) => {
              const stats = getCategoryStats(categoryShards);
              const isExpanded = expandedCategories.has(category);
              return (
                <div key={category} className="border-b border-[var(--color-border-subtle)] last:border-b-0">
                  {/* Category header */}
                  <Button
                    variant="ghost"
                    onClick={() => toggleCategory(category)}
                    className="w-full p-2 flex items-center justify-between hover:bg-[var(--color-bg-hover)] transition-colors h-auto"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <FolderOpen className="h-4 w-4 text-[var(--color-accent-yellow)]" />
                      ) : (
                        <Folder className="h-4 w-4 text-[var(--color-accent-yellow)]" />
                      )}
                      <span className="font-medium text-sm">{category}</span>
                      <span className="text-xs text-[var(--color-text-muted)]">({stats.total} shards)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Status summary badges */}
                      {stats.completed > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-[var(--color-status-success-bg-tag)] text-[var(--color-accent-green)]">
                          {stats.completed} ✓
                        </span>
                      )}
                      {stats.running > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-[var(--color-status-running-bg-tag)] text-[var(--color-accent-cyan)]">
                          {stats.running} ⟳
                        </span>
                      )}
                      {stats.failed > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-[var(--color-status-error-bg-tag)] text-[var(--color-accent-red)]">
                          {stats.failed} ✗
                        </span>
                      )}
                      {stats.pending > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-[var(--color-status-muted-bg-tag)] text-[var(--color-text-muted)]">
                          {stats.pending} ○
                        </span>
                      )}
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 text-[var(--color-text-muted)] transition-transform",
                          isExpanded && "rotate-90",
                        )}
                      />
                    </div>
                  </Button>
                  {/* Category shards */}
                  {isExpanded && (
                    <div className="divide-y divide-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
                      {categoryShards.map((shard) => (
                        <ShardRow
                          key={shard.shard_id}
                          shard={shard}
                          selected={selectedShards.has(shard.shard_id)}
                          onSelect={() => toggleShardSelection(shard.shard_id)}
                          onCancel={() => handleCancelShard(shard.shard_id)}
                          onViewLogs={() => openShardLogs(shard)}
                          cancelling={actionLoading === `shard-${shard.shard_id}`}
                          classification={status?.shard_classifications?.[shard.shard_id]}
                          vmEvents={events.filter((e) => e.shard_id === shard.shard_id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Flat view
          <>
            <div className="max-h-[500px] overflow-y-auto divide-y divide-[var(--color-border-subtle)]">
              {displayShards.map((shard) => (
                <ShardRow
                  key={shard.shard_id}
                  shard={shard}
                  selected={selectedShards.has(shard.shard_id)}
                  onSelect={() => toggleShardSelection(shard.shard_id)}
                  onCancel={() => handleCancelShard(shard.shard_id)}
                  onViewLogs={() => openShardLogs(shard)}
                  cancelling={actionLoading === `shard-${shard.shard_id}`}
                  classification={status?.shard_classifications?.[shard.shard_id]}
                  vmEvents={events.filter((e) => e.shard_id === shard.shard_id)}
                />
              ))}
            </div>
            {shardsForDisplay.length > 50 && (
              <Button
                variant="ghost"
                onClick={() => setShowAllShards(!showAllShards)}
                className="w-full p-2 text-xs text-[var(--color-text-secondary)] flex items-center justify-center gap-1 h-auto"
              >
                {showAllShards ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show all {shardsForDisplay.length} shards
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </div>
    </TabsContent>
  );
}
