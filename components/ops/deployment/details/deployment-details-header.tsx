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

export function DeploymentDetailsHeader() {
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
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <CardTitle className="font-mono text-lg">{status.deployment_id}</CardTitle>
            <DeploymentStatusBadge status={status.status} statusDetail={status.status_detail} />
            {status.has_force && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--color-accent-purple)]/20 text-[var(--color-accent-purple)]">
                --force
              </span>
            )}
            {(status.gcs_fuse_active !== undefined || status.gcs_fuse_reason) && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  status.gcs_fuse_active
                    ? "bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]"
                    : "bg-[var(--color-accent-red)]/20 text-[var(--color-accent-red)]"
                }`}
                title={status.gcs_fuse_reason}
              >
                {status.gcs_fuse_active ? "GCS Fuse" : "GCS API"}
              </span>
            )}
          </div>
          <CardDescription>
            {status.service} • {status.compute_type}
            {status.region && ` • ${status.region}`}
            {status.zone && ` (${status.zone})`}
            {" • "}
            {formatDateTime(status.created_at || "")}
            {status.updated_at && (
              <span className="text-[var(--color-text-muted)]" title="Status refreshes every few seconds">
                {" • Updated "}
                {formatDateTime(status.updated_at)}
              </span>
            )}
          </CardDescription>

          {/* Image Tag Display */}
          {(status.image_short_digest || status.image_tag) && (
            <div className="flex items-center gap-2 mt-2">
              <GitCommit className="h-3 w-3 text-[var(--color-text-muted)]" />
              {status.image_short_digest ? (
                // Show resolved digest when available
                <>
                  <span
                    className="text-xs font-mono text-[var(--color-accent-cyan)]"
                    title={`Full digest: ${status.image_digest}\nImage: ${status.docker_image}`}
                  >
                    {status.image_short_digest}
                  </span>
                  {/* Show other tags if available (like commit hashes) */}
                  {status.image_all_tags && status.image_all_tags.length > 1 && (
                    <span className="text-xs text-[var(--color-text-muted)]">
                      (
                      {status.image_all_tags
                        .filter((t) => t !== "latest" && t !== status.image_tag)
                        .slice(0, 2)
                        .join(", ") || status.image_tag}
                      )
                    </span>
                  )}
                </>
              ) : (
                // Fallback to just showing the tag
                <span className="text-xs font-mono text-[var(--color-accent-purple)]" title={status.docker_image}>
                  {status.image_tag}
                </span>
              )}
              {status.docker_image && (
                <span
                  className="text-xs text-[var(--color-text-muted)] truncate max-w-[200px]"
                  title={status.docker_image}
                >
                  ({status.docker_image.split("/").pop()?.split(":")[0] || "image"})
                </span>
              )}
            </div>
          )}

          {/* Tag Display/Edit */}
          <div className="flex items-center gap-2 mt-2">
            <Tag className="h-3 w-3 text-[var(--color-text-muted)]" />
            {editingTag ? (
              <div className="flex items-center gap-2">
                <Input
                  value={tagValue}
                  onChange={(e) => setTagValue(e.target.value)}
                  placeholder="Add a description..."
                  className="h-7 text-xs w-64"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleSaveTag}
                  disabled={actionLoading === "tag"}
                >
                  {actionLoading === "tag" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3 text-[var(--color-accent-green)]" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setEditingTag(false);
                    setTagValue(status.tag || "");
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {status.tag || <span className="text-[var(--color-text-muted)] italic">No description</span>}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setTagValue(status.tag || "");
                    setEditingTag(true);
                  }}
                  title="Edit description"
                >
                  <Edit2 className="h-3 w-3 text-[var(--color-text-muted)]" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live health indicator for live-mode deployments */}
          {status.deploy_mode === "live" && liveHealth && (
            <span
              className={`text-xs flex items-center gap-1 ${
                liveHealth.healthy ? "text-[var(--color-accent-green)]" : "text-[var(--color-accent-red)]"
              }`}
              title={`Health check at ${liveHealth.checked_at}${liveHealth.status_code ? ` — HTTP ${liveHealth.status_code}` : ""}`}
            >
              <span
                className={`inline-block h-2 w-2 rounded-full ${liveHealth.healthy ? "bg-[var(--color-accent-green)]" : "bg-[var(--color-accent-red)]"}`}
              />
              {liveHealth.healthy ? "Healthy" : "Unhealthy"}
            </span>
          )}
          {status.status === "running" && (
            <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Auto-syncing
            </span>
          )}
          <Button variant="ghost" size="icon" onClick={fetchStatus} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} title="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--color-border-subtle)]">
        {/* Cancel - only for running/pending */}
        {(status.status === "running" || status.status === "pending") && (
          <Button variant="destructive" size="sm" onClick={handleCancelDeployment} disabled={actionLoading !== null}>
            {actionLoading === "cancel" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <StopCircle className="h-4 w-4 mr-1" />
            )}
            Cancel Deployment
          </Button>
        )}

        {/* Resume - only for failed */}
        {status.status === "failed" && (
          <Button variant="default" size="sm" onClick={handleResumeDeployment} disabled={actionLoading !== null}>
            {actionLoading === "resume" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Play className="h-4 w-4 mr-1" />
            )}
            Resume Deployment
          </Button>
        )}

        {/* Retry Failed - only if there are failed shards */}
        {status.failed_shards > 0 && status.status !== "cancelled" && (
          <Button variant="outline" size="sm" onClick={handleRetryFailed} disabled={actionLoading !== null}>
            {actionLoading === "retry" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Creating VMs...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-1" />
                Retry Failed ({status.failed_shards})
              </>
            )}
          </Button>
        )}

        {/* Rollback - live mode only, not when completed */}
        {status.deploy_mode === "live" && status.status !== "completed" && status.status !== "cancelled" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRollback}
            disabled={actionLoading !== null}
            className="border-[var(--color-accent-amber)] text-[var(--color-accent-amber)] hover:bg-[var(--color-accent-amber)]/10"
          >
            {actionLoading === "rollback" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Rolling back...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-1" />
                Rollback
              </>
            )}
          </Button>
        )}
      </div>

      {/* Action Messages */}
      {actionError && (
        <div className="mt-3 p-2 rounded bg-[var(--color-status-error-bg)] border border-[var(--color-status-error-border-strong)]">
          <p className="text-sm text-[var(--color-accent-red)] flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {actionError}
          </p>
        </div>
      )}
      {actionSuccess && (
        <div className="mt-3 p-3 rounded bg-[var(--color-status-success-bg-alt)] border border-[var(--color-status-success-border-alt)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[var(--color-accent-green)] flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {actionSuccess}
            </p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActionSuccess(null)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </CardHeader>
  );
}
