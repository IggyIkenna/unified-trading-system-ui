export type BreakType = "position" | "pnl" | "fee" | "balance" | "gas";

export type ReconciliationStatus = "resolved" | "pending" | "investigating" | "rejected" | "accepted";

export type ReconciliationResolution = "system_correct" | "chain_correct" | "adjusted";

export interface ReconciliationRecord {
  id: string;
  date: string;
  venue: string;
  breakType: BreakType;
  liveValue: number;
  batchValue: number;
  delta: number;
  status: ReconciliationStatus;
  resolution?: ReconciliationResolution;
}
