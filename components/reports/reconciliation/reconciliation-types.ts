export type BreakType = "position" | "pnl" | "fee";

export type ReconciliationStatus = "resolved" | "pending" | "investigating" | "rejected";

export interface ReconciliationRecord {
  id: string;
  date: string;
  venue: string;
  breakType: BreakType;
  liveValue: number;
  batchValue: number;
  delta: number;
  status: ReconciliationStatus;
}
