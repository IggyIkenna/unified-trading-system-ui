import React, { useState, useEffect, useRef, useCallback } from "react";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogContent } from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { cn, formatDateTime } from "../lib/utils";
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
} from "../api/client";
import type { DeploymentReport, RerunCommands } from "../api/client";
import type { ShardEvent, LiveHealthStatus } from "../types/index";
import { VM_EVENT_TYPES } from "../types/index";

interface ExecutionAttempt {
  attempt: number;
  zone?: string;
  region?: string;
  started_at?: string;
  ended_at?: string;
  status: string;
  failure_reason?: string;
  failure_category?: string;
  job_id?: string;
}

interface ShardDetail {
  shard_id: string;
  status: string;
  job_id?: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  dimensions?: Record<string, unknown>;
  retries?: number;
  args?: string[];
  execution_history?: ExecutionAttempt[];
  final_zone?: string;
  final_region?: string;
  zone_switches?: number;
  region_switches?: number;
  failure_category?: string;
}

interface LogAnalysisEntry {
  shard_id: string;
  message: string;
  timestamp?: string;
  severity: string;
}

interface LogAnalysis {
  errors: LogAnalysisEntry[];
  warnings: LogAnalysisEntry[];
  error_count: number;
  warning_count: number;
  has_stack_traces: boolean;
}

interface DeploymentStatusData {
  deployment_id: string;
  service: string;
  status: string;
  status_detail?: string; // "clean" | "completed_with_warnings" | "completed_with_errors"
  compute_type: string;
  created_at?: string;
  updated_at?: string;
  total_shards: number;
  completed_shards: number;
  completed_with_verification?: number | null;
  completed_with_warnings?: number | null;
  completed_with_errors?: number | null;
  completed?: number | null;
  shard_classifications?: Record<string, string>;
  classification_counts?: Record<string, number>;
  failed_shards: number;
  running_shards: number;
  pending_shards: number;
  progress_percentage: number;
  shard_counts: Record<string, number>;
  has_force?: boolean;
  gcs_fuse_active?: boolean;
  gcs_fuse_reason?: string;
  shards?: ShardDetail[];
  shards_by_category?: Record<string, ShardDetail[]>;
  region?: string;
  zone?: string;
  tag?: string | null;
  docker_image?: string;
  image_tag?: string; // Tag from config (usually 'latest')
  image_digest?: string; // Full sha256 digest
  image_short_digest?: string; // First 12 chars of digest
  image_all_tags?: string[]; // All tags pointing to this digest
  error_message?: string;
  log_analysis?: LogAnalysis | null;
  deploy_mode?: "batch" | "live";
  service_url?: string;
  retry_stats?: {
    total_retries: number;
    succeeded_after_retry: number;
    failed_after_retry: number;
  };
}

interface LogEntry {
  timestamp: string;
  severity: string;
  message: string;
  execution_name?: string;
  shard?: string;
  logger?: string;
}

// Classification filter keys (from the new shard outcome classification system)
// Defined at module level to avoid recreation on every render
const CLASSIFICATION_FILTERS = [
  "VERIFIED",
  "EXPECTED_SKIP",
  "DATA_STALE",
  "DATA_MISSING",
  "UNVERIFIED",
  "COMPLETED_WITH_ERRORS",
  "COMPLETED_WITH_WARNINGS",
  "INFRA_FAILURE",
  "TIMEOUT_FAILURE",
  "CODE_FAILURE",
  "VM_DIED",
  "NEVER_RAN",
  "CANCELLED",
  "STILL_RUNNING",
] as const;

interface DeploymentDetailsProps {
  deploymentId: string;
  onClose: () => void;
}

export function DeploymentDetails({
  deploymentId,
  onClose,
}: DeploymentDetailsProps) {
  const [status, setStatus] = useState<DeploymentStatusData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsMessage, setLogsMessage] = useState<string | null>(null);
  const [logsHoursBack, setLogsHoursBack] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllShards, setShowAllShards] = useState(false);
  const [viewMode, setViewMode] = useState<"flat" | "grouped">("grouped");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["CEFI", "TRADFI", "DEFI"]),
  );

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
  const [rerunCommands, setRerunCommands] = useState<RerunCommands | null>(
    null,
  );

  // Event timeline
  const [events, setEvents] = useState<ShardEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsExpanded, setEventsExpanded] = useState(false);

  // Live health
  const [liveHealth, setLiveHealth] = useState<LiveHealthStatus | null>(null);

  // Shard log modal
  const [selectedShardForLogs, setSelectedShardForLogs] =
    useState<ShardDetail | null>(null);
  const [shardLogs, setShardLogs] = useState<LogEntry[]>([]);
  const [shardLogsLoading, setShardLogsLoading] = useState(false);
  const [shardLogsMessage, setShardLogsMessage] = useState<string | null>(null);

  // VM logs: pick a shard from Logs tab when "must be requested per shard"
  const [vmLogShardId, setVmLogShardId] = useState("");

  // Log search & severity filter
  const [logSearch, setLogSearch] = useState("");
  const [logSeverityFilter, setLogSeverityFilter] = useState<
    "ALL" | "ERROR" | "WARNING" | "INFO"
  >("ALL");

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
    if (
      !window.confirm(
        "Are you sure you want to cancel this deployment? All running shards will be stopped.",
      )
    )
      return;

    try {
      setActionLoading("cancel");
      setActionError(null);
      const result = await cancelDeployment(deploymentId);
      setActionSuccess(
        `Deployment cancelled. ${result.cancelled_shards} shard(s) stopped.`,
      );
      fetchStatus();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to cancel deployment",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeDeployment = async () => {
    try {
      setActionLoading("resume");
      setActionError(null);
      const result = await resumeDeployment(deploymentId);
      setActionSuccess(result.message);
      fetchStatus();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to resume deployment",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyCompletion = async (force = false) => {
    try {
      setActionLoading("verify");
      setActionError(null);
      await verifyDeploymentCompletion(deploymentId, { force });
      setActionSuccess(
        force ? "Verification refreshed." : "Verification completed.",
      );
      fetchStatus();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to verify completion",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetryFailed = async () => {
    try {
      setActionLoading("retry");
      setActionError(null);
      const result = await retryFailedShards(deploymentId);
      setActionSuccess(result.message);
      fetchStatus();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to retry failed shards",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelShard = async (shardId: string) => {
    try {
      setActionLoading(`shard-${shardId}`);
      setActionError(null);
      const result = await cancelShard(deploymentId, shardId);
      setActionSuccess(result.message);
      fetchStatus();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : `Failed to cancel shard ${shardId}`,
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSelectedShards = async () => {
    if (selectedShards.size === 0) return;
    if (!window.confirm(`Cancel ${selectedShards.size} selected shard(s)?`))
      return;

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
      setActionSuccess(
        `Cancelled ${cancelled} shard(s)${failed > 0 ? `, ${failed} failed` : ""}`,
      );
      fetchStatus();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to cancel selected shards",
      );
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
      setActionSuccess(result.message);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update tag",
      );
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
      const health = await getLiveDeploymentHealth(
        deploymentId,
        status.service,
        status.region ?? "",
      );
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
      setActionSuccess(
        "Rollback initiated. Traffic shifted to previous revision.",
      );
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
    const runningShards = source
      .filter((s) => s.status === "running")
      .map((s) => s.shard_id);
    if (
      runningShards.length === selectedShards.size &&
      runningShards.every((id) => selectedShards.has(id))
    ) {
      setSelectedShards(new Set());
    } else {
      setSelectedShards(new Set(runningShards));
    }
  };

  // Group shards by category (CEFI, TRADFI, DEFI, etc.)
  const groupShardsByCategory = (
    shards: ShardDetail[],
  ): Record<string, ShardDetail[]> => {
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
      const response = await fetch(
        `/api/deployments/${deploymentId}?skip_logs=true&summary=true`,
      );
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
    async (opts?: {
      offset?: number;
      status?: typeof shardPageStatus;
      category?: string;
    }) => {
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

        const response = await fetch(
          `/api/deployments/${deploymentId}/shards?${params.toString()}`,
        );
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
    [
      deploymentId,
      shardPageLimit,
      shardPageOffset,
      shardPageStatus,
      shardPageCategory,
    ],
  );

  // API allows max limit=1000; use it so the request succeeds (was 10000 → 422)
  const SHARDS_PAGE_LIMIT = 1000;

  // Load all shards for a deployment (for client-side search/filter)
  const loadAllShards = useCallback(async () => {
    if (shardsLoading) return;
    setShardsLoading(true);
    try {
      const response = await fetch(
        `/api/deployments/${deploymentId}/shards?limit=${SHARDS_PAGE_LIMIT}&offset=0`,
      );
      if (!response.ok) {
        // Fallback: full status includes shards (for deployments with many shards we only get first page from /shards)
        const fullResponse = await fetch(
          `/api/deployments/${deploymentId}?skip_logs=true`,
        );
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

  // Client-side filtered shards (status + classification + text search)
  const filteredShards = React.useMemo(() => {
    const source = allShards ?? status?.shards ?? shardPage ?? [];
    if (source.length === 0) return [];

    let result = source;
    const classifications = status?.shard_classifications;

    // Filter: basic status or classification
    if (shardStatusFilter !== "all") {
      const isClassification = CLASSIFICATION_FILTERS.includes(
        shardStatusFilter as (typeof CLASSIFICATION_FILTERS)[number],
      );

      if (isClassification && classifications) {
        // Filter by classification, with fallback to raw status for STILL_RUNNING
        let classFiltered = result.filter(
          (s) => classifications[s.shard_id] === shardStatusFilter,
        );
        // Fallback: if classification filter returns nothing but we expect matches,
        // it means the deployment state changed since classifications were computed.
        // For STILL_RUNNING, fall back to matching shards with status 'running'.
        if (
          classFiltered.length === 0 &&
          shardStatusFilter === "STILL_RUNNING"
        ) {
          classFiltered = result.filter((s) => s.status === "running");
        }
        result = classFiltered;
      } else {
        // Filter by raw shard status
        result = result.filter((s) => {
          if (shardStatusFilter === "succeeded") {
            return s.status === "succeeded" || s.status === "completed";
          }
          return s.status === shardStatusFilter;
        });
      }
    }

    // Text search (case-insensitive match on shard_id, dimensions, status)
    const query = shardSearchText.trim().toLowerCase();
    if (query) {
      result = result.filter((s) => {
        // Match shard_id (e.g. "2024-01-15_CEFI_BINANCE-SPOT")
        if (s.shard_id.toLowerCase().includes(query)) return true;
        // Match status
        if (s.status.toLowerCase().includes(query)) return true;
        // Match classification
        if (classifications?.[s.shard_id]?.toLowerCase().includes(query))
          return true;
        // Match dimension values
        if (s.dimensions) {
          const dimStr = Object.values(s.dimensions)
            .map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v)))
            .join(" ")
            .toLowerCase();
          if (dimStr.includes(query)) return true;
        }
        // Match job_id if present
        if (s.job_id && s.job_id.toLowerCase().includes(query)) return true;
        return false;
      });
    }

    return result;
  }, [
    allShards,
    status?.shards,
    shardPage,
    shardStatusFilter,
    shardSearchText,
    status?.shard_classifications,
  ]);

  // Use ref to prevent concurrent fetches
  const isFetchingLogs = useRef(false);

  const fetchLogs = useCallback(
    async (
      severity: string = "DEFAULT",
      incremental: boolean = false,
      hoursBack?: number | null,
    ) => {
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
              setLogsMessage(
                data.message ||
                  "Cloud Logging rate limit exceeded. Wait a minute and try again.",
              );
            }
            return;
          }
          throw new Error(
            data.detail || data.message || "Failed to fetch logs",
          );
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
        if (
          followLogs &&
          data.logs &&
          data.logs.length > 0 &&
          logsContainerRef.current
        ) {
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
          setLogsMessage(
            msg.includes("429") || msg.toLowerCase().includes("rate limit")
              ? msg
              : null,
          );
        }
      } finally {
        setLogsLoading(false);
        isFetchingLogs.current = false;
      }
    },
    [
      deploymentId,
      lastLineCount,
      followLogs,
      logsHoursBack,
      status?.compute_type,
    ],
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
          setShardLogsMessage(
            data.message ||
              "Cloud Logging rate limit exceeded. Wait a minute and try again.",
          );
          return;
        }
        throw new Error(
          data.detail || data.message || "Failed to fetch shard logs",
        );
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

  useEffect(() => {
    let mounted = true;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let pollCount = 0;
    const maxFastPolls = 6; // Fast poll for first 18 seconds (6 polls * 3 sec)

    const poll = async () => {
      if (!mounted) return;

      pollCount++;
      const isFastPolling = pollCount <= maxFastPolls;

      try {
        // Always skip log analysis for fast response - logs tab fetches separately
        const response = await fetch(
          `/api/deployments/${deploymentId}?skip_logs=true&summary=true`,
        );
        if (!mounted) return;

        if (response.ok) {
          const data = await response.json();
          // Preserve any previously loaded shard details while polling summary-only
          setStatus((prev) => {
            if (prev?.shards && !data.shards) {
              return {
                ...data,
                shards: prev.shards,
                shards_by_category: prev.shards_by_category,
              };
            }
            return data;
          });
          setError(null);
          setLoading(false);

          // Call refresh on first poll and every 2nd poll (every ~30s during slow polling)
          // With aggregatedList backend optimization, refresh is now fast (~1-3s)
          const hasWorkRemaining =
            (data.running_shards || 0) > 0 || (data.pending_shards || 0) > 0;
          if (hasWorkRemaining && (pollCount === 1 || pollCount % 2 === 0)) {
            try {
              await fetch(`/api/deployments/${deploymentId}/refresh`, {
                method: "POST",
              });
            } catch {
              // Refresh failed - continue polling
            }
          }

          // Stop polling if deployment is in a terminal state
          const terminalStates = [
            "completed",
            "completed_pending_delete",
            "failed",
            "cancelled",
            "clean",
            "completed_with_warnings",
            "completed_with_errors",
          ];
          const isTerminal =
            terminalStates.includes(data.status) ||
            terminalStates.includes(data.status_detail);
          if (isTerminal && !hasWorkRemaining) {
            if (pollInterval) clearInterval(pollInterval);
            pollInterval = null;
            return;
          }
        } else if (response.status === 404) {
          // Status not found yet - keep polling fast
          if (!isFastPolling) {
            setError(`Deployment ${deploymentId} not found`);
            setLoading(false);
          }
        } else {
          const err = await response.json();
          throw new Error(err.detail || "Failed to fetch status");
        }
      } catch (err) {
        if (mounted && pollCount > maxFastPolls) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch status",
          );
          setLoading(false);
        }
      }

      // Adjust polling interval: fast (3s) for first 18s, then slow (15s)
      if (isFastPolling && pollCount === maxFastPolls && pollInterval) {
        clearInterval(pollInterval);
        pollInterval = setInterval(poll, 15000); // Switch to 15s polling
      }
    };

    refetchStatusRef.current = poll;
    // Initial fetch
    poll();
    // Don't auto-fetch logs on mount; fetch when user opens Logs tab

    // Start fast polling (every 3 seconds) for status only
    pollInterval = setInterval(poll, 3000);

    // Don't auto-poll logs - user can manually refresh via button
    // This dramatically reduces API load

    return () => {
      mounted = false;
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };
  }, [deploymentId]);

  // SSE: refetch status when backend notifies state change (low-latency updates)
  useEffect(() => {
    const url = `${window.location.origin}/api/deployments/${deploymentId}/events`;
    const es = new EventSource(url);
    const onUpdate = () => {
      refetchStatusRef.current?.();
    };
    es.addEventListener("updated", onUpdate);
    es.onmessage = onUpdate;
    es.onerror = () => {
      es.close();
    };
    return () => {
      es.close();
    };
  }, [deploymentId]);

  // Auto-refresh shard page when deployment reaches terminal state
  // This ensures shard statuses are updated when deployment completes
  const prevStatusRef = useRef<string | null>(null);
  useEffect(() => {
    if (!status) return;

    const terminalStates = [
      "completed",
      "completed_pending_delete",
      "failed",
      "cancelled",
      "clean",
      "completed_with_warnings",
      "completed_with_errors",
    ];
    const isNowTerminal =
      terminalStates.includes(status.status) ||
      (status.status_detail && terminalStates.includes(status.status_detail));
    const wasNotTerminal =
      prevStatusRef.current && !terminalStates.includes(prevStatusRef.current);

    // If deployment just transitioned to terminal state and we have shard data loaded, refresh it
    if (isNowTerminal && wasNotTerminal && allShards !== null) {
      loadAllShards();
    }

    prevStatusRef.current = status.status;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omit `status` object to avoid re-running on every status poll
  }, [status?.status, status?.status_detail, loadAllShards, allShards]);

  // Poll live health every 15s for live-mode running deployments
  useEffect(() => {
    if (status?.deploy_mode !== "live" || status?.status !== "running") return;
    fetchLiveHealth();
    const interval = setInterval(fetchLiveHealth, 15000);
    return () => clearInterval(interval);
  }, [status?.deploy_mode, status?.status, fetchLiveHealth]);

  const getStatusBadge = (status: string, statusDetail?: string) => {
    // Use status_detail for nuanced display if available
    const detailStatus = statusDetail || status;

    switch (detailStatus) {
      case "clean":
        return <Badge variant="success">✅ Clean</Badge>;
      case "completed_with_warnings":
        return <Badge variant="warning">⚠️ Completed with Warnings</Badge>;
      case "completed_with_errors":
        return <Badge variant="warning">⚠️ Completed with Errors</Badge>;
      case "completed":
      case "succeeded":
        return <Badge variant="success">Completed</Badge>;
      case "completed_pending_delete":
        return (
          <Badge
            variant="warning"
            title="VMs may still be deleting; delete manually if they remain"
          >
            Completed (pending delete)
          </Badge>
        );
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

  if (loading && !status) {
    return (
      <Card className="border-2 border-[var(--color-border-emphasis)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-mono text-lg">{deploymentId}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent-cyan)]" />
            <div className="text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Loading deployment status...
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Checking shard states and VM instances
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !status) {
    // Show retry button for errors
    return (
      <Card className="border-2 border-[var(--color-accent-red)]/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Deployment Details</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 rounded-lg status-error">
            <AlertCircle className="h-5 w-5 text-[var(--color-accent-red)]" />
            <div>
              <p className="text-sm font-medium text-[var(--color-accent-red)]">
                {error || "Deployment not found"}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchStatus}
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

  // When we have loaded shards (allShards or status.shards), use filteredShards which applies
  // the status filter + text search. Only fall back to raw shardPage when nothing is loaded.
  const hasLoadedShards = allShards !== null || status.shards !== null;
  const shardsForDisplay = hasLoadedShards ? filteredShards : (shardPage ?? []);
  const displayShards = shardsForDisplay.slice(
    0,
    showAllShards ? undefined : 50,
  );

  return (
    <Card className="border-2 border-[var(--color-border-emphasis)]">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="font-mono text-lg">
                {status.deployment_id}
              </CardTitle>
              {getStatusBadge(status.status, status.status_detail)}
              {status.has_force && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--color-accent-purple)]/20 text-[var(--color-accent-purple)]">
                  --force
                </span>
              )}
              {(status.gcs_fuse_active !== undefined ||
                status.gcs_fuse_reason) && (
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
                <span
                  className="text-[var(--color-text-muted)]"
                  title="Status refreshes every few seconds"
                >
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
                    {status.image_all_tags &&
                      status.image_all_tags.length > 1 && (
                        <span className="text-xs text-[var(--color-text-muted)]">
                          (
                          {status.image_all_tags
                            .filter(
                              (t) => t !== "latest" && t !== status.image_tag,
                            )
                            .slice(0, 2)
                            .join(", ") || status.image_tag}
                          )
                        </span>
                      )}
                  </>
                ) : (
                  // Fallback to just showing the tag
                  <span
                    className="text-xs font-mono text-[var(--color-accent-purple)]"
                    title={status.docker_image}
                  >
                    {status.image_tag}
                  </span>
                )}
                {status.docker_image && (
                  <span
                    className="text-xs text-[var(--color-text-muted)] truncate max-w-[200px]"
                    title={status.docker_image}
                  >
                    (
                    {status.docker_image.split("/").pop()?.split(":")[0] ||
                      "image"}
                    )
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
                    {status.tag || (
                      <span className="text-[var(--color-text-muted)] italic">
                        No description
                      </span>
                    )}
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
                  liveHealth.healthy
                    ? "text-[var(--color-accent-green)]"
                    : "text-[var(--color-accent-red)]"
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
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchStatus}
              title="Refresh"
            >
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
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancelDeployment}
              disabled={actionLoading !== null}
            >
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
            <Button
              variant="default"
              size="sm"
              onClick={handleResumeDeployment}
              disabled={actionLoading !== null}
            >
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetryFailed}
              disabled={actionLoading !== null}
            >
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
          {status.deploy_mode === "live" &&
            status.status !== "completed" &&
            status.status !== "cancelled" && (
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

      <CardContent className="space-y-4">
        {/* Error Message Banner */}
        {status.status === "failed" && status.error_message && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--color-status-error-bg)] border border-[var(--color-status-error-border-strong)]">
            <AlertCircle className="h-5 w-5 text-[var(--color-accent-red)] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--color-accent-red)]">
                Deployment Failed
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1 font-mono">
                {status.error_message}
              </p>
            </div>
          </div>
        )}

        {/* Log Analysis - Errors and Warnings Summary */}
        {status.log_analysis &&
          (status.log_analysis.error_count > 0 ||
            status.log_analysis.warning_count > 0) && (
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
                      This deployment completed but had{" "}
                      {status.log_analysis.error_count} error(s) in the logs.
                      Review before considering data reliable.
                    </p>
                  </div>
                </div>
              )}

              {status.status_detail === "completed_with_warnings" && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-status-warning-bg-alt)] border border-[var(--color-status-warning-border-alt)]">
                  <AlertCircle className="h-5 w-5 text-[var(--color-accent-amber)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-accent-amber)]">
                      Completed with Warnings
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                      This deployment completed but had{" "}
                      {status.log_analysis.warning_count} warning(s). Review
                      recommended.
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
                      <div
                        key={idx}
                        className="text-xs font-mono text-[var(--color-text-secondary)] truncate"
                      >
                        <span className="text-[var(--color-accent-purple)]">
                          [{err.shard_id}]
                        </span>{" "}
                        {err.message}
                      </div>
                    ))}
                    {status.log_analysis.error_count > 5 && (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        ... and {status.log_analysis.error_count - 5} more
                        errors
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
                    {status.log_analysis.warnings
                      .slice(0, 5)
                      .map((warn, idx) => (
                        <div
                          key={idx}
                          className="text-xs font-mono text-[var(--color-text-secondary)] truncate"
                        >
                          <span className="text-[var(--color-accent-purple)]">
                            [{warn.shard_id}]
                          </span>{" "}
                          {warn.message}
                        </div>
                      ))}
                    {status.log_analysis.warning_count > 5 && (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        ... and {status.log_analysis.warning_count - 5} more
                        warnings
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
            <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
              Shard Classification
            </p>

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
              (status.classification_counts?.COMPLETED_WITH_WARNINGS ?? 0) >
                0) && (
              <div className="mb-2">
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                  Log Quality
                </p>
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
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                  Job Failures
                </p>
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
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                  In Progress
                </p>
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
                onClick={() =>
                  handleVerifyCompletion(
                    (status.completed_with_verification ?? null) != null,
                  )
                }
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
                    {(status.completed_with_verification ?? null) != null
                      ? "Re-verify"
                      : "Verify"}
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (status.completed_shards ?? 0) > 0 ? (
          /* Fallback: old-style stat boxes when classification is not yet available */
          <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
            <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
              Completed shards
            </p>
            <div className="grid grid-cols-4 gap-3">
              <StatBox
                label="Verified"
                value={
                  status.completed_with_verification != null
                    ? status.completed_with_verification
                    : "—"
                }
                color="var(--color-accent-green)"
              />
              <StatBox
                label="With warnings"
                value={
                  status.completed_with_warnings != null
                    ? status.completed_with_warnings
                    : "—"
                }
                color="var(--color-accent-amber)"
              />
              <StatBox
                label="With errors"
                value={
                  status.completed_with_errors != null
                    ? status.completed_with_errors
                    : "—"
                }
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
                {(status.running_shards ?? 0) === 0 &&
                (status.pending_shards ?? 0) === 0
                  ? "Verification is running automatically in the background. Refresh in a moment, or click Verify."
                  : "Click Verify to check how many completed shards have created output files."}
              </p>
            )}
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  handleVerifyCompletion(
                    (status.completed_with_verification ?? null) != null,
                  )
                }
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
                    {(status.completed_with_verification ?? null) != null
                      ? "Re-verify"
                      : "Verify"}
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
                  • {status.retry_stats.succeeded_after_retry} succeeded after
                  retry
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
            <span className="font-mono text-[var(--color-text-primary)]">
              {status.progress_percentage}%
            </span>
          </div>
          <div className="h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent-green)] transition-all duration-300"
              style={{ width: `${status.progress_percentage}%` }}
            />
          </div>
        </div>

        {/* Tabs for Shards and Logs */}
        <Tabs defaultValue="shards" className="w-full">
          <TabsList variant="pill" className="grid w-full grid-cols-4">
            <TabsTrigger value="shards">
              Shards ({status.total_shards})
            </TabsTrigger>
            <TabsTrigger
              value="logs"
              onClick={() => {
                // Lazy-load logs to keep initial render fast
                if (logs.length === 0 && !logsLoading) {
                  fetchLogs("DEFAULT", false, logsHoursBack);
                }
              }}
            >
              Logs ({logs.length})
            </TabsTrigger>
            <TabsTrigger
              value="report"
              onClick={() => !report && fetchReport()}
            >
              Report
            </TabsTrigger>
            <TabsTrigger
              value="events"
              onClick={() => {
                if (events.length === 0 && !eventsLoading) {
                  fetchEvents();
                }
              }}
            >
              Events {events.length > 0 ? `(${events.length})` : ""}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shards" className="mt-4">
            {/* Show provisioning message when all shards are pending */}
            {status.pending_shards === status.total_shards &&
              status.total_shards > 0 && (
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
                    <Button
                      variant="default"
                      size="sm"
                      onClick={loadAllShards}
                      disabled={shardsLoading}
                    >
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
                              (s) =>
                                s.status === "succeeded" ||
                                s.status === "completed",
                            ).length,
                          },
                          {
                            key: "failed" as const,
                            label: "Failed",
                            color: "var(--color-accent-red)",
                            count: (allShards ?? status?.shards ?? []).filter(
                              (s) => s.status === "failed",
                            ).length,
                          },
                          {
                            key: "running" as const,
                            label: "Running",
                            color: "var(--color-accent-cyan)",
                            count: (allShards ?? status?.shards ?? []).filter(
                              (s) => s.status === "running",
                            ).length,
                          },
                          {
                            key: "pending" as const,
                            label: "Pending",
                            color: "var(--color-text-muted)",
                            count: (allShards ?? status?.shards ?? []).filter(
                              (s) => s.status === "pending",
                            ).length,
                          },
                        ]
                          .filter((f) => f.key === "all" || f.count > 0)
                          .map((f) => (
                            <Button
                              key={f.key}
                              variant={
                                shardStatusFilter === f.key
                                  ? "default"
                                  : "ghost"
                              }
                              size="sm"
                              onClick={() => setShardStatusFilter(f.key)}
                              className={cn(
                                "px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap h-auto",
                                shardStatusFilter === f.key
                                  ? "text-white"
                                  : "text-[var(--color-text-secondary)]",
                              )}
                              style={
                                shardStatusFilter === f.key
                                  ? { backgroundColor: f.color }
                                  : undefined
                              }
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
                        {shardsLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                      </Button>
                    </div>

                    {/* Active classification filter banner */}
                    {CLASSIFICATION_FILTERS.includes(
                      shardStatusFilter as (typeof CLASSIFICATION_FILTERS)[number],
                    ) && (
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
                          Showing {filteredShards.length} of{" "}
                          {(allShards ?? status?.shards ?? []).length} shards
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllRunningShards}
                      className="h-7 text-xs"
                    >
                      {selectedShards.size > 0 ? (
                        <CheckSquare className="h-3 w-3 mr-1" />
                      ) : (
                        <Square className="h-3 w-3 mr-1" />
                      )}
                      {selectedShards.size === status.running_shards
                        ? "Deselect All"
                        : "Select Running"}
                    </Button>
                    {selectedShards.size > 0 && (
                      <span className="text-xs text-[var(--color-accent-cyan)]">
                        {selectedShards.size} selected
                      </span>
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
              {shardsForDisplay.length === 0 &&
              (allShards || status?.shards) ? (
                // No results after filtering
                <div className="p-6 text-center text-sm text-[var(--color-text-muted)]">
                  {shardSearchText.trim() ? (
                    <>
                      No shards matching &ldquo;{shardSearchText}&rdquo;
                      {shardStatusFilter !== "all"
                        ? ` (in ${shardStatusFilter} shards)`
                        : ""}
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
                  {Object.entries(groupShardsByCategory(shardsForDisplay)).map(
                    ([category, categoryShards]) => {
                      const stats = getCategoryStats(categoryShards);
                      const isExpanded = expandedCategories.has(category);
                      return (
                        <div
                          key={category}
                          className="border-b border-[var(--color-border-subtle)] last:border-b-0"
                        >
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
                              <span className="font-medium text-sm">
                                {category}
                              </span>
                              <span className="text-xs text-[var(--color-text-muted)]">
                                ({stats.total} shards)
                              </span>
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
                                  onSelect={() =>
                                    toggleShardSelection(shard.shard_id)
                                  }
                                  onCancel={() =>
                                    handleCancelShard(shard.shard_id)
                                  }
                                  onViewLogs={() => openShardLogs(shard)}
                                  cancelling={
                                    actionLoading === `shard-${shard.shard_id}`
                                  }
                                  classification={
                                    status?.shard_classifications?.[
                                      shard.shard_id
                                    ]
                                  }
                                  vmEvents={events.filter(
                                    (e) => e.shard_id === shard.shard_id,
                                  )}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    },
                  )}
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
                        classification={
                          status?.shard_classifications?.[shard.shard_id]
                        }
                        vmEvents={events.filter(
                          (e) => e.shard_id === shard.shard_id,
                        )}
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

          <TabsContent value="logs" className="mt-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {/* Severity filter (structured, not text search) */}
                <Select
                  value={logSeverityFilter}
                  onValueChange={(v) =>
                    setLogSeverityFilter(
                      v as "ALL" | "ERROR" | "WARNING" | "INFO",
                    )
                  }
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
                          ? logs.filter(
                              (l) =>
                                l.severity === "ERROR" ||
                                l.severity === "CRITICAL",
                            )
                          : logSeverityFilter === "WARNING"
                            ? logs.filter(
                                (l) =>
                                  l.severity === "ERROR" ||
                                  l.severity === "CRITICAL" ||
                                  l.severity === "WARNING",
                              )
                            : logs;
                    const searchLower = logSearch.toLowerCase().trim();
                    const count = searchLower
                      ? sevFiltered.filter(
                          (l) =>
                            l.message.toLowerCase().includes(searchLower) ||
                            (l.logger &&
                              l.logger.toLowerCase().includes(searchLower)) ||
                            (l.shard &&
                              l.shard.toLowerCase().includes(searchLower)),
                        ).length
                      : sevFiltered.length;
                    return logSearch || logSeverityFilter !== "ALL"
                      ? `${count}/${logs.length}`
                      : `${logs.length} logs`;
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
                    followLogs &&
                      "bg-[var(--color-accent-green)] hover:bg-[var(--color-accent-green)]/80",
                  )}
                  title={
                    followLogs
                      ? "Stop auto-follow"
                      : "Auto-follow (poll every 15s)"
                  }
                >
                  {followLogs ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
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
                  {logsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* VM shard picker - always visible for VM deployments */}
              {status.compute_type === "vm" && (
                <div className="p-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                      View shard:
                    </span>
                    {(allShards ?? status?.shards ?? shardPage ?? []).length >
                    0 ? (
                      <>
                        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto flex-1">
                          {(allShards ?? status?.shards ?? shardPage ?? [])
                            .slice(0, 50)
                            .map((s) => (
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
                                {s.shard_id.length > 30
                                  ? `${s.shard_id.slice(0, 27)}…`
                                  : s.shard_id}
                              </Button>
                            ))}
                          {(allShards ?? status?.shards ?? shardPage ?? [])
                            .length > 50 && (
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
                            onClick={() =>
                              fetchLogs("DEFAULT", false, logsHoursBack)
                            }
                            disabled={logsLoading}
                          >
                            {logsLoading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Load all logs"
                            )}
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
                            onClick={() =>
                              fetchLogs("DEFAULT", false, logsHoursBack)
                            }
                            disabled={logsLoading}
                          >
                            {logsLoading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Load all logs"
                            )}
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
                <div
                  ref={logsContainerRef}
                  className="log-container max-h-80 overflow-y-auto font-mono text-xs space-y-1"
                >
                  {/* Filter logs by structured severity, then by text search on message/logger/shard */}
                  {(() => {
                    // Step 1: Filter by severity field (structured, not text matching)
                    const severityFiltered =
                      logSeverityFilter === "ALL"
                        ? logs
                        : logSeverityFilter === "ERROR"
                          ? logs.filter(
                              (l) =>
                                l.severity === "ERROR" ||
                                l.severity === "CRITICAL",
                            )
                          : logSeverityFilter === "WARNING"
                            ? logs.filter(
                                (l) =>
                                  l.severity === "ERROR" ||
                                  l.severity === "CRITICAL" ||
                                  l.severity === "WARNING",
                              )
                            : logs; // INFO+ = all

                    // Step 2: Text search on message, logger, shard — NOT on severity
                    const searchLower = logSearch.toLowerCase().trim();
                    const filteredLogs = searchLower
                      ? severityFiltered.filter((log) => {
                          return (
                            (log.message &&
                              log.message
                                .toLowerCase()
                                .includes(searchLower)) ||
                            (log.logger &&
                              log.logger.toLowerCase().includes(searchLower)) ||
                            (log.execution_name &&
                              log.execution_name
                                .toLowerCase()
                                .includes(searchLower)) ||
                            (log.shard &&
                              log.shard.toLowerCase().includes(searchLower))
                          );
                        })
                      : severityFiltered;

                    if (
                      filteredLogs.length === 0 &&
                      (logSearch || logSeverityFilter !== "ALL")
                    ) {
                      return (
                        <div className="text-center py-4 text-sm text-[var(--color-text-muted)]">
                          No logs matching{" "}
                          {logSeverityFilter !== "ALL"
                            ? `severity=${logSeverityFilter}`
                            : ""}
                          {logSearch ? ` "${logSearch}"` : ""}
                        </div>
                      );
                    }

                    return filteredLogs.map((log, idx) => {
                      // Check for failover-related tags
                      const isZoneExhausted =
                        log.message.includes("[ZONE_EXHAUSTED]");
                      const isRegionSwitch =
                        log.message.includes("[REGION_SWITCH]");
                      const isQuotaExhausted =
                        log.message.includes("[REGIONAL_QUOTA_EXHAUSTED]") ||
                        log.message.includes("[IP_QUOTA_EXCEEDED]") ||
                        log.message.includes("[CPU_QUOTA_EXCEEDED]");
                      const isAllExhausted = log.message.includes(
                        "[ALL_REGIONS_EXHAUSTED]",
                      );
                      const isFailoverEvent =
                        isZoneExhausted ||
                        isRegionSwitch ||
                        isQuotaExhausted ||
                        isAllExhausted;

                      return (
                        <div
                          key={idx}
                          className={cn(
                            "py-1 px-2 rounded hover:bg-[var(--color-bg-tertiary)]",
                            isRegionSwitch &&
                              "bg-[var(--color-status-tradfi-bg)] border-l-2 border-[var(--color-accent-purple)]",
                            isZoneExhausted &&
                              "bg-[var(--color-status-warning-bg-subtle)]",
                            isQuotaExhausted &&
                              "bg-[var(--color-status-warning-bg)] border-l-2 border-[var(--color-accent-amber)]",
                            isAllExhausted &&
                              "bg-[var(--color-status-error-bg)] border-l-2 border-[var(--color-accent-red)]",
                          )}
                        >
                          <span
                            className={cn(
                              "font-bold",
                              log.severity === "ERROR" &&
                                "text-[var(--color-accent-red)]",
                              log.severity === "WARNING" &&
                                "text-[var(--color-accent-amber)]",
                              log.severity === "INFO" &&
                                "text-[var(--color-accent-cyan)]",
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
                                  isRegionSwitch &&
                                    "bg-[var(--color-accent-purple)] text-white",
                                  isZoneExhausted &&
                                    "bg-[var(--color-accent-amber)] text-black",
                                  isQuotaExhausted &&
                                    "bg-[var(--color-accent-amber)] text-black",
                                  isAllExhausted &&
                                    "bg-[var(--color-accent-red)] text-white",
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
                              <span className="text-[var(--color-text-muted)] opacity-60 text-[10px]">
                                {log.logger}
                              </span>
                            </>
                          )}
                          {log.shard && (
                            <>
                              {" "}
                              <span className="text-[var(--color-accent-purple)]">
                                [{log.shard}]
                              </span>
                            </>
                          )}{" "}
                          <span className="text-[var(--color-text-secondary)]">
                            {log.message}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="report" className="mt-4">
            {reportLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent-cyan)]" />
                <span className="ml-2 text-sm text-[var(--color-text-secondary)]">
                  Loading report...
                </span>
              </div>
            ) : report ? (
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] text-center">
                    <div className="text-xl font-mono font-bold text-[var(--color-accent-green)]">
                      {report.summary.success_rate}%
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      Success Rate
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] text-center">
                    <div className="text-xl font-mono font-bold text-[var(--color-accent-amber)]">
                      {report.summary.total_retries}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      Total Retries
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] text-center">
                    <div className="text-xl font-mono font-bold text-[var(--color-accent-purple)]">
                      {report.retry_stats.total_zone_switches}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      Zone Switches
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] text-center">
                    <div className="text-xl font-mono font-bold text-[var(--color-accent-cyan)]">
                      {report.retry_stats.total_region_switches}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      Region Switches
                    </div>
                  </div>
                </div>

                {/* Failure Breakdown */}
                {Object.keys(report.failure_breakdown).length > 0 && (
                  <div className="p-3 rounded-lg bg-[var(--color-status-error-bg)] border border-[var(--color-status-error-border-strong)]">
                    <h4 className="text-sm font-medium text-[var(--color-accent-red)] mb-2">
                      Failure Breakdown
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(report.failure_breakdown).map(
                        ([category, count]) => (
                          <div
                            key={category}
                            className="flex justify-between text-xs"
                          >
                            <span className="text-[var(--color-text-secondary)]">
                              {category}
                            </span>
                            <span className="font-mono text-[var(--color-accent-red)]">
                              {count}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Zone Usage */}
                {Object.keys(report.zone_usage).length > 0 && (
                  <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
                    <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Zone Usage
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(report.zone_usage).map(
                        ([zone, count]) => (
                          <div
                            key={zone}
                            className="flex justify-between text-xs"
                          >
                            <span className="text-[var(--color-text-secondary)]">
                              {zone}
                            </span>
                            <span className="font-mono text-[var(--color-accent-cyan)]">
                              {count} shards
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Infrastructure Issues */}
                {report.infrastructure_issues.length > 0 && (
                  <div className="p-3 rounded-lg bg-[var(--color-status-warning-bg)] border border-[var(--color-status-warning-border)]">
                    <h4 className="text-sm font-medium text-[var(--color-accent-amber)] mb-2">
                      Infrastructure Issues (
                      {report.infrastructure_issues.length})
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {report.infrastructure_issues
                        .slice(0, 10)
                        .map((issue, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="text-[var(--color-accent-purple)]">
                              [{issue.shard_id}]
                            </span>
                            <span className="text-[var(--color-text-muted)]">
                              {" "}
                              {issue.zone} -{" "}
                            </span>
                            <span className="text-[var(--color-accent-amber)]">
                              {issue.category}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Rerun Commands */}
                {rerunCommands && rerunCommands.total_commands > 0 && (
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
                        <div
                          key={idx}
                          className="text-xs font-mono text-[var(--color-text-secondary)] truncate"
                        >
                          # {cmd.shard_id}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchReport}
                  className="w-full"
                >
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

          <TabsContent value="events" className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                Shard Event Timeline
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchEvents}
                disabled={eventsLoading}
              >
                {eventsLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                Refresh
              </Button>
            </div>

            {eventsLoading && events.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--color-accent-cyan)]" />
                <span className="ml-2 text-sm text-[var(--color-text-muted)]">
                  Loading events...
                </span>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-[var(--color-text-muted)]">
                  No events recorded for this deployment.
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Events are emitted by VM/Cloud Run backends during execution.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {[...events]
                  .sort(
                    (a, b) =>
                      new Date(a.timestamp).getTime() -
                      new Date(b.timestamp).getTime(),
                  )
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
                        <code className="text-[var(--color-text-muted)] truncate shrink-0 max-w-[180px]">
                          {ev.shard_id}
                        </code>
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                            isVm
                              ? "bg-[var(--color-status-warning-bg-tag)] text-[var(--color-accent-amber)]"
                              : "bg-[var(--color-status-running-bg-alt)] text-[var(--color-accent-cyan)]"
                          }`}
                        >
                          {ev.event_type.replace(/_/g, " ")}
                        </span>
                        <span className="text-[var(--color-text-secondary)] flex-1 min-w-0 truncate">
                          {ev.message}
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Collapsible: aggregate VM error summary */}
            {events.filter((e) => VM_EVENT_TYPES.has(e.event_type)).length >
              0 && (
              <div className="mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] h-auto p-0"
                  onClick={() => setEventsExpanded((v) => !v)}
                >
                  {eventsExpanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  VM Event Summary (
                  {
                    events.filter((e) => VM_EVENT_TYPES.has(e.event_type))
                      .length
                  }{" "}
                  events)
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
                      <div
                        key={type}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="text-[var(--color-accent-amber)]">
                          {type.replace(/_/g, " ")}
                        </span>
                        <span className="text-[var(--color-text-muted)]">
                          ×{count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Shard Logs Modal */}
      <Dialog open={!!selectedShardForLogs} onClose={closeShardLogs}>
        <DialogHeader onClose={closeShardLogs}>
          <DialogTitle className="font-mono">
            {selectedShardForLogs?.shard_id} - Logs
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          {shardLogsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent-cyan)]" />
              <span className="ml-2 text-sm text-[var(--color-text-muted)]">
                Loading logs...
              </span>
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
              {shardLogsMessage && (
                <p className="text-xs text-[var(--color-text-muted)] mb-2">
                  {shardLogsMessage}
                </p>
              )}
              <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-3 font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
                {shardLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "py-1 border-b border-[var(--color-border-subtle)] last:border-0",
                      log.severity === "ERROR" &&
                        "text-[var(--color-accent-red)]",
                      log.severity === "WARNING" &&
                        "text-[var(--color-accent-amber)]",
                      log.severity === "INFO" &&
                        "text-[var(--color-text-secondary)]",
                      log.severity === "DEBUG" &&
                        "text-[var(--color-text-muted)]",
                    )}
                  >
                    <span className="text-[var(--color-text-muted)] mr-2">
                      {log.timestamp &&
                        new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={cn(
                        "px-1 rounded text-xs mr-2",
                        log.severity === "ERROR" &&
                          "bg-[var(--color-status-error-bg-tag)]",
                        log.severity === "WARNING" &&
                          "bg-[var(--color-status-warning-bg-tag)]",
                        log.severity === "INFO" &&
                          "bg-[var(--color-status-success-bg-tag)]",
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
                {shardLogsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Refresh
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function StatBox({
  label,
  value,
  color,
  onClick,
}: {
  label: string;
  value: number | string;
  color: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] text-center",
        onClick &&
          "cursor-pointer hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border)] transition-colors",
      )}
      onClick={onClick}
      title={onClick ? `Filter shards by: ${label}` : undefined}
    >
      <div className="text-xl font-mono font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
    </div>
  );
}

interface ShardRowProps {
  shard: ShardDetail;
  selected?: boolean;
  onSelect?: () => void;
  onCancel?: () => void;
  onViewLogs?: () => void;
  cancelling?: boolean;
  classification?: string;
  vmEvents?: ShardEvent[];
}

const CLASSIFICATION_STYLES: Record<string, { color: string; bg: string }> = {
  VERIFIED: {
    color: "var(--color-class-verified)",
    bg: "var(--color-class-verified-bg)",
  },
  EXPECTED_SKIP: {
    color: "var(--color-class-expected-skip)",
    bg: "var(--color-class-expected-skip-bg)",
  },
  DATA_STALE: {
    color: "var(--color-class-data-stale)",
    bg: "var(--color-class-data-stale-bg)",
  },
  DATA_MISSING: {
    color: "var(--color-class-data-missing)",
    bg: "var(--color-class-data-missing-bg)",
  },
  UNVERIFIED: {
    color: "var(--color-class-unverified)",
    bg: "var(--color-class-unverified-bg)",
  },
  COMPLETED_WITH_ERRORS: {
    color: "var(--color-class-error)",
    bg: "var(--color-class-error-bg)",
  },
  COMPLETED_WITH_WARNINGS: {
    color: "var(--color-class-warning)",
    bg: "var(--color-class-warning-bg)",
  },
  INFRA_FAILURE: {
    color: "var(--color-class-warning)",
    bg: "var(--color-class-warning-bg)",
  },
  TIMEOUT_FAILURE: {
    color: "var(--color-class-warning)",
    bg: "var(--color-class-warning-bg)",
  },
  CODE_FAILURE: {
    color: "var(--color-class-error)",
    bg: "var(--color-class-error-bg)",
  },
  VM_DIED: {
    color: "var(--color-class-error)",
    bg: "var(--color-class-error-bg)",
  },
  NEVER_RAN: {
    color: "var(--color-class-unverified)",
    bg: "var(--color-class-unverified-bg)",
  },
  CANCELLED: {
    color: "var(--color-class-unverified)",
    bg: "var(--color-class-unverified-bg)",
  },
  STILL_RUNNING: {
    color: "var(--color-class-expected-skip)",
    bg: "var(--color-class-expected-skip-bg)",
  },
};

const VM_EVENT_BADGE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  VM_PREEMPTED: {
    label: "Preempted",
    color: "var(--color-accent-amber)",
    bg: "var(--color-event-amber-bg)",
  },
  CONTAINER_OOM: {
    label: "OOM",
    color: "var(--color-accent-red)",
    bg: "var(--color-event-red-bg)",
  },
  VM_QUOTA_EXHAUSTED: {
    label: "Quota",
    color: "var(--color-accent-amber)",
    bg: "var(--color-event-amber-bg)",
  },
  VM_ZONE_UNAVAILABLE: {
    label: "Zone N/A",
    color: "var(--color-accent-amber)",
    bg: "var(--color-event-amber-bg)",
  },
  CLOUD_RUN_REVISION_FAILED: {
    label: "Rev Failed",
    color: "var(--color-accent-red)",
    bg: "var(--color-event-red-bg)",
  },
  VM_TIMEOUT: {
    label: "Timeout",
    color: "var(--color-accent-amber)",
    bg: "var(--color-event-amber-bg)",
  },
  VM_DELETED: {
    label: "VM Deleted",
    color: "var(--color-text-muted)",
    bg: "var(--color-event-gray-bg)",
  },
};

function ShardRow({
  shard,
  selected,
  onSelect,
  onCancel,
  onViewLogs,
  cancelling,
  classification,
  vmEvents,
}: ShardRowProps) {
  const getIcon = () => {
    switch (shard.status) {
      case "succeeded":
        return (
          <CheckCircle2 className="h-4 w-4 text-[var(--color-accent-green)]" />
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
          <StopCircle className="h-4 w-4 text-[var(--color-accent-amber)]" />
        );
      default:
        return <Clock className="h-4 w-4 text-[var(--color-text-muted)]" />;
    }
  };

  // Get retry badge styling based on outcome
  const getRetryBadge = () => {
    if (!shard.retries || shard.retries === 0) return null;

    if (shard.status === "succeeded") {
      // Succeeded after retry - green
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-[var(--color-status-success-bg-tag)] text-[var(--color-accent-green)]">
          <RotateCcw className="h-3 w-3" />
          {shard.retries}→OK
        </span>
      );
    } else if (shard.status === "failed") {
      // Failed after retries - red
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-[var(--color-status-error-bg-tag)] text-[var(--color-accent-red)]">
          <RotateCcw className="h-3 w-3" />
          {shard.retries}→X
        </span>
      );
    } else {
      // Still retrying - yellow
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-[var(--color-status-warning-bg-tag)] text-[var(--color-accent-amber)]">
          <RotateCcw className="h-3 w-3" />
          retry {shard.retries}
        </span>
      );
    }
  };

  const isRunning = shard.status === "running";

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 bg-[var(--color-bg-secondary)]",
        selected && "bg-[var(--color-status-running-bg)]",
      )}
    >
      {/* Selection checkbox - only for running shards */}
      {isRunning && onSelect && (
        <div
          className="shrink-0 cursor-pointer p-1 rounded hover:bg-[var(--color-bg-tertiary)]"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {selected ? (
            <CheckSquare className="h-4 w-4 text-[var(--color-accent-cyan)]" />
          ) : (
            <Square className="h-4 w-4 text-[var(--color-text-muted)]" />
          )}
        </div>
      )}

      {getIcon()}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono text-[var(--color-text-primary)] truncate">
            {shard.shard_id}
          </code>
          {getRetryBadge()}
          {shard.args?.includes("--force") && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--color-status-purple-bg-tag)] text-[var(--color-accent-purple)]">
              --force
            </span>
          )}
          {classification && (
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{
                color:
                  CLASSIFICATION_STYLES[classification]?.color ??
                  "var(--color-class-unverified)",
                backgroundColor:
                  CLASSIFICATION_STYLES[classification]?.bg ??
                  "var(--color-class-unverified-bg)",
              }}
            >
              {classification.replace(/_/g, " ")}
            </span>
          )}
          {/* VM event badges — derived from event timeline */}
          {vmEvents &&
            vmEvents.length > 0 &&
            Array.from(
              new Set(
                vmEvents
                  .map((e) => e.event_type)
                  .filter((t) => t in VM_EVENT_BADGE_CONFIG),
              ),
            ).map((eventType) => {
              const cfg = VM_EVENT_BADGE_CONFIG[eventType];
              return cfg ? (
                <span
                  key={eventType}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                  style={{ color: cfg.color, backgroundColor: cfg.bg }}
                  title={eventType}
                >
                  {cfg.label}
                </span>
              ) : null;
            })}
        </div>
        {/* CLI args (compact, hover for full) */}
        {shard.args && shard.args.length > 0 && (
          <p
            className="text-[10px] text-[var(--color-text-muted)] mt-0.5 truncate max-w-[500px] font-mono cursor-help"
            title={shard.args.join(" ")}
          >
            {shard.args.join(" ")}
          </p>
        )}
        {shard.error_message && (
          <p className="text-xs text-[var(--color-accent-red)] mt-1 truncate">
            {shard.error_message}
          </p>
        )}
      </div>

      {/* View logs button */}
      {onViewLogs && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onViewLogs();
          }}
          title="View shard logs"
        >
          <FileText className="h-3 w-3 text-[var(--color-text-muted)] hover:text-[var(--color-accent-cyan)]" />
        </Button>
      )}

      {/* Individual cancel button - only for running shards */}
      {isRunning && onCancel && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          disabled={cancelling}
          title="Cancel this shard"
        >
          {cancelling ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <StopCircle className="h-3 w-3 text-[var(--color-accent-red)]" />
          )}
        </Button>
      )}
    </div>
  );
}
