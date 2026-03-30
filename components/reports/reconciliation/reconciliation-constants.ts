export { FALLBACK_HISTORY } from "@/lib/mocks/fixtures/reconciliation";

export const DRIFT_METRICS = [
  {
    label: "Net Position (BTC)",
    liveValue: 4.2045,
    batchValue: 4.162,
    unit: "BTC",
    threshold: 2,
  },
  {
    label: "Unrealized PnL",
    liveValue: 41731.92,
    batchValue: 40930.12,
    threshold: 3,
  },
  { label: "Total Fees", liveValue: 86.25, batchValue: 81.4, threshold: 5 },
  { label: "Order Count", liveValue: 1247, batchValue: 1243, threshold: 1 },
  { label: "Fill Count", liveValue: 1189, batchValue: 1182, threshold: 1 },
];

export const UNRECONCILED_ITEMS = [
  {
    id: "UNR-001",
    type: "position" as const,
    description: "BTC-PERP position mismatch on Binance",
    timestamp: "2026-03-22T14:32:00Z",
    amount: 0.0045,
    venue: "Binance",
  },
  {
    id: "UNR-002",
    type: "fill" as const,
    description: "Missing fill for ETH-USDT limit order",
    timestamp: "2026-03-22T13:18:00Z",
    amount: 321.8,
    venue: "Deribit",
  },
  {
    id: "UNR-003",
    type: "transfer" as const,
    description: "Funding rate credit not reflected in batch",
    timestamp: "2026-03-22T12:00:00Z",
    amount: 12.45,
    venue: "OKX",
  },
  {
    id: "UNR-004",
    type: "fill" as const,
    description: "Partial fill quantity discrepancy SOL-PERP",
    timestamp: "2026-03-22T11:45:00Z",
    amount: 40.3,
    venue: "Bybit",
  },
  {
    id: "UNR-005",
    type: "position" as const,
    description: "AVAX-USDT position stale in batch snapshot",
    timestamp: "2026-03-22T10:22:00Z",
    amount: 0.012,
    venue: "Bybit",
  },
  {
    id: "UNR-006",
    type: "transfer" as const,
    description: "Withdrawal fee double-counted",
    timestamp: "2026-03-21T23:55:00Z",
    amount: 0.52,
    venue: "Hyperliquid",
  },
  {
    id: "UNR-007",
    type: "fill" as const,
    description: "Maker rebate missing for BTC-PERP batch",
    timestamp: "2026-03-21T22:10:00Z",
    amount: 2.4,
    venue: "Binance",
  },
];

export const VENUES = [
  "All",
  "Binance",
  "Deribit",
  "OKX",
  "Bybit",
  "Hyperliquid",
  "AAVEV3-ETHEREUM",
  "UNISWAPV3-ETHEREUM",
  "ETHENA-ETHEREUM",
];
export const BREAK_TYPES: Array<{ value: string; label: string }> = [
  { value: "all", label: "All Types" },
  { value: "position", label: "Position" },
  { value: "pnl", label: "PnL" },
  { value: "fee", label: "Fee" },
  { value: "balance", label: "Balance" },
  { value: "gas", label: "Gas" },
];
export const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "investigating", label: "Investigating" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
  { value: "accepted", label: "Accepted" },
];
