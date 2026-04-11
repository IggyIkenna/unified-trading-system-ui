export type RefreshInterval = "manual" | "100ms" | "500ms" | "1s";

export interface QuoteRow {
  id: string;
  symbol: string;
  venue: string;
  bidPrice: string;
  bidSize: string;
  askPrice: string;
  askSize: string;
  skewBps: number;
  active: boolean;
}

export interface QuoteStatus {
  quotesOutstanding: number;
  fillRate: number;
  pnlFromSpread: number;
  inventory: Record<string, number>;
}

export interface ComplianceCheckResult {
  name: string;
  passed: boolean;
  limit_value: number | string;
  current_value: number | string;
  proposed_value: number | string;
}

export interface PreTradeCheckResponse {
  passed: boolean;
  checks: ComplianceCheckResult[];
}

export interface ManualTradingPanelProps {
  defaultInstrument?: string;
  defaultVenue?: string;
  currentPrice?: number;
  instruments?: Array<{ symbol: string; venue: string }>;
  strategies?: Array<{ id: string; name: string }>;
}

export type OrderState = "idle" | "preview" | "submitting" | "success" | "error";
