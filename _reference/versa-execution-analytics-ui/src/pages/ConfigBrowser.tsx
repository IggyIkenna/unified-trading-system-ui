import { useState, useEffect } from "react";
import {
  RefreshCw,
  FileText,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@unified-trading/ui-kit";
import apiClient from "@/api/client";

interface ConfigFile {
  path: string;
  filename: string;
  version: string;
  strategyBase: string;
  mode: string;
  timeframe: string;
}

interface ConfigContent {
  config_id: string;
  strategy_id: string;
  config_version: string;
  category: string;
  asset: string;
  strategy_base: string;
  execution_mode: string;
  timeframe: string;
  timeframe_seconds: number;
  instruments: Record<
    string,
    {
      primary: string[];
      secondary?: string[];
      related_balance?: string[];
    }
  >;
  execution: Record<
    string,
    {
      algorithm: string;
      params?: Record<string, unknown>;
    }
  >;
  venue?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ValidationError {
  field: string;
  message: string;
}

export default function ConfigBrowser() {
  // State for config list
  const [configs, setConfigs] = useState<ConfigFile[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(true);

  // State for filters
  const [folderFilter, setFolderFilter] = useState<string>(""); // Empty = all folders, 'V1' or 'V2' for specific folder
  const [strategyBaseFilter, setStrategyBaseFilter] = useState<string>("");
  const [modeFilter, setModeFilter] = useState<string>("");
  const [timeframeFilter, setTimeframeFilter] = useState<string>("");

  // State for selected config
  const [selectedConfig, setSelectedConfig] = useState<string>("");
  const [configContent, setConfigContent] = useState<ConfigContent | null>(
    null,
  );
  const [loadingContent, setLoadingContent] = useState(false);

  // State for validation
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [isValidating, setIsValidating] = useState(false);

  // State for errors
  const [error, setError] = useState<string | null>(null);

  // Get unique filter values
  const strategyBases = [...new Set(configs.map((c) => c.strategyBase))].sort();
  const modes = [...new Set(configs.map((c) => c.mode))].sort();
  const timeframes = [...new Set(configs.map((c) => c.timeframe))].sort();

  // Filter configs (folder filtering is done server-side)
  const filteredConfigs = configs.filter(
    (c) =>
      (!strategyBaseFilter || c.strategyBase === strategyBaseFilter) &&
      (!modeFilter || c.mode === modeFilter) &&
      (!timeframeFilter || c.timeframe === timeframeFilter),
  );

  useEffect(() => {
    loadConfigs();
  }, [folderFilter]); // Reload when folder filter changes

  useEffect(() => {
    if (selectedConfig) {
      loadConfigContent();
    } else {
      setConfigContent(null);
      setValidationErrors([]);
    }
  }, [selectedConfig]);

  async function loadConfigs() {
    setLoadingConfigs(true);
    setError(null);

    try {
      // Pass folder filter to API (maps to version parameter for V1/V2 folders)
      const params: Record<string, string> = {};
      if (folderFilter) {
        params.version = folderFilter;
      }

      const response = await apiClient.get<{ configs: ConfigFile[] }>(
        "/data/configs",
        { params },
      );
      setConfigs(response.data.configs || []);
    } catch (err) {
      setError(`Failed to load configs: ${err}`);
      console.error(err);
    } finally {
      setLoadingConfigs(false);
    }
  }

  async function loadConfigContent() {
    if (!selectedConfig) return;

    setLoadingContent(true);
    setError(null);

    try {
      const response = await apiClient.get<{
        config: ConfigContent;
        validation_errors: ValidationError[];
      }>("/data/configs/content", {
        params: { path: selectedConfig },
      });
      setConfigContent(response.data.config);
      setValidationErrors(response.data.validation_errors || []);
    } catch (err) {
      setError(`Failed to load config content: ${err}`);
      console.error(err);
    } finally {
      setLoadingContent(false);
    }
  }

  async function validateConfig() {
    if (!selectedConfig) return;

    setIsValidating(true);
    setError(null);

    try {
      const response = await apiClient.get<{ errors: ValidationError[] }>(
        "/data/configs/validate",
        {
          params: { path: selectedConfig },
        },
      );
      setValidationErrors(response.data.errors || []);
    } catch (err) {
      setError(`Failed to validate config: ${err}`);
      console.error(err);
    } finally {
      setIsValidating(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">
            Config Browser
          </h1>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            Browse and inspect strategy configuration files
          </p>
        </div>
        <Button
          onClick={loadConfigs}
          disabled={loadingConfigs}
          variant="default"
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
        >
          <RefreshCw
            className={`w-4 h-4 ${loadingConfigs ? "animate-spin" : ""}`}
          />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-md p-4 text-red-200">
          {error}
          <p className="text-sm mt-2">
            Make sure the backend API is running:{" "}
            <code className="bg-red-800 px-2 py-1 rounded">
              cd execution-services/visualizer-api && uvicorn app.main:app
              --port 8001
            </code>
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="text-sm text-slate-400 mb-4">Filter Configs</div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Folder</label>
            <Select value={folderFilter} onValueChange={setFolderFilter}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="All Folders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Folders</SelectItem>
                <SelectItem value="V1">configs/V1</SelectItem>
                <SelectItem value="V2">configs/V2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Strategy Base
            </label>
            <Select
              value={strategyBaseFilter}
              onValueChange={setStrategyBaseFilter}
            >
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="All Strategies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Strategies</SelectItem>
                {strategyBases.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Mode</label>
            <Select value={modeFilter} onValueChange={setModeFilter}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="All Modes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Modes</SelectItem>
                {modes.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Timeframe
            </label>
            <Select value={timeframeFilter} onValueChange={setTimeframeFilter}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="All Timeframes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Timeframes</SelectItem>
                {timeframes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Config List and Content */}
      <div className="grid grid-cols-2 gap-6">
        {/* Config List */}
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-slate-400" />
              <div>
                <span className="font-medium">
                  Available Configs ({filteredConfigs.length})
                </span>
                {folderFilter && (
                  <span className="ml-2 text-xs text-slate-500">
                    • Folder:{" "}
                    <span className="font-mono text-slate-400">
                      configs/{folderFilter}
                    </span>
                  </span>
                )}
                {!folderFilter && (
                  <span className="ml-2 text-xs text-slate-500">
                    • Showing all folders (V1 and V2)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {loadingConfigs ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-500 mb-4" />
                <p className="text-slate-400">Loading configs...</p>
              </div>
            ) : filteredConfigs.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No configs found
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {filteredConfigs.map((config) => (
                  <Button
                    key={config.path}
                    onClick={() => setSelectedConfig(config.path)}
                    variant="ghost"
                    className={`w-full text-left p-4 hover:bg-slate-700/50 transition-colors border-l-2 justify-start h-auto rounded-none ${
                      selectedConfig === config.path
                        ? "bg-slate-700 border-purple-500"
                        : config.version === "V2"
                          ? "border-green-500/30"
                          : "border-yellow-500/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Strategy name - emphasized */}
                        <div className="font-semibold text-base text-white mb-1 truncate">
                          {config.strategyBase}
                        </div>

                        {/* Mode and Timeframe */}
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                          <span className="px-2 py-0.5 bg-slate-700/50 rounded">
                            {config.mode}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-700/50 rounded">
                            {config.timeframe}
                          </span>
                        </div>

                        {/* Filename */}
                        <div className="text-xs text-slate-500 mt-1 truncate font-mono">
                          {config.filename}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" />
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Config Content */}
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <span className="font-medium">Config Content</span>
            {selectedConfig && (
              <Button
                onClick={validateConfig}
                disabled={isValidating}
                variant="default"
                size="sm"
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
              >
                {isValidating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>Validate</span>
              </Button>
            )}
          </div>

          {loadingContent ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-500 mb-4" />
              <p className="text-slate-400">Loading config content...</p>
            </div>
          ) : !selectedConfig ? (
            <div className="p-8 text-center text-slate-400">
              Select a config to view its content
            </div>
          ) : configContent ? (
            <div className="p-4 space-y-4">
              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-red-900/30 border border-red-700 rounded-md p-4">
                  <div className="flex items-center space-x-2 text-red-400 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">
                      Validation Errors ({validationErrors.length})
                    </span>
                  </div>
                  <ul className="text-sm text-red-300 list-disc list-inside space-y-1">
                    {validationErrors.map((err, idx) => (
                      <li key={idx}>{err.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationErrors.length === 0 && (
                <div className="bg-green-900/30 border border-green-700 rounded-md p-4">
                  <div className="flex items-center space-x-2 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Config is valid</span>
                  </div>
                </div>
              )}

              {/* Config JSON */}
              <div className="max-h-[400px] overflow-auto">
                <pre className="text-xs font-mono bg-slate-900 p-4 rounded overflow-x-auto">
                  {JSON.stringify(configContent, null, 2)}
                </pre>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-slate-800/50 rounded-lg p-4 text-sm text-slate-400">
        <p className="font-medium mb-2">Config Browser Help:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            Configs are stored in GCS at{" "}
            <code className="bg-slate-700 px-2 py-1 rounded">
              gs://execution-store-{"{project}"}/configs/
            </code>
          </li>
          <li>
            Path structure:{" "}
            <code className="bg-slate-700 px-2 py-1 rounded">
              configs/{"{folder}"}/{"{strategy_base}"}/{"{mode}"}/
              {"{timeframe}"}/{"{filename}"}.json
            </code>
          </li>
          <li>
            Select a folder (V1 or V2) to browse configs from that folder, or
            leave empty to see all folders
          </li>
          <li>
            Use filters to narrow down configs by folder, strategy, mode, or
            timeframe
          </li>
          <li>Click "Validate" to check config against the schema</li>
        </ul>
      </div>
    </div>
  );
}
