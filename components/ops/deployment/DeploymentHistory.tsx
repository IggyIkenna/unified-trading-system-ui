"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  AlertCircle,
  Trash2,
  Square,
  CheckSquare,
  StopCircle,
  Tag,
  Edit2,
  Check,
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
import { cn, formatDateTime } from "@/lib/utils";
import {
  getDeployments,
  bulkDeleteDeployments,
  cancelDeployment,
  updateDeploymentTag,
} from "@/hooks/deployment/_api-stub";
import { Input } from "@/components/ui/input";

interface DeploymentSummary {
  deployment_id: string;
  service: string;
  compute_type: string;
  status: string;
  created_at: string;
  total_shards: number;
  progress: string;
  tag?: string | null;
  deploy_mode?: "batch" | "live";
  cloud_provider?: string;
}

interface DeploymentHistoryProps {
  serviceName?: string;
  onViewDetails?: (deploymentId: string) => void;
}

export function DeploymentHistory({
  serviceName = "all",
  onViewDetails,
}: DeploymentHistoryProps) {
  const [deployments, setDeployments] = useState<DeploymentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Inline tag editing
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagValue, setEditingTagValue] = useState<string>("");
  const [savingTag, setSavingTag] = useState(false);

  const fetchDeployments = useCallback(
    async (
      forceRefresh = false,
      clearSelection = false,
      isBackgroundPoll = false,
    ) => {
      try {
        // Only show loading spinner on initial/manual fetches, NOT background polls.
        // Background polls update data silently to avoid UI flickering.
        if (!isBackgroundPoll) {
          setLoading(true);
        }
        setError(null);
        const response = await getDeployments({
          service: serviceName,
          limit: 20,
          forceRefresh,
        });
        setDeployments(
          (response.deployments || []).map((d) => ({
            deployment_id: d.id,
            service: d.service,
            compute_type: (d.parameters?.compute as string) ?? "cloud_run",
            status: d.status,
            created_at: d.created_at,
            total_shards: d.total_shards,
            progress: `${d.completed_shards}/${d.total_shards}`,
            tag: null,
            deploy_mode: d.parameters?.mode as "batch" | "live" | undefined,
            cloud_provider: d.parameters?.cloud_provider as string | undefined,
          })),
        );
        if (clearSelection) setSelectedIds(new Set());
      } catch (err) {
        // Only show errors for manual fetches, not background polls
        if (!isBackgroundPoll) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch deployments",
          );
        }
      } finally {
        if (!isBackgroundPoll) {
          setLoading(false);
        }
      }
    },
    [serviceName],
  );

  // Initial fetch on mount
  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  // Poll for updates when any deployment is pending or running (so status/progress update in the list)
  const hasActiveDeployments = deployments.some(
    (d) => d.status === "pending" || d.status === "running",
  );
  useEffect(() => {
    if (!hasActiveDeployments) return;
    const interval = setInterval(() => {
      fetchDeployments(true, false, true); // force_refresh, don't clear selection, IS background poll
    }, 30000); // every 30s while there is at least one active deployment (silent update)
    return () => clearInterval(interval);
  }, [hasActiveDeployments, fetchDeployments]);

  const toggleSelection = (deploymentId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(deploymentId)) {
        next.delete(deploymentId);
      } else {
        next.add(deploymentId);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === deployments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(deployments.map((d) => d.deployment_id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.size} deployment(s)? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setDeleteError(null);
      const result = await bulkDeleteDeployments(Array.from(selectedIds));

      if (result.failed > 0) {
        setDeleteError(`Deleted ${result.deleted}, failed ${result.failed}`);
      }

      // Refresh the list (force refresh so deleted items disappear; clear selection)
      await fetchDeployments(true, true);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkCancel = async () => {
    // Get selected deployments that are running
    const runningSelected = deployments.filter(
      (d) =>
        selectedIds.has(d.deployment_id) &&
        (d.status === "running" || d.status === "pending"),
    );

    if (runningSelected.length === 0) {
      setCancelError("No running deployments selected");
      return;
    }

    const confirmed = window.confirm(
      `Cancel ${runningSelected.length} running deployment(s)? All running shards will be stopped.`,
    );

    if (!confirmed) return;

    try {
      setCancelling(true);
      setCancelError(null);

      let cancelled = 0;
      let failed = 0;

      for (const dep of runningSelected) {
        try {
          await cancelDeployment(dep.deployment_id);
          cancelled++;
        } catch {
          failed++;
        }
      }

      if (failed > 0) {
        setCancelError(`Cancelled ${cancelled}, failed ${failed}`);
      }

      // Refresh the list (force refresh so status updates; clear selection)
      await fetchDeployments(true, true);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setCancelling(false);
    }
  };

  const handleSaveTag = async (deploymentId: string) => {
    setSavingTag(true);
    try {
      await updateDeploymentTag(deploymentId, editingTagValue.trim() || null);
      setDeployments((prev) =>
        prev.map((d) =>
          d.deployment_id === deploymentId
            ? { ...d, tag: editingTagValue.trim() || null }
            : d,
        ),
      );
      setEditingTagId(null);
    } catch {
      // silently ignore — tag is non-critical
    } finally {
      setSavingTag(false);
    }
  };

  // Count running deployments in selection
  const selectedRunningCount = deployments.filter(
    (d) =>
      selectedIds.has(d.deployment_id) &&
      (d.status === "running" || d.status === "pending"),
  ).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "succeeded":
      case "clean":
        return <Badge variant="success">Completed</Badge>;
      case "completed_pending_delete":
        return (
          <Badge
            variant="warning"
            title="VMs may still be deleting; check and delete manually if they remain"
          >
            Completed (pending delete)
          </Badge>
        );
      case "completed_with_errors":
        return <Badge variant="warning">Completed with Errors</Badge>;
      case "completed_with_warnings":
        return <Badge variant="warning">Completed with Warnings</Badge>;
      case "running":
        return <Badge variant="running">Running</Badge>;
      case "failed":
        return <Badge variant="error">Failed</Badge>;
      case "pending":
        return <Badge variant="pending">Pending</Badge>;
      case "cancelled":
        return <Badge variant="warning">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "succeeded":
      case "clean":
        return (
          <CheckCircle2 className="h-4 w-4 text-[var(--color-accent-green)]" />
        );
      case "completed_pending_delete":
        return (
          <AlertCircle className="h-4 w-4 text-[var(--color-accent-amber)]" />
        );
      case "completed_with_errors":
      case "completed_with_warnings":
        return (
          <AlertCircle className="h-4 w-4 text-[var(--color-accent-amber)]" />
        );
      case "running":
        return (
          <Loader2 className="h-4 w-4 text-[var(--color-accent-cyan)] animate-spin" />
        );
      case "failed":
        return <XCircle className="h-4 w-4 text-[var(--color-accent-red)]" />;
      case "pending":
        return <Clock className="h-4 w-4 text-[var(--color-text-muted)]" />;
      case "cancelled":
        return (
          <AlertCircle className="h-4 w-4 text-[var(--color-accent-amber)]" />
        );
      default:
        return <Clock className="h-4 w-4 text-[var(--color-text-muted)]" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent-cyan)]" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deployment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 rounded-lg status-error">
            <AlertCircle className="h-5 w-5 text-[var(--color-accent-red)] shrink-0" />
            <div>
              <p className="text-sm font-medium text-[var(--color-accent-red)]">
                Failed to load deployments
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                {error}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchDeployments(true, true)}
                className="mt-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (deployments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Deployment History</CardTitle>
              <CardDescription>
                Recent deployments for {serviceName}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDeployments(true, true)}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-12 w-12 text-[var(--color-text-muted)] mb-4" />
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
              No Deployment History
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-md">
              No deployments found for {serviceName}. Run a deployment to see it
              here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Deployment History</CardTitle>
            <CardDescription>
              {deployments.length} recent deployments for {serviceName}
              {selectedIds.size > 0 && (
                <span className="ml-2 text-[var(--color-accent-cyan)]">
                  ({selectedIds.size} selected)
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <>
                {/* Cancel running deployments */}
                {selectedRunningCount > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkCancel}
                    disabled={cancelling}
                  >
                    {cancelling ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <StopCircle className="h-4 w-4 mr-1" />
                    )}
                    Cancel ({selectedRunningCount})
                  </Button>
                )}
                {/* Delete deployments */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={deleting}
                  className="text-[var(--color-accent-red)] hover:bg-[var(--color-accent-red)]/10"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-1" />
                  )}
                  Delete ({selectedIds.size})
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              title={
                selectedIds.size === deployments.length
                  ? "Deselect all"
                  : "Select all"
              }
            >
              {selectedIds.size === deployments.length ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDeployments(true, true)}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {(deleteError || cancelError) && (
          <div className="mt-2 p-2 rounded status-error">
            <p className="text-sm text-[var(--color-accent-red)]">
              {deleteError || cancelError}
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-[var(--color-border-subtle)]">
          {deployments.map((deployment) => (
            <div
              key={deployment.deployment_id}
              className={cn(
                "flex items-center gap-4 p-4 hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer",
                selectedIds.has(deployment.deployment_id) &&
                  "bg-[var(--color-accent-cyan)]/10",
              )}
              onClick={() => onViewDetails?.(deployment.deployment_id)}
            >
              {/* Checkbox */}
              <div
                className="shrink-0 cursor-pointer p-1 rounded hover:bg-[var(--color-bg-tertiary)]"
                onClick={(e) => toggleSelection(deployment.deployment_id, e)}
              >
                {selectedIds.has(deployment.deployment_id) ? (
                  <CheckSquare className="h-4 w-4 text-[var(--color-accent-cyan)]" />
                ) : (
                  <Square className="h-4 w-4 text-[var(--color-text-muted)]" />
                )}
              </div>

              <div className="shrink-0">{getStatusIcon(deployment.status)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-sm font-mono text-[var(--color-text-primary)] truncate">
                    {deployment.deployment_id}
                  </code>
                  {getStatusBadge(deployment.status)}
                  {deployment.deploy_mode === "live" && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--color-accent-cyan)]/15 text-[var(--color-accent-cyan)]">
                      LIVE
                    </span>
                  )}
                </div>
                {/* Tag display + inline edit */}
                <div className="flex items-center gap-1 mb-1">
                  <Tag className="h-3 w-3 text-[var(--color-text-muted)] shrink-0" />
                  {editingTagId === deployment.deployment_id ? (
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Input
                        value={editingTagValue}
                        onChange={(e) => setEditingTagValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            handleSaveTag(deployment.deployment_id);
                          if (e.key === "Escape") setEditingTagId(null);
                        }}
                        className="h-6 text-xs w-40"
                        autoFocus
                        placeholder="Add description..."
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0.5 h-auto hover:text-[var(--color-accent-green)]"
                        onClick={() => handleSaveTag(deployment.deployment_id)}
                        disabled={savingTag}
                      >
                        {savingTag ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0.5 h-auto hover:text-[var(--color-accent-red)]"
                        onClick={() => setEditingTagId(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-1 group"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs text-[var(--color-text-secondary)] truncate max-w-xs">
                        {deployment.tag || (
                          <span className="text-[var(--color-text-muted)] italic">
                            No tag
                          </span>
                        )}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 p-0.5 h-auto hover:text-[var(--color-accent-cyan)]"
                        onClick={() => {
                          setEditingTagId(deployment.deployment_id);
                          setEditingTagValue(deployment.tag ?? "");
                        }}
                        title="Edit tag"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                  <span>
                    <Clock className="h-3 w-3 inline mr-1" />
                    {deployment.created_at
                      ? formatDateTime(deployment.created_at)
                      : "Unknown"}
                  </span>
                  <span>{deployment.total_shards} shards</span>
                  <span className="font-mono">{deployment.progress}</span>
                  <Badge variant="outline" className="text-xs">
                    {deployment.compute_type || "cloud_run"}
                  </Badge>
                  {deployment.cloud_provider && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        color:
                          deployment.cloud_provider === "aws"
                            ? "var(--color-accent-orange)"
                            : "var(--color-accent-cyan)",
                        borderColor:
                          deployment.cloud_provider === "aws"
                            ? "var(--color-accent-orange)"
                            : "var(--color-accent-cyan)",
                      }}
                    >
                      {deployment.cloud_provider.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>

              <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
