export interface PnLComponent {
  name: string;
  value: number;
  percentage: number;
  isNegative?: boolean;
  category?: "structural" | "factor" | "diagnostic";
}

export interface ClientPnLRow {
  id: string;
  name: string;
  org: string;
  pnl: number;
  strategies: number;
  change: number;
}

export interface FactorDrilldown {
  factor: PnLComponent;
  breakdown: Array<{ id: string; name: string; client: string; value: number; percentage: number }>;
  timeSeries: Array<Record<string, string | number>>;
  strategyNames: string[];
}

export interface StrategyRecord {
  id: string;
  name: string;
  clientId: string;
}

export interface ClientRecord {
  id: string;
  name: string;
  orgId: string;
}

export interface OrgRecord {
  id: string;
  name: string;
}
