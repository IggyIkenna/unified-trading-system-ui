import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Play,
  Upload,
  Loader2,
  Folder,
  FileJson,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Cpu,
  Cloud,
  BarChart3,
  RefreshCw,
  Copy,
  Download,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import {
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@unified-trading/ui-kit";
import apiClient from "@/api/client";
import {
  deploymentClient,
  DeploymentResponse,
  DataStatusResponse,
  ExecutionMissingShardsResponse,
} from "@/api/deploymentClient";

interface SystemCoresResponse {
  cores: number;
  recommended_workers: number;
  max_safe_workers: number;
}

type Mode = "single" | "batch" | "mass-deploy";

interface PrefixInfo {
  prefix: string;
  name: string;
  has_results: boolean;
}

interface BucketInfo {
  name: string;
  location: string;
  storage_class: string;
}

interface MissingItem {
  instrument?: string;
  strategy?: string;
  date?: string;
  path?: string;
  error?: string;
}

interface ErrorDetails {
  error_type?: string;
  missing_path?: string;
  instrument?: string;
  fix_instructions?: string;
  searched_pattern?: string;
  searched_bucket?: string;
  error_message?: string;
  missing_items?: MissingItem[];
  execution_context?: {
    config_path?: string;
    start_date?: string;
    end_date?: string;
    buckets_used?: string[];
    environment_vars?: Record<string, string>;
    project_id?: string;
  };
}

interface ErrorInfo {
  category: string;
  message: string;
  details: ErrorDetails;
  is_known_error?: boolean;
}

interface JobStatus {
  job_id: string;
  status: "queued" | "running" | "completed" | "failed";
  progress?: number;
  result_path?: string;
  gcs_result_path?: string;
  errors?: ErrorInfo[]; // List of structured errors (multiple errors supported)
  execution_time_secs?: number;
  logs?: string[];
  config_path?: string;
}

interface BatchJobInfo {
  job_id: string;
  config_path: string;
  status: JobStatus["status"];
}

interface BatchStatus {
  batch_id: string;
  total_jobs: number;
  completed: number;
  failed: number;
  running: number;
  queued: number;
  jobs: BatchJobInfo[];
}

// Config path in GCS: configs/V1/{strategy_id}/{mode}/{timeframe}/{config}.json
const CONFIG_ROOT = "configs/";

// Helper function to format date with time for API
const formatDateTime = (date: string, hour: number, minute: number): string => {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  return `${year}-${month}-${day}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`;
};

// Cloud deployment APIs expect plain YYYY-MM-DD dates.
const formatDateOnly = (date: string): string => {
  if (!date) return "";
  return date;
};

// Single Error Display Component with collapsible details
function SingleErrorBox({ errorInfo }: { errorInfo: ErrorInfo }) {
  const [showDetails, setShowDetails] = useState(false);
  const executionContext = errorInfo.details?.execution_context;

  const getErrorColor = () => {
    if (errorInfo.is_known_error === false)
      return {
        bg: "bg-yellow-900/20",
        border: "border-yellow-600",
        icon: "text-yellow-400",
      };
    switch (errorInfo.category) {
      case "preflight":
        return {
          bg: "bg-red-900/30",
          border: "border-red-600",
          icon: "text-red-400",
        };
      case "dependency":
        return {
          bg: "bg-orange-900/30",
          border: "border-orange-600",
          icon: "text-orange-400",
        };
      case "config":
        return {
          bg: "bg-purple-900/30",
          border: "border-purple-600",
          icon: "text-purple-400",
        };
      case "gcs":
        return {
          bg: "bg-blue-900/30",
          border: "border-blue-600",
          icon: "text-blue-400",
        };
      case "execution":
        return {
          bg: "bg-red-900/30",
          border: "border-red-600",
          icon: "text-red-400",
        };
      default:
        return {
          bg: "bg-red-900/30",
          border: "border-red-600",
          icon: "text-red-400",
        };
    }
  };

  const getErrorTitle = () => {
    if (errorInfo.is_known_error === false) return "⚠️ Unknown Error";
    switch (errorInfo.category) {
      case "preflight":
        return "❌ Preflight Validation Failed";
      case "dependency":
        return "⚠️ Dependency Check Failed";
      case "config":
        return "❌ Configuration Error";
      case "gcs":
        return "❌ GCS Access Error";
      case "execution":
        return "❌ Data Validation Failed";
      default:
        return "❌ Backtest Failed";
    }
  };

  const colors = getErrorColor();

  return (
    <div className={`rounded-lg border-2 p-4 ${colors.bg} ${colors.border}`}>
      <div className="flex items-start space-x-3">
        <AlertCircle
          className={`w-6 h-6 flex-shrink-0 mt-0.5 ${colors.icon}`}
        />
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div>
            <h3 className="font-semibold text-lg">{getErrorTitle()}</h3>
          </div>

          {/* Human-readable error message */}
          <div className="bg-slate-900/50 rounded p-4 text-sm text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
            {errorInfo.message
              ? errorInfo.message.split("\n").map((line, i) => {
                  // Format sections
                  if (line.trim().startsWith("Required:")) {
                    const [label, ...valueParts] = line.split(":");
                    const value = valueParts.join(":").trim();
                    return (
                      <div key={i} className="flex items-start mt-1">
                        <span className="text-slate-400 min-w-[80px] font-semibold">
                          {label}:
                        </span>
                        <span className="text-slate-200 ml-2 flex-1">
                          {value}
                        </span>
                      </div>
                    );
                  } else if (
                    line.trim().startsWith("Searched in bucket:") ||
                    line.trim().startsWith("Searched:")
                  ) {
                    const [label, ...valueParts] = line.split(":");
                    const value = valueParts.join(":").trim();
                    return (
                      <div key={i} className="flex items-start mt-1">
                        <span className="text-slate-400 min-w-[80px]">
                          {label}:
                        </span>
                        <span className="font-mono text-cyan-300 ml-2">
                          {value}
                        </span>
                      </div>
                    );
                  } else if (
                    line.trim().startsWith("Expected:") ||
                    line.trim().startsWith("Expected file pattern:") ||
                    line.trim().startsWith("Expected path pattern:") ||
                    line.trim().startsWith("Search pattern:")
                  ) {
                    const [label, ...valueParts] = line.split(":");
                    const value = valueParts.join(":").trim();
                    return (
                      <div key={i} className="flex items-start mt-1 ml-6">
                        <span className="text-slate-400 text-xs">{label}:</span>
                        <span className="font-mono text-xs text-red-300 ml-2 break-all">
                          {value}
                        </span>
                      </div>
                    );
                  } else if (
                    line.trim().startsWith("Missing files:") ||
                    line.trim().startsWith("Missing for dates:")
                  ) {
                    return (
                      <div
                        key={i}
                        className="font-semibold mt-3 mb-2 text-red-300"
                      >
                        {line}
                      </div>
                    );
                  } else if (line.trim().startsWith("•")) {
                    return (
                      <div
                        key={i}
                        className="ml-4 mt-1.5 text-yellow-300 font-medium"
                      >
                        {line}
                      </div>
                    );
                  } else if (line.trim() === "") {
                    return <div key={i} className="h-2" />;
                  } else if (
                    line.trim() === "Missing Market Data" ||
                    line.trim() === "Missing Instrument Definitions" ||
                    line.trim() === "Missing Strategy Instructions"
                  ) {
                    return (
                      <div
                        key={i}
                        className="font-bold text-lg mb-2 text-red-400"
                      >
                        {line}
                      </div>
                    );
                  } else {
                    return <div key={i}>{line}</div>;
                  }
                })
              : "An error occurred during backtest execution"}
          </div>

          {/* Collapsible details section */}
          {(executionContext || errorInfo.details) && (
            <div className="pt-2 border-t border-slate-700">
              <Button
                onClick={() => setShowDetails(!showDetails)}
                variant="ghost"
                className="flex items-center space-x-2 text-sm text-slate-300 hover:text-slate-100 transition-colors w-full justify-start p-0 h-auto"
              >
                {showDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                <span>Show technical details</span>
              </Button>

              {showDetails && (
                <div className="mt-3 space-y-3 bg-slate-900/30 rounded p-3">
                  {/* Preflight Details - What was searched */}
                  {errorInfo.category === "preflight" && errorInfo.details && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wide">
                        Preflight Check Details
                      </h4>

                      {errorInfo.details.searched_bucket && (
                        <div className="text-xs">
                          <span className="text-slate-400">
                            Searched bucket:{" "}
                          </span>
                          <span className="font-mono text-cyan-300">
                            {errorInfo.details.searched_bucket}
                          </span>
                        </div>
                      )}

                      {errorInfo.details.searched_pattern && (
                        <div className="text-xs">
                          <span className="text-slate-400">
                            Search pattern:{" "}
                          </span>
                          <span className="font-mono text-slate-300 break-all">
                            {errorInfo.details.searched_pattern}
                          </span>
                        </div>
                      )}

                      {errorInfo.details.missing_items &&
                        errorInfo.details.missing_items.length > 0 && (
                          <div className="text-xs">
                            <span className="text-slate-400">
                              Missing items (
                              {errorInfo.details.missing_items.length}):
                            </span>
                            <div className="mt-1 ml-4 space-y-1 max-h-32 overflow-y-auto">
                              {errorInfo.details.missing_items
                                .slice(0, 10)
                                .map((item: MissingItem, i: number) => (
                                  <div key={i} className="font-mono text-xs">
                                    {item.instrument && (
                                      <span className="text-yellow-300">
                                        {item.instrument}
                                      </span>
                                    )}
                                    {item.strategy && (
                                      <span className="text-yellow-300">
                                        {item.strategy}
                                      </span>
                                    )}
                                    {item.date && (
                                      <span className="text-slate-300">
                                        {" "}
                                        on {item.date}
                                      </span>
                                    )}
                                    {item.path && (
                                      <span className="text-red-300 block ml-2 break-all">
                                        {item.path}
                                      </span>
                                    )}
                                    {item.error && (
                                      <span className="text-red-300 block ml-2">
                                        {item.error}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              {errorInfo.details.missing_items.length > 10 && (
                                <div className="text-slate-400 italic">
                                  ... and{" "}
                                  {errorInfo.details.missing_items.length - 10}{" "}
                                  more
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                      {/* Display error message for new error types */}
                      {errorInfo.details.error_message && (
                        <div className="text-xs">
                          <span className="text-slate-400">Error: </span>
                          <span className="text-red-300">
                            {errorInfo.details.error_message}
                          </span>
                        </div>
                      )}

                      {/* Display fix instructions if available */}
                      {errorInfo.details.fix_instructions && (
                        <div className="text-xs mt-2 pt-2 border-t border-slate-700">
                          <span className="text-slate-400 font-semibold">
                            Fix Instructions:
                          </span>
                          <div className="mt-1 ml-4 font-mono text-green-300 whitespace-pre-wrap">
                            {errorInfo.details.fix_instructions}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Execution Context */}
                  {executionContext && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wide">
                        Execution Context
                      </h4>

                      {executionContext.config_path && (
                        <div className="text-xs">
                          <span className="text-slate-400">Config: </span>
                          <span className="font-mono text-cyan-300 break-all">
                            {executionContext.config_path}
                          </span>
                        </div>
                      )}

                      {(executionContext.start_date ||
                        executionContext.end_date) && (
                        <div className="text-xs">
                          <span className="text-slate-400">Date Range: </span>
                          <span className="font-mono text-slate-200">
                            {executionContext.start_date} to{" "}
                            {executionContext.end_date}
                          </span>
                        </div>
                      )}

                      {executionContext.project_id && (
                        <div className="text-xs">
                          <span className="text-slate-400">GCP Project: </span>
                          <span className="font-mono text-slate-200">
                            {executionContext.project_id}
                          </span>
                        </div>
                      )}

                      {executionContext.buckets_used &&
                        executionContext.buckets_used.length > 0 && (
                          <div className="text-xs">
                            <span className="text-slate-400">
                              Buckets Used:
                            </span>
                            <ul className="mt-1 ml-4 space-y-1">
                              {executionContext.buckets_used.map(
                                (bucket, i) => (
                                  <li
                                    key={i}
                                    className="font-mono text-cyan-300"
                                  >
                                    {bucket}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}

                      {executionContext.environment_vars &&
                        Object.keys(executionContext.environment_vars).length >
                          0 && (
                          <div className="text-xs">
                            <span className="text-slate-400">
                              Environment Variables:
                            </span>
                            <div className="mt-1 ml-4 space-y-1">
                              {Object.entries(
                                executionContext.environment_vars,
                              ).map(([key, value]) => (
                                <div key={key} className="font-mono">
                                  <span className="text-slate-300">{key}=</span>
                                  <span className="text-green-300">
                                    {value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Raw error details (only if not preflight) */}
                  {errorInfo.category !== "preflight" &&
                    errorInfo.details &&
                    Object.keys(errorInfo.details).length > 0 && (
                      <div className="pt-2 border-t border-slate-700">
                        <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wide mb-2">
                          Error Details
                        </h4>
                        <div className="bg-slate-900/50 rounded p-2 font-mono text-xs text-slate-300 overflow-x-auto">
                          <pre>
                            {JSON.stringify(errorInfo.details, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {/* Unknown error indicator */}
          {errorInfo.is_known_error === false && (
            <div className="pt-2 border-t border-yellow-700">
              <p className="text-xs text-yellow-300">
                ⚠️ This is a new or unrecognized error. Please check the logs
                below for details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Error Display Component - handles both single and multiple errors
function ErrorDisplayBox({ jobStatus }: { jobStatus: JobStatus }) {
  const errors: ErrorInfo[] = jobStatus.errors || [];

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {errors.map((errorInfo, index) => (
        <SingleErrorBox key={index} errorInfo={errorInfo} />
      ))}
    </div>
  );
}

export default function RunBacktest() {
  const [mode, setMode] = useState<Mode>("single");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startHour, setStartHour] = useState(0);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(23);
  const [endMinute, setEndMinute] = useState(59);
  const [configSource, setConfigSource] = useState<"gcs" | "file">("gcs");
  const [parallel, setParallel] = useState(4);
  const [skipPreflight, setSkipPreflight] = useState(false);
  const [skipDependencyCheck, setSkipDependencyCheck] = useState(false);
  const [strategyId, setStrategyId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // GCS Browser state
  const [projectId] = useState(import.meta.env.VITE_GCP_PROJECT_ID ?? "");
  const [bucket, setBucket] = useState(
    `execution-store-${import.meta.env.VITE_GCP_PROJECT_ID ?? ""}`,
  );
  const [configPrefix, setConfigPrefix] = useState(CONFIG_ROOT);
  const [prefixHistory, setPrefixHistory] = useState<string[]>([]);
  const [selectedConfigs, setSelectedConfigs] = useState<string[]>([]);

  // Config ownership (v1, v2, or user-specific)
  const [configOwnership, setConfigOwnership] = useState<"v1" | "v2" | "user">(
    "v1",
  );
  const [selectedUser, setSelectedUser] = useState<string>("");

  // Ref to track target prefix when loading example (avoids race condition with useEffect)
  const targetPrefixRef = useRef<string | null>(null);

  // Job tracking state (single mode)
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);

  // Batch tracking state (batch mode)
  const [batchJobs, setBatchJobs] = useState<BatchJobInfo[]>([]);
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);

  // Local file state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localFiles, setLocalFiles] = useState<File[]>([]);

  // Mass deployment state
  const [forceOverride, setForceOverride] = useState(false);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);

  // Cloud deployment state (unified-trading-deployment-v2)
  const [cloudDeployment, setCloudDeployment] =
    useState<DeploymentResponse | null>(null);
  const [cloudDeploymentPolling, setCloudDeploymentPolling] = useState(false);
  const [dataStatus, setDataStatus] = useState<DataStatusResponse | null>(null);
  const [dataStatusLoading, setDataStatusLoading] = useState(false);
  const [showDataStatusPreview, setShowDataStatusPreview] = useState(false);
  const [expandedConfigsInPreview, setExpandedConfigsInPreview] = useState<
    Set<string>
  >(new Set());
  const [showCliPreview, setShowCliPreview] = useState(true); // Show by default
  const [deployMissingOnly, setDeployMissingOnly] = useState(false);
  const [missingShardsData, setMissingShardsData] =
    useState<ExecutionMissingShardsResponse | null>(null);
  const [missingShardsLoading, setMissingShardsLoading] = useState(false);

  // Fetch available buckets
  const { data: bucketsData, error: bucketsError } = useQuery({
    queryKey: ["buckets", projectId],
    queryFn: async () => {
      const response = await apiClient.get<{
        buckets: BucketInfo[];
        project_id: string;
      }>(
        `/results/buckets?project_id=${encodeURIComponent(projectId)}&filter_prefix=execution-store`,
      );
      return response.data;
    },
    enabled: configSource === "gcs",
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });

  // Fetch config prefixes
  const {
    data: prefixesData,
    isLoading: prefixesLoading,
    error: prefixesError,
  } = useQuery({
    queryKey: ["config-prefixes", bucket, configPrefix],
    queryFn: async () => {
      const response = await apiClient.get<{
        prefixes: PrefixInfo[];
        bucket: string;
      }>(
        `/results/prefixes?bucket=${encodeURIComponent(bucket)}&parent_prefix=${encodeURIComponent(configPrefix)}`,
      );
      return response.data;
    },
    enabled: configSource === "gcs" && !!bucket,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  // Fetch config files (JSON files at current level)
  const { data: configFilesData } = useQuery({
    queryKey: ["config-files", bucket, configPrefix],
    queryFn: async () => {
      const response = await apiClient.get<{ files: string[] }>(
        `/results/files?bucket=${encodeURIComponent(bucket)}&prefix=${encodeURIComponent(configPrefix)}&suffix=.json`,
      );
      return response.data;
    },
    enabled:
      configSource === "gcs" &&
      !!bucket &&
      configPrefix.split("/").filter(Boolean).length >= 4,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  // Fetch system cores (for batch mode)
  const { data: systemCores, error: systemCoresError } = useQuery({
    queryKey: ["system-cores"],
    queryFn: async () => {
      const response = await apiClient.get<SystemCoresResponse>(
        "/config/system/cores",
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour (cores don't change)
    gcTime: 1000 * 60 * 60 * 24, // Keep for 24 hours
    retry: 1,
  });

  // Combine API errors for display
  const apiError = bucketsError || prefixesError || systemCoresError;

  // Fetch available config sources (global + users)
  const { data: configSources } = useQuery({
    queryKey: ["config-sources"],
    queryFn: async () => {
      const response = await apiClient.get<{
        sources: Array<{
          name: string;
          type: string;
          path: string;
          config_count: number;
          username?: string;
        }>;
      }>("/config/sources");
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Poll job status when there's an active job
  const { data: polledStatus } = useQuery({
    queryKey: ["job-status", activeJobId],
    queryFn: async () => {
      if (!activeJobId) return null;
      // Request full logs for display
      const response = await apiClient.get<JobStatus>(
        `/backtest/status/${activeJobId}?full_logs=true`,
      );
      return response.data;
    },
    enabled:
      !!activeJobId &&
      jobStatus?.status !== "completed" &&
      jobStatus?.status !== "failed",
    refetchInterval: 2000, // Poll every 2 seconds
  });

  // Update job status when polling returns data
  useEffect(() => {
    if (polledStatus) {
      setJobStatus(polledStatus);
      if (polledStatus.status === "completed") {
        setSuccess(
          `Backtest completed! Results: ${polledStatus.gcs_result_path || "Available in GCS"}`,
        );
      }
      // Don't set error here - backtest errors are displayed in ErrorDisplayBox component
      // Only API connection errors should show in the top-level error box
    }
  }, [polledStatus]);

  // Helper to read file as JSON
  const readFileAsJson = async (
    file: File,
  ): Promise<Record<string, unknown>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          resolve(json);
        } catch (err) {
          reject(new Error(`Invalid JSON in file ${file.name}: ${err}`));
        }
      };
      reader.onerror = () =>
        reject(new Error(`Failed to read file ${file.name}`));
      reader.readAsText(file);
    });
  };

  // Run backtest mutation
  const runBacktestMutation = useMutation({
    mutationFn: async () => {
      if (!startDate || !endDate) {
        throw new Error("Please select start and end dates");
      }

      // Handle local file configs
      if (configSource === "file") {
        if (localFiles.length === 0) {
          throw new Error("Please select local config file(s)");
        }

        if (mode === "single") {
          const configJson = await readFileAsJson(localFiles[0]);
          const response = await apiClient.post<{
            job_id: string;
            status: string;
            message?: string;
          }>("/backtest/run-local", {
            config_json: configJson,
            start_date: formatDateTime(startDate, startHour, startMinute),
            end_date: formatDateTime(endDate, endHour, endMinute),
            skip_dependency_check: skipDependencyCheck,
            skip_preflight: skipPreflight,
          });
          return { type: "single" as const, ...response.data };
        } else {
          const configs = await Promise.all(
            localFiles.map((f) => readFileAsJson(f)),
          );
          const response = await apiClient.post<{
            batch_id: string;
            jobs: Array<{
              job_id: string;
              config_id?: string;
              config_path?: string;
            }>;
          }>("/backtest/batch-local", {
            config_jsons: configs,
            start_date: formatDateTime(startDate, startHour, startMinute),
            end_date: formatDateTime(endDate, endHour, endMinute),
            parallel: parallel,
          });
          return {
            type: "batch" as const,
            batch_id: response.data.batch_id,
            jobs: response.data.jobs.map((job, idx) => ({
              job_id: job.job_id,
              config_path: localFiles[idx]?.name || "unknown",
              status: "queued" as const,
            })),
            message: `Batch started with ${response.data.jobs.length} local configs`,
          };
        }
      }

      // Handle GCS configs
      if (selectedConfigs.length === 0) {
        throw new Error("Please select a config from GCS");
      }

      const configPath = `gs://${bucket}/${selectedConfigs[0]}`;

      if (mode === "single") {
        const response = await apiClient.post<{
          job_id: string;
          status: string;
          message?: string;
        }>("/backtest/run", {
          config_gcs_path: configPath,
          start_date: formatDateTime(startDate, startHour, startMinute),
          end_date: formatDateTime(endDate, endHour, endMinute),
          skip_dependency_check: skipDependencyCheck,
          skip_preflight: skipPreflight,
          upload_gcs: true, // Match CLI behavior exactly
          strategy_id: strategyId || undefined, // Include strategy_id if provided
        });
        return { type: "single" as const, ...response.data };
      } else {
        const configPaths = selectedConfigs.map((c) => `gs://${bucket}/${c}`);
        const response = await apiClient.post<{
          batch_id: string;
          jobs: Array<{ job_id: string; config_path?: string }>;
        }>("/backtest/batch", {
          config_gcs_paths: configPaths,
          start_date: formatDateTime(startDate, startHour, startMinute),
          end_date: formatDateTime(endDate, endHour, endMinute),
          parallel: parallel,
        });
        // Track ALL jobs, not just the first one
        return {
          type: "batch" as const,
          batch_id: response.data.batch_id,
          jobs: response.data.jobs.map((job, idx) => ({
            job_id: job.job_id,
            config_path: configPaths[idx] || "unknown",
            status: "queued" as const,
          })),
          message: `Batch started with ${response.data.jobs.length} configs`,
        };
      }
    },
    onSuccess: (data) => {
      if (data.type === "single") {
        setActiveJobId(data.job_id);
        setJobStatus({ job_id: data.job_id, status: "queued" });
        setBatchJobs([]);
      } else {
        // Track all batch jobs
        setBatchJobs(data.jobs);
        setBatchStatus({
          batch_id: data.batch_id,
          total_jobs: data.jobs.length,
          completed: 0,
          failed: 0,
          running: data.jobs.length,
          queued: 0,
          jobs: data.jobs,
        });
        setActiveJobId(null);
        setJobStatus(null);
      }
      setSuccess(data.message || `Backtest started`);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to start backtest");
      setSuccess(null);
    },
  });

  // Check for quick test configs from ConfigGenerator on mount
  useEffect(() => {
    const quickTestDataStr = sessionStorage.getItem("quickTestConfigPaths");
    if (quickTestDataStr) {
      try {
        const quickTestData = JSON.parse(quickTestDataStr);

        // Prefer config JSONs if available (for batch-local mode with full details)
        if (
          quickTestData.configJsons &&
          Array.isArray(quickTestData.configJsons) &&
          quickTestData.configJsons.length > 0
        ) {
          // Create File objects from config JSONs for batch-local mode
          const configFiles = quickTestData.configJsons.map(
            (configJson: Record<string, unknown>, idx: number) => {
              const configId =
                (configJson.config_id as string) || `quick-test-config-${idx}`;
              const blob = new Blob([JSON.stringify(configJson, null, 2)], {
                type: "application/json",
              });
              return new File([blob], `${configId}.json`, {
                type: "application/json",
              });
            },
          );

          // Set default dates
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const defaultStartDate = yesterday.toISOString().split("T")[0];
          const defaultEndDate = today.toISOString().split("T")[0];

          // Set up batch mode with local files
          setMode(quickTestData.mode || "batch");
          setConfigSource("file"); // Use file mode for batch-local
          setLocalFiles(configFiles);
          if (quickTestData.parallel) {
            setParallel(quickTestData.parallel);
          }

          // Set dates
          setStartDate(defaultStartDate);
          setEndDate(defaultEndDate);

          // Show success message
          setSuccess(
            `Loaded ${configFiles.length} configs from Quick Test (with full details). ${quickTestData.autoStart ? "Starting batch backtest..." : "Ready to run batch backtest."}`,
          );

          // Clear sessionStorage after loading
          sessionStorage.removeItem("quickTestConfigPaths");

          // Auto-start if requested
          if (quickTestData.autoStart) {
            setTimeout(() => {
              runBacktestMutation.mutate();
            }, 1000);
          }
        } else if (
          quickTestData.configPaths &&
          Array.isArray(quickTestData.configPaths) &&
          quickTestData.configPaths.length > 0
        ) {
          // Fallback to GCS paths if JSONs not available
          const configPaths = quickTestData.configPaths.map((path: string) => {
            if (path.startsWith("gs://")) {
              const parts = path.replace("gs://", "").split("/");
              return parts.slice(1).join("/");
            }
            return path;
          });

          // Set default dates
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const defaultStartDate = yesterday.toISOString().split("T")[0];
          const defaultEndDate = today.toISOString().split("T")[0];

          // Set up batch mode with GCS configs
          setMode(quickTestData.mode || "batch");
          setConfigSource(quickTestData.source || "gcs");
          setSelectedConfigs(configPaths);
          if (quickTestData.parallel) {
            setParallel(quickTestData.parallel);
          }

          // Set dates
          setStartDate(defaultStartDate);
          setEndDate(defaultEndDate);

          // Show success message
          setSuccess(
            `Loaded ${configPaths.length} configs from Quick Test. ${quickTestData.autoStart ? "Starting batch backtest..." : "Ready to run batch backtest."}`,
          );

          // Clear sessionStorage after loading
          sessionStorage.removeItem("quickTestConfigPaths");

          // Auto-start if requested
          if (quickTestData.autoStart) {
            setTimeout(() => {
              runBacktestMutation.mutate();
            }, 1000);
          }
        }
      } catch (err) {
        console.error("Failed to parse quick test config paths:", err);
        sessionStorage.removeItem("quickTestConfigPaths");
      }
    }
  }, []); // Run once on mount

  // Reset config prefix when bucket changes
  useEffect(() => {
    setConfigPrefix(CONFIG_ROOT);
    setPrefixHistory([]);
    // Don't clear selectedConfigs if they came from quick test
    const quickTestDataStr = sessionStorage.getItem("quickTestConfigPaths");
    if (!quickTestDataStr) {
      setSelectedConfigs([]);
    }
  }, [bucket]);

  // Update config prefix when ownership or user changes
  useEffect(() => {
    // If we have a target prefix from loading example, use it instead of resetting
    if (targetPrefixRef.current) {
      const target = targetPrefixRef.current;
      targetPrefixRef.current = null; // Clear ref after use
      setConfigPrefix(target);
      return;
    }

    // Otherwise, reset to root based on ownership
    if (configOwnership === "v1") {
      setConfigPrefix("configs/V1/");
    } else if (configOwnership === "v2") {
      setConfigPrefix("configs/V2/");
    } else if (configOwnership === "user" && selectedUser) {
      setConfigPrefix(`configs/users/${selectedUser}/`);
    }
    setPrefixHistory([]);
    setSelectedConfigs([]);
  }, [configOwnership, selectedUser]);

  // Cloud deployment mutation (via unified-trading-deployment-v2)
  const cloudDeployMutation = useMutation({
    mutationFn: async () => {
      if (!startDate || !endDate) {
        throw new Error("Please select start and end dates");
      }
      if (selectedFolders.length === 0) {
        throw new Error("Please select at least one folder");
      }

      // Build config path from selected folders
      // If multiple folders selected, use the common parent
      const configPath =
        selectedFolders.length === 1
          ? `gs://${bucket}/${selectedFolders[0]}`
          : `gs://${bucket}/${configPrefix}`;

      const response = await deploymentClient.createDeployment({
        service: "execution-services",
        start_date: formatDateOnly(startDate),
        end_date: formatDateOnly(endDate),
        cloud_config_path: configPath,
        compute: "vm", // Default to VM for better resource availability
        force: forceOverride,
        deploy_missing_only: deployMissingOnly,
        dry_run: false,
      });

      return response;
    },
    onSuccess: (data) => {
      if (!data.deployment_id) {
        setError(
          "Cloud deployment returned no deployment_id (likely dry-run response).",
        );
        setSuccess(null);
        setCloudDeploymentPolling(false);
        return;
      }
      setCloudDeployment(data);
      setCloudDeploymentPolling(true);
      setSuccess(
        `Cloud deployment started: ${data.deployment_id} (${data.total_shards} shards)`,
      );
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to start cloud deployment");
      setSuccess(null);
    },
  });

  // Poll cloud deployment status
  const pollDeploymentStatus = useCallback(async () => {
    if (!cloudDeployment?.deployment_id || !cloudDeploymentPolling) return;

    try {
      const status = await deploymentClient.getDeployment(
        cloudDeployment.deployment_id,
      );
      setCloudDeployment(status);

      // Stop polling when complete or failed
      if (status.status === "completed" || status.status === "failed") {
        setCloudDeploymentPolling(false);
        if (status.status === "completed") {
          setSuccess(
            `Deployment completed: ${status.completed_shards}/${status.total_shards} shards`,
          );
        } else {
          setError(`Deployment failed: ${status.failed_shards} shards failed`);
        }
      }
    } catch (err) {
      console.error("Error polling deployment status:", err);
    }
  }, [cloudDeployment?.deployment_id, cloudDeploymentPolling]);

  // Polling effect for cloud deployment
  useEffect(() => {
    if (!cloudDeploymentPolling) return;

    const interval = setInterval(pollDeploymentStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [cloudDeploymentPolling, pollDeploymentStatus]);

  // Fetch data status preview (check existing results before deploy)
  const fetchDataStatus = useCallback(async () => {
    if (selectedFolders.length === 0 || !startDate || !endDate) return;

    setDataStatusLoading(true);
    try {
      const configPath =
        selectedFolders.length === 1
          ? `gs://${bucket}/${selectedFolders[0]}`
          : `gs://${bucket}/${configPrefix}`;

      const status = await deploymentClient.getDataStatus({
        config_path: configPath,
        start_date: formatDateOnly(startDate),
        end_date: formatDateOnly(endDate),
        include_dates_list: true,
      });
      setDataStatus(status);
    } catch (err) {
      console.error("Error fetching data status:", err);
      setDataStatus(null);
    } finally {
      setDataStatusLoading(false);
    }
  }, [bucket, configPrefix, selectedFolders, startDate, endDate]);

  // Fetch missing shards (config×date combinations that need deployment)
  const fetchMissingShards = useCallback(async () => {
    if (selectedFolders.length === 0 || !startDate || !endDate) return;

    setMissingShardsLoading(true);
    try {
      const configPath =
        selectedFolders.length === 1
          ? `gs://${bucket}/${selectedFolders[0]}`
          : `gs://${bucket}/${configPrefix}`;

      const result = await deploymentClient.getExecutionMissingShards({
        config_path: configPath,
        start_date: formatDateOnly(startDate),
        end_date: formatDateOnly(endDate),
      });
      setMissingShardsData(result);
    } catch (err) {
      console.error("Error fetching missing shards:", err);
      setMissingShardsData(null);
    } finally {
      setMissingShardsLoading(false);
    }
  }, [
    bucket,
    configPrefix,
    selectedFolders,
    startDate,
    startHour,
    startMinute,
    endDate,
    endHour,
    endMinute,
  ]);

  const handleRun = () => {
    setError(null);
    setSuccess(null);
    setJobStatus(null);
    setActiveJobId(null);
    runBacktestMutation.mutate();
  };

  // Run exact CLI test mutation (for comparison)
  const runExactCliMutation = useMutation({
    mutationFn: async () => {
      if (!startDate || !endDate) {
        throw new Error("Please select start and end dates");
      }

      // Only works with GCS configs in single mode
      if (configSource !== "gcs" || mode !== "single") {
        throw new Error(
          "Exact CLI test only works with GCS configs in single mode",
        );
      }

      if (selectedConfigs.length === 0) {
        throw new Error("Please select a config from GCS");
      }

      const configPath = `gs://${bucket}/${selectedConfigs[0]}`;

      const response = await apiClient.post<{
        job_id: string;
        status: string;
        message?: string;
      }>("/backtest/run-exact-cli", {
        config_gcs_path: configPath,
        start_date: formatDateTime(startDate, startHour, startMinute),
        end_date: formatDateTime(endDate, endHour, endMinute),
        upload_gcs: true,
        skip_dependency_check: skipDependencyCheck,
        skip_preflight: skipPreflight,
      });
      return { type: "single" as const, ...response.data };
    },
    onSuccess: (data) => {
      setActiveJobId(data.job_id);
      setJobStatus({ job_id: data.job_id, status: "queued" });
      setBatchJobs([]);
      setSuccess(data.message || `Exact CLI test started`);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to start exact CLI test");
      setSuccess(null);
    },
  });

  // Load example CLI command values into form
  const loadExampleCliCommand = () => {
    // Example command values from the provided CLI command
    const exampleStart = "2023-05-23T07:00:00Z";
    const exampleEnd = "2023-05-23T16:00:00Z";
    const exampleStrategyId = "DEFI_ETH_comprehensive-defi_SCE_5M_V2";
    const targetPrefix = "configs/V2/DEFI_ETH_comprehensive-defi/SCE/5M/";

    // Parse the start time
    const startMatch = exampleStart.match(
      /(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):/,
    );
    if (startMatch) {
      setStartDate(startMatch[1]);
      setStartHour(parseInt(startMatch[2], 10));
      setStartMinute(parseInt(startMatch[3], 10));
    }

    // Parse the end time
    const endMatch = exampleEnd.match(/(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):/);
    if (endMatch) {
      setEndDate(endMatch[1]);
      setEndHour(parseInt(endMatch[2], 10));
      setEndMinute(parseInt(endMatch[3], 10));
    }

    // Build prefix history by navigating through folder structure
    // This ensures proper navigation path: V2/ -> DEFI_ETH_comprehensive-defi/ -> SCE/ -> 5M/
    const prefixParts = targetPrefix
      .replace("configs/V2/", "")
      .split("/")
      .filter(Boolean);
    const history: string[] = ["configs/V2/"];
    let currentPrefix = "configs/V2/";

    for (const part of prefixParts) {
      currentPrefix = currentPrefix + part + "/";
      history.push(currentPrefix);
    }

    // Set target prefix in ref first, then change ownership
    // The useEffect will check the ref and navigate directly to target
    targetPrefixRef.current = targetPrefix;
    setPrefixHistory(history.slice(0, -1));
    setConfigOwnership("v2");

    // Set the full config path (user will need to select it from the browser)
    setSelectedConfigs([]); // Clear first, user needs to select it
    setStrategyId(exampleStrategyId);

    setSuccess(
      `Example CLI values loaded! Navigate to: ${targetPrefix} and select the config file.`,
    );
  };

  const handleExactCliTest = () => {
    // Load example values instead of running
    loadExampleCliCommand();
  };

  // Generate CLI command preview
  const generateCliCommand = (): string => {
    if (!startDate || !endDate || selectedConfigs.length === 0) {
      return "";
    }

    const configPath = `gs://${bucket}/${selectedConfigs[0]}`;
    const startTime = formatDateTime(startDate, startHour, startMinute);
    const endTime = formatDateTime(endDate, endHour, endMinute);

    const cmdParts = [
      "python -m execution_services.cli.backtest",
      `--config-gcs "${configPath}"`,
      `--start "${startTime}"`,
      `--end "${endTime}"`,
      "--upload-gcs",
    ];

    if (skipDependencyCheck) {
      cmdParts.push("--skip-dependency-check");
    }

    if (skipPreflight) {
      cmdParts.push("--skip-preflight");
    }

    // Add strategy-id if provided
    if (strategyId) {
      cmdParts.push(`--strategy-id ${strategyId}`);
    }

    return cmdParts.join(" \\\n  ");
  };

  const handleCopyCliCommand = async () => {
    const command = generateCliCommand();
    try {
      await navigator.clipboard.writeText(command);
      setSuccess("CLI command copied to clipboard!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (_err) {
      setError("Failed to copy command");
    }
  };

  const handleCloudDeploy = () => {
    setError(null);
    setSuccess(null);
    setCloudDeployment(null);
    cloudDeployMutation.mutate();
  };

  // Navigate into a folder
  const navigateToFolder = (folderPrefix: string) => {
    setPrefixHistory([...prefixHistory, configPrefix]);
    setConfigPrefix(folderPrefix);
  };

  // Navigate back to parent
  const navigateBack = () => {
    if (prefixHistory.length > 0) {
      const newHistory = [...prefixHistory];
      const previousPrefix = newHistory.pop() || CONFIG_ROOT;
      setPrefixHistory(newHistory);
      setConfigPrefix(previousPrefix);
    }
  };

  // Select a config file
  const selectConfig = (fullPath: string) => {
    if (mode === "single") {
      setSelectedConfigs([fullPath]);
    } else {
      if (selectedConfigs.includes(fullPath)) {
        setSelectedConfigs(selectedConfigs.filter((c) => c !== fullPath));
      } else {
        // No hardcoded limit - user controls via parallel workers
        setSelectedConfigs([...selectedConfigs, fullPath]);
      }
    }
  };

  // Handle local file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (mode === "single") {
      setLocalFiles(files.slice(0, 1));
    } else {
      // No hardcoded limit - user controls via parallel workers
      setLocalFiles(files);
    }
  };

  const isRunning =
    runBacktestMutation.isPending ||
    runExactCliMutation.isPending ||
    cloudDeployMutation.isPending ||
    cloudDeploymentPolling ||
    jobStatus?.status === "running" ||
    jobStatus?.status === "queued" ||
    (batchStatus && batchStatus.running > 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">
            Run Backtest
          </h1>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            Configure and launch strategy backtests
          </p>
        </div>
        <Button
          size="sm"
          disabled={!!isRunning}
          onClick={() => runBacktestMutation.mutate()}
        >
          <Play size={14} className="mr-1" />
          {isRunning ? "Running…" : "Run"}
        </Button>
      </div>

      {/* Error/Success Messages - Only show API connection errors, not backtest execution errors */}
      {apiError && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-200">
              {apiError instanceof Error
                ? apiError.message
                : "API connection failed"}
            </span>
          </div>
          <p className="text-sm text-red-300 mt-2">
            Make sure the backend API is running:{" "}
            <code className="bg-red-800 px-2 py-1 rounded">
              cd execution-services/visualizer-api && uvicorn app.main:app
              --port 8001
            </code>
          </p>
        </div>
      )}
      {/* Show error only for API/startup errors, not backtest execution errors */}
      {error && !jobStatus && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-200">{error}</span>
          </div>
        </div>
      )}
      {success && (
        <div className="bg-green-900/50 border border-green-700 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-green-200">{success}</span>
        </div>
      )}

      {/* Mode Selection */}
      <div className="card">
        <div className="card-body">
          <div className="flex space-x-4 flex-wrap gap-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                checked={mode === "single"}
                onChange={() => {
                  setMode("single");
                  setSelectedConfigs(selectedConfigs.slice(0, 1));
                }}
                className="w-4 h-4 text-blue-600"
              />
              <span>Single Config</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                checked={mode === "batch"}
                onChange={() => setMode("batch")}
                className="w-4 h-4 text-blue-600"
              />
              <span>Batch (Local Parallel)</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                checked={mode === "mass-deploy"}
                onChange={() => setMode("mass-deploy")}
                className="w-4 h-4 text-purple-600"
              />
              <span className="text-purple-400">Mass Deploy (Cloud)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Config Source Selection (Global vs User) */}
      {configSource === "gcs" && (
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-medium mb-4">Config Source</h3>
            <div className="grid grid-cols-3 gap-4">
              {/* V1 Configs */}
              <label
                className={`flex items-start space-x-3 p-4 rounded-lg cursor-pointer transition-colors ${
                  configOwnership === "v1"
                    ? "bg-cyan-900/30 border border-cyan-600"
                    : "bg-slate-700/50 border border-slate-600 hover:border-slate-500"
                }`}
              >
                <input
                  type="radio"
                  checked={configOwnership === "v1"}
                  onChange={() => setConfigOwnership("v1")}
                  className="mt-1 w-4 h-4 text-cyan-600"
                />
                <div>
                  <div className="font-medium">V1 Configs</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Standard combinatorics configs from grid_generator.py
                  </div>
                  {configSources?.sources.find((s) => s.type === "global") && (
                    <div className="text-xs text-cyan-400 mt-1">
                      {configSources.sources.find((s) => s.type === "global")
                        ?.config_count || 0}{" "}
                      configs available
                    </div>
                  )}
                </div>
              </label>

              {/* V2 Configs */}
              <label
                className={`flex items-start space-x-3 p-4 rounded-lg cursor-pointer transition-colors ${
                  configOwnership === "v2"
                    ? "bg-green-900/30 border border-green-600"
                    : "bg-slate-700/50 border border-slate-600 hover:border-slate-500"
                }`}
              >
                <input
                  type="radio"
                  checked={configOwnership === "v2"}
                  onChange={() => setConfigOwnership("v2")}
                  className="mt-1 w-4 h-4 text-green-600"
                />
                <div>
                  <div className="font-medium">V2 Configs</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Multi-instruction type configs with explicit instruction
                    types
                  </div>
                </div>
              </label>

              {/* User-Specific Configs */}
              <label
                className={`flex items-start space-x-3 p-4 rounded-lg cursor-pointer transition-colors ${
                  configOwnership === "user"
                    ? "bg-purple-900/30 border border-purple-600"
                    : "bg-slate-700/50 border border-slate-600 hover:border-slate-500"
                }`}
              >
                <input
                  type="radio"
                  checked={configOwnership === "user"}
                  onChange={() => setConfigOwnership("user")}
                  className="mt-1 w-4 h-4 text-purple-600"
                />
                <div className="flex-1">
                  <div className="font-medium">User-Specific Configs</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Configs generated via UI by specific users
                  </div>
                  {configOwnership === "user" && (
                    <Select
                      value={selectedUser}
                      onValueChange={setSelectedUser}
                    >
                      <SelectTrigger
                        className="mt-2 w-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectValue placeholder="Select a user..." />
                      </SelectTrigger>
                      <SelectContent>
                        {configSources?.sources
                          .filter(
                            (s): s is typeof s & { username: string } =>
                              s.type === "user" && !!s.username,
                          )
                          .map((source) => (
                            <SelectItem
                              key={source.username}
                              value={source.username}
                            >
                              {source.username} ({source.config_count} configs)
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </label>
            </div>

            {configOwnership === "user" && !selectedUser && (
              <div className="mt-3 text-sm text-amber-400">
                Please select a user to browse their configs
              </div>
            )}
          </div>
        </div>
      )}

      {/* Batch Mode Info */}
      {mode === "batch" && (
        <div className="grid grid-cols-2 gap-4">
          {/* CPU Info */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <span className="font-medium text-cyan-400">
                System Resources
              </span>
            </div>
            {systemCores ? (
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-slate-400">Available cores: </span>
                  <span className="font-mono text-green-400">
                    {systemCores.cores}
                  </span>
                </p>
                <p>
                  <span className="text-slate-400">Recommended workers: </span>
                  <span className="font-mono text-cyan-400">
                    {systemCores.recommended_workers}
                  </span>
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Workers = cores - 1 (leaves 1 core for system)
                </p>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">Loading system info...</p>
            )}
          </div>

          {/* Warning/Info */}
          <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-400 mb-1">
                Local Testing Mode
              </p>
              <p className="text-amber-200/80">
                Batch mode runs configs locally in parallel. For full-scale
                backtests (100s-1000s of configs), use{" "}
                <code className="bg-slate-800 px-1 rounded">
                  unified-trading-deployment-v2
                </code>{" "}
                with cloud sharding.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mass Deploy Mode Info */}
      {mode === "mass-deploy" && (
        <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Cpu className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-purple-400 mb-1">
                Cloud Deployment Mode
              </p>
              <p className="text-purple-200/80 mb-2">
                Mass deployment uses{" "}
                <code className="bg-slate-800 px-1 rounded">
                  unified-trading-deployment-v2
                </code>{" "}
                to run backtests across Cloud Run Jobs with automatic sharding.
                Select config folders instead of individual files.
              </p>
              <ul className="text-purple-200/60 text-xs space-y-1 list-disc list-inside">
                <li>
                  Results are stored in GCS with config_id as result_id for
                  idempotency
                </li>
                <li>
                  Use{" "}
                  <code className="bg-slate-800 px-0.5 rounded">--force</code>{" "}
                  to re-run existing results
                </li>
                <li>Progress tracked via deployment state in GCS</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Configuration */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold">Configuration</h2>
          </div>
          <div className="card-body space-y-4">
            {/* Config source selection */}
            <div className="flex space-x-2">
              {(["gcs", "file"] as const).map((src) => (
                <Button
                  key={src}
                  onClick={() => setConfigSource(src)}
                  variant={configSource === src ? "default" : "outline"}
                  size="sm"
                  className={
                    configSource === src ? "bg-blue-600 hover:bg-blue-700" : ""
                  }
                >
                  {src === "file" ? "Local File" : "GCS Browser"}
                </Button>
              ))}
            </div>

            {configSource === "gcs" && mode !== "mass-deploy" && (
              <div className="space-y-3">
                {/* Bucket selector (usually just one) */}
                {bucketsData?.buckets && bucketsData.buckets.length > 1 && (
                  <div className="field-group">
                    <label className="field-label block text-sm text-slate-400 mb-1">
                      Bucket
                    </label>
                    <Select value={bucket} onValueChange={setBucket}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {bucketsData.buckets.map((b) => (
                          <SelectItem key={b.name} value={b.name}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Breadcrumb / Current path */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500 font-mono truncate max-w-[80%]">
                    gs://{bucket}/{configPrefix}
                  </div>
                  {prefixHistory.length > 0 && (
                    <Button
                      onClick={navigateBack}
                      variant="ghost"
                      size="sm"
                      className="text-sm text-blue-400 hover:text-blue-300 flex items-center space-x-1 p-0 h-auto"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Back</span>
                    </Button>
                  )}
                </div>

                {/* Folder/File browser */}
                <div className="border border-slate-700 rounded-lg max-h-64 overflow-y-auto">
                  {prefixesLoading ? (
                    <div className="p-4 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Loading...
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-700">
                      {/* Show folders */}
                      {prefixesData?.prefixes?.map((p) => (
                        <Button
                          key={p.prefix}
                          onClick={() => navigateToFolder(p.prefix)}
                          variant="ghost"
                          className="w-full px-3 py-2 flex items-center space-x-3 hover:bg-slate-800 transition-colors justify-start h-auto rounded-none"
                        >
                          <Folder className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                          <span className="flex-1 font-mono text-sm">
                            {p.name}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </Button>
                      ))}

                      {/* Show JSON config files */}
                      {configFilesData?.files
                        ?.filter((f) => f.endsWith(".json"))
                        .map((file) => {
                          const fileName = file.split("/").pop() || file;
                          const isSelected = selectedConfigs.includes(file);
                          return (
                            <Button
                              key={file}
                              onClick={() => selectConfig(file)}
                              variant="ghost"
                              className={`w-full px-3 py-2 flex items-center space-x-3 transition-colors justify-start h-auto rounded-none ${
                                isSelected
                                  ? "bg-blue-900/50"
                                  : "hover:bg-slate-800"
                              }`}
                            >
                              <FileJson
                                className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-blue-400" : "text-slate-400"}`}
                              />
                              <span className="flex-1 font-mono text-sm truncate">
                                {fileName}
                              </span>
                              {isSelected && (
                                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                                  Selected
                                </span>
                              )}
                            </Button>
                          );
                        })}

                      {/* Empty state */}
                      {!prefixesData?.prefixes?.length &&
                        !configFilesData?.files?.length && (
                          <div className="p-4 text-center text-slate-500">
                            No configs found at this level
                          </div>
                        )}
                    </div>
                  )}
                </div>

                {/* Selected config display */}
                {selectedConfigs.length > 0 && (
                  <div className="text-sm">
                    <span className="text-slate-400">Selected: </span>
                    <span className="text-green-400 font-mono">
                      {selectedConfigs.length} config
                      {selectedConfigs.length > 1 ? "s" : ""}
                    </span>
                  </div>
                )}

                {/* Structure hint */}
                <p className="text-xs text-slate-500">
                  Structure: configs/V1/{"{strategy}"}/{"{mode}"}/
                  {"{timeframe}"}/{"{config}"}.json
                </p>
              </div>
            )}

            {/* Mass Deploy: Folder selection instead of files */}
            {configSource === "gcs" && mode === "mass-deploy" && (
              <div className="space-y-3">
                {/* Breadcrumb / Current path */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500 font-mono truncate max-w-[80%]">
                    gs://{bucket}/{configPrefix}
                  </div>
                  {prefixHistory.length > 0 && (
                    <Button
                      onClick={navigateBack}
                      variant="ghost"
                      size="sm"
                      className="text-sm text-purple-400 hover:text-purple-300 flex items-center space-x-1 p-0 h-auto"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Back</span>
                    </Button>
                  )}
                </div>

                {/* Folder browser - for selecting folders */}
                <div className="border border-slate-700 rounded-lg max-h-64 overflow-y-auto">
                  {prefixesLoading ? (
                    <div className="p-4 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Loading...
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-700">
                      {prefixesData?.prefixes?.map((p) => {
                        const isSelected = selectedFolders.includes(p.prefix);
                        return (
                          <Button
                            key={p.prefix}
                            onClick={() => {
                              if (selectedFolders.includes(p.prefix)) {
                                setSelectedFolders(
                                  selectedFolders.filter((f) => f !== p.prefix),
                                );
                              } else {
                                setSelectedFolders([
                                  ...selectedFolders,
                                  p.prefix,
                                ]);
                              }
                            }}
                            onDoubleClick={() => navigateToFolder(p.prefix)}
                            variant="ghost"
                            className={`w-full px-3 py-2 flex items-center space-x-3 transition-colors justify-start h-auto rounded-none ${
                              isSelected
                                ? "bg-purple-900/50"
                                : "hover:bg-slate-800"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (isSelected) {
                                  setSelectedFolders(
                                    selectedFolders.filter(
                                      (f) => f !== p.prefix,
                                    ),
                                  );
                                } else {
                                  setSelectedFolders([
                                    ...selectedFolders,
                                    p.prefix,
                                  ]);
                                }
                              }}
                              className="w-4 h-4 rounded text-purple-500"
                            />
                            <Folder
                              className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-purple-400" : "text-yellow-500"}`}
                            />
                            <span className="flex-1 font-mono text-sm">
                              {p.name}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected folders display */}
                {selectedFolders.length > 0 && (
                  <div className="text-sm">
                    <span className="text-slate-400">Selected: </span>
                    <span className="text-purple-400 font-mono">
                      {selectedFolders.length} folder
                      {selectedFolders.length > 1 ? "s" : ""}
                    </span>
                    <div className="mt-2 max-h-24 overflow-y-auto bg-slate-900 rounded p-2">
                      {selectedFolders.map((f) => (
                        <div
                          key={f}
                          className="text-xs font-mono text-slate-400 flex items-center justify-between"
                        >
                          <span>{f}</span>
                          <Button
                            onClick={() =>
                              setSelectedFolders(
                                selectedFolders.filter((x) => x !== f),
                              )
                            }
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 px-1 h-auto p-0"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <p className="text-xs text-slate-500">
                  Click to select folders for deployment. Double-click to
                  navigate into folder.
                  <br />
                  All configs in selected folders will be deployed.
                </p>
              </div>
            )}

            {configSource === "file" && (
              <div className="space-y-3">
                <div
                  className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-slate-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                  <p className="text-slate-400">
                    {localFiles.length > 0
                      ? `${localFiles.length} file(s) selected`
                      : "Drop JSON config file here or click to upload"}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    multiple={mode === "batch"}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {localFiles.length > 0 && (
                  <div className="space-y-1">
                    {localFiles.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <FileJson className="w-4 h-4 text-blue-400" />
                        <span className="font-mono">{f.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Local file location hint */}
                <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-slate-400">
                  <p className="font-semibold text-slate-300 mb-1">
                    Where to find configs:
                  </p>
                  <p className="font-mono">
                    execution-services/configs/generated/V1/
                  </p>
                  <p className="mt-1">
                    Structure: {"{strategy}"}/{"{mode}"}/{"{timeframe}"}/
                    {"{config}"}.json
                  </p>
                  <p className="mt-2 text-blue-400">
                    Upload JSON config files to run backtests directly from your
                    local machine.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Parameters */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold">Parameters</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="field-group">
                <label className="field-label block text-sm text-slate-400 mb-1">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="field-group">
                    <label className="field-label block text-xs text-slate-500 mb-1">
                      Hour
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      value={startHour}
                      onChange={(e) =>
                        setStartHour(
                          Math.max(0, Math.min(23, Number(e.target.value))),
                        )
                      }
                      className="w-full text-sm"
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label block text-xs text-slate-500 mb-1">
                      Minute
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={startMinute}
                      onChange={(e) =>
                        setStartMinute(
                          Math.max(0, Math.min(59, Number(e.target.value))),
                        )
                      }
                      className="w-full text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="field-group">
                <label className="field-label block text-sm text-slate-400 mb-1">
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
                />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="field-group">
                    <label className="field-label block text-xs text-slate-500 mb-1">
                      Hour
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      value={endHour}
                      onChange={(e) =>
                        setEndHour(
                          Math.max(0, Math.min(23, Number(e.target.value))),
                        )
                      }
                      className="w-full text-sm"
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label block text-xs text-slate-500 mb-1">
                      Minute
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={endMinute}
                      onChange={(e) =>
                        setEndMinute(
                          Math.max(0, Math.min(59, Number(e.target.value))),
                        )
                      }
                      className="w-full text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick date presets */}
            <div className="field-group">
              <label className="field-label block text-sm text-slate-400 mb-1">
                Quick Date Presets
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    setStartDate("2023-05-23");
                    setEndDate("2023-05-24");
                    setStartHour(0);
                    setStartMinute(0);
                    setEndHour(0);
                    setEndMinute(0);
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  May 23
                </Button>
                <Button
                  onClick={() => {
                    setStartDate("2023-05-23");
                    setEndDate("2023-05-24");
                    setStartHour(0);
                    setStartMinute(0);
                    setEndHour(23);
                    setEndMinute(59);
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  May 23-24
                </Button>
                <Button
                  onClick={() => {
                    setStartDate("2023-05-23");
                    setEndDate("2023-05-25");
                    setStartHour(0);
                    setStartMinute(0);
                    setEndHour(23);
                    setEndMinute(59);
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  May 23-25
                </Button>
              </div>
            </div>

            {/* Quick time presets */}
            <div className="field-group">
              <label className="field-label block text-sm text-slate-400 mb-1">
                Quick Time Presets
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    setStartDate("2023-05-23");
                    setEndDate("2023-05-23");
                    setStartHour(15);
                    setStartMinute(30);
                    setEndHour(15);
                    setEndMinute(35);
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs bg-purple-700 hover:bg-purple-600 border-purple-600"
                  title="5 minute super fast test at 15:30 (works with tradfi and cefi)"
                >
                  5min (15:30)
                </Button>
                <Button
                  onClick={() => {
                    setStartDate("2023-05-23");
                    setEndDate("2023-05-23");
                    setStartHour(15);
                    setStartMinute(30);
                    setEndHour(17);
                    setEndMinute(30);
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs bg-purple-700 hover:bg-purple-600 border-purple-600"
                >
                  2h (15:30-17:30)
                </Button>
                <Button
                  onClick={() => {
                    setStartDate("2023-05-23");
                    setEndDate("2023-05-23");
                    setStartHour(0);
                    setStartMinute(0);
                    setEndHour(12);
                    setEndMinute(0);
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs bg-purple-700 hover:bg-purple-600 border-purple-600"
                >
                  12h (00:00-12:00)
                </Button>
              </div>
            </div>

            {/* Strategy ID */}
            {mode !== "mass-deploy" && configSource === "gcs" && (
              <div className="field-group pt-2 border-t border-slate-700">
                <label
                  htmlFor="strategy-id"
                  className="field-label block text-sm font-medium text-slate-300 mb-1"
                >
                  Strategy ID (optional)
                </label>
                <Input
                  type="text"
                  id="strategy-id"
                  value={strategyId}
                  onChange={(e) => setStrategyId(e.target.value)}
                  placeholder="e.g., DEFI_ETH_comprehensive-defi_SCE_5M_V2"
                  className="w-full text-sm"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Strategy ID for signal loading from GCS (no timeframe in name)
                </p>
              </div>
            )}

            {/* Skip Dependency Check */}
            {mode !== "mass-deploy" && (
              <div className="flex items-center space-x-3 pt-2 border-t border-slate-700">
                <input
                  type="checkbox"
                  id="skip-dependency-check"
                  checked={skipDependencyCheck}
                  onChange={(e) => setSkipDependencyCheck(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-orange-500 focus:ring-orange-500"
                />
                <label
                  htmlFor="skip-dependency-check"
                  className="text-sm cursor-pointer flex-1"
                >
                  <span className="text-orange-400 font-medium">
                    Skip Dependency Check
                  </span>
                  <span className="text-slate-400 ml-2">
                    Skip upstream dependency validation (use with caution)
                  </span>
                </label>
              </div>
            )}

            {/* Skip Preflight Validation */}
            {mode !== "mass-deploy" && (
              <div className="flex items-center space-x-3 pt-2 border-t border-slate-700">
                <input
                  type="checkbox"
                  id="skip-preflight"
                  checked={skipPreflight}
                  onChange={(e) => setSkipPreflight(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <label
                  htmlFor="skip-preflight"
                  className="text-sm cursor-pointer flex-1"
                >
                  <span className="text-amber-400 font-medium">
                    Skip Preflight Validation
                  </span>
                  <span className="text-slate-400 ml-2">
                    Skip data validation checks (config, instruments,
                    instructions, tick data)
                  </span>
                </label>
              </div>
            )}

            {mode === "batch" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-slate-400">
                    Parallel Workers: {parallel}
                  </label>
                  {systemCores && (
                    <Button
                      onClick={() =>
                        setParallel(systemCores.recommended_workers)
                      }
                      variant="ghost"
                      size="sm"
                      className="text-xs text-cyan-400 hover:text-cyan-300 p-0 h-auto"
                    >
                      Use recommended ({systemCores.recommended_workers})
                    </Button>
                  )}
                </div>
                <input
                  type="range"
                  min="1"
                  max={systemCores?.cores || 16}
                  value={parallel}
                  onChange={(e) => setParallel(Number(e.target.value))}
                  className="w-full"
                />
                {systemCores && parallel > systemCores.cores && (
                  <p className="text-xs text-red-400 mt-1 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>
                      Workers ({parallel}) exceed available cores (
                      {systemCores.cores}). This may degrade performance.
                    </span>
                  </p>
                )}
                {systemCores &&
                  parallel > systemCores.recommended_workers &&
                  parallel <= systemCores.cores && (
                    <p className="text-xs text-amber-400 mt-1 flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>
                        Using all cores may impact system responsiveness.
                        Recommended: {systemCores.recommended_workers}
                      </span>
                    </p>
                  )}
              </div>
            )}

            {mode === "mass-deploy" && (
              <div className="space-y-4">
                {/* Force Override Toggle */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="force-override"
                    checked={forceOverride}
                    onChange={(e) => setForceOverride(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-purple-500 focus:ring-purple-500"
                  />
                  <label
                    htmlFor="force-override"
                    className="text-sm cursor-pointer"
                  >
                    <span className="text-purple-400 font-medium">--force</span>
                    <span className="text-slate-400 ml-2">
                      Override existing results (re-run all configs)
                    </span>
                  </label>
                </div>
                <p className="text-xs text-slate-500">
                  Without --force, configs that already have results will be
                  skipped. This can save 5-20 minutes per config by avoiding
                  redundant runs.
                </p>

                {/* Deploy Missing Only Toggle */}
                <div className="flex items-center space-x-3 pt-2">
                  <input
                    type="checkbox"
                    id="deploy-missing-only"
                    checked={deployMissingOnly}
                    onChange={(e) => {
                      setDeployMissingOnly(e.target.checked);
                      if (
                        e.target.checked &&
                        !missingShardsData &&
                        selectedFolders.length > 0 &&
                        startDate &&
                        endDate
                      ) {
                        fetchMissingShards();
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <label
                    htmlFor="deploy-missing-only"
                    className="text-sm cursor-pointer"
                  >
                    <span className="text-amber-400 font-medium">
                      Deploy missing days only
                    </span>
                    <span className="text-slate-400 ml-2">
                      Target specific config×date gaps
                    </span>
                  </label>
                </div>

                {/* Missing Shards Preview */}
                {deployMissingOnly && (
                  <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-3 text-xs">
                    {missingShardsLoading ? (
                      <div className="flex items-center space-x-2 text-amber-300">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>
                          Calculating missing config×date combinations...
                        </span>
                      </div>
                    ) : missingShardsData ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-amber-300 font-medium">
                            Missing Shards Preview
                          </span>
                          <Button
                            onClick={fetchMissingShards}
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-slate-300 flex items-center space-x-1 p-0 h-auto"
                          >
                            <RefreshCw
                              className={`w-3 h-3 ${missingShardsLoading ? "animate-spin" : ""}`}
                            />
                            <span>Refresh</span>
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-slate-700/50 rounded p-2 text-center">
                            <div className="text-slate-400">Total Configs</div>
                            <div className="text-lg font-semibold">
                              {missingShardsData.total_configs}
                            </div>
                          </div>
                          <div className="bg-slate-700/50 rounded p-2 text-center">
                            <div className="text-slate-400">Date Range</div>
                            <div className="text-lg font-semibold">
                              {missingShardsData.total_dates} days
                            </div>
                          </div>
                          <div className="bg-slate-700/50 rounded p-2 text-center">
                            <div className="text-slate-400">Missing Shards</div>
                            <div className="text-lg font-semibold text-amber-400">
                              {missingShardsData.total_missing}
                            </div>
                          </div>
                        </div>
                        {missingShardsData.breakdown && (
                          <div className="space-y-1 pt-2 border-t border-slate-700">
                            <div className="text-slate-400 mb-1">
                              Breakdown by dimension:
                            </div>
                            {Object.keys(
                              missingShardsData.breakdown.by_strategy || {},
                            ).length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                <span className="text-slate-500">
                                  Strategy:
                                </span>
                                {Object.entries(
                                  missingShardsData.breakdown.by_strategy,
                                )
                                  .slice(0, 5)
                                  .map(([key, count]) => (
                                    <span
                                      key={key}
                                      className="bg-slate-700/50 px-1.5 py-0.5 rounded text-slate-300"
                                    >
                                      {key}: {count}
                                    </span>
                                  ))}
                                {Object.keys(
                                  missingShardsData.breakdown.by_strategy,
                                ).length > 5 && (
                                  <span className="text-slate-500">
                                    +
                                    {Object.keys(
                                      missingShardsData.breakdown.by_strategy,
                                    ).length - 5}{" "}
                                    more
                                  </span>
                                )}
                              </div>
                            )}
                            {Object.keys(
                              missingShardsData.breakdown.by_date || {},
                            ).length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                <span className="text-slate-500">Dates:</span>
                                {Object.entries(
                                  missingShardsData.breakdown.by_date,
                                )
                                  .slice(0, 5)
                                  .map(([date, count]) => (
                                    <span
                                      key={date}
                                      className="bg-slate-700/50 px-1.5 py-0.5 rounded text-slate-300"
                                    >
                                      {date}: {count}
                                    </span>
                                  ))}
                                {Object.keys(
                                  missingShardsData.breakdown.by_date,
                                ).length > 5 && (
                                  <span className="text-slate-500">
                                    +
                                    {Object.keys(
                                      missingShardsData.breakdown.by_date,
                                    ).length - 5}{" "}
                                    more dates
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        <p className="text-amber-300/80 mt-2">
                          Will deploy exactly {missingShardsData.total_missing}{" "}
                          missing config×date combinations.
                        </p>
                      </div>
                    ) : (
                      <div className="text-slate-400">
                        Select folders and date range to calculate missing
                        shards.
                      </div>
                    )}
                  </div>
                )}

                {/* Data Status Preview Button */}
                {selectedFolders.length > 0 && startDate && endDate && (
                  <div className="pt-2 border-t border-slate-700">
                    <Button
                      onClick={() => {
                        setShowDataStatusPreview(!showDataStatusPreview);
                        if (!dataStatus) fetchDataStatus();
                      }}
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2 text-sm text-cyan-400 hover:text-cyan-300 p-0 h-auto"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Preview Data Status</span>
                      {dataStatusLoading && (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      )}
                    </Button>

                    {showDataStatusPreview && dataStatus && (
                      <div className="mt-3 bg-slate-800/50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Data Status Preview
                          </span>
                          <Button
                            onClick={fetchDataStatus}
                            variant="ghost"
                            size="sm"
                            className="text-xs text-slate-400 hover:text-slate-300 flex items-center space-x-1 p-0 h-auto"
                          >
                            <RefreshCw
                              className={`w-3 h-3 ${dataStatusLoading ? "animate-spin" : ""}`}
                            />
                            <span>Refresh</span>
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-700/50 rounded p-2">
                            <div className="text-slate-400">Total Configs</div>
                            <div className="text-lg font-semibold">
                              {dataStatus.total_configs}
                            </div>
                          </div>
                          <div className="bg-slate-700/50 rounded p-2">
                            <div className="text-slate-400">With Results</div>
                            <div className="text-lg font-semibold text-green-400">
                              {dataStatus.configs_with_results}
                            </div>
                          </div>
                          <div className="bg-slate-700/50 rounded p-2">
                            <div className="text-slate-400">Missing</div>
                            <div className="text-lg font-semibold text-amber-400">
                              {dataStatus.missing_count}
                            </div>
                          </div>
                          <div className="bg-slate-700/50 rounded p-2">
                            <div className="text-slate-400">Completion</div>
                            <div className="text-lg font-semibold">
                              {dataStatus.completion_pct.toFixed(1)}%
                            </div>
                          </div>
                        </div>

                        {!forceOverride && (
                          <p className="text-xs text-green-400 mt-2">
                            Will deploy {dataStatus.missing_count} configs
                            (skipping {dataStatus.configs_with_results} with
                            existing results)
                          </p>
                        )}
                        {forceOverride && (
                          <p className="text-xs text-purple-400 mt-2">
                            Will deploy all {dataStatus.total_configs} configs
                            (--force enabled)
                          </p>
                        )}

                        {/* Config-level day breakdown */}
                        {dataStatus.strategies &&
                          dataStatus.strategies.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-700">
                              <div className="text-xs font-medium text-slate-300 mb-2">
                                Config Day Breakdown
                              </div>
                              <div className="space-y-1 max-h-60 overflow-y-auto">
                                {dataStatus.strategies.flatMap((strategyData) =>
                                  strategyData.modes.flatMap((modeData) =>
                                    modeData.timeframes.flatMap((tfData) =>
                                      tfData.configs.map((configData) => {
                                        const configKey = `${strategyData.strategy}/${modeData.mode}/${tfData.timeframe}/${configData.config_file}`;
                                        const isExpanded =
                                          expandedConfigsInPreview.has(
                                            configKey,
                                          );
                                        const hasDayBreakdown =
                                          configData.dates_found_count !==
                                          undefined;
                                        const completionPct =
                                          configData.completion_pct ?? 0;
                                        const datesFoundCount =
                                          configData.dates_found_count ?? 0;
                                        const datesMissingCount =
                                          configData.dates_missing_count ?? 0;

                                        return (
                                          <div
                                            key={configKey}
                                            className="bg-slate-700/30 rounded"
                                          >
                                            <Button
                                              onClick={() => {
                                                const newExpanded = new Set(
                                                  expandedConfigsInPreview,
                                                );
                                                if (isExpanded) {
                                                  newExpanded.delete(configKey);
                                                } else {
                                                  newExpanded.add(configKey);
                                                }
                                                setExpandedConfigsInPreview(
                                                  newExpanded,
                                                );
                                              }}
                                              variant="ghost"
                                              className="w-full flex items-center justify-between p-2 text-xs hover:bg-slate-700/50 rounded h-auto"
                                            >
                                              <div className="flex items-center space-x-2 min-w-0 flex-1">
                                                {hasDayBreakdown ? (
                                                  isExpanded ? (
                                                    <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                                  ) : (
                                                    <ChevronRight className="w-3 h-3 flex-shrink-0" />
                                                  )
                                                ) : (
                                                  <div className="w-3 h-3 flex-shrink-0" />
                                                )}
                                                <span className="truncate text-slate-300">
                                                  {configData.algo_name ||
                                                    configData.config_file}
                                                </span>
                                              </div>
                                              {hasDayBreakdown && (
                                                <div className="flex items-center space-x-2 text-xs flex-shrink-0 ml-2">
                                                  <span className="text-green-400">
                                                    {datesFoundCount}
                                                  </span>
                                                  <span className="text-slate-500">
                                                    /
                                                  </span>
                                                  <span
                                                    className={
                                                      datesMissingCount > 0
                                                        ? "text-red-400"
                                                        : "text-slate-400"
                                                    }
                                                  >
                                                    {datesFoundCount +
                                                      datesMissingCount}
                                                  </span>
                                                  <span className="text-slate-400">
                                                    ({completionPct.toFixed(0)}
                                                    %)
                                                  </span>
                                                </div>
                                              )}
                                            </Button>

                                            {isExpanded && hasDayBreakdown && (
                                              <div className="px-2 pb-2 space-y-2">
                                                {/* Available Days */}
                                                {datesFoundCount > 0 && (
                                                  <details className="group">
                                                    <summary className="flex items-center space-x-1 cursor-pointer text-xs text-green-400 hover:text-green-300">
                                                      <CheckCircle className="w-3 h-3" />
                                                      <span>
                                                        Available Days (
                                                        {datesFoundCount})
                                                      </span>
                                                    </summary>
                                                    <div className="mt-1 pl-4 text-xs text-green-300/80 space-y-0.5 max-h-24 overflow-y-auto">
                                                      {configData.dates_found_list?.map(
                                                        (date) => (
                                                          <div key={date}>
                                                            {date}
                                                          </div>
                                                        ),
                                                      )}
                                                      {configData.dates_found_truncated &&
                                                        configData.dates_found_list_tail && (
                                                          <>
                                                            <div className="text-slate-500">
                                                              ...
                                                            </div>
                                                            {configData.dates_found_list_tail.map(
                                                              (date) => (
                                                                <div key={date}>
                                                                  {date}
                                                                </div>
                                                              ),
                                                            )}
                                                          </>
                                                        )}
                                                    </div>
                                                  </details>
                                                )}

                                                {/* Missing Days */}
                                                {datesMissingCount > 0 && (
                                                  <details className="group">
                                                    <summary className="flex items-center space-x-1 cursor-pointer text-xs text-red-400 hover:text-red-300">
                                                      <AlertCircle className="w-3 h-3" />
                                                      <span>
                                                        Missing Days (
                                                        {datesMissingCount})
                                                      </span>
                                                    </summary>
                                                    <div className="mt-1 pl-4 text-xs text-red-300/80 space-y-0.5 max-h-24 overflow-y-auto">
                                                      {configData.dates_missing_list?.map(
                                                        (date) => (
                                                          <div key={date}>
                                                            {date}
                                                          </div>
                                                        ),
                                                      )}
                                                      {configData.dates_missing_truncated &&
                                                        configData.dates_missing_list_tail && (
                                                          <>
                                                            <div className="text-slate-500">
                                                              ...
                                                            </div>
                                                            {configData.dates_missing_list_tail.map(
                                                              (date) => (
                                                                <div key={date}>
                                                                  {date}
                                                                </div>
                                                              ),
                                                            )}
                                                          </>
                                                        )}
                                                    </div>
                                                  </details>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      }),
                                    ),
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )}

                {/* Cloud Deployment Info */}
                <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-3 text-xs">
                  <div className="flex items-center space-x-2 text-purple-300 mb-1">
                    <Cloud className="w-4 h-4" />
                    <span className="font-medium">
                      Cloud Deployment via unified-trading-deployment-v2
                    </span>
                  </div>
                  <p className="text-slate-400">
                    Each config becomes a separate cloud job. Progress tracked
                    in real-time.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CLI Command Preview - Shows above Run Backtest button */}
      {mode === "single" &&
        configSource === "gcs" &&
        selectedConfigs.length > 0 &&
        startDate &&
        endDate && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Button
                onClick={() => setShowCliPreview(!showCliPreview)}
                variant="ghost"
                className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors p-0 h-auto"
              >
                {showCliPreview ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <Eye className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium">CLI Command Preview</span>
              </Button>
              {showCliPreview && (
                <Button
                  onClick={handleCopyCliCommand}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 p-0 h-auto"
                  title="Copy command to clipboard"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </Button>
              )}
            </div>
            {showCliPreview && (
              <>
                <div className="bg-slate-900 rounded p-3 border border-slate-700">
                  <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap break-words overflow-x-auto">
                    {generateCliCommand()}
                  </pre>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  This is the exact command that will be executed. Both "Run
                  Backtest" and "Test Exact CLI" buttons run this same command.
                  By default, both dependency check and preflight validation run
                  (uncheck the boxes above to skip them).
                </p>
              </>
            )}
          </div>
        )}

      {/* Run Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={mode === "mass-deploy" ? handleCloudDeploy : handleRun}
          disabled={
            isRunning ||
            (mode !== "mass-deploy" && selectedConfigs.length === 0) ||
            (mode === "mass-deploy" && selectedFolders.length === 0) ||
            !startDate ||
            !endDate
          }
          variant="default"
          className={`btn flex-1 flex items-center justify-center space-x-2 ${
            mode === "mass-deploy"
              ? "bg-purple-600 hover:bg-purple-700"
              : "btn-primary"
          }`}
          title={
            mode !== "mass-deploy"
              ? "Run backtest with exact CLI command (includes --upload-gcs flag)"
              : undefined
          }
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {cloudDeploymentPolling ? "Deploying..." : "Running..."}
              </span>
            </>
          ) : mode === "mass-deploy" ? (
            <>
              <Cloud className="w-4 h-4" />
              <span>
                Deploy to Cloud
                {selectedFolders.length > 0 &&
                  ` (${selectedFolders.length} folder${selectedFolders.length > 1 ? "s" : ""})`}
                {forceOverride && " --force"}
              </span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>
                Run {mode === "batch" ? "Batch " : ""}Backtest
                {selectedConfigs.length > 0 &&
                  ` (${selectedConfigs.length} config${selectedConfigs.length > 1 ? "s" : ""})`}
              </span>
            </>
          )}
        </Button>

        {/* Load Example CLI Button - Loads example command values into form */}
        {mode === "single" && configSource === "gcs" && (
          <Button
            onClick={handleExactCliTest}
            disabled={!!isRunning}
            variant="default"
            className="btn bg-yellow-600 hover:bg-yellow-700 flex items-center justify-center space-x-2"
            title="Load example CLI command values (config, dates, strategy-id) into the form"
          >
            <Upload className="w-4 h-4" />
            <span>Load Example CLI</span>
          </Button>
        )}
      </div>

      {/* Validation hint */}
      {mode !== "mass-deploy" &&
        (selectedConfigs.length === 0 || !startDate || !endDate) && (
          <p className="text-sm text-yellow-500">
            {selectedConfigs.length === 0
              ? "Select a config from GCS to continue"
              : !startDate || !endDate
                ? "Select start and end dates"
                : ""}
          </p>
        )}
      {mode === "mass-deploy" &&
        (selectedFolders.length === 0 || !startDate || !endDate) && (
          <p className="text-sm text-yellow-500">
            {selectedFolders.length === 0
              ? "Select config folders for deployment"
              : !startDate || !endDate
                ? "Select start and end dates"
                : ""}
          </p>
        )}

      {/* Cloud Deployment Progress */}
      {cloudDeployment && (
        <div className="card border-purple-700/50">
          <div className="card-header flex items-center justify-between bg-purple-900/20">
            <div className="flex items-center space-x-2">
              <Cloud className="w-5 h-5 text-purple-400" />
              <h2 className="font-semibold">Cloud Deployment</h2>
              <span className="text-xs text-slate-400 font-mono">
                {cloudDeployment.deployment_id}
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-xs ${
                cloudDeployment.status === "completed"
                  ? "bg-green-900 text-green-300"
                  : cloudDeployment.status === "failed"
                    ? "bg-red-900 text-red-300"
                    : cloudDeployment.status === "running"
                      ? "bg-purple-900 text-purple-300"
                      : "bg-slate-700 text-slate-300"
              }`}
            >
              {cloudDeployment.status.toUpperCase()}
            </span>
          </div>
          <div className="card-body space-y-4">
            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>
                  {cloudDeployment.completed_shards}/
                  {cloudDeployment.total_shards} shards
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    cloudDeployment.status === "failed"
                      ? "bg-red-500"
                      : cloudDeployment.status === "completed"
                        ? "bg-green-500"
                        : "bg-purple-600"
                  }`}
                  style={{
                    width: `${(cloudDeployment.completed_shards / cloudDeployment.total_shards) * 100 || 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Shard counts */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-green-900/30 rounded p-2">
                <div className="text-lg font-bold text-green-400">
                  {cloudDeployment.completed_shards}
                </div>
                <div className="text-xs text-slate-400">Completed</div>
              </div>
              <div className="bg-purple-900/30 rounded p-2">
                <div className="text-lg font-bold text-purple-400">
                  {cloudDeployment.running_shards}
                </div>
                <div className="text-xs text-slate-400">Running</div>
              </div>
              <div className="bg-slate-700/50 rounded p-2">
                <div className="text-lg font-bold text-slate-300">
                  {cloudDeployment.pending_shards}
                </div>
                <div className="text-xs text-slate-400">Pending</div>
              </div>
              <div className="bg-red-900/30 rounded p-2">
                <div className="text-lg font-bold text-red-400">
                  {cloudDeployment.failed_shards}
                </div>
                <div className="text-xs text-slate-400">Failed</div>
              </div>
            </div>

            {/* Polling indicator */}
            {cloudDeploymentPolling && (
              <div className="flex items-center justify-center space-x-2 text-sm text-purple-300">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Monitoring deployment... (updates every 5s)</span>
              </div>
            )}

            {/* View in Dashboard link */}
            <div className="text-center">
              <a
                href={`https://deployment-dashboard-1060025368044.asia-northeast1.run.app/deployments/${cloudDeployment.deployment_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-cyan-400 hover:text-cyan-300"
              >
                View in Deployment Dashboard →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Progress */}
      {jobStatus && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold">
              Job: {jobStatus.job_id}
              {jobStatus.execution_time_secs && (
                <span className="text-sm text-slate-400 ml-2">
                  ({jobStatus.execution_time_secs.toFixed(1)}s)
                </span>
              )}
            </h2>
            <span
              className={`px-2 py-0.5 rounded text-xs ${
                jobStatus.status === "completed"
                  ? "bg-green-900 text-green-300"
                  : jobStatus.status === "failed"
                    ? "bg-red-900 text-red-300"
                    : jobStatus.status === "running"
                      ? "bg-blue-900 text-blue-300"
                      : "bg-slate-700 text-slate-300"
              }`}
            >
              {jobStatus.status.toUpperCase()}
            </span>
          </div>
          <div className="card-body space-y-3">
            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{jobStatus.progress || 0}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    jobStatus.status === "failed"
                      ? "bg-red-500"
                      : jobStatus.status === "completed"
                        ? "bg-green-500"
                        : "bg-blue-600"
                  }`}
                  style={{ width: `${jobStatus.progress || 0}%` }}
                />
              </div>
            </div>

            {/* Result path */}
            {jobStatus.gcs_result_path && (
              <div className="text-sm">
                <span className="text-slate-400">Result: </span>
                <span className="font-mono text-green-400 break-all">
                  {jobStatus.gcs_result_path}
                </span>
              </div>
            )}

            {/* Error Message Box - Prominent display for structured errors */}
            {jobStatus.status === "failed" &&
              jobStatus.errors &&
              jobStatus.errors.length > 0 && (
                <ErrorDisplayBox jobStatus={jobStatus} />
              )}

            {/* Logs */}
            {jobStatus.logs && jobStatus.logs.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm text-slate-400">Logs</label>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={async () => {
                        try {
                          // Fetch full logs from API
                          const response = await apiClient.get<JobStatus>(
                            `/backtest/status/${jobStatus.job_id}?full_logs=true`,
                          );
                          const fullLogs = response.data.logs || [];
                          const logsText = fullLogs.join("\n");
                          await navigator.clipboard.writeText(logsText);
                          setSuccess(
                            `Copied ${fullLogs.length} log lines to clipboard!`,
                          );
                          setTimeout(() => setSuccess(null), 3000);
                        } catch (err) {
                          console.error("Failed to fetch full logs:", err);
                          // Fallback to current logs if API call fails
                          const logsText = jobStatus.logs!.join("\n");
                          navigator.clipboard
                            .writeText(logsText)
                            .then(() => {
                              setSuccess("Logs copied to clipboard!");
                              setTimeout(() => setSuccess(null), 2000);
                            })
                            .catch(() => {
                              setError("Failed to copy logs");
                              setTimeout(() => setError(null), 2000);
                            });
                        }
                      }}
                      variant="ghost"
                      size="sm"
                      className="p-1.5 hover:bg-slate-700 rounded transition-colors h-auto"
                      title="Copy all logs to clipboard"
                    >
                      <Copy className="w-4 h-4 text-slate-400 hover:text-slate-200" />
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          // Fetch full logs from API
                          const response = await apiClient.get<JobStatus>(
                            `/backtest/status/${jobStatus.job_id}?full_logs=true`,
                          );
                          const fullLogs = response.data.logs || [];
                          const logsText = fullLogs.join("\n");
                          const blob = new Blob([logsText], {
                            type: "text/plain",
                          });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `backtest-logs-${jobStatus.job_id}-${new Date().toISOString().split("T")[0]}.txt`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          setSuccess(
                            `Downloaded ${fullLogs.length} log lines!`,
                          );
                          setTimeout(() => setSuccess(null), 3000);
                        } catch (err) {
                          console.error("Failed to fetch full logs:", err);
                          // Fallback to current logs if API call fails
                          const logsText = jobStatus.logs!.join("\n");
                          const blob = new Blob([logsText], {
                            type: "text/plain",
                          });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `backtest-logs-${jobStatus.job_id}-${new Date().toISOString().split("T")[0]}.txt`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          setSuccess("Logs downloaded!");
                          setTimeout(() => setSuccess(null), 2000);
                        }
                      }}
                      variant="ghost"
                      size="sm"
                      className="p-1.5 hover:bg-slate-700 rounded transition-colors h-auto"
                      title="Download all logs as file"
                    >
                      <Download className="w-4 h-4 text-slate-400 hover:text-slate-200" />
                    </Button>
                  </div>
                </div>
                <div className="bg-slate-900 rounded p-2 max-h-96 overflow-y-auto font-mono text-xs">
                  {jobStatus.logs.map((log, i) => (
                    <div
                      key={i}
                      className={`${
                        log.includes("ERROR")
                          ? "text-red-400"
                          : log.includes("WARNING")
                            ? "text-yellow-400"
                            : log.includes("Uploaded") ||
                                log.includes("completed")
                              ? "text-green-400"
                              : "text-slate-300"
                      }`}
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Batch Progress - tracks ALL jobs */}
      {batchStatus && batchJobs.length > 0 && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold">
              Batch: {batchStatus.batch_id}
              <span className="text-sm text-slate-400 ml-2">
                ({batchStatus.total_jobs} configs)
              </span>
            </h2>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-xs bg-green-900 text-green-300">
                {batchStatus.completed} completed
              </span>
              <span className="px-2 py-0.5 rounded text-xs bg-blue-900 text-blue-300">
                {batchStatus.running} running
              </span>
              {batchStatus.failed > 0 && (
                <span className="px-2 py-0.5 rounded text-xs bg-red-900 text-red-300">
                  {batchStatus.failed} failed
                </span>
              )}
            </div>
          </div>
          <div className="card-body space-y-3">
            {/* Overall progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>
                  {Math.round(
                    (batchStatus.completed / batchStatus.total_jobs) * 100,
                  )}
                  %
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-green-600 transition-all duration-500"
                  style={{
                    width: `${(batchStatus.completed / batchStatus.total_jobs) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Individual job list */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Job Details
              </label>
              <div className="bg-slate-900 rounded overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800 sticky top-0">
                    <tr className="table-row">
                      <th className="table-header-cell text-left px-3 py-2 text-slate-400">
                        Job ID
                      </th>
                      <th className="table-header-cell text-left px-3 py-2 text-slate-400">
                        Config
                      </th>
                      <th className="table-header-cell text-center px-3 py-2 text-slate-400">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchJobs.map((job) => (
                      <tr
                        key={job.job_id}
                        className="table-row border-t border-slate-800 hover:bg-slate-800/50"
                      >
                        <td className="table-cell px-3 py-2 font-mono text-xs">
                          {job.job_id}
                        </td>
                        <td
                          className="table-cell px-3 py-2 font-mono text-xs truncate max-w-[200px]"
                          title={job.config_path}
                        >
                          {job.config_path.split("/").pop() || job.config_path}
                        </td>
                        <td className="table-cell px-3 py-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              job.status === "completed"
                                ? "bg-green-900 text-green-300"
                                : job.status === "failed"
                                  ? "bg-red-900 text-red-300"
                                  : job.status === "running"
                                    ? "bg-blue-900 text-blue-300"
                                    : "bg-slate-700 text-slate-300"
                            }`}
                          >
                            {job.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
