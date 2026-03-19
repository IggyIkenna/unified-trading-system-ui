import { useState, useEffect, useMemo } from "react";
import { RefreshCw, Table, Eye, ChevronDown, ChevronUp } from "lucide-react";
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@unified-trading/ui-kit";
import apiClient from "@/api/client";

interface Strategy {
  strategyId: string;
  dates: string[];
}

interface Instruction {
  timestamp: number;
  timestamp_formatted: string;
  instruction_id: string;
  instruction_type: string;
  direction: number;
  instrument_id: string;
  strategy_id: string;
  quantity: number;
  benchmark_price: number;
  take_profit_price?: number | null;
  stop_loss_price?: number | null;
  candle_close_price?: number | null;
}

export default function InstructionAvailability() {
  // State for strategies list
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loadingStrategies, setLoadingStrategies] = useState(true);

  // State for selected strategy and date
  const [selectedStrategy, setSelectedStrategy] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");

  // State for instructions
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [loadingInstructions, setLoadingInstructions] = useState(false);

  // State for errors
  const [error, setError] = useState<string | null>(null);

  // State for table sorting
  const [sortField, setSortField] = useState<string>("timestamp");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // State for type filter
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Available dates for selected strategy
  const availableDates = useMemo(() => {
    const strategy = strategies.find((s) => s.strategyId === selectedStrategy);
    return strategy?.dates || [];
  }, [strategies, selectedStrategy]);

  // Filtered and sorted instructions
  const sortedInstructions = useMemo(() => {
    // Filter by type first
    let filtered = instructions;
    if (typeFilter === "TRADE") {
      filtered = instructions.filter((i) => i.instruction_type === "TRADE");
    } else if (typeFilter === "HEARTBEAT") {
      filtered = instructions.filter(
        (i) =>
          i.instruction_type === "HEARTBEAT" ||
          i.instruction_type === "NO_ACTION",
      );
    }

    // Then sort
    const sorted = [...filtered].sort((a, b) => {
      const aVal = a[sortField as keyof Instruction];
      const bVal = b[sortField as keyof Instruction];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDirection === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
    return sorted;
  }, [instructions, sortField, sortDirection, typeFilter]);

  // Load strategies on mount
  useEffect(() => {
    loadStrategies();
  }, []);

  // Load instructions when strategy/date changes
  useEffect(() => {
    if (selectedStrategy && selectedDate) {
      loadInstructions();
    } else {
      setInstructions([]);
    }
  }, [selectedStrategy, selectedDate]);

  async function loadStrategies() {
    setLoadingStrategies(true);
    setError(null);

    try {
      const response = await apiClient.get<{ strategies: Strategy[] }>(
        "/data/strategies",
      );
      const data = response.data;
      setStrategies(data.strategies || []);

      // Auto-select first strategy if available
      if (data.strategies?.length > 0) {
        const firstStrategy = data.strategies[0];
        setSelectedStrategy(firstStrategy.strategyId);
        if (firstStrategy.dates?.length > 0) {
          setSelectedDate(firstStrategy.dates[0]);
        }
      }
    } catch (err) {
      setError(`Failed to load strategies: ${err}`);
      console.error(err);
    } finally {
      setLoadingStrategies(false);
    }
  }

  async function loadInstructions() {
    if (!selectedStrategy || !selectedDate) return;

    setLoadingInstructions(true);
    setError(null);

    try {
      const response = await apiClient.get<{ instructions: Instruction[] }>(
        "/data/instructions",
        {
          params: { strategy_id: selectedStrategy, date: selectedDate },
        },
      );
      setInstructions(response.data.instructions || []);
    } catch (err) {
      setError(`Failed to load instructions: ${err}`);
      console.error(err);
    } finally {
      setLoadingInstructions(false);
    }
  }

  function handleSort(field: string) {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  function formatPrice(price: number | null | undefined): string {
    if (price === null || price === undefined) return "-";
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  }

  function formatDirection(direction: number): JSX.Element {
    if (direction === 1) {
      return <span className="text-green-400 font-medium">BUY (+1)</span>;
    } else if (direction === -1) {
      return <span className="text-red-400 font-medium">SELL (-1)</span>;
    }
    return <span className="text-slate-400">{direction}</span>;
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field)
      return <span className="text-slate-600 ml-1">↕</span>;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">
            Availability
          </h1>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            Strategy instructions data validator and availability checker
          </p>
        </div>
        <Button
          onClick={loadStrategies}
          disabled={loadingStrategies}
          variant="default"
          size="sm"
          className="flex items-center space-x-2"
        >
          <RefreshCw
            className={`w-4 h-4 ${loadingStrategies ? "animate-spin" : ""}`}
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

      {/* Selection Controls */}
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Eye className="w-5 h-5 text-slate-400" />
          <span className="font-medium text-lg">Select Strategy & Date</span>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Strategy Selector */}
          <div className="field-group">
            <label className="field-label block text-sm text-slate-400 mb-2">
              Strategy
            </label>
            <Select
              value={selectedStrategy}
              onValueChange={(v) => {
                setSelectedStrategy(v);
                const strategy = strategies.find((s) => s.strategyId === v);
                if (strategy && strategy.dates && strategy.dates.length > 0) {
                  setSelectedDate(strategy.dates[0]);
                } else {
                  setSelectedDate("");
                }
              }}
              disabled={loadingStrategies}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Select a Strategy --" />
              </SelectTrigger>
              <SelectContent>
                {strategies.map((s) => (
                  <SelectItem key={s.strategyId} value={s.strategyId}>
                    {s.strategyId} ({s.dates.length} dates)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selector */}
          <div className="field-group">
            <label className="field-label block text-sm text-slate-400 mb-2">
              Date
            </label>
            <Select
              value={selectedDate}
              onValueChange={setSelectedDate}
              disabled={!selectedStrategy || loadingInstructions}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Select a Date --" />
              </SelectTrigger>
              <SelectContent>
                {availableDates.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {selectedStrategy && selectedDate && (
        <div className="space-y-4">
          <div className="grid grid-cols-6 gap-4">
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400">Total Instructions</div>
              <div className="text-2xl font-semibold">
                {instructions.length}
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border-2 border-blue-600">
              <div className="text-sm text-slate-400">TRADE Signals</div>
              <div className="text-2xl font-semibold text-blue-400">
                {
                  instructions.filter((i) => i.instruction_type === "TRADE")
                    .length
                }
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400">HEARTBEAT</div>
              <div className="text-xl font-semibold text-slate-500">
                {
                  instructions.filter(
                    (i) =>
                      i.instruction_type === "HEARTBEAT" ||
                      i.instruction_type === "NO_ACTION",
                  ).length
                }
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400">BUY / SELL</div>
              <div className="text-xl font-semibold">
                <span className="text-green-400">
                  {instructions.filter((i) => i.direction === 1).length}
                </span>
                {" / "}
                <span className="text-red-400">
                  {instructions.filter((i) => i.direction === -1).length}
                </span>
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400">Benchmark Range</div>
              <div className="text-sm font-semibold">
                {instructions.filter(
                  (i) => i.benchmark_price && !isNaN(i.benchmark_price),
                ).length > 0
                  ? `${Math.min(...instructions.filter((i) => i.benchmark_price && !isNaN(i.benchmark_price)).map((i) => i.benchmark_price)).toLocaleString(undefined, { maximumFractionDigits: 2 })} - ${Math.max(...instructions.filter((i) => i.benchmark_price && !isNaN(i.benchmark_price)).map((i) => i.benchmark_price)).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                  : "-"}
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400">Total Quantity</div>
              <div className="text-xl font-semibold">
                {instructions
                  .reduce((sum, i) => sum + (i.quantity || 0), 0)
                  .toFixed(2)}
              </div>
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-400">Filter by type:</span>
            <Button
              onClick={() => setTypeFilter("all")}
              variant="ghost"
              size="sm"
              className={`px-3 py-1 rounded text-sm ${typeFilter === "all" ? "bg-blue-600" : "bg-slate-700"}`}
            >
              All ({instructions.length})
            </Button>
            <Button
              onClick={() => setTypeFilter("TRADE")}
              variant="ghost"
              size="sm"
              className={`px-3 py-1 rounded text-sm ${typeFilter === "TRADE" ? "bg-blue-600" : "bg-slate-700"}`}
            >
              TRADE Only (
              {
                instructions.filter((i) => i.instruction_type === "TRADE")
                  .length
              }
              )
            </Button>
            <Button
              onClick={() => setTypeFilter("HEARTBEAT")}
              variant="ghost"
              size="sm"
              className={`px-3 py-1 rounded text-sm ${typeFilter === "HEARTBEAT" ? "bg-slate-500" : "bg-slate-700"}`}
            >
              HEARTBEAT Only (
              {
                instructions.filter(
                  (i) =>
                    i.instruction_type === "HEARTBEAT" ||
                    i.instruction_type === "NO_ACTION",
                ).length
              }
              )
            </Button>
          </div>
        </div>
      )}

      {/* Instructions Table */}
      {loadingInstructions ? (
        <div className="bg-slate-800 rounded-lg p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-4" />
          <p className="text-slate-400">Loading instructions...</p>
        </div>
      ) : instructions.length > 0 ? (
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <Table className="w-5 h-5 text-slate-400" />
              <span className="font-medium">
                Instructions Detail ({sortedInstructions.length} rows)
              </span>
            </div>
            <span className="text-sm text-slate-400">
              Click column headers to sort
            </span>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-700/50 sticky top-0">
                <tr className="table-row">
                  <th
                    className="table-header-cell px-4 py-3 text-left font-medium text-slate-300 cursor-pointer hover:bg-slate-600"
                    onClick={() => handleSort("timestamp")}
                  >
                    Timestamp <SortIcon field="timestamp" />
                  </th>
                  <th
                    className="table-header-cell px-4 py-3 text-left font-medium text-slate-300 cursor-pointer hover:bg-slate-600"
                    onClick={() => handleSort("instruction_id")}
                  >
                    Instruction ID <SortIcon field="instruction_id" />
                  </th>
                  <th
                    className="table-header-cell px-4 py-3 text-center font-medium text-slate-300 cursor-pointer hover:bg-slate-600"
                    onClick={() => handleSort("instruction_type")}
                  >
                    Type <SortIcon field="instruction_type" />
                  </th>
                  <th
                    className="table-header-cell px-4 py-3 text-center font-medium text-slate-300 cursor-pointer hover:bg-slate-600"
                    onClick={() => handleSort("direction")}
                  >
                    Direction <SortIcon field="direction" />
                  </th>
                  <th
                    className="table-header-cell px-4 py-3 text-right font-medium text-slate-300 cursor-pointer hover:bg-slate-600"
                    onClick={() => handleSort("quantity")}
                  >
                    Quantity <SortIcon field="quantity" />
                  </th>
                  <th
                    className="table-header-cell px-4 py-3 text-right font-medium text-slate-300 cursor-pointer hover:bg-slate-600"
                    onClick={() => handleSort("benchmark_price")}
                  >
                    Benchmark Price <SortIcon field="benchmark_price" />
                  </th>
                  <th
                    className="table-header-cell px-4 py-3 text-right font-medium text-slate-300 cursor-pointer hover:bg-slate-600"
                    onClick={() => handleSort("take_profit_price")}
                  >
                    Take Profit <SortIcon field="take_profit_price" />
                  </th>
                  <th
                    className="table-header-cell px-4 py-3 text-right font-medium text-slate-300 cursor-pointer hover:bg-slate-600"
                    onClick={() => handleSort("stop_loss_price")}
                  >
                    Stop Loss <SortIcon field="stop_loss_price" />
                  </th>
                  <th className="table-header-cell px-4 py-3 text-left font-medium text-slate-300">
                    Instrument
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedInstructions.map((inst, idx) => (
                  <tr
                    key={inst.instruction_id || idx}
                    className={`table-row ${idx % 2 === 0 ? "bg-slate-800" : "bg-slate-800/50"} hover:bg-slate-700/50`}
                  >
                    <td className="table-cell px-4 py-2 font-mono text-xs whitespace-nowrap">
                      {inst.timestamp_formatted}
                    </td>
                    <td className="table-cell px-4 py-2 font-mono text-xs">
                      {inst.instruction_id?.slice(0, 30)}...
                    </td>
                    <td className="table-cell px-4 py-2 text-center">
                      <span className="px-2 py-1 bg-blue-900 text-blue-200 rounded text-xs font-medium">
                        {inst.instruction_type}
                      </span>
                    </td>
                    <td className="table-cell px-4 py-2 text-center">
                      {formatDirection(inst.direction)}
                    </td>
                    <td className="table-cell px-4 py-2 text-right font-mono">
                      {inst.quantity?.toFixed(2)}
                    </td>
                    <td className="table-cell px-4 py-2 text-right font-mono font-medium text-yellow-300">
                      {formatPrice(inst.benchmark_price)}
                    </td>
                    <td className="table-cell px-4 py-2 text-right font-mono text-green-400">
                      {formatPrice(inst.take_profit_price)}
                    </td>
                    <td className="table-cell px-4 py-2 text-right font-mono text-red-400">
                      {formatPrice(inst.stop_loss_price)}
                    </td>
                    <td
                      className="table-cell px-4 py-2 text-xs truncate max-w-[200px]"
                      title={inst.instrument_id}
                    >
                      {inst.instrument_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : selectedStrategy && selectedDate ? (
        <div className="bg-slate-800 rounded-lg p-8 text-center text-slate-400">
          No instructions found for {selectedStrategy} on {selectedDate}
        </div>
      ) : null}

      {/* Instructions to run backend */}
      <div className="bg-slate-800/50 rounded-lg p-4 text-sm text-slate-400">
        <p className="font-medium mb-2">To use this data validator:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>
            Start the backend API:{" "}
            <code className="bg-slate-700 px-2 py-1 rounded">
              cd execution-services/visualizer-api && uvicorn app.main:app
              --port 8001
            </code>
          </li>
          <li>Select a strategy from the dropdown</li>
          <li>Select a date to view instructions</li>
          <li>Verify benchmark prices, direction, and other fields</li>
        </ol>
      </div>
    </div>
  );
}
