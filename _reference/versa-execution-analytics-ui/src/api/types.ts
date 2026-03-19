// Result types
export interface ResultSummary {
  result_id: string;
  config_id: string;
  strategy_id: string;
  run_id: string;
  run_path?: string; // GCS path to the run folder (for fetching execution_alpha.json)
  bucket?: string; // GCS bucket containing the run (for fetching execution_alpha.json)
  date: string;
  category: string;
  asset: string;
  strategy_description: string;
  mode: string;
  timeframe: string;
  algorithm: string;
  instruction_type: string;
  net_alpha_bps: number;
  gross_alpha_bps: number;
  total_costs_bps: number;
  net_alpha_usd: number;
  total_notional_usd: number;
  pnl: number;
  sharpe_ratio: number;
  win_rate: number;
  total_trades: number;
}

export interface Order {
  id: string;
  timestamp: string;
  side: "BUY" | "SELL";
  price: number;
  amount: number;
  status: "FILLED" | "REJECTED" | "CANCELLED" | "PENDING";
  parent_order_id?: string;
  exec_algorithm?: string;
}

export interface Fill {
  order_id: string;
  timestamp: string;
  side: string;
  price: number;
  quantity: number;
  alpha_bps?: number;
}

export interface EquityPoint {
  timestamp: string;
  portfolio_value: number;
  cash: number;
  positions_value: number;
}

export interface TimelineEvent {
  ts: string;
  event: string;
  data: Record<string, unknown>;
}

export interface ExecutionAlphaSummary {
  vw_net_alpha_bps: number;
  vw_gross_alpha_bps: number;
  vw_entry_alpha_bps: number;
  vw_exit_alpha_bps: number;
  vw_total_costs_bps: number;
  net_alpha_usd: number;
  total_notional_usd: number;
  total_gas_costs_usd: number;
}

export interface ExecutionAlpha {
  summary: ExecutionAlphaSummary;
  entry_fills: FillAlpha[];
  exit_fills: FillAlpha[];
}

export interface FillAlpha {
  timestamp: string;
  side: string;
  price: number;
  quantity: number;
  benchmark_price: number;
  alpha_bps: number;
  notional: number;
}

export interface ResultDetails {
  summary: ResultSummary;
  orders: Order[];
  fills: Fill[];
  equity_curve: EquityPoint[];
  timeline: TimelineEvent[];
  execution_alpha?: ExecutionAlpha;
}

export interface FilterOptions {
  categories: string[];
  assets: string[];
  strategies: string[];
  algorithms: string[];
  timeframes: string[];
  instruction_types: string[];
  modes: string[];
}

export interface ResultsResponse {
  results: ResultSummary[];
  total: number;
  filters: FilterOptions;
}

// Analysis types
export interface AggregatedGroup {
  name: string;
  count: number;
  mean_alpha: number;
  std_alpha: number;
  min_alpha: number;
  max_alpha: number;
  total_alpha_usd: number;
}

export interface OverallSummary {
  total_results: number;
  mean_alpha_bps: number;
  median_alpha_bps: number;
  std_alpha_bps: number;
  min_alpha_bps: number;
  max_alpha_bps: number;
  positive_pct: number;
  total_alpha_usd: number;
  total_notional_usd: number;
}

export interface AggregateResponse {
  groups: AggregatedGroup[];
  summary: OverallSummary;
}

export interface HistogramBin {
  bin_start: number;
  bin_end: number;
  count: number;
}

export interface DistributionStats {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  skewness: number;
  kurtosis: number;
  percentile_5: number;
  percentile_95: number;
}

export interface DistributionResponse {
  histogram: HistogramBin[];
  stats: DistributionStats;
}

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}

export interface TimeSeriesResponse {
  series: TimeSeriesPoint[];
}

export interface HeatmapResponse {
  rows: string[];
  cols: string[];
  values: number[][];
}

export interface RankedConfig {
  rank: number;
  result_id: string;
  config_id: string;
  algorithm: string;
  net_alpha_bps: number;
  pnl: number;
  sharpe_ratio: number;
  total_trades: number;
}

export interface BestConfigsResponse {
  configs: RankedConfig[];
}

// Backtest types
export interface BacktestJobResponse {
  job_id: string;
  status: "queued" | "running" | "completed" | "failed";
}

export interface JobInfo {
  job_id: string;
  config_id: string;
}

export interface BatchJobResponse {
  batch_id: string;
  jobs: JobInfo[];
}

export interface JobStatusResponse {
  job_id: string;
  status: "queued" | "running" | "completed" | "failed";
  progress?: number;
  result_path?: string;
  error?: string;
  execution_time_secs?: number;
}

// Validation types
export interface ConfigValidationResponse {
  valid: boolean;
  errors: string[];
}

export interface DependencyCheck {
  name: string;
  service: string;
  available: boolean;
  message: string;
  checked_path: string;
  required: boolean;
}

export interface DependencyCheckResponse {
  all_available: boolean;
  required_available: boolean;
  checks: DependencyCheck[];
}
