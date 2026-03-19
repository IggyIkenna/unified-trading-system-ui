import { useState, useMemo, useEffect } from "react";
import {
  Play,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Upload,
  Folder,
  Info,
  Zap,
  Save,
  User,
  Sparkles,
} from "lucide-react";

// Schema-driven parameter definitions from grid_generator.py DEFAULT_GRIDS
// This ensures only valid parameters are shown for each algorithm
const ALGORITHM_SCHEMAS: Record<string, AlgorithmSchema> = {
  // TRADE algorithms (CLOB execution)
  TWAP: {
    name: "Time-Weighted Average Price",
    description:
      "Splits large order into smaller orders executed evenly over time",
    instructionType: "TRADE",
    params: {
      horizon_secs: {
        min: 60,
        max: 1800,
        step: 30,
        default: [300, 600],
        unit: "seconds",
        description: "Total execution time",
      },
      num_slices: {
        min: 2,
        max: 50,
        step: 1,
        default: [5, 10, 20],
        unit: "slices",
        description: "Number of child orders",
      },
      interval_secs: {
        min: 5,
        max: 300,
        step: 5,
        default: [30, 60],
        unit: "seconds",
        description: "Time between orders",
      },
    },
  },
  VWAP: {
    name: "Volume-Weighted Average Price",
    description: "Executes based on historical volume distribution",
    instructionType: "TRADE",
    params: {
      num_intervals: {
        min: 2,
        max: 30,
        step: 1,
        default: [4, 8, 12, 16, 20],
        unit: "intervals",
        description: "Number of execution intervals",
      },
    },
  },
  ADAPTIVE_TWAP: {
    name: "Adaptive TWAP",
    description: "TWAP with momentum and volatility adjustments",
    instructionType: "TRADE",
    params: {
      horizon_secs: {
        min: 30,
        max: 1800,
        step: 30,
        default: [60, 120, 300, 600],
        unit: "seconds",
        description: "Total execution horizon",
      },
      urgency_factor: {
        min: 0.1,
        max: 1.0,
        step: 0.1,
        default: [0.3, 0.5, 0.7, 0.9],
        unit: "",
        description: "Execution urgency (0=passive, 1=aggressive)",
      },
      num_slices: {
        min: 2,
        max: 50,
        step: 1,
        default: [5, 10, 20],
        unit: "slices",
        description: "Number of child orders",
      },
    },
  },
  ALMGREN_CHRISS: {
    name: "Almgren-Chriss Optimal Execution",
    description: "Optimal execution with market impact modeling",
    instructionType: "TRADE",
    params: {
      risk_aversion: {
        min: 0.0001,
        max: 100,
        step: 0.001,
        default: [0.001, 0.01, 0.1, 1.0, 10.0],
        unit: "",
        description: "Risk aversion parameter (higher = more urgent)",
      },
      horizon_secs: {
        min: 60,
        max: 900,
        step: 15,
        default: [150, 225, 300],
        unit: "seconds",
        description: "Execution horizon",
      },
    },
  },
  POV_DYNAMIC: {
    name: "Percentage of Volume (Dynamic)",
    description: "Trades as percentage of market volume",
    instructionType: "TRADE",
    params: {
      target_pov: {
        min: 0.01,
        max: 0.5,
        step: 0.01,
        default: [0.05, 0.1, 0.15, 0.2],
        unit: "%",
        description: "Target participation rate",
      },
      min_pov: {
        min: 0.005,
        max: 0.1,
        step: 0.005,
        default: [0.01, 0.05],
        unit: "%",
        description: "Minimum participation rate",
      },
      max_pov: {
        min: 0.1,
        max: 1.0,
        step: 0.05,
        default: [0.25, 0.5],
        unit: "%",
        description: "Maximum participation rate",
      },
    },
  },
  HYBRID_OPTIMAL: {
    name: "Hybrid Optimal",
    description: "Regime-based algorithm selection",
    instructionType: "TRADE",
    params: {
      horizon_secs: {
        min: 60,
        max: 1800,
        step: 30,
        default: [300, 600],
        unit: "seconds",
        description: "Execution horizon",
      },
      volatility_threshold: {
        min: 0.001,
        max: 0.1,
        step: 0.001,
        default: [0.005, 0.01, 0.02],
        unit: "",
        description: "Volatility regime threshold",
      },
      trend_threshold: {
        min: 0.001,
        max: 0.1,
        step: 0.001,
        default: [0.005, 0.01, 0.02],
        unit: "",
        description: "Trend detection threshold",
      },
    },
  },
  PASSIVE_AGGRESSIVE_HYBRID: {
    name: "Passive-Aggressive Hybrid",
    description: "Starts passive (maker), becomes aggressive (taker) if needed",
    instructionType: "TRADE",
    params: {
      horizon_secs: {
        min: 60,
        max: 1800,
        step: 30,
        default: [300, 600, 900],
        unit: "seconds",
        description: "Total execution horizon",
      },
      passive_time_pct: {
        min: 0.1,
        max: 0.9,
        step: 0.1,
        default: [0.3, 0.5, 0.7],
        unit: "%",
        description: "Percentage of time for passive execution",
      },
      price_improve_bps: {
        min: 0.1,
        max: 5.0,
        step: 0.1,
        default: [0.5, 1.0, 2.0],
        unit: "bps",
        description: "Price improvement in basis points",
      },
    },
  },
  BENCHMARK_FILL: {
    name: "Benchmark Fill",
    description: "Fills at benchmark/arrival price (zero alpha baseline)",
    instructionType: "TRADE",
    params: {},
  },
  // SWAP algorithms (DEX execution)
  SMART_ORDER_ROUTER: {
    name: "Smart Order Router",
    description: "Routes across multiple DEXs for best execution",
    instructionType: "SWAP",
    params: {
      max_slippage_bps: {
        min: 5,
        max: 500,
        step: 5,
        default: [20, 50, 100],
        unit: "bps",
        description: "Maximum acceptable slippage",
      },
    },
  },
  SOR_TWAP: {
    name: "SOR + TWAP",
    description: "Smart Order Router with time-weighted execution",
    instructionType: "SWAP",
    params: {
      horizon_secs: {
        min: 30,
        max: 600,
        step: 30,
        default: [60, 120, 300],
        unit: "seconds",
        description: "Execution horizon",
      },
      num_slices: {
        min: 2,
        max: 20,
        step: 1,
        default: [3, 5, 10],
        unit: "slices",
        description: "Number of TWAP slices",
      },
      max_slippage_bps: {
        min: 5,
        max: 200,
        step: 5,
        default: [20, 50],
        unit: "bps",
        description: "Max slippage per slice",
      },
    },
  },
  SWAP_TWAP: {
    name: "Swap TWAP",
    description: "Time-weighted execution for single DEX swaps",
    instructionType: "SWAP",
    params: {
      horizon_secs: {
        min: 30,
        max: 600,
        step: 30,
        default: [60, 120, 300],
        unit: "seconds",
        description: "Execution horizon",
      },
      num_slices: {
        min: 2,
        max: 20,
        step: 1,
        default: [3, 5, 10],
        unit: "slices",
        description: "Number of TWAP slices",
      },
    },
  },
  MAX_SLIPPAGE: {
    name: "Max Slippage",
    description: "Ensures execution within slippage bounds",
    instructionType: "SWAP",
    params: {
      max_slippage_bps: {
        min: 5,
        max: 500,
        step: 5,
        default: [20, 50, 100],
        unit: "bps",
        description: "Maximum acceptable slippage",
      },
    },
  },
};

interface ParamSchema {
  min: number;
  max: number;
  step: number;
  default: number[];
  unit: string;
  description: string;
}

interface AlgorithmSchema {
  name: string;
  description: string;
  instructionType: string;
  params: Record<string, ParamSchema>;
}

interface ParamGridConfig {
  min: number;
  max: number;
  numValues: number;
}

interface GenerationResult {
  success: boolean;
  message: string;
  configPaths?: string[];
  totalConfigs?: number;
  errors?: string[];
}

interface ConfigGenerateResponse {
  message?: string;
  saved_paths?: string[];
  config_ids?: string[];
  total_configs?: number;
  total_strategies?: number;
}

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

// Execution modes supported
const EXECUTION_MODES = ["SCE", "HUF"] as const;
type ExecutionMode = (typeof EXECUTION_MODES)[number];

// Timeframes supported
const TIMEFRAMES = ["5M", "15M", "1H"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

// Helper to generate evenly spaced values
function generateValues(
  min: number,
  max: number,
  numValues: number,
  step: number,
): number[] {
  if (numValues <= 1) return [min];
  if (numValues === 2) return [min, max];

  const values: number[] = [];
  const range = max - min;
  const stepSize = range / (numValues - 1);

  for (let i = 0; i < numValues; i++) {
    let value = min + stepSize * i;
    // Round to step precision
    value = Math.round(value / step) * step;
    // Ensure we don't exceed max due to rounding
    value = Math.min(value, max);
    values.push(value);
  }

  // Ensure unique values
  return [...new Set(values)];
}

export default function ConfigGenerator() {
  // Algorithm selection
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<string[]>([
    "TWAP",
  ]);

  // Parameter grid configs for each algorithm
  const [paramGrids, setParamGrids] = useState<
    Record<string, Record<string, ParamGridConfig>>
  >({});

  // Strategy settings
  const [strategyId, setStrategyId] = useState(
    "CEFI_BTC_momentum-macd_SCE_5M_V1",
  );
  const [instructionType, setInstructionType] = useState<"TRADE" | "SWAP">(
    "TRADE",
  );

  // Execution modes and timeframes for generate-all
  const [selectedModes, setSelectedModes] = useState<ExecutionMode[]>([
    "SCE",
    "HUF",
  ]);
  const [selectedTimeframes, setSelectedTimeframes] = useState<Timeframe[]>([
    "5M",
    "15M",
  ]);
  const [generateAllMode, setGenerateAllMode] = useState(false);

  // Date/time range
  const [startDate, setStartDate] = useState("2023-05-23");
  const [endDate, setEndDate] = useState("2023-05-23");
  const [startHour, setStartHour] = useState(1);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(2);
  const [endMinute, setEndMinute] = useState(0);

  // Generation settings
  const [uploadToGcs, setUploadToGcs] = useState(false);
  const [saveLocal, setSaveLocal] = useState(true);
  const [outputDir, setOutputDir] = useState("./configs/generated");
  const [dryRun, setDryRun] = useState(true);
  const [cleanupFirst, setCleanupFirst] = useState(false);

  // User-specific config generation
  const [username, setUsername] = useState("");
  const [useGlobalConfigs, setUseGlobalConfigs] = useState(false); // false = user-specific (requires name)

  // Status
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);

  // Initialize param grids when algorithms change
  useEffect(() => {
    const newGrids: Record<string, Record<string, ParamGridConfig>> = {};

    for (const algo of selectedAlgorithms) {
      const schema = ALGORITHM_SCHEMAS[algo];
      if (!schema) continue;

      newGrids[algo] = {};
      for (const [paramName, paramSchema] of Object.entries(schema.params)) {
        // Initialize with sensible defaults
        const defaultVals = paramSchema.default;
        newGrids[algo][paramName] = {
          min: defaultVals[0] ?? paramSchema.min,
          max: defaultVals[defaultVals.length - 1] ?? paramSchema.max,
          numValues: Math.min(defaultVals.length, 3),
        };
      }
    }

    setParamGrids((prev) => ({ ...prev, ...newGrids }));
  }, [selectedAlgorithms]);

  // Calculate total configs
  const totalConfigs = useMemo(() => {
    let total = 0;

    for (const algo of selectedAlgorithms) {
      const schema = ALGORITHM_SCHEMAS[algo];
      if (!schema) continue;

      const algoGrid = paramGrids[algo];
      if (!algoGrid) continue;

      // For algorithms with no params (like BENCHMARK_FILL), count as 1
      const paramNames = Object.keys(schema.params);
      if (paramNames.length === 0) {
        total += 1;
        continue;
      }

      // Calculate combinations
      let combinations = 1;
      for (const paramName of paramNames) {
        const config = algoGrid[paramName];
        if (config) {
          combinations *= config.numValues;
        }
      }
      total += combinations;
    }

    return total;
  }, [selectedAlgorithms, paramGrids]);

  // Calculate duration
  const duration = useMemo(() => {
    const start = new Date(
      `${startDate}T${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}:00Z`,
    );
    const end = new Date(
      `${endDate}T${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}:00Z`,
    );
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffMinutes = diffMs / (1000 * 60);
    return { hours: diffHours, minutes: diffMinutes };
  }, [startDate, endDate, startHour, startMinute, endHour, endMinute]);

  // Get algorithms filtered by instruction type
  const filteredAlgorithms = useMemo(() => {
    return Object.entries(ALGORITHM_SCHEMAS)
      .filter(([_, schema]) => schema.instructionType === instructionType)
      .map(([name]) => name);
  }, [instructionType]);

  // Update param grid for a specific algorithm and parameter
  const updateParamGrid = (
    algo: string,
    param: string,
    field: keyof ParamGridConfig,
    value: number,
  ) => {
    setParamGrids((prev) => ({
      ...prev,
      [algo]: {
        ...prev[algo],
        [param]: {
          ...prev[algo]?.[param],
          [field]: value,
        },
      },
    }));
  };

  // Generate preview of parameter values
  const getParamValues = (algo: string, param: string): number[] => {
    const config = paramGrids[algo]?.[param];
    const schema = ALGORITHM_SCHEMAS[algo]?.params[param];
    if (!config || !schema) return [];
    return generateValues(
      config.min,
      config.max,
      config.numValues,
      schema.step,
    );
  };

  // Handle generate (single strategy)
  async function handleGenerate() {
    setIsGenerating(true);
    setResult(null);

    try {
      // Build custom grids from UI state
      const customGrids: Record<string, Record<string, number[]>> = {};

      for (const algo of selectedAlgorithms) {
        const schema = ALGORITHM_SCHEMAS[algo];
        if (!schema) continue;

        customGrids[algo] = {};
        for (const [paramName, paramSchema] of Object.entries(schema.params)) {
          const config = paramGrids[algo]?.[paramName];
          if (config) {
            customGrids[algo][paramName] = generateValues(
              config.min,
              config.max,
              config.numValues,
              paramSchema.step,
            );
          }
        }
      }

      const response = await apiClient.post<ConfigGenerateResponse>(
        "/config/generate",
        {
          strategy_id: strategyId,
          algorithms: selectedAlgorithms,
          instruction_type: instructionType,
          custom_grids: customGrids,
          upload_gcs: uploadToGcs,
          save_local: saveLocal,
          output_dir: outputDir,
          dry_run: dryRun,
          // User-specific: if username provided, save under users/{username}/
          username: useGlobalConfigs ? null : username.trim() || null,
        },
      );

      console.log("✅ Config generation response:", response.data);
      const data = response.data;

      const resultData = {
        success: true,
        message: data.message || "Configs generated successfully",
        configPaths: data.saved_paths || data.config_ids || [],
        totalConfigs: data.total_configs || 0,
      };

      console.log("Setting result:", resultData);
      setResult(resultData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setResult({
        success: false,
        message: `Error: ${errorMessage}`,
      });
    } finally {
      setIsGenerating(false);
    }
  }

  // Handle generate-all (mass generation)
  async function handleGenerateAll() {
    setIsGenerating(true);
    setResult(null);

    try {
      const response = await apiClient.post<ConfigGenerateResponse>(
        "/config/generate-all",
        {
          modes: selectedModes,
          timeframes: selectedTimeframes,
          upload_gcs: uploadToGcs,
          output_dir: outputDir,
          cleanup: cleanupFirst,
          dry_run: dryRun,
        },
      );

      const data = response.data;

      setResult({
        success: true,
        message:
          data.message ||
          `Generated ${data.total_configs} configs across ${data.total_strategies} strategies`,
        totalConfigs: data.total_configs,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setResult({
        success: false,
        message: `Error: ${errorMessage}`,
      });
    } finally {
      setIsGenerating(false);
    }
  }

  // Quick test: Generate 3-5 example configs covering all algorithms
  async function handleQuickTest() {
    setIsGenerating(true);
    setResult(null);

    // Select a diverse mix of algorithms covering both TRADE and SWAP
    const testAlgorithms = [
      "TWAP", // Basic time-weighted
      "VWAP", // Volume-weighted
      "POV_DYNAMIC", // Percentage of volume
      "SMART_ORDER_ROUTER", // DEX routing
    ];

    // Set up test configs with default parameters
    const testConfigs = [];
    const paramGridsForUI: Record<string, Record<string, ParamGridConfig>> = {};

    for (const algo of testAlgorithms) {
      const schema = ALGORITHM_SCHEMAS[algo];
      if (!schema) continue;

      // Use default parameter values from schema
      const customGrids: Record<string, Record<string, number[]>> = {};
      customGrids[algo] = {};
      paramGridsForUI[algo] = {};

      for (const [paramName, paramSchema] of Object.entries(schema.params)) {
        // Use first default value for quick test
        const defaultValue = paramSchema.default[0] || paramSchema.min;
        customGrids[algo][paramName] = [defaultValue];

        // Set up param grid for UI display
        paramGridsForUI[algo][paramName] = {
          min: defaultValue,
          max: defaultValue,
          numValues: 1,
        };
      }

      testConfigs.push({
        strategy_id: strategyId,
        algorithms: [algo],
        instruction_type: schema.instructionType as "TRADE" | "SWAP",
        custom_grids: customGrids,
      });
    }

    try {
      // Generate configs sequentially
      const results: ConfigGenerateResponse[] = [];
      for (const config of testConfigs) {
        const response = await apiClient.post<ConfigGenerateResponse>(
          "/config/generate",
          {
            ...config,
            upload_gcs: uploadToGcs,
            save_local: saveLocal,
            output_dir: outputDir,
            dry_run: dryRun,
            username: useGlobalConfigs ? null : username.trim() || null,
          },
        );
        results.push(response.data);
      }

      const totalConfigs = results.reduce(
        (sum, r) => sum + (r.total_configs || 0),
        0,
      );
      const allPaths = results.flatMap(
        (r) => r.saved_paths || r.config_ids || [],
      );

      setResult({
        success: true,
        message: `Quick test: Generated ${totalConfigs} configs covering ${testAlgorithms.length} algorithms (${testAlgorithms.join(", ")})`,
        configPaths: allPaths,
        totalConfigs: totalConfigs,
      });

      // Update UI to show selected algorithms and their param grids
      setSelectedAlgorithms(testAlgorithms);
      setParamGrids(paramGridsForUI);
      setInstructionType("TRADE"); // Default to TRADE since most are TRADE
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setResult({
        success: false,
        message: `Quick test error: ${errorMessage}`,
      });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">
            Config Generator
          </h1>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            Generate parameter grids and strategy configuration sets
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleQuickTest}
            disabled={isGenerating || generateAllMode}
            variant="default"
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
            title="Quick test: Generate 3-5 example configs covering all algorithms"
          >
            <Sparkles className="w-4 h-4" />
            <span>Quick Test (All Algos)</span>
          </Button>
          <div className="flex items-center space-x-2 text-sm text-slate-400">
            <Info className="w-4 h-4" />
            <span>
              Generate grid search configs for execution algorithm backtests
            </span>
          </div>
        </div>
      </div>

      {/* Generation Mode Toggle */}
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Generation Mode</h2>
          <div className="flex items-center space-x-2 bg-slate-700 rounded-lg p-1">
            <Button
              onClick={() => setGenerateAllMode(false)}
              variant={!generateAllMode ? "default" : "ghost"}
              size="sm"
              className={
                !generateAllMode
                  ? "bg-cyan-600 hover:bg-cyan-700"
                  : "text-slate-400 hover:text-white"
              }
            >
              Single Strategy
            </Button>
            <Button
              onClick={() => setGenerateAllMode(true)}
              variant={generateAllMode ? "default" : "ghost"}
              size="sm"
              className={`flex items-center space-x-2 ${generateAllMode ? "bg-cyan-600 hover:bg-cyan-700" : "text-slate-400 hover:text-white"}`}
            >
              <Zap className="w-4 h-4" />
              <span>Generate All (Mass)</span>
            </Button>
          </div>
        </div>

        {generateAllMode ? (
          <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-400 mb-1">
                  Mass Generation Mode
                </p>
                <p className="text-amber-200/80">
                  This will generate configs for ALL strategy bases across the
                  selected modes and timeframes. Expected output: 2000-3500+
                  configs depending on selections.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-slate-400">
              Generate configs for a single strategy with custom algorithm and
              parameter selections.
            </p>
            <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-3 mt-3">
              <div className="flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-purple-200/80">
                  <span className="font-medium text-purple-400">
                    Quick Test:
                  </span>{" "}
                  Click "Quick Test (All Algos)" button above to generate 3-5
                  example configs covering all algorithm types (TWAP, VWAP,
                  POV_DYNAMIC, SMART_ORDER_ROUTER) with default parameters.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Config Section - Only for Single Strategy Mode */}
      {!generateAllMode && (
        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium flex items-center space-x-2">
              <User className="w-5 h-5 text-cyan-500" />
              <span>Config Ownership</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Toggle between User and Global */}
            <div>
              <label className="block text-sm text-slate-400 mb-3">
                Save configs to:
              </label>
              <div className="space-y-2">
                <label
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    !useGlobalConfigs
                      ? "bg-cyan-900/30 border border-cyan-600"
                      : "bg-slate-700/50 border border-slate-600 hover:border-slate-500"
                  }`}
                >
                  <input
                    type="radio"
                    name="configOwnership"
                    checked={!useGlobalConfigs}
                    onChange={() => setUseGlobalConfigs(false)}
                    className="w-4 h-4 border-slate-600 bg-slate-700 text-cyan-500"
                  />
                  <div>
                    <div className="font-medium">User-Specific Configs</div>
                    <div className="text-xs text-slate-400">
                      Saved under configs/users/{"{"}your-name{"}"}/ - for
                      experimentation
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    useGlobalConfigs
                      ? "bg-amber-900/30 border border-amber-600"
                      : "bg-slate-700/50 border border-slate-600 hover:border-slate-500"
                  }`}
                >
                  <input
                    type="radio"
                    name="configOwnership"
                    checked={useGlobalConfigs}
                    onChange={() => setUseGlobalConfigs(true)}
                    className="w-4 h-4 border-slate-600 bg-slate-700 text-amber-500"
                  />
                  <div>
                    <div className="font-medium text-amber-400">
                      Global Configs (V1)
                    </div>
                    <div className="text-xs text-slate-400">
                      Saved under configs/generated/V1/ - standard combinatorics
                      (use for production)
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Username Input */}
            <div>
              <label className="block text-sm text-slate-400 mb-3">
                {useGlobalConfigs
                  ? "Username (not required for global)"
                  : "Your Name (required)"}
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name (e.g., john_doe)"
                disabled={useGlobalConfigs}
                className={`w-full bg-slate-700 border rounded-md px-3 py-2 ${
                  useGlobalConfigs
                    ? "border-slate-600 opacity-50"
                    : username.trim()
                      ? "border-cyan-600"
                      : "border-red-500"
                }`}
              />
              {!useGlobalConfigs && !username.trim() && (
                <p className="text-xs text-red-400 mt-1">
                  Please enter your name to save user-specific configs
                </p>
              )}
              {!useGlobalConfigs && username.trim() && (
                <p className="text-xs text-cyan-400 mt-1">
                  Configs will be saved to: configs/users/
                  {username.toLowerCase().replace(/[^a-z0-9_-]/g, "_")}/
                </p>
              )}
            </div>
          </div>

          {useGlobalConfigs && (
            <div className="mt-4 bg-amber-900/30 border border-amber-700 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-400 mb-1">
                    Global Config Warning
                  </p>
                  <p className="text-amber-200/80">
                    Global configs are the standard baseline used by everyone.
                    Only use this mode if you intend to update the shared config
                    set. For personal experimentation, use user-specific
                    configs.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generate All: Mode and Timeframe Selection */}
      {generateAllMode && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">
            Select Modes and Timeframes
          </h2>

          <div className="grid grid-cols-2 gap-6">
            {/* Execution Modes */}
            <div>
              <label className="block text-sm text-slate-400 mb-3">
                Execution Modes
              </label>
              <div className="space-y-2">
                {EXECUTION_MODES.map((mode) => (
                  <label
                    key={mode}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedModes.includes(mode)
                        ? "bg-cyan-900/30 border border-cyan-600"
                        : "bg-slate-700/50 border border-slate-600 hover:border-slate-500"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedModes.includes(mode)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedModes([...selectedModes, mode]);
                        } else {
                          setSelectedModes(
                            selectedModes.filter((m) => m !== mode),
                          );
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500"
                    />
                    <div>
                      <div className="font-medium">{mode}</div>
                      <div className="text-xs text-slate-400">
                        {mode === "SCE"
                          ? "Same Candle Exit - exits within the same candle"
                          : "Hold Until Flip - holds until signal reversal"}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Timeframes */}
            <div>
              <label className="block text-sm text-slate-400 mb-3">
                Timeframes
              </label>
              <div className="space-y-2">
                {TIMEFRAMES.map((tf) => (
                  <label
                    key={tf}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedTimeframes.includes(tf)
                        ? "bg-cyan-900/30 border border-cyan-600"
                        : "bg-slate-700/50 border border-slate-600 hover:border-slate-500"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTimeframes.includes(tf)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTimeframes([...selectedTimeframes, tf]);
                        } else {
                          setSelectedTimeframes(
                            selectedTimeframes.filter((t) => t !== tf),
                          );
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500"
                    />
                    <div>
                      <div className="font-medium">{tf}</div>
                      <div className="text-xs text-slate-400">
                        {tf === "5M"
                          ? "5 minutes (300 seconds)"
                          : tf === "15M"
                            ? "15 minutes (900 seconds)"
                            : "1 hour (3600 seconds)"}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Estimated configs */}
          <div className="mt-4 bg-cyan-900/30 border border-cyan-700 rounded-lg p-4">
            <div className="text-lg font-medium text-cyan-400">
              Estimated configs: ~
              {selectedModes.length * selectedTimeframes.length * 150 * 8}
              <span className="text-sm font-normal text-slate-400 ml-2">
                ({selectedModes.length} modes × {selectedTimeframes.length}{" "}
                timeframes × ~8 strategies × ~150 algo combos)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Strategy ID (single mode only) */}
      {!generateAllMode && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">
            Step 1: Strategy Configuration
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Strategy ID
              </label>
              <Input
                type="text"
                value={strategyId}
                onChange={(e) => setStrategyId(e.target.value)}
                placeholder="CEFI_BTC_momentum-macd_SCE_5M_V1"
                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                Format: CATEGORY_ASSET_strategy-desc_MODE_TIMEFRAME_V{"{N}"}
              </p>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Instruction Type
              </label>
              <Select
                value={instructionType}
                onValueChange={(val) => {
                  setInstructionType(val as "TRADE" | "SWAP");
                  setSelectedAlgorithms([]);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRADE">
                    TRADE (CeFi/TradFi CLOB)
                  </SelectItem>
                  <SelectItem value="SWAP">SWAP (DeFi DEX)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Algorithm Selection (single mode only) */}
      {!generateAllMode && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">
            Step 2: Select Algorithms
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {filteredAlgorithms.map((algo) => {
              const schema = ALGORITHM_SCHEMAS[algo];
              const isSelected = selectedAlgorithms.includes(algo);
              return (
                <label
                  key={algo}
                  className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-cyan-900/30 border border-cyan-600"
                      : "bg-slate-700/50 border border-slate-600 hover:border-slate-500"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAlgorithms([...selectedAlgorithms, algo]);
                      } else {
                        setSelectedAlgorithms(
                          selectedAlgorithms.filter((a) => a !== algo),
                        );
                      }
                    }}
                    className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
                  />
                  <div>
                    <div className="font-medium">{algo}</div>
                    <div className="text-xs text-slate-400">{schema.name}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Parameter Grids (single mode only) */}
      {!generateAllMode && selectedAlgorithms.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">
            Step 3: Configure Parameter Grids
          </h2>

          <div className="space-y-6">
            {selectedAlgorithms.map((algo) => {
              const schema = ALGORITHM_SCHEMAS[algo];
              if (!schema) return null;

              const paramNames = Object.keys(schema.params);
              if (paramNames.length === 0) {
                return (
                  <div key={algo} className="bg-slate-700/50 rounded-lg p-4">
                    <h3 className="font-medium text-cyan-400">{algo}</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      No parameters (baseline algorithm)
                    </p>
                  </div>
                );
              }

              return (
                <div key={algo} className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="font-medium text-cyan-400 mb-4">{algo}</h3>

                  <div className="grid grid-cols-2 gap-6">
                    {paramNames.map((paramName) => {
                      const paramSchema = schema.params[paramName];
                      const config = paramGrids[algo]?.[paramName];
                      if (!config) return null;

                      const values = getParamValues(algo, paramName);

                      return (
                        <div key={paramName} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">
                              {paramName}
                            </label>
                            <span className="text-xs text-slate-400">
                              {paramSchema.description}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            {/* Min */}
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">
                                Min
                              </label>
                              <div className="flex items-center space-x-1">
                                <Input
                                  type="number"
                                  value={config.min}
                                  onChange={(e) =>
                                    updateParamGrid(
                                      algo,
                                      paramName,
                                      "min",
                                      Number(e.target.value),
                                    )
                                  }
                                  min={paramSchema.min}
                                  max={config.max}
                                  step={paramSchema.step}
                                  className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm"
                                />
                                <Button
                                  onClick={() =>
                                    updateParamGrid(
                                      algo,
                                      paramName,
                                      "min",
                                      Math.max(
                                        paramSchema.min,
                                        config.min - paramSchema.step,
                                      ),
                                    )
                                  }
                                  variant="outline"
                                  size="sm"
                                  className="px-2 py-1"
                                >
                                  -
                                </Button>
                                <Button
                                  onClick={() =>
                                    updateParamGrid(
                                      algo,
                                      paramName,
                                      "min",
                                      Math.min(
                                        config.max,
                                        config.min + paramSchema.step,
                                      ),
                                    )
                                  }
                                  variant="outline"
                                  size="sm"
                                  className="px-2 py-1"
                                >
                                  +
                                </Button>
                              </div>
                            </div>

                            {/* Max */}
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">
                                Max
                              </label>
                              <div className="flex items-center space-x-1">
                                <Input
                                  type="number"
                                  value={config.max}
                                  onChange={(e) =>
                                    updateParamGrid(
                                      algo,
                                      paramName,
                                      "max",
                                      Number(e.target.value),
                                    )
                                  }
                                  min={config.min}
                                  max={paramSchema.max}
                                  step={paramSchema.step}
                                  className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm"
                                />
                                <Button
                                  onClick={() =>
                                    updateParamGrid(
                                      algo,
                                      paramName,
                                      "max",
                                      Math.max(
                                        config.min,
                                        config.max - paramSchema.step,
                                      ),
                                    )
                                  }
                                  variant="outline"
                                  size="sm"
                                  className="px-2 py-1"
                                >
                                  -
                                </Button>
                                <Button
                                  onClick={() =>
                                    updateParamGrid(
                                      algo,
                                      paramName,
                                      "max",
                                      Math.min(
                                        paramSchema.max,
                                        config.max + paramSchema.step,
                                      ),
                                    )
                                  }
                                  variant="outline"
                                  size="sm"
                                  className="px-2 py-1"
                                >
                                  +
                                </Button>
                              </div>
                            </div>

                            {/* Number of values */}
                            <div>
                              <label className="block text-xs text-slate-500 mb-1 flex items-center">
                                Number of values
                                <span
                                  className="ml-1 text-slate-600 cursor-help"
                                  title="How many evenly-spaced values between min and max"
                                >
                                  ⓘ
                                </span>
                              </label>
                              <div className="flex items-center space-x-1">
                                <Input
                                  type="number"
                                  value={config.numValues}
                                  onChange={(e) =>
                                    updateParamGrid(
                                      algo,
                                      paramName,
                                      "numValues",
                                      Math.max(1, Number(e.target.value)),
                                    )
                                  }
                                  min={1}
                                  max={20}
                                  className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm"
                                />
                                <Button
                                  onClick={() =>
                                    updateParamGrid(
                                      algo,
                                      paramName,
                                      "numValues",
                                      Math.max(1, config.numValues - 1),
                                    )
                                  }
                                  variant="outline"
                                  size="sm"
                                  className="px-2 py-1"
                                >
                                  -
                                </Button>
                                <Button
                                  onClick={() =>
                                    updateParamGrid(
                                      algo,
                                      paramName,
                                      "numValues",
                                      Math.min(20, config.numValues + 1),
                                    )
                                  }
                                  variant="outline"
                                  size="sm"
                                  className="px-2 py-1"
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Preview values */}
                          <div className="text-xs text-slate-400">
                            Values: [
                            {values
                              .map((v) =>
                                paramSchema.step < 1 ? v.toFixed(4) : v,
                              )
                              .join(", ")}
                            ]
                            {paramSchema.unit && (
                              <span className="ml-1 text-slate-500">
                                ({paramSchema.unit})
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total configs counter */}
          <div className="mt-6 bg-cyan-900/30 border border-cyan-700 rounded-lg p-4">
            <div className="text-lg font-medium text-cyan-400">
              Total configs to generate: {totalConfigs}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Date and Time Range (single mode only - configs don't have dates, backtests do) */}
      {!generateAllMode && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">
            Step 4: Select Date and Time Range (for backtest reference)
          </h2>

          <div className="flex items-center space-x-2 text-yellow-500 text-sm mb-4">
            <AlertTriangle className="w-4 h-4" />
            <span>
              All times are in UTC (timezone-aware). This matches how backtests
              are run.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Start Time */}
            <div>
              <h3 className="font-medium mb-3">Start Time (UTC)</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Start Hour (UTC)
                    </label>
                    <div className="flex items-center space-x-1">
                      <Input
                        type="number"
                        value={startHour}
                        onChange={(e) =>
                          setStartHour(
                            Math.max(0, Math.min(23, Number(e.target.value))),
                          )
                        }
                        min={0}
                        max={23}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                      />
                      <Button
                        onClick={() => setStartHour(Math.max(0, startHour - 1))}
                        variant="outline"
                        size="sm"
                        className="px-3 py-2"
                      >
                        -
                      </Button>
                      <Button
                        onClick={() =>
                          setStartHour(Math.min(23, startHour + 1))
                        }
                        variant="outline"
                        size="sm"
                        className="px-3 py-2"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Start Minute
                    </label>
                    <div className="flex items-center space-x-1">
                      <Input
                        type="number"
                        value={startMinute}
                        onChange={(e) =>
                          setStartMinute(
                            Math.max(0, Math.min(59, Number(e.target.value))),
                          )
                        }
                        min={0}
                        max={59}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                      />
                      <Button
                        onClick={() =>
                          setStartMinute(Math.max(0, startMinute - 1))
                        }
                        variant="outline"
                        size="sm"
                        className="px-3 py-2"
                      >
                        -
                      </Button>
                      <Button
                        onClick={() =>
                          setStartMinute(Math.min(59, startMinute + 1))
                        }
                        variant="outline"
                        size="sm"
                        className="px-3 py-2"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* End Time */}
            <div>
              <h3 className="font-medium mb-3">End Time (UTC)</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      End Hour (UTC)
                    </label>
                    <div className="flex items-center space-x-1">
                      <Input
                        type="number"
                        value={endHour}
                        onChange={(e) =>
                          setEndHour(
                            Math.max(0, Math.min(23, Number(e.target.value))),
                          )
                        }
                        min={0}
                        max={23}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                      />
                      <Button
                        onClick={() => setEndHour(Math.max(0, endHour - 1))}
                        variant="outline"
                        size="sm"
                        className="px-3 py-2"
                      >
                        -
                      </Button>
                      <Button
                        onClick={() => setEndHour(Math.min(23, endHour + 1))}
                        variant="outline"
                        size="sm"
                        className="px-3 py-2"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      End Minute
                    </label>
                    <div className="flex items-center space-x-1">
                      <Input
                        type="number"
                        value={endMinute}
                        onChange={(e) =>
                          setEndMinute(
                            Math.max(0, Math.min(59, Number(e.target.value))),
                          )
                        }
                        min={0}
                        max={59}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                      />
                      <Button
                        onClick={() => setEndMinute(Math.max(0, endMinute - 1))}
                        variant="outline"
                        size="sm"
                        className="px-3 py-2"
                      >
                        -
                      </Button>
                      <Button
                        onClick={() =>
                          setEndMinute(Math.min(59, endMinute + 1))
                        }
                        variant="outline"
                        size="sm"
                        className="px-3 py-2"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Duration display */}
          <div className="mt-6 bg-cyan-900/30 border border-cyan-700 rounded-lg p-4">
            <div className="text-lg font-medium text-cyan-400">
              Duration: {duration.hours.toFixed(2)} hours (
              {duration.minutes.toFixed(0)} minutes)
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Generate */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">
          {generateAllMode
            ? "Generate All Configs"
            : "Step 5: Generate Configs"}
        </h2>

        {/* Output options */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Output Directory
            </label>
            <Input
              type="text"
              value={outputDir}
              onChange={(e) => setOutputDir(e.target.value)}
              placeholder="./configs/generated"
              className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 font-mono text-sm"
            />
          </div>
          <div className="flex flex-col justify-end">
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveLocal}
                  onChange={(e) => setSaveLocal(e.target.checked)}
                  disabled={dryRun}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 disabled:opacity-50"
                />
                <Save className="w-4 h-4" />
                <span className={dryRun ? "text-slate-500" : ""}>
                  Save Locally
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={uploadToGcs}
                  onChange={(e) => setUploadToGcs(e.target.checked)}
                  disabled={dryRun}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 disabled:opacity-50"
                />
                <Upload className="w-4 h-4" />
                <span className={dryRun ? "text-slate-500" : ""}>
                  Upload to GCS
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6 mb-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
            />
            <span>Dry Run (preview only)</span>
          </label>

          {generateAllMode && (
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={cleanupFirst}
                onChange={(e) => setCleanupFirst(e.target.checked)}
                disabled={dryRun}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500 disabled:opacity-50"
              />
              <span className={dryRun ? "text-slate-500" : "text-amber-400"}>
                Clean old configs first
              </span>
            </label>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {generateAllMode ? (
            <Button
              onClick={handleGenerateAll}
              disabled={
                isGenerating ||
                selectedModes.length === 0 ||
                selectedTimeframes.length === 0
              }
              variant="default"
              className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Generating All...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Generate All Configs</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={
                isGenerating ||
                selectedAlgorithms.length === 0 ||
                !strategyId ||
                (!useGlobalConfigs && !username.trim())
              }
              variant="default"
              className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>
                    Generate {totalConfigs} Configs{" "}
                    {!useGlobalConfigs && username.trim()
                      ? `for ${username}`
                      : "(Global)"}
                  </span>
                </>
              )}
            </Button>
          )}

          {!generateAllMode && selectedAlgorithms.length === 0 && (
            <span className="text-yellow-500 text-sm">
              Select at least one algorithm
            </span>
          )}

          {!generateAllMode &&
            !useGlobalConfigs &&
            !username.trim() &&
            selectedAlgorithms.length > 0 && (
              <span className="text-red-500 text-sm">
                Enter your name to generate user-specific configs
              </span>
            )}

          {generateAllMode &&
            (selectedModes.length === 0 || selectedTimeframes.length === 0) && (
              <span className="text-yellow-500 text-sm">
                Select at least one mode and timeframe
              </span>
            )}
        </div>

        {/* Result display */}
        {result && (
          <div
            className={`mt-6 p-4 rounded-lg ${result.success ? "bg-green-900/30 border border-green-700" : "bg-red-900/30 border border-red-700"}`}
          >
            <div className="flex items-center space-x-2 mb-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              )}
              <span
                className={`font-medium ${result.success ? "text-green-400" : "text-red-400"}`}
              >
                {result.message}
              </span>
            </div>

            {result.totalConfigs && (
              <p className="text-sm text-slate-300">
                Total configs: {result.totalConfigs}
              </p>
            )}

            {result.configPaths && result.configPaths.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-slate-400 mb-2">Generated paths:</p>
                <div className="max-h-40 overflow-y-auto bg-slate-900/50 rounded p-2">
                  {result.configPaths.slice(0, 10).map((path, i) => (
                    <div
                      key={i}
                      className="text-xs font-mono text-slate-300 flex items-center space-x-2"
                    >
                      <Folder className="w-3 h-3" />
                      <span>{path}</span>
                    </div>
                  ))}
                  {result.configPaths.length > 10 && (
                    <p className="text-xs text-slate-500 mt-1">
                      ... and {result.configPaths.length - 10} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {result.errors && result.errors.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-red-400 mb-2">Errors:</p>
                <ul className="list-disc list-inside text-sm text-red-300">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
