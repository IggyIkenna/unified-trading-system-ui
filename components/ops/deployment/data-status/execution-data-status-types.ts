import type { ReactNode } from "react";
import type { ExecutionMissingShardsResponse } from "@/hooks/deployment/_api-stub";

export interface ExecutionDataStatusProps {
  serviceName: string;
}

export interface ConfigInfo {
  config_file: string;
  algo_name: string;
  result_strategy_id: string;
  has_results: boolean;
  result_dates: string[];
  dates_found_count?: number;
  dates_found_list?: string[];
  dates_found_list_tail?: string[];
  dates_found_truncated?: boolean;
  dates_missing_count?: number;
  dates_missing_list?: string[];
  dates_missing_list_tail?: string[];
  dates_missing_truncated?: boolean;
  completion_pct?: number;
}

export interface TimeframeStatus {
  timeframe: string;
  total: number;
  with_results: number;
  completion_pct: number;
  missing_configs: Array<{ config_file: string; algo_name: string }>;
  configs: ConfigInfo[];
}

export interface ModeStatus {
  mode: string;
  total: number;
  with_results: number;
  completion_pct: number;
  timeframes: TimeframeStatus[];
}

export interface StrategyStatus {
  strategy: string;
  total: number;
  with_results: number;
  completion_pct: number;
  result_dates: string[];
  result_date_count: number;
  modes: ModeStatus[];
}

export interface BreakdownItem {
  total: number;
  with_results: number;
  missing_count: number;
  completion_pct: number;
  missing_samples: string[];
}

export interface ExecutionDataStatusResponse {
  config_path: string;
  version: string;
  total_configs: number;
  configs_with_results: number;
  missing_count: number;
  completion_pct: number;
  strategy_count: number;
  strategies: StrategyStatus[];
  breakdown_by_mode: Record<string, BreakdownItem>;
  breakdown_by_timeframe: Record<string, BreakdownItem>;
  breakdown_by_algo: Record<string, BreakdownItem>;
  date_filter?: {
    start: string | null;
    end: string | null;
  };
  error?: string;
}

export type ViewMode = "hierarchy" | "by_mode" | "by_timeframe" | "by_algo";

export type ExecutionDataStatusProviderProps = ExecutionDataStatusProps & {
  children: ReactNode;
};

export interface ExecutionDataStatusContextValue {
  serviceName: string;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  cloudConfigPath: string | null;
  data: ExecutionDataStatusResponse | null;
  loading: boolean;
  error: string | null;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  expandedStrategies: Set<string>;
  expandedModes: Set<string>;
  expandedTimeframes: Set<string>;
  expandedBreakdowns: Set<string>;
  expandedConfigs: Set<string>;
  showDeployModal: boolean;
  missingShardsData: ExecutionMissingShardsResponse | null;
  loadingMissingShards: boolean;
  deployingMissing: boolean;
  deployRegion: string;
  setDeployRegion: (v: string) => void;
  backendRegion: string;
  showDeployRegionWarning: boolean;
  handleCloudConfigSelected: (path: string, configCount: number) => void;
  fetchData: () => Promise<void>;
  fetchMissingShards: () => Promise<void>;
  handleDeployMissing: () => Promise<void>;
  toggleStrategy: (key: string) => void;
  toggleMode: (key: string) => void;
  toggleTimeframe: (key: string) => void;
  toggleBreakdown: (key: string) => void;
  toggleConfig: (key: string) => void;
  closeDeployModal: () => void;
}
