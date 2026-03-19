import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Download,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  RefreshCw,
  Folder,
  FolderOpen,
  ArrowLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Wifi,
} from "lucide-react";
import apiClient from "@/api/client";
import type { ResultsResponse } from "@/api/types";
import { useResultsStore } from "@/stores/resultsStore";
import {
  Badge,
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@unified-trading/ui-kit";

type Source = "gcs" | "local";

interface BucketInfo {
  name: string;
  location: string;
  storage_class: string;
}

interface PrefixInfo {
  prefix: string;
  name: string;
  has_results: boolean;
}

interface LocalDefaultDirectoryInfo {
  directory: string;
  reason: string;
  exists: boolean;
}

// Known instruction types from execution_services/utils/instruction_type.py
const INSTRUCTION_TYPES = [
  "TRADE",
  "SWAP",
  "LEND",
  "BORROW",
  "STAKE",
  "TRANSFER",
] as const;

// Results root folder name
const RESULTS_ROOT = "results";

// Sortable columns
type SortColumn =
  | "config_id"
  | "algorithm"
  | "net_alpha_bps"
  | "pnl"
  | "total_trades";
type SortDirection = "asc" | "desc";

// Folder structure: results/{date}/{strategy_id}/{instruction_type}/
type FolderLevel =
  | "root"
  | "date"
  | "strategy"
  | "instruction_type"
  | "results";

function getFolderLevel(prefix: string): FolderLevel {
  const parts = prefix.split("/").filter(Boolean);

  // Handle both old (backtest_results) and new (results) root folders
  const isResultsRoot =
    parts[0] === RESULTS_ROOT || parts[0] === "backtest_results";

  if (parts.length === 0) return "root"; // At bucket root
  if (!isResultsRoot) return "root"; // Not in results folder

  // Skip the root folder when counting depth
  const depth = parts.length - 1;

  if (depth === 0) return "date"; // results/
  if (depth === 1) return "strategy"; // results/{date}/
  if (depth === 2) return "instruction_type"; // results/{date}/{strategy}/
  return "results"; // results/{date}/{strategy}/{type}/
}

function isDateFolder(name: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(name);
}

function isInstructionTypeFolder(name: string): boolean {
  return INSTRUCTION_TYPES.includes(
    name.toUpperCase() as (typeof INSTRUCTION_TYPES)[number],
  );
}

function isResultsRootFolder(name: string): boolean {
  return name === RESULTS_ROOT || name === "backtest_results";
}

export default function LoadResults() {
  const [source, setSource] = useState<Source>("gcs");
  const [projectId, setProjectId] = useState("test-project");
  const [bucket, setBucket] = useState("");
  const [prefix, setPrefix] = useState("");
  const [prefixHistory, setPrefixHistory] = useState<string[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [directory, setDirectory] = useState("");
  const [directoryTouched, setDirectoryTouched] = useState(false);
  const [limit, setLimit] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>("net_alpha_bps");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const { setResults, clearResults, results } = useResultsStore();

  // Sorted results based on current sort state
  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case "config_id":
          comparison = a.config_id.localeCompare(b.config_id);
          break;
        case "algorithm":
          comparison = a.algorithm.localeCompare(b.algorithm);
          break;
        case "net_alpha_bps":
          comparison = a.net_alpha_bps - b.net_alpha_bps;
          break;
        case "pnl":
          comparison = a.pnl - b.pnl;
          break;
        case "total_trades":
          comparison = a.total_trades - b.total_trades;
          break;
        default:
          comparison = 0;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [results, sortColumn, sortDirection]);

  // Toggle sort column/direction
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  // Sort indicator component
  const SortIndicator = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3 h-3 text-slate-500" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3 h-3 text-cyan-400" />
    ) : (
      <ArrowDown className="w-3 h-3 text-cyan-400" />
    );
  };

  // Fetch available buckets when project ID changes
  // Use staleTime to cache bucket list
  const {
    data: bucketsData,
    isPending: bucketsLoading,
    refetch: refetchBuckets,
    isError: bucketsError,
    error: bucketsQueryError,
  } = useQuery({
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
    enabled: source === "gcs" && !!projectId,
    retry: 1,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes - buckets rarely change
    gcTime: 1000 * 60 * 60, // Keep in garbage collection for 1 hour
  });

  // Fetch suggested local directory to avoid loading stale historical ./results by default.
  const { data: localDefaultDirectory } = useQuery({
    queryKey: ["local-default-directory"],
    queryFn: async () => {
      const response = await apiClient.get<LocalDefaultDirectoryInfo>(
        "/results/local-default-directory",
      );
      return response.data;
    },
    retry: 1,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  // Handle bucket loading errors
  useEffect(() => {
    if (bucketsError && bucketsQueryError) {
      setError(
        "Failed to load buckets. Check your GCP credentials and project ID.",
      );
    }
  }, [bucketsError, bucketsQueryError]);

  // Fetch available prefixes when bucket or prefix changes
  // Use staleTime to cache results and speed up navigation
  const { data: prefixesData, isPending: prefixesLoading } = useQuery({
    queryKey: ["prefixes", bucket, prefix],
    queryFn: async () => {
      const response = await apiClient.get<{
        prefixes: PrefixInfo[];
        bucket: string;
      }>(
        `/results/prefixes?bucket=${encodeURIComponent(bucket)}&parent_prefix=${encodeURIComponent(prefix)}`,
      );
      return response.data;
    },
    enabled: source === "gcs" && !!bucket,
    retry: 1,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes - folders don't change often
    gcTime: 1000 * 60 * 30, // Keep in garbage collection for 30 minutes
  });

  // Load results mutation - supports multiple prefixes
  const loadResultsMutation = useMutation({
    mutationFn: async (prefixesToLoad?: string[]) => {
      const prefixes =
        prefixesToLoad ||
        (selectedFolders.length > 0 ? selectedFolders : [prefix]);

      if (source === "gcs") {
        if (!bucket) throw new Error("Please select a bucket");
        if (prefixes.length === 0)
          throw new Error("Please select at least one folder with results");

        // Load results from all selected prefixes
        const allResults: ResultsResponse["results"] = [];
        const seenResultIds = new Set<string>();
        const allFilters: {
          categories: Set<string>;
          assets: Set<string>;
          strategies: Set<string>;
          algorithms: Set<string>;
          timeframes: Set<string>;
          instruction_types: Set<string>;
          modes: Set<string>;
        } = {
          categories: new Set<string>(),
          assets: new Set<string>(),
          strategies: new Set<string>(),
          algorithms: new Set<string>(),
          timeframes: new Set<string>(),
          instruction_types: new Set<string>(),
          modes: new Set<string>(),
        };

        for (const prefixToLoad of prefixes) {
          const params = new URLSearchParams({
            source,
            limit: limit.toString(),
            bucket,
            prefix: prefixToLoad,
          });
          const response = await apiClient.get<ResultsResponse>(
            `/results?${params}`,
          );

          // Deduplicate results by result_id (same result might exist in multiple folders)
          for (const result of response.data.results) {
            if (!seenResultIds.has(result.result_id)) {
              seenResultIds.add(result.result_id);
              allResults.push(result);
            }
          }

          // Merge all filter fields
          if (response.data.filters) {
            response.data.filters.categories?.forEach((c) =>
              allFilters.categories.add(c),
            );
            response.data.filters.assets?.forEach((a) =>
              allFilters.assets.add(a),
            );
            response.data.filters.strategies?.forEach((s) =>
              allFilters.strategies.add(s),
            );
            response.data.filters.algorithms?.forEach((a) =>
              allFilters.algorithms.add(a),
            );
            response.data.filters.timeframes?.forEach((t) =>
              allFilters.timeframes.add(t),
            );
            response.data.filters.instruction_types?.forEach((i) =>
              allFilters.instruction_types.add(i),
            );
            response.data.filters.modes?.forEach((m) =>
              allFilters.modes.add(m),
            );
          }
        }

        // Convert Sets back to arrays for the response
        return {
          results: allResults,
          total: allResults.length,
          filters: {
            categories: Array.from(allFilters.categories),
            assets: Array.from(allFilters.assets),
            strategies: Array.from(allFilters.strategies),
            algorithms: Array.from(allFilters.algorithms),
            timeframes: Array.from(allFilters.timeframes),
            instruction_types: Array.from(allFilters.instruction_types),
            modes: Array.from(allFilters.modes),
          },
        };
      } else {
        if (!directory) throw new Error("Please enter a directory path");
        const params = new URLSearchParams({
          source,
          limit: limit.toString(),
          directory,
        });
        const response = await apiClient.get<ResultsResponse>(
          `/results?${params}`,
        );
        return response.data;
      }
    },
    onSuccess: (data) => {
      setResults(data.results, data.filters);
      setSuccess(
        `Successfully loaded ${data.results.length} results from ${selectedFolders.length || 1} folder(s)`,
      );
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to load results");
      setSuccess(null);
    },
  });

  // Reset bucket and prefix when project changes
  useEffect(() => {
    setBucket("");
    setPrefix("");
    setPrefixHistory([]);
    setSelectedFolders([]);
  }, [projectId]);

  // When entering local mode, prefill with a suggested directory (latest phase-E run if available).
  useEffect(() => {
    if (source !== "local") return;
    if (!localDefaultDirectory?.directory) return;
    if (directoryTouched) return;
    setDirectory(localDefaultDirectory.directory);
  }, [source, localDefaultDirectory, directoryTouched]);

  // Auto-navigate to results/ folder when bucket changes
  useEffect(() => {
    if (bucket) {
      // Automatically start in the results/ folder to skip showing config/catalog folders
      setPrefix("results/");
      setPrefixHistory([]);
    } else {
      setPrefix("");
      setPrefixHistory([]);
    }
  }, [bucket]);

  const handleLoad = () => {
    setError(null);
    const prefixesToLoad =
      selectedFolders.length > 0 ? selectedFolders : prefix ? [prefix] : [];
    loadResultsMutation.mutate(prefixesToLoad);
  };

  // Toggle folder selection and auto-load if folder has results
  const toggleFolderSelection = (folderPrefix: string, hasResults: boolean) => {
    const isCurrentlySelected = selectedFolders.includes(folderPrefix);
    let newSelectedFolders: string[];

    if (isCurrentlySelected) {
      newSelectedFolders = selectedFolders.filter((f) => f !== folderPrefix);
      setSelectedFolders(newSelectedFolders);

      // Reload from remaining selected folders if any remain
      if (
        hasResults &&
        bucket &&
        newSelectedFolders.length > 0 &&
        !loadResultsMutation.isPending
      ) {
        // Try loading from all selected folders - API will handle folders without results
        loadResultsMutation.mutate(newSelectedFolders);
      } else if (hasResults && newSelectedFolders.length === 0) {
        // Clear results if no folders remain
        clearResults();
      }
    } else {
      newSelectedFolders = [...selectedFolders, folderPrefix];
      setSelectedFolders(newSelectedFolders);

      // Auto-load results if the folder has results
      if (hasResults && bucket && !loadResultsMutation.isPending) {
        // Try loading from all selected folders - API will handle folders without results
        loadResultsMutation.mutate(newSelectedFolders);
      }
    }
  };

  const handleClear = () => {
    clearResults();
    setSuccess("Results cleared");
    setTimeout(() => setSuccess(null), 2000);
  };

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      // Test API health endpoint
      const healthResponse = await apiClient.get<{
        status: string;
        version: string;
      }>("/health");

      // Test GCS connection by trying to fetch buckets
      if (source === "gcs" && projectId) {
        await apiClient.get<{ buckets: BucketInfo[]; project_id: string }>(
          `/results/buckets?project_id=${encodeURIComponent(projectId)}&filter_prefix=execution-store`,
        );
      }

      return healthResponse.data;
    },
    onSuccess: (data) => {
      setConnectionStatus("success");
      setSuccess(`Connection successful! API version: ${data.version}`);
      setError(null);
      setTimeout(() => {
        setSuccess(null);
        setConnectionStatus("idle");
      }, 3000);
    },
    onError: (err: Error) => {
      setConnectionStatus("error");
      setError(
        `Connection test failed: ${err.message || "Unable to connect to API or GCS"}`,
      );
      setSuccess(null);
      setTimeout(() => setConnectionStatus("idle"), 5000);
    },
  });

  const handleTestConnection = () => {
    setTestingConnection(true);
    setConnectionStatus("idle");
    setError(null);
    setSuccess(null);
    testConnectionMutation.mutate();
    setTimeout(() => setTestingConnection(false), 1000);
  };

  // Navigate into a folder
  const navigateToFolder = (folderPrefix: string) => {
    setPrefixHistory([...prefixHistory, prefix]);
    setPrefix(folderPrefix);
  };

  // Navigate back to parent
  const navigateBack = () => {
    if (prefixHistory.length > 0) {
      const newHistory = [...prefixHistory];
      const previousPrefix = newHistory.pop() || "";
      setPrefixHistory(newHistory);
      setPrefix(previousPrefix);
    }
  };

  // Get current folder level info
  const currentLevel = getFolderLevel(prefix);
  const levelLabels: Record<FolderLevel, string> = {
    root: "Select Folder",
    date: "Select Date",
    strategy: "Select Strategy",
    instruction_type: "Select Instruction Type",
    results: "Results",
  };

  // Calculate summary stats
  const totalResults = results.length;
  const uniqueStrategies = new Set(results.map((r) => r.strategy_id)).size;
  const uniqueAlgos = new Set(results.map((r) => r.algorithm)).size;
  const avgAlpha =
    totalResults > 0
      ? results.reduce((sum, r) => sum + r.net_alpha_bps, 0) / totalResults
      : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">
            Load Results
          </h1>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            Browse and load backtest result sets
          </p>
        </div>
        <Badge variant="default">{results.length} loaded</Badge>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-200">{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-green-900/50 border border-green-700 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-green-200">{success}</span>
        </div>
      )}

      {/* Source Selection */}
      <div className="card">
        <div className="card-body">
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                checked={source === "gcs"}
                onChange={() => setSource("gcs")}
                className="w-4 h-4 text-blue-600"
              />
              <span>GCS</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                checked={source === "local"}
                onChange={() => setSource("local")}
                className="w-4 h-4 text-blue-600"
              />
              <span>Local Directory</span>
            </label>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold">
            {source === "gcs" ? "GCS Settings" : "Local Settings"}
          </h2>
        </div>
        <div className="card-body space-y-4">
          {source === "gcs" ? (
            <>
              {/* Project ID */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Project ID
                </label>
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder="your-gcp-project-id"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => refetchBuckets()}
                    disabled={bucketsLoading || !projectId}
                    variant="outline"
                    size="sm"
                    title="Refresh buckets"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${bucketsLoading ? "animate-spin" : ""}`}
                    />
                  </Button>
                  <Button
                    onClick={handleTestConnection}
                    disabled={
                      testConnectionMutation.isPending ||
                      testingConnection ||
                      (source === "gcs" && !projectId)
                    }
                    variant={
                      connectionStatus === "success"
                        ? "default"
                        : connectionStatus === "error"
                          ? "destructive"
                          : "outline"
                    }
                    size="sm"
                    className={
                      connectionStatus === "success"
                        ? "bg-green-600 hover:bg-green-700"
                        : connectionStatus === "error"
                          ? "bg-red-600 hover:bg-red-700"
                          : ""
                    }
                    title="Test API and GCS connection"
                  >
                    {testConnectionMutation.isPending || testingConnection ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : connectionStatus === "success" ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : connectionStatus === "error" ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : (
                      <Wifi className="w-4 h-4" />
                    )}
                    <span>Test Connection</span>
                  </Button>
                </div>
              </div>

              {/* Bucket Dropdown */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Bucket
                </label>
                <Select
                  value={bucket}
                  onValueChange={setBucket}
                  disabled={
                    bucketsLoading ||
                    !bucketsData?.buckets ||
                    bucketsData.buckets.length === 0
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        bucketsLoading
                          ? "Loading buckets..."
                          : bucketsError
                            ? "Failed to load buckets"
                            : bucketsData?.buckets &&
                                bucketsData.buckets.length > 0
                              ? "Select a bucket..."
                              : "No execution-store buckets found"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {bucketsData?.buckets?.map((b: BucketInfo) => (
                      <SelectItem key={b.name} value={b.name}>
                        {b.name} {b.location && `(${b.location})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {bucketsData?.buckets && bucketsData.buckets.length > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    {bucketsData.buckets.length} execution-store bucket(s) found
                  </p>
                )}
              </div>

              {/* Hierarchical Folder Browser */}
              {bucket && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm text-slate-400">
                      {levelLabels[currentLevel]}
                    </label>
                    {prefixHistory.length > 0 && (
                      <Button
                        onClick={navigateBack}
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Back</span>
                      </Button>
                    )}
                  </div>

                  {/* Breadcrumb */}
                  {prefix && (
                    <div className="text-xs text-slate-500 mb-2 font-mono">
                      gs://{bucket}/{prefix}
                    </div>
                  )}

                  {/* Folder list - filtered to only show results-related folders */}
                  <div className="border border-slate-700 rounded-lg max-h-64 overflow-y-auto">
                    {prefixesLoading ? (
                      <div className="p-4 text-center text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                        Loading folders...
                      </div>
                    ) : prefixesData?.prefixes?.length ? (
                      <div className="divide-y divide-slate-700">
                        {prefixesData.prefixes
                          // Filter out non-results folders at root level
                          .filter((p) => {
                            // If we're inside results/, show everything
                            if (
                              prefix.startsWith("results/") ||
                              prefix.startsWith("backtest_results/")
                            ) {
                              return true;
                            }
                            // At root level, only show results folders
                            return isResultsRootFolder(p.name);
                          })
                          .map((p) => {
                            const isDate = isDateFolder(p.name);
                            const isInstructionType = isInstructionTypeFolder(
                              p.name,
                            );
                            const isSelected = selectedFolders.includes(
                              p.prefix,
                            );

                            return (
                              <button
                                key={p.prefix}
                                onClick={(e) => {
                                  // If clicking checkbox, toggle selection only
                                  if (
                                    (e.target as HTMLElement).tagName ===
                                    "INPUT"
                                  ) {
                                    return; // Checkbox handles its own onChange
                                  }
                                  // Clicking anywhere else on the folder navigates into it
                                  navigateToFolder(p.prefix);
                                }}
                                onDoubleClick={(e) => {
                                  // Double-click also navigates (same as single click)
                                  if (
                                    (e.target as HTMLElement).tagName !==
                                    "INPUT"
                                  ) {
                                    navigateToFolder(p.prefix);
                                  }
                                }}
                                className={`w-full px-3 py-2 flex items-center space-x-3 transition-colors text-left ${
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
                                    toggleFolderSelection(
                                      p.prefix,
                                      p.has_results,
                                    );
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                />
                                {p.has_results ? (
                                  <FolderOpen className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                                ) : (
                                  <Folder className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                )}
                                <span className="flex-1 font-mono text-sm">
                                  {p.name}
                                </span>
                                <div className="flex items-center space-x-2">
                                  {isDate && (
                                    <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded">
                                      date
                                    </span>
                                  )}
                                  {isInstructionType && (
                                    <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded">
                                      {p.name.toLowerCase()}
                                    </span>
                                  )}
                                  {p.has_results && (
                                    <span className="text-xs bg-green-900/50 text-green-300 px-2 py-0.5 rounded">
                                      has results
                                    </span>
                                  )}
                                  <ChevronRight className="w-4 h-4 text-slate-500" />
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-slate-500">
                        <p>No subfolders - results are in this folder</p>
                        <p className="text-xs text-slate-600 mt-1">
                          Click "Load Results" below to view
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Selected folders display */}
                  {selectedFolders.length > 0 && (
                    <div className="mt-3 p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-300 font-semibold">
                          Selected: {selectedFolders.length} folder
                          {selectedFolders.length > 1 ? "s" : ""}
                        </span>
                        <Button
                          onClick={() => setSelectedFolders([])}
                          variant="ghost"
                          size="sm"
                          className="text-xs text-[var(--color-error)] hover:text-[var(--color-error)]"
                        >
                          Clear all
                        </Button>
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {selectedFolders.map((folderPrefix) => {
                          const folderName =
                            folderPrefix.split("/").filter(Boolean).pop() ||
                            folderPrefix;
                          return (
                            <div
                              key={folderPrefix}
                              className="flex items-center justify-between text-xs font-mono bg-slate-900/50 px-2 py-1 rounded"
                            >
                              <span className="text-slate-400 truncate flex-1">
                                {folderName}
                              </span>
                              <Button
                                onClick={() =>
                                  setSelectedFolders(
                                    selectedFolders.filter(
                                      (f) => f !== folderPrefix,
                                    ),
                                  )
                                }
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 text-[var(--color-error)] ml-2"
                              >
                                ×
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Folder structure hint */}
                  <p className="text-xs text-slate-500 mt-2">
                    Structure: {"{date}"}/{"{strategy_id}"}/
                    {"{instruction_type}"}/
                    <br />
                    Types: TRADE, SWAP, LEND, BORROW, STAKE, TRANSFER
                    <br />
                    <span className="text-yellow-400">
                      Tip: Click folder to navigate into it. Use checkbox to
                      select folders (results load automatically when selected).
                    </span>
                  </p>
                </div>
              )}
            </>
          ) : (
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Directory
              </label>
              <Input
                type="text"
                value={directory}
                onChange={(e) => {
                  setDirectory(e.target.value);
                  setDirectoryTouched(true);
                }}
                placeholder="/path/to/results"
                className="w-full"
              />
              {localDefaultDirectory?.directory && (
                <div className="mt-2 text-xs text-slate-500">
                  Suggested:{" "}
                  <code className="font-mono text-cyan-300">
                    {localDefaultDirectory.directory}
                  </code>
                  <Button
                    onClick={() => {
                      setDirectory(localDefaultDirectory.directory);
                      setDirectoryTouched(false);
                    }}
                    variant="ghost"
                    size="sm"
                    className="ml-2 text-cyan-400 hover:text-cyan-300 underline h-auto p-0 text-xs"
                  >
                    Use suggested
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Max Results */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Max Results: {limit}
            </label>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex space-x-4">
        <Button
          onClick={handleLoad}
          disabled={
            loadResultsMutation.isPending ||
            (source === "gcs" &&
              (!bucket || (selectedFolders.length === 0 && !prefix))) ||
            (source === "local" && !directory.trim())
          }
          variant="default"
          className="flex items-center space-x-2"
        >
          {loadResultsMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>
            {source === "local"
              ? `Load Results from "${directory || "local directory"}"`
              : `Load Results ${
                  selectedFolders.length > 0
                    ? `from ${selectedFolders.length} folder${selectedFolders.length > 1 ? "s" : ""}`
                    : prefix
                      ? `from "${prefix.split("/").filter(Boolean).pop()}"`
                      : "from Selected Folder"
                }`}
          </span>
        </Button>
        <Button
          onClick={handleClear}
          disabled={results.length === 0}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear All</span>
        </Button>
      </div>

      {/* Validation hint */}
      {source === "gcs" &&
        (!bucket || (selectedFolders.length === 0 && !prefix)) && (
          <p className="text-sm text-yellow-500">
            {!bucket
              ? "Select a bucket to browse folders"
              : "Select one or more folders with results (checkboxes) or navigate to a folder"}
          </p>
        )}

      {/* Summary */}
      {results.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold">Loaded: {totalResults} results</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-4 gap-4">
              <div className="metric-card">
                <div className="metric-value">{totalResults}</div>
                <div className="metric-label">Total</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{uniqueStrategies}</div>
                <div className="metric-label">Strategies</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{uniqueAlgos}</div>
                <div className="metric-label">Algorithms</div>
              </div>
              <div className="metric-card">
                <div
                  className={`metric-value ${avgAlpha >= 0 ? "value-positive" : "value-negative"}`}
                >
                  {avgAlpha >= 0 ? "+" : ""}
                  {avgAlpha.toFixed(2)}
                </div>
                <div className="metric-label">Avg Alpha (bps)</div>
              </div>
            </div>

            {/* Preview Table */}
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-slate-400 mb-2">
                Results (showing {Math.min(sortedResults.length, 50)} of{" "}
                {sortedResults.length}) - Click headers to sort
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="table-header">
                    <tr>
                      <th
                        className="table-cell text-left cursor-pointer hover:bg-slate-700 select-none"
                        onClick={() => handleSort("config_id")}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Config ID</span>
                          <SortIndicator column="config_id" />
                        </div>
                      </th>
                      <th
                        className="table-cell text-left cursor-pointer hover:bg-slate-700 select-none"
                        onClick={() => handleSort("algorithm")}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Algorithm</span>
                          <SortIndicator column="algorithm" />
                        </div>
                      </th>
                      <th
                        className="table-cell text-right cursor-pointer hover:bg-slate-700 select-none"
                        onClick={() => handleSort("net_alpha_bps")}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>Alpha (bps)</span>
                          <SortIndicator column="net_alpha_bps" />
                        </div>
                      </th>
                      <th
                        className="table-cell text-right cursor-pointer hover:bg-slate-700 select-none"
                        onClick={() => handleSort("pnl")}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>P&L</span>
                          <SortIndicator column="pnl" />
                        </div>
                      </th>
                      <th
                        className="table-cell text-right cursor-pointer hover:bg-slate-700 select-none"
                        onClick={() => handleSort("total_trades")}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>Trades</span>
                          <SortIndicator column="total_trades" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedResults.slice(0, 50).map((r) => (
                      <tr key={r.result_id} className="table-row">
                        <td
                          className="table-cell font-mono text-xs"
                          title={r.config_id}
                        >
                          {r.config_id.length > 50
                            ? `${r.config_id.slice(0, 50)}...`
                            : r.config_id}
                        </td>
                        <td className="table-cell">{r.algorithm}</td>
                        <td
                          className={`table-cell text-right ${r.net_alpha_bps >= 0 ? "value-positive" : "value-negative"}`}
                        >
                          {r.net_alpha_bps >= 0 ? "+" : ""}
                          {r.net_alpha_bps.toFixed(2)}
                        </td>
                        <td className="table-cell text-right">
                          ${r.pnl.toLocaleString()}
                        </td>
                        <td className="table-cell text-right">
                          {r.total_trades}
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
