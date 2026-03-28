export interface QuantDashboardProps {
  currentPage: string;
}

export interface BacktestRun {
  id: string;
  name: string;
  strategy: string;
  status: "completed" | "running" | "queued" | "failed" | "promoted";
  period: string;
  trades: number;
  winRate: number;
  pnl: number;
  sharpe: number;
  maxDrawdown: number;
  completedAt?: string;
  progress?: number;
  error?: string;
  promotedAt?: string;
  liveAllocation?: number;
}

export type MlTrainingJobStatus = "completed" | "running" | "queued";

export interface MlTrainingJob {
  id: string;
  name: string;
  model: string;
  status: MlTrainingJobStatus;
  accuracy: number;
  loss: number;
  epochs: number;
  duration: string;
  completedAt?: string;
  progress?: number;
}

export type ConfigParameter =
  | {
      name: string;
      type: "int" | "float";
      min: number;
      max: number;
      default: number;
      current: number;
      description: string;
    }
  | {
      name: string;
      type: "bool";
      default: boolean;
      current: boolean;
      description: string;
    }
  | {
      name: string;
      type: "string";
      options: string[];
      default: string;
      current: string;
      description: string;
    };

export interface QuantFeatureRow {
  name: string;
  category: string;
  freshness: string;
  coverage: string;
  status: "live" | "degraded";
}

export interface ExecutionAlphaRow {
  strategy: string;
  trades: number;
  signal: string;
  executed: string;
  slippage: string;
  alpha: string;
}
