"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  cancelDeployment,
  resumeDeployment,
  verifyDeploymentCompletion,
  retryFailedShards,
  cancelShard,
  updateDeploymentTag,
  getDeploymentReport,
  getRerunCommands,
  getDeploymentEvents,
  rollbackLiveDeployment,
  getLiveDeploymentHealth,
} from "@/hooks/deployment/_api-stub";
import type { DeploymentReport, RerunCommands } from "@/hooks/deployment/_api-stub";
import type { ShardEvent, LiveHealthStatus } from "@/lib/types/deployment";

import { filterDeploymentShards } from "./filter-deployment-shards";
import {
  CLASSIFICATION_FILTERS,
  type DeploymentStatusData,
  type LogEntry,
  type ShardDetail,
} from "./deployment-details-types";
import { useDeploymentDetailsStatusSync } from "./use-deployment-details-status-sync";

export interface DeploymentDetailsModelInput {
  deploymentId: string;
  onClose: () => void;
}

export function useDeploymentDetailsModel({ deploymentId, onClose }: DeploymentDetailsModelInput) {
  const [status, setStatus] = useState<DeploymentStatusData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsMessage, setLogsMessage] = useState<string | null>(null);
  const [logsHoursBack, setLogsHoursBack] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllShards, setShowAllShards] = useState(false);
  const [viewMode, setViewMode] = useState<"flat" | "grouped">("grouped");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["CEFI", "TRADFI", "DEFI"]));

  // Shard loading & filtering
  const [allShards, setAllShards] = useState<ShardDetail[] | null>(null);
  const [shardsLoading, setShardsLoading] = useState(false);
  const [shardStatusFilter, setShardStatusFilter] = useState<string>("all");
  const [shardSearchText, setShardSearchText] = useState("");

  // Legacy paginated shard loading (kept for backward compat with backend)
  const [shardPage, setShardPage] = useState<ShardDetail[] | null>(null);
  const [_shardPageTotal, setShardPageTotal] = useState<number | null>(null);
  const [shardPageOffset, setShardPageOffset] = useState(0);
  const [shardPageLimit] = useState(200);
  const [shardPageStatus, setShardPageStatus] = useState<
    "running" | "pending" | "failed" | "succeeded" | "cancelled" | "all"
  >("all");
  const [shardPageCategory, setShardPageCategory] = useState<string>("");
  const [shardPageLoading, setShardPageLoading] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Shard selection
  const [selectedShards, setSelectedShards] = useState<Set<string>>(new Set());

  // Tag editing
  const [editingTag, setEditingTag] = useState(false);
  const [tagValue, setTagValue] = useState("");

  // Infrastructure report
  const [report, setReport] = useState<DeploymentReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [rerunCommands, setRerunCommands] = useState<RerunCommands | null>(null);

  // Event timeline
  const [events, setEvents] = useState<ShardEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsExpanded, setEventsExpanded] = useState(false);

  // Live health
  const [liveHealth, setLiveHealth] = useState<LiveHealthStatus | null>(null);

  // Shard log modal
  const [selectedShardForLogs, setSelectedShardForLogs] = useState<ShardDetail | null>(null);
  const [shardLogs, setShardLogs] = useState<LogEntry[]>([]);
  const [shardLogsLoading, setShardLogsLoading] = useState(false);
  const [shardLogsMessage, setShardLogsMessage] = useState<string | null>(null);

  // VM logs: pick a shard from Logs tab when "must be requested per shard"
  const [vmLogShardId, setVmLogShardId] = useState("");

  // Log search & severity filter
  const [logSearch, setLogSearch] = useState("");
  const [logSeverityFilter, setLogSeverityFilter] = useState<"ALL" | "ERROR" | "WARNING" | "INFO">("ALL");

  // Auto-follow logs
  const [followLogs, setFollowLogs] = useState(false);
  const [lastLineCount, setLastLineCount] = useState(0);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const refetchStatusRef = useRef<(() => Promise<void>) | null>(null);
  const autoShardsRequestedRef = useRef(false);

  useEffect(() => {
    // Reset shard state when switching deployments
    setAllShards(null);
    setShardsLoading(false);
    autoShardsRequestedRef.current = false;
    setShardStatusFilter("all");
    setShardSearchText("");
    setShardPage(null);
    setShardPageTotal(null);
    setShardPageOffset(0);
    setShardPageStatus("all");
    setShardPageCategory("");
  }, [deploymentId]);

  // Clear action messages after 5 seconds
  useEffect(() => {
    if (actionSuccess || actionError) {
      const timer = setTimeout(() => {
        setActionSuccess(null);
        setActionError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess, actionError]);

  // Action handlers
  const handleCancelDeployment = async () => {
    if (!window.confirm("Are you sure you want to cancel this deployment? All running shards will be stopped.")) return;

    try {
      setActionLoading("cancel");
      setActionError(null);
      const result = await cancelDeployment(deploymentId);
      setActionSuccess(`Deployment cancelled. ${result.cancelled_shards} shard(s) stopped.`);
      fetchStatus();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to cancel deployment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeDeployment = async () => {
    try {
      setActionLoading("resume");
      setActionError(null);
      const result = await resumeDeployment(deploymentId);
      setActionSuccess(result.message ?? null);
      fetchStatus();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to resume deployment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyCompletion = async (force = false) => {
    try {
      setActionLoading("verify");
      setActionError(null);
      await verifyDeploymentCompletion(deploymentId, { force });
      setActionSuccess(force ? "Verification refreshed." : "Verification completed.");
      fetchStatus();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to verify completion");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetryFailed = async () => {
    try {
      setActionLoading("retry");
      setActionError(null);
      const result = await retryFailedShards(deploymentId);
      setActionSuccess(result.message ?? null);
      fetchStatus();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to retry failed shards");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelShard = async (shardId: string) => {
    try {
      setActionLoading(`shard-${shardId}`);
      setActionError(null);
      const result = await cancelShard(deploymentId, shardId);
      setActionSuccess(result.message ?? null);
      fetchStatus();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : `Failed to cancel shard ${shardId}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSelectedShards = async () => {
    if (selectedShards.size === 0) return;
    if (!window.confirm(`Cancel ${selectedShards.size} selected shard(s)?`)) return;

    try {
      setActionLoading("cancel-selected");
      setActionError(null);

      let cancelled = 0;
      let failed = 0;

      for (const shardId of selectedShards) {
        try {
          await cancelShard(deploymentId, shardId);
          cancelled++;
        } catch {
          failed++;
        }
      }

      setSelectedShards(new Set());
      setActionSuccess(`Cancelled ${cancelled} shard(s)${failed > 0 ? `, ${failed} failed` : ""}`);
      fetchStatus();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to cancel selected shards");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveTag = async () => {
    try {
      setActionLoading("tag");
      const result = await updateDeploymentTag(deploymentId, tagValue || null);
      setStatus((prev) => (prev ? { ...prev, tag: tagValue || null } : null));
      setEditingTag(false);
      setActionSuccess(result.message ?? null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update tag");
    } finally {
      setActionLoading(null);
    }
  };

  const fetchEvents = useCallback(async () => {
    if (eventsLoading) return;
    setEventsLoading(true);
    try {
      const stream = await getDeploymentEvents(deploymentId);
      setEvents(stream.events);
    } catch {
      // silently ignore — events endpoint may not be available for all deployments
    } finally {
      setEventsLoading(false);
    }
  }, [deploymentId, eventsLoading]);

  const fetchLiveHealth = useCallback(async () => {
    if (!status?.service_url) return;
    try {
      const health = await getLiveDeploymentHealth(deploymentId, status.service, status.region ?? "");
      setLiveHealth(health);
    } catch {
      // silently ignore
    }
  }, [deploymentId, status?.service, status?.region, status?.service_url]);

  const handleRollback = async () => {
    if (!status) return;
    if (
      !window.confirm(
        `Roll back live deployment "${deploymentId}"? The previous revision will receive 100% of traffic.`,
      )
    )
      return;
    try {
      setActionLoading("rollback");
      setActionError(null);
      await rollbackLiveDeployment(deploymentId, {
        service: status.service,
        region: status.region ?? "",
      });
      setActionSuccess("Rollback initiated. Traffic shifted to previous revision.");
      fetchStatus();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Rollback failed");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleShardSelection = (shardId: string) => {
    setSelectedShards((prev) => {
      const next = new Set(prev);
      if (next.has(shardId)) {
        next.delete(shardId);
      } else {
        next.add(shardId);
      }
      return next;
    });
  };

  const selectAllRunningShards = () => {
    const source = allShards ?? status?.shards;
    if (!source) return;
    const runningShards = source.filter((s) => s.status === "running").map((s) => s.shard_id);
    if (runningShards.length === selectedShards.size && runningShards.every((id) => selectedShards.has(id))) {
      setSelectedShards(new Set());
    } else {
      setSelectedShards(new Set(runningShards));
    }
  };

  // Group shards by category (CEFI, TRADFI, DEFI, etc.)
  const groupShardsByCategory = (shards: ShardDetail[]): Record<string, ShardDetail[]> => {
    const grouped: Record<string, ShardDetail[]> = {};
    for (const shard of shards) {
      const parts = shard.shard_id.split("-");
      const category = parts[0] || "OTHER";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(shard);
    }
    // Sort categories: CEFI, TRADFI, DEFI first, then others alphabetically
    const categoryOrder = ["CEFI", "TRADFI", "DEFI"];
    const sortedGrouped: Record<string, ShardDetail[]> = {};
    for (const cat of categoryOrder) {
      if (grouped[cat]) {
        sortedGrouped[cat] = grouped[cat];
      }
    }
    for (const cat of Object.keys(grouped).sort()) {
      if (!sortedGrouped[cat]) {
        sortedGrouped[cat] = grouped[cat];
      }
    }
    return sortedGrouped;
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const getCategoryStats = (shards: ShardDetail[]) => {
    return {
      total: shards.length,
      completed: shards.filter((s) => s.status === "succeeded").length,
      running: shards.filter((s) => s.status === "running").length,
      failed: shards.filter((s) => s.status === "failed").length,
      pending: shards.filter((s) => s.status === "pending").length,
      cancelled: shards.filter((s) => s.status === "cancelled").length,
    };
  };

  const fetchReport = async () => {
    try {
      setReportLoading(true);
      const reportData = await getDeploymentReport(deploymentId);
      setReport(reportData);

      // Also fetch rerun commands for failed shards
      const commands = await getRerunCommands(deploymentId, {
        failedOnly: true,
      });
      setRerunCommands(commands);
    } catch {
      // Error surfaced via report state
    } finally {
      setReportLoading(false);
    }
  };

  // Use ref to prevent concurrent status fetches
  const isFetchingStatus = useRef(false);

  const fetchStatus = async () => {
    // Prevent concurrent fetches
    if (isFetchingStatus.current) return;
    isFetchingStatus.current = true;

    try {
      setLoading(true);
      // Fetch summary only for speed (avoid downloading tens of thousands of shards)
      // Logs are fetched separately via the Logs tab
      const response = await fetch(`/api/deployments/${deploymentId}?skip_logs=true&summary=true`);
      if (!response.ok) {
        let message = "Failed to fetch status";
        try {
          const err = await response.json();
          message = err.detail || message;
        } catch {
          // non-JSON or empty body
        }
        if (response.status === 404) {
          message = `Deployment not found. It may have been deleted or the dashboard may be using a different environment. (${message})`;
        }
        throw new Error(message);
      }
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch status");
    } finally {
      setLoading(false);
      isFetchingStatus.current = false;
    }
  };

  // Legacy: paginated shard fetching (kept for backward compat, replaced by loadAllShards for UI)
  const fetchShardPage = useCallback(
    async (opts?: { offset?: number; status?: typeof shardPageStatus; category?: string }) => {
      const nextOffset = opts?.offset ?? shardPageOffset;
      const nextStatus = opts?.status ?? shardPageStatus;
      const nextCategory = opts?.category ?? shardPageCategory;

      try {
        setShardPageLoading(true);

        const params = new URLSearchParams();
        params.set("limit", String(shardPageLimit));
        params.set("offset", String(nextOffset));
        if (nextStatus !== "all") params.append("status", nextStatus);
        if (nextCategory.trim()) params.set("category", nextCategory.trim());

        const response = await fetch(`/api/deployments/${deploymentId}/shards?${params.toString()}`);
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.detail || "Failed to fetch shards");
        }

        const data = await response.json();
        setShardPage(data.shards || []);
        setShardPageTotal(typeof data.total === "number" ? data.total : null);
        setShardPageOffset(nextOffset);
      } catch {
        // Error surfaced via shard page state
      } finally {
        setShardPageLoading(false);
      }
    },
    [deploymentId, shardPageLimit, shardPageOffset, shardPageStatus, shardPageCategory],
  );

  // API allows max limit=1000; use it so the request succeeds (was 10000 → 422)
  const SHARDS_PAGE_LIMIT = 1000;

  // Load all shards for a deployment (for client-side search/filter)
  const loadAllShards = useCallback(async () => {
    if (shardsLoading) return;
    setShardsLoading(true);
    try {
      const response = await fetch(`/api/deployments/${deploymentId}/shards?limit=${SHARDS_PAGE_LIMIT}&offset=0`);
      if (!response.ok) {
        // Fallback: full status includes shards (for deployments with many shards we only get first page from /shards)
        const fullResponse = await fetch(`/api/deployments/${deploymentId}?skip_logs=true`);
        if (fullResponse.ok) {
          const data = await fullResponse.json();
          if (data.shards) {
            setAllShards(data.shards);
          }
        }
        return;
      }
      const data = await response.json();
      setAllShards(data.shards || []);
    } catch {
      // Error surfaced via allShards state
    } finally {
      setShardsLoading(false);
    }
  }, [deploymentId, shardsLoading]);

  // Auto-load shards when deployment has moderate shard count so Shards tab is ready without clicking
  useEffect(() => {
    if (
      status?.total_shards != null &&
      status.total_shards > 0 &&
      status.total_shards <= SHARDS_PAGE_LIMIT &&
      allShards === null &&
      !shardsLoading &&
      !autoShardsRequestedRef.current
    ) {
      autoShardsRequestedRef.current = true;
      loadAllShards();
    }
  }, [status?.total_shards, allShards, shardsLoading, loadAllShards]);

  const filteredShards = React.useMemo(() => {
    const source = allShards ?? status?.shards ?? shardPage ?? [];
    return filterDeploymentShards(source, shardStatusFilter, shardSearchText, status?.shard_classifications);
  }, [allShards, status?.shards, shardPage, shardStatusFilter, shardSearchText, status?.shard_classifications]);

  // Use ref to prevent concurrent fetches
  const isFetchingLogs = useRef(false);

  const fetchLogs = useCallback(
    async (severity: string = "DEFAULT", incremental: boolean = false, hoursBack?: number | null) => {
      // Prevent concurrent fetches
      if (isFetchingLogs.current) return;
      isFetchingLogs.current = true;

      try {
        if (!incremental) setLogsLoading(true);

        // For incremental fetching, use after_line to get only new logs
        const afterLine = incremental ? lastLineCount : 0;
        // VM: request aggregated logs from up to 10 shards (no shard_id)
        const isVm = status?.compute_type === "vm";
        const logsUrl = `/api/deployments/${deploymentId}/logs?severity=${severity}&after_line=${afterLine}${typeof (hoursBack ?? logsHoursBack) === "number" ? `&hours_back=${hoursBack ?? logsHoursBack}` : ""}${isVm ? "&max_shards=10" : ""}`;
        const response = await fetch(logsUrl);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          // 429 = Cloud Logging rate limit (60 reads/min); show message instead of generic error
          if (response.status === 429) {
            if (!incremental) {
              setLogs([]);
              setLogsMessage(data.message || "Cloud Logging rate limit exceeded. Wait a minute and try again.");
            }
            return;
          }
          throw new Error(data.detail || data.message || "Failed to fetch logs");
        }

        if (incremental && afterLine > 0) {
          // Append new logs to existing
          if (data.logs && data.logs.length > 0) {
            setLogs((prev) => [...prev, ...data.logs]);
          }
        } else {
          // Full refresh
          setLogs(data.logs || []);
        }

        // Update last line count for next incremental fetch
        setLastLineCount(data.total_lines || 0);
        setLogsMessage(data.message || null);

        // Auto-scroll to bottom if following and new logs arrived
        if (followLogs && data.logs && data.logs.length > 0 && logsContainerRef.current) {
          setTimeout(() => {
            logsContainerRef.current?.scrollTo({
              top: logsContainerRef.current.scrollHeight,
              behavior: "smooth",
            });
          }, 100);
        }
      } catch (err) {
        if (!incremental) {
          setLogs([]);
          const msg = err instanceof Error ? err.message : String(err);
          setLogsMessage(msg.includes("429") || msg.toLowerCase().includes("rate limit") ? msg : null);
        }
      } finally {
        setLogsLoading(false);
        isFetchingLogs.current = false;
      }
    },
    [deploymentId, lastLineCount, followLogs, logsHoursBack, status?.compute_type],
  );

  // Auto-follow polling effect
  useEffect(() => {
    if (!followLogs) return;

    // Poll every 15s to avoid exceeding Cloud Logging 60 reads/min quota
    const pollInterval = setInterval(() => {
      fetchLogs("DEFAULT", true);
    }, 15000);

    return () => clearInterval(pollInterval);
  }, [followLogs, fetchLogs]);

  const fetchShardLogs = async (shardId: string) => {
    try {
      setShardLogsLoading(true);
      setShardLogs([]);
      setShardLogsMessage(null);

      const url = `/api/deployments/${deploymentId}/logs?shard_id=${shardId}`;

      const response = await fetch(url);

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 429) {
          setShardLogsMessage(data.message || "Cloud Logging rate limit exceeded. Wait a minute and try again.");
          return;
        }
        throw new Error(data.detail || data.message || "Failed to fetch shard logs");
      }

      setShardLogs(data.logs || []);
      setShardLogsMessage(data.message || null);
    } catch {
      setShardLogsMessage("Failed to fetch logs");
    } finally {
      setShardLogsLoading(false);
    }
  };

  const openShardLogs = (shard: ShardDetail) => {
    setSelectedShardForLogs(shard);
    fetchShardLogs(shard.shard_id);
  };

  const closeShardLogs = () => {
    setSelectedShardForLogs(null);
    setShardLogs([]);
    setShardLogsMessage(null);
  };

  const { prevStatusRef, sseConnected } = useDeploymentDetailsStatusSync({
    deploymentId,
    setStatus,
    setError,
    setLoading,
    refetchStatusRef,
    status,
    allShards,
    loadAllShards,
    fetchLiveHealth,
  });

  const hasLoadedShards = allShards !== null || status?.shards != null;
  const shardsForDisplay = hasLoadedShards ? filteredShards : (shardPage ?? []);
  const displayShards = shardsForDisplay.slice(0, showAllShards ? undefined : 50);

  return {
    deploymentId,
    onClose,
    status,
    setStatus,
    logs,
    setLogs,
    logsMessage,
    setLogsMessage,
    logsHoursBack,
    setLogsHoursBack,
    loading,
    logsLoading,
    error,
    setError,
    showAllShards,
    setShowAllShards,
    viewMode,
    setViewMode,
    expandedCategories,
    setExpandedCategories,
    allShards,
    setAllShards,
    shardsLoading,
    shardStatusFilter,
    setShardStatusFilter,
    shardSearchText,
    setShardSearchText,
    shardPage,
    setShardPage,
    _shardPageTotal,
    setShardPageTotal,
    shardPageOffset,
    setShardPageOffset,
    shardPageLimit,
    shardPageStatus,
    setShardPageStatus,
    shardPageCategory,
    setShardPageCategory,
    shardPageLoading,
    actionLoading,
    setActionLoading,
    actionError,
    setActionError,
    actionSuccess,
    setActionSuccess,
    selectedShards,
    setSelectedShards,
    editingTag,
    setEditingTag,
    tagValue,
    setTagValue,
    report,
    setReport,
    reportLoading,
    setReportLoading,
    rerunCommands,
    setRerunCommands,
    events,
    setEvents,
    eventsLoading,
    eventsExpanded,
    setEventsExpanded,
    liveHealth,
    setLiveHealth,
    selectedShardForLogs,
    setSelectedShardForLogs,
    shardLogs,
    setShardLogs,
    shardLogsLoading,
    setShardLogsLoading,
    shardLogsMessage,
    setShardLogsMessage,
    vmLogShardId,
    setVmLogShardId,
    logSearch,
    setLogSearch,
    logSeverityFilter,
    setLogSeverityFilter,
    followLogs,
    setFollowLogs,
    logsContainerRef,
    refetchStatusRef,
    autoShardsRequestedRef,
    handleCancelDeployment,
    handleResumeDeployment,
    handleVerifyCompletion,
    handleRetryFailed,
    handleCancelShard,
    handleCancelSelectedShards,
    handleSaveTag,
    fetchEvents,
    fetchLiveHealth,
    fetchLogs,
    fetchReport,
    fetchShardPage,
    fetchStatus,
    fetchShardLogs,
    openShardLogs,
    closeShardLogs,
    toggleShardSelection,
    selectAllRunningShards,
    groupShardsByCategory,
    getCategoryStats,
    toggleCategory,
    loadAllShards,
    handleRollback,
    filteredShards,
    hasLoadedShards,
    shardsForDisplay,
    displayShards,
    SHARDS_PAGE_LIMIT,
    CLASSIFICATION_FILTERS,
    isFetchingStatus,
    isFetchingLogs,
    prevStatusRef,
    sseConnected,
  };
}

export type DeploymentDetailsModel = ReturnType<typeof useDeploymentDetailsModel>;
