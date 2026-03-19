import { useState, useEffect, useMemo } from "react";
import { LineChart, RefreshCw, Calendar, Filter } from "lucide-react";
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@unified-trading/ui-kit";
import apiClient from "@/api/client";

interface TickDataPoint {
  timestamp: number;
  timestamp_formatted: string;
  price: number;
  size?: number;
  side?: string;
}

interface CategoryData {
  category: string;
  instrumentTypes: string[];
  dates: string[];
}

interface InstrumentInfo {
  instrumentId: string;
  instrumentType: string;
}

export default function MarketTickData() {
  // State for categories and data structure
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // State for selection
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedInstrumentType, setSelectedInstrumentType] =
    useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [instruments, setInstruments] = useState<InstrumentInfo[]>([]);
  const [selectedInstrument, setSelectedInstrument] = useState<string>("");

  // State for tick data
  const [tickData, setTickData] = useState<TickDataPoint[]>([]);
  const [loadingTicks, setLoadingTicks] = useState(false);

  // State for errors
  const [error, setError] = useState<string | null>(null);

  // State for chart settings
  const [sampleRate, setSampleRate] = useState<number>(100);
  const [serverSideSampling, setServerSideSampling] = useState<boolean>(true);

  // Get available instrument types for selected category
  const availableInstrumentTypes = useMemo(() => {
    const category = categories.find((c) => c.category === selectedCategory);
    return category?.instrumentTypes || [];
  }, [categories, selectedCategory]);

  // Get available dates for selected category
  const availableDates = useMemo(() => {
    const category = categories.find((c) => c.category === selectedCategory);
    return category?.dates || [];
  }, [categories, selectedCategory]);

  // Sampled tick data for display (client-side sampling when server-side is disabled)
  const sampledTickData = useMemo(() => {
    // If server-side sampling is enabled, data is already sampled
    if (serverSideSampling) return tickData;

    // Client-side sampling fallback
    if (tickData.length <= sampleRate) return tickData;

    const step = Math.ceil(tickData.length / sampleRate);
    return tickData.filter((_, i) => i % step === 0);
  }, [tickData, sampleRate, serverSideSampling]);

  // Price statistics
  const priceStats = useMemo(() => {
    if (tickData.length === 0) return null;

    const prices = tickData.map((t) => t.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const first = prices[0];
    const last = prices[prices.length - 1];
    const change = ((last - first) / first) * 100;

    return { min, max, avg, first, last, change };
  }, [tickData]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory && selectedInstrumentType && selectedDate) {
      loadInstruments();
    } else {
      setInstruments([]);
      setSelectedInstrument("");
    }
  }, [selectedCategory, selectedInstrumentType, selectedDate]);

  useEffect(() => {
    if (selectedInstrument && selectedDate) {
      loadTickData();
    } else {
      setTickData([]);
    }
  }, [selectedInstrument, selectedDate]);

  async function loadCategories() {
    setLoadingCategories(true);
    setError(null);

    try {
      const response = await apiClient.get<{ categories: CategoryData[] }>(
        "/data/tick-data",
      );
      const data = response.data;
      setCategories(data.categories || []);

      // Auto-select first category
      if (data.categories?.length > 0) {
        const first = data.categories[0];
        setSelectedCategory(first.category);
        if (first.instrumentTypes?.length > 0) {
          setSelectedInstrumentType(first.instrumentTypes[0]);
        }
        if (first.dates?.length > 0) {
          setSelectedDate(first.dates[0]);
        }
      }
    } catch (err) {
      setError(`Failed to load categories: ${err}`);
      console.error(err);
    } finally {
      setLoadingCategories(false);
    }
  }

  async function loadInstruments() {
    if (!selectedCategory || !selectedInstrumentType || !selectedDate) return;

    try {
      const response = await apiClient.get<{ instruments: InstrumentInfo[] }>(
        "/data/tick-data/instruments",
        {
          params: {
            category: selectedCategory,
            instrument_type: selectedInstrumentType,
            date: selectedDate,
          },
        },
      );
      const data = response.data;
      setInstruments(data.instruments || []);

      // Auto-select first instrument
      if (data.instruments?.length > 0) {
        setSelectedInstrument(data.instruments[0].instrumentId);
      }
    } catch (err) {
      setError(`Failed to load instruments: ${err}`);
      console.error(err);
    }
  }

  async function loadTickData() {
    if (!selectedInstrument || !selectedDate || !selectedCategory) return;

    setLoadingTicks(true);
    setError(null);

    try {
      const params: Record<string, string | number> = {
        category: selectedCategory,
        instrument_id: selectedInstrument,
        date: selectedDate,
      };

      // Add sample_rate for server-side downsampling (1 = all ticks, higher = faster load)
      if (serverSideSampling && sampleRate > 1) {
        params.sample_rate = sampleRate;
      }

      const response = await apiClient.get<{ ticks: TickDataPoint[] }>(
        "/data/tick-data/ticks",
        { params },
      );
      setTickData(response.data.ticks || []);
    } catch (err) {
      setError(`Failed to load tick data: ${err}`);
      console.error(err);
    } finally {
      setLoadingTicks(false);
    }
  }

  // Simple SVG chart renderer
  function renderPriceChart() {
    if (sampledTickData.length < 2) return null;

    const width = 800;
    const height = 300;
    const padding = 50;

    const prices = sampledTickData.map((t) => t.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const xScale = (i: number) =>
      padding + (i / (sampledTickData.length - 1)) * (width - padding * 2);
    const yScale = (price: number) =>
      height -
      padding -
      ((price - minPrice) / priceRange) * (height - padding * 2);

    // Generate path
    const pathD = sampledTickData
      .map(
        (tick, i) =>
          `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(tick.price)}`,
      )
      .join(" ");

    // Generate Y-axis labels
    const yLabels = Array.from({ length: 5 }, (_, i) => {
      const price = minPrice + (priceRange * i) / 4;
      return { price, y: yScale(price) };
    });

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Background */}
        <rect
          x={padding}
          y={padding}
          width={width - padding * 2}
          height={height - padding * 2}
          fill="#1e293b"
        />

        {/* Grid lines */}
        {yLabels.map(({ y }, i) => (
          <line
            key={i}
            x1={padding}
            y1={y}
            x2={width - padding}
            y2={y}
            stroke="#334155"
            strokeWidth="1"
          />
        ))}

        {/* Y-axis labels */}
        {yLabels.map(({ price, y }, i) => (
          <text
            key={i}
            x={padding - 5}
            y={y + 4}
            textAnchor="end"
            fill="#94a3b8"
            fontSize="10"
          >
            {price.toFixed(2)}
          </text>
        ))}

        {/* Price line */}
        <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" />

        {/* X-axis labels */}
        <text x={padding} y={height - 10} fill="#94a3b8" fontSize="10">
          {sampledTickData[0]?.timestamp_formatted?.split(" ")[1] || ""}
        </text>
        <text
          x={width - padding}
          y={height - 10}
          textAnchor="end"
          fill="#94a3b8"
          fontSize="10"
        >
          {sampledTickData[
            sampledTickData.length - 1
          ]?.timestamp_formatted?.split(" ")[1] || ""}
        </text>
      </svg>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">
            Market Tick Data
          </h1>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            Browse and visualize raw market tick data by instrument
          </p>
        </div>
        <Button
          onClick={loadCategories}
          disabled={loadingCategories}
          variant="default"
          className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700"
        >
          <RefreshCw
            className={`w-4 h-4 ${loadingCategories ? "animate-spin" : ""}`}
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
          <Calendar className="w-5 h-5 text-slate-400" />
          <span className="font-medium text-lg">Select Data Source</span>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {/* Category Selector */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Category
            </label>
            <Select
              value={selectedCategory}
              onValueChange={(val) => {
                setSelectedCategory(val);
                setSelectedInstrumentType("");
                setSelectedInstrument("");
                const cat = categories.find((c) => c.category === val);
                if (
                  cat &&
                  cat.instrumentTypes &&
                  cat.instrumentTypes.length > 0
                ) {
                  setSelectedInstrumentType(cat.instrumentTypes[0]);
                }
                if (cat && cat.dates && cat.dates.length > 0) {
                  setSelectedDate(cat.dates[0]);
                }
              }}
              disabled={loadingCategories}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Select Category --" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.category} value={c.category}>
                    {c.category.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Instrument Type Selector */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Instrument Type
            </label>
            <Select
              value={selectedInstrumentType}
              onValueChange={(val) => {
                setSelectedInstrumentType(val);
                setSelectedInstrument("");
              }}
              disabled={!selectedCategory}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Select Type --" />
              </SelectTrigger>
              <SelectContent>
                {availableInstrumentTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selector */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Date</label>
            <Select
              value={selectedDate}
              onValueChange={(val) => {
                setSelectedDate(val);
                setSelectedInstrument("");
              }}
              disabled={!selectedCategory}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Select Date --" />
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

          {/* Instrument Selector */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Instrument
            </label>
            <Select
              value={selectedInstrument}
              onValueChange={setSelectedInstrument}
              disabled={instruments.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Select Instrument --" />
              </SelectTrigger>
              <SelectContent>
                {instruments.map((i) => (
                  <SelectItem key={i.instrumentId} value={i.instrumentId}>
                    {i.instrumentId.length > 40
                      ? i.instrumentId.substring(0, 40) + "..."
                      : i.instrumentId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats and Controls */}
      {tickData.length > 0 && priceStats && (
        <div className="space-y-4">
          <div className="grid grid-cols-6 gap-4">
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400">Total Ticks</div>
              <div className="text-2xl font-semibold">
                {tickData.length.toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400">First Price</div>
              <div className="text-xl font-semibold">
                ${priceStats.first.toFixed(2)}
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400">Last Price</div>
              <div className="text-xl font-semibold">
                ${priceStats.last.toFixed(2)}
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400">Min</div>
              <div className="text-xl font-semibold text-red-400">
                ${priceStats.min.toFixed(2)}
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400">Max</div>
              <div className="text-xl font-semibold text-green-400">
                ${priceStats.max.toFixed(2)}
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400">Change</div>
              <div
                className={`text-xl font-semibold ${priceStats.change >= 0 ? "text-green-400" : "text-red-400"}`}
              >
                {priceStats.change >= 0 ? "+" : ""}
                {priceStats.change.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Chart Controls */}
          <div className="bg-slate-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium">Display Settings</span>
              </div>
              <span className="text-sm text-slate-500">
                Showing {sampledTickData.length.toLocaleString()} of{" "}
                {tickData.length.toLocaleString()} ticks
              </span>
            </div>

            {/* Sample Rate Slider */}
            <div className="flex items-center space-x-4">
              <label className="text-sm text-slate-400 w-32">
                Sample Rate:{" "}
                <span className="text-white font-medium">{sampleRate}</span>
              </label>
              <input
                type="range"
                min={1}
                max={1000}
                value={sampleRate}
                onChange={(e) => setSampleRate(Number(e.target.value))}
                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <span className="text-xs text-slate-500 w-48">
                (1 = all ticks, higher = faster load)
              </span>
            </div>

            {/* Server-side sampling toggle */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={serverSideSampling}
                  onChange={(e) => setServerSideSampling(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-orange-500 focus:ring-orange-500"
                />
                <span>Server-side sampling</span>
              </label>
              <span className="text-xs text-slate-500">
                {serverSideSampling
                  ? "(Faster load - data sampled before transfer)"
                  : "(Full data loaded, then sampled client-side)"}
              </span>
              {serverSideSampling && (
                <Button
                  onClick={loadTickData}
                  variant="default"
                  size="sm"
                  className="text-xs bg-orange-600 hover:bg-orange-700"
                >
                  Reload with new sample rate
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Price Chart */}
      {loadingTicks ? (
        <div className="bg-slate-800 rounded-lg p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-4" />
          <p className="text-slate-400">Loading tick data...</p>
        </div>
      ) : sampledTickData.length > 0 ? (
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <LineChart className="w-5 h-5 text-slate-400" />
              <span className="font-medium">Price Over Time</span>
            </div>
            <span className="text-sm text-slate-400">{selectedInstrument}</span>
          </div>

          <div className="p-4">{renderPriceChart()}</div>
        </div>
      ) : selectedInstrument && selectedDate ? (
        <div className="bg-slate-800 rounded-lg p-8 text-center text-slate-400">
          No tick data found for {selectedInstrument} on {selectedDate}
        </div>
      ) : null}

      {/* Instructions */}
      <div className="bg-slate-800/50 rounded-lg p-4 text-sm text-slate-400">
        <p className="font-medium mb-2">Market Tick Data Help:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            Tick data is stored at{" "}
            <code className="bg-slate-700 px-2 py-1 rounded">
              gs://market-data-tick-{"{category}"}-{"{project}"}
              /raw_tick_data/by_date/day-{"{date}"}/data_type-trades/
              {"{instrument_type}"}/*.parquet
            </code>
          </li>
          <li>
            For futures_chain and options_chain, files contain multiple
            instruments - filter by specific contract
          </li>
          <li>
            <strong>Sample Rate slider</strong> (1-1000): 1 = all ticks, higher
            values = faster load by taking every Nth tick
          </li>
          <li>
            <strong>Server-side sampling</strong>: Reduces data transfer by
            sampling before download (recommended for large datasets)
          </li>
          <li>
            Prices are displayed in the quote currency (usually USD or USDT)
          </li>
        </ul>
      </div>
    </div>
  );
}
