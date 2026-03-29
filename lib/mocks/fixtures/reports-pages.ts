/** Reports pages — fund ops, overview seeds, regulatory, settlement. */

export interface InvestorRegister {
  name: string;
  type: "LP" | "GP" | "Seed";
  commitment: number;
  drawn: number;
  remaining: number;
  status: "Active" | "Fully Drawn" | "Suspended";
}

interface CapitalAccount {
  label: string;
  value: number;
}

interface DistributionWaterfallStep {
  tier: string;
  description: string;
  amount: number;
  cumulative: number;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

export const MOCK_INVESTORS_FUND_OPERATIONS: InvestorRegister[] = [
  { name: "Odum Fund I", type: "GP", commitment: 5000000, drawn: 4800000, remaining: 200000, status: "Active" },
  { name: "Odum Fund II", type: "GP", commitment: 4000000, drawn: 3500000, remaining: 500000, status: "Active" },
  { name: "Seed LP", type: "Seed", commitment: 3000000, drawn: 3000000, remaining: 0, status: "Fully Drawn" },
  { name: "Meridian Fund", type: "LP", commitment: 3500000, drawn: 2800000, remaining: 700000, status: "Active" },
  { name: "Apex Capital", type: "LP", commitment: 2500000, drawn: 2200000, remaining: 300000, status: "Active" },
  { name: "Quantum Strategies", type: "LP", commitment: 2000000, drawn: 1500000, remaining: 500000, status: "Active" },
  { name: "Vertex Partners", type: "LP", commitment: 1500000, drawn: 1200000, remaining: 300000, status: "Active" },
  { name: "Nova Investments", type: "LP", commitment: 1200000, drawn: 1000000, remaining: 200000, status: "Suspended" },
];

export type TransferStatus = "confirming" | "settled" | "confirmed" | "pending" | "failed";
export const SEED_REPORTS = [
  {
    id: "RPT-001",
    name: "Daily P&L Summary",
    type: "pnl",
    status: "complete",
    date: "2026-03-28",
    client: "Trading Desk Alpha",
    format: "PDF",
  },
  {
    id: "RPT-002",
    name: "Risk Exposure Report",
    type: "risk",
    status: "complete",
    date: "2026-03-28",
    client: "All Clients",
    format: "PDF",
  },
  {
    id: "RPT-003",
    name: "Execution Quality Report",
    type: "execution",
    status: "complete",
    date: "2026-03-28",
    client: "Trading Desk Beta",
    format: "XLSX",
  },
  {
    id: "RPT-004",
    name: "Monthly NAV Statement",
    type: "nav",
    status: "complete",
    date: "2026-03-01",
    client: "Apex Capital",
    format: "PDF",
  },
  {
    id: "RPT-005",
    name: "Position Reconciliation",
    type: "recon",
    status: "pending",
    date: "2026-03-28",
    client: "All Clients",
    format: "PDF",
  },
  {
    id: "RPT-006",
    name: "Fee Schedule Summary",
    type: "fees",
    status: "complete",
    date: "2026-03-28",
    client: "Zenith Partners",
    format: "XLSX",
  },
];
export const SEED_SETTLEMENTS = [
  {
    id: "STL-001",
    instrument: "BTC-USDT",
    venue: "Binance",
    quantity: 2.5,
    value: 168125,
    status: "settled",
    date: "2026-03-28",
    counterparty: "Binance",
  },
  {
    id: "STL-002",
    instrument: "ETH-PERP",
    venue: "Hyperliquid",
    quantity: 15,
    value: 51300,
    status: "settled",
    date: "2026-03-28",
    counterparty: "Hyperliquid",
  },
  {
    id: "STL-003",
    instrument: "SOL-USDT",
    venue: "Binance",
    quantity: 120,
    value: 17400,
    status: "pending",
    date: "2026-03-28",
    counterparty: "Binance",
  },
  {
    id: "STL-004",
    instrument: "BTC-28MAR-68000-C",
    venue: "Deribit",
    quantity: 5,
    value: 9250,
    status: "settled",
    date: "2026-03-27",
    counterparty: "Deribit",
  },
];
export const SEED_PORTFOLIO = [
  { client: "Trading Desk Alpha", aum: 13300000, pnl: 245000, pnlPct: 1.84, positions: 12 },
  { client: "Trading Desk Beta", aum: 9600000, pnl: 178000, pnlPct: 1.85, positions: 8 },
  { client: "DeFi Ops", aum: 6000000, pnl: 92000, pnlPct: 1.53, positions: 6 },
  { client: "Global Macro Fund", aum: 20500000, pnl: 312000, pnlPct: 1.52, positions: 5 },
  { client: "Core Strategy", aum: 12300000, pnl: -48000, pnlPct: -0.39, positions: 4 },
];
export const SEED_BALANCES = [
  { venue: "Binance", currency: "USDT", free: 2_450_000, locked: 820_000, total: 3_270_000 },
  { venue: "Hyperliquid", currency: "USDC", free: 1_800_000, locked: 450_000, total: 2_250_000 },
  { venue: "Deribit", currency: "BTC", free: 12.5, locked: 5.2, total: 17.7 },
  { venue: "Aave V3", currency: "WETH", free: 45, locked: 0, total: 45 },
];
export const SEED_TRANSFERS: Array<{
  time: string;
  from: string;
  to: string;
  amount: string;
  status: TransferStatus;
  confirmations?: string;
  txHash?: string;
}> = [
  {
    time: "2026-03-28T13:22:00Z",
    from: "Binance",
    to: "Hyperliquid",
    amount: "$500,000",
    status: "confirmed",
    confirmations: "12/12",
  },
  { time: "2026-03-28T10:15:00Z", from: "Deribit", to: "Binance", amount: "2.5 BTC", status: "settled" },
  {
    time: "2026-03-27T18:42:00Z",
    from: "Uniswap",
    to: "Aave V3",
    amount: "10 WETH",
    status: "confirmed",
    confirmations: "35/35",
  },
];

export type SettlementStatus = "pending" | "matched" | "disputed" | "settled";
export type Side = "buy" | "sell";

export interface Settlement {
  id: string;
  date: string;
  venue: string;
  instrument: string;
  side: Side;
  expectedAmount: number;
  settledAmount: number;
  status: SettlementStatus;
  settlementDate: string;
}

export interface Invoice {
  id: string;
  client: string;
  amount: number;
  status: "paid" | "unpaid";
  date: string;
}

export const MOCK_SETTLEMENTS: Settlement[] = [
  {
    id: "STL-a3f8e1",
    date: "2026-03-22",
    venue: "Binance",
    instrument: "BTC-USDT",
    side: "buy",
    expectedAmount: 48250.0,
    settledAmount: 48250.0,
    status: "matched",
    settlementDate: "2026-03-22",
  },
  {
    id: "STL-b7c2d4",
    date: "2026-03-22",
    venue: "Deribit",
    instrument: "ETH-PERP",
    side: "sell",
    expectedAmount: 3180.5,
    settledAmount: 3180.5,
    status: "matched",
    settlementDate: "2026-03-22",
  },
  {
    id: "STL-c9e0f2",
    date: "2026-03-21",
    venue: "OKX",
    instrument: "SOL-USDT",
    side: "buy",
    expectedAmount: 142.3,
    settledAmount: 0,
    status: "pending",
    settlementDate: "",
  },
  {
    id: "STL-d1a3b5",
    date: "2026-03-21",
    venue: "Bybit",
    instrument: "BTC-USDT",
    side: "sell",
    expectedAmount: 47980.0,
    settledAmount: 47965.2,
    status: "disputed",
    settlementDate: "2026-03-21",
  },
  {
    id: "STL-e4f6c8",
    date: "2026-03-21",
    venue: "Binance",
    instrument: "ETH-USDT",
    side: "buy",
    expectedAmount: 3195.75,
    settledAmount: 3195.75,
    status: "settled",
    settlementDate: "2026-03-21",
  },
  {
    id: "STL-f2d8a0",
    date: "2026-03-20",
    venue: "Hyperliquid",
    instrument: "ARB-USDT",
    side: "buy",
    expectedAmount: 1.82,
    settledAmount: 1.82,
    status: "matched",
    settlementDate: "2026-03-20",
  },
  {
    id: "STL-g5b1e3",
    date: "2026-03-20",
    venue: "Deribit",
    instrument: "BTC-28MAR26-C",
    side: "sell",
    expectedAmount: 2450.0,
    settledAmount: 0,
    status: "pending",
    settlementDate: "",
  },
  {
    id: "STL-h8c4f6",
    date: "2026-03-20",
    venue: "OKX",
    instrument: "DOGE-USDT",
    side: "buy",
    expectedAmount: 0.168,
    settledAmount: 0.168,
    status: "settled",
    settlementDate: "2026-03-20",
  },
  {
    id: "STL-i0d7a9",
    date: "2026-03-19",
    venue: "Binance",
    instrument: "AVAX-USDT",
    side: "sell",
    expectedAmount: 38.42,
    settledAmount: 38.1,
    status: "disputed",
    settlementDate: "2026-03-19",
  },
  {
    id: "STL-j3e9b1",
    date: "2026-03-19",
    venue: "Bybit",
    instrument: "ETH-USDT",
    side: "buy",
    expectedAmount: 3210.0,
    settledAmount: 3210.0,
    status: "matched",
    settlementDate: "2026-03-19",
  },
  {
    id: "STL-k6f2c4",
    date: "2026-03-19",
    venue: "Hyperliquid",
    instrument: "OP-USDT",
    side: "sell",
    expectedAmount: 2.14,
    settledAmount: 2.14,
    status: "settled",
    settlementDate: "2026-03-19",
  },
  {
    id: "STL-l9a4d7",
    date: "2026-03-18",
    venue: "Deribit",
    instrument: "ETH-PERP",
    side: "buy",
    expectedAmount: 3150.25,
    settledAmount: 0,
    status: "pending",
    settlementDate: "",
  },
  {
    id: "STL-m2b6e0",
    date: "2026-03-18",
    venue: "OKX",
    instrument: "BTC-USDT",
    side: "sell",
    expectedAmount: 47500.0,
    settledAmount: 47500.0,
    status: "matched",
    settlementDate: "2026-03-18",
  },
  {
    id: "STL-n5c8f3",
    date: "2026-03-17",
    venue: "Binance",
    instrument: "LINK-USDT",
    side: "buy",
    expectedAmount: 14.85,
    settledAmount: 14.85,
    status: "settled",
    settlementDate: "2026-03-17",
  },
  {
    id: "STL-o8d1a6",
    date: "2026-03-17",
    venue: "Bybit",
    instrument: "SOL-USDT",
    side: "sell",
    expectedAmount: 138.9,
    settledAmount: 138.5,
    status: "disputed",
    settlementDate: "2026-03-17",
  },
];

export const MOCK_INVOICES: Invoice[] = [
  {
    id: "INV-2026-0087",
    client: "Alpha Capital",
    amount: 12500,
    status: "paid",
    date: "2026-03-15",
  },
  {
    id: "INV-2026-0088",
    client: "Meridian Fund",
    amount: 8750,
    status: "unpaid",
    date: "2026-03-18",
  },
  {
    id: "INV-2026-0089",
    client: "Apex Trading Co",
    amount: 21000,
    status: "paid",
    date: "2026-03-10",
  },
  {
    id: "INV-2026-0090",
    client: "Quantum Strategies",
    amount: 15300,
    status: "unpaid",
    date: "2026-03-20",
  },
  {
    id: "INV-2026-0091",
    client: "Vertex Partners",
    amount: 9800,
    status: "paid",
    date: "2026-03-12",
  },
];
