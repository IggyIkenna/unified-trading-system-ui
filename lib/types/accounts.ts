/** Per-venue balance row from `/api/positions/balances` (and mock). */
export interface BalanceRecord {
  venue: string;
  free: number;
  locked: number;
  total: number;
  margin_used?: number;
  margin_available?: number;
  margin_total?: number;
}

export interface TransferHistoryEntry {
  timestamp: string;
  type: string;
  from: string;
  to: string;
  asset: string;
  amount: number;
  status: "Completed" | "Pending" | "Processing";
  txHash: string;
}
