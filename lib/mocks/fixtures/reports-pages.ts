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
    status: "sent",
    date: "2026-03-28",
    client: "Trading Desk Alpha",
    clientId: "trading-desk-alpha",
    format: "PDF",
    generated: "Mar 28, 08:15",
  },
  {
    id: "RPT-002",
    name: "Risk Exposure Report",
    type: "risk",
    status: "sent",
    date: "2026-03-28",
    client: "All Clients",
    clientId: "",
    format: "PDF",
    generated: "Mar 28, 08:30",
  },
  {
    id: "RPT-003",
    name: "Execution Quality Report",
    type: "execution",
    status: "ready",
    date: "2026-03-28",
    client: "Trading Desk Beta",
    clientId: "trading-desk-beta",
    format: "XLSX",
    generated: "Mar 28, 09:00",
  },
  {
    id: "RPT-004",
    name: "Monthly NAV Statement",
    type: "nav",
    status: "sent",
    date: "2026-03-01",
    client: "Apex Capital",
    clientId: "apex-global-macro",
    format: "PDF",
    generated: "Mar 1, 06:00",
  },
  {
    id: "RPT-005",
    name: "Position Reconciliation",
    type: "recon",
    status: "generating",
    date: "2026-03-28",
    client: "All Clients",
    clientId: "",
    format: "PDF",
  },
  {
    id: "RPT-006",
    name: "Fee Schedule Summary",
    type: "fees",
    status: "sent",
    date: "2026-03-28",
    client: "Zenith Partners",
    clientId: "zenith-core",
    format: "XLSX",
    generated: "Mar 28, 07:00",
  },
  {
    id: "RPT-007",
    name: "Investor Letter — Q1 2026",
    type: "letter",
    status: "ready",
    date: "2026-03-31",
    client: "All Clients",
    clientId: "",
    format: "PDF",
    generated: "Mar 30, 14:00",
  },
  {
    id: "RPT-008",
    name: "Regulatory Capital Adequacy",
    type: "regulatory",
    status: "ready",
    date: "2026-03-28",
    client: "Compliance",
    clientId: "",
    format: "PDF",
    generated: "Mar 28, 06:00",
  },
];
export const SEED_SETTLEMENTS = [
  {
    id: "STL-001",
    instrument: "BTC-USDT",
    venue: "BINANCE-SPOT",
    type: "spot_settlement",
    quantity: 2.5,
    amount: 168125,
    value: 168125,
    status: "settled",
    date: "2026-03-28",
    settledAt: "2026-03-28T14:30:00Z",
    client: "Trading Desk Alpha",
    clientId: "trading-desk-alpha",
    counterparty: "BINANCE-SPOT",
  },
  {
    id: "STL-002",
    instrument: "ETH-PERP",
    venue: "HYPERLIQUID",
    type: "perp_settlement",
    quantity: 15,
    amount: 51300,
    value: 51300,
    status: "settled",
    date: "2026-03-28",
    settledAt: "2026-03-28T12:15:00Z",
    client: "Trading Desk Beta",
    clientId: "trading-desk-beta",
    counterparty: "HYPERLIQUID",
  },
  {
    id: "STL-003",
    instrument: "SOL-USDT",
    venue: "BINANCE-SPOT",
    type: "spot_settlement",
    quantity: 120,
    amount: 17400,
    value: 17400,
    status: "pending",
    date: "2026-03-28",
    dueDate: "2026-03-29",
    client: "DeFi Ops",
    clientId: "defi-ops",
    counterparty: "BINANCE-SPOT",
  },
  {
    id: "STL-004",
    instrument: "BTC-28MAR-68000-C",
    venue: "DERIBIT",
    type: "options_expiry",
    quantity: 5,
    amount: 9250,
    value: 9250,
    status: "confirmed",
    date: "2026-03-27",
    settledAt: "2026-03-27T16:00:00Z",
    client: "Global Macro Fund",
    clientId: "apex-global-macro",
    counterparty: "DERIBIT",
  },
  {
    id: "STL-005",
    instrument: "WETH",
    venue: "AAVEV3-ETHEREUM",
    type: "defi_withdrawal",
    quantity: 10,
    amount: 34200,
    value: 34200,
    status: "pending",
    date: "2026-03-28",
    dueDate: "2026-03-29",
    client: "DeFi Ops",
    clientId: "defi-ops",
    counterparty: "AAVEV3-ETHEREUM",
  },
];
export const SEED_PORTFOLIO = [
  { name: "Trading Desk Alpha", client: "Trading Desk Alpha", clientId: "trading-desk-alpha", aum: 13300000, pnl: 245000, pnlPct: 1.84, mtdReturn: 1.84, ytdReturn: 8.42, sharpe: 2.14, positions: 12 },
  { name: "Trading Desk Beta", client: "Trading Desk Beta", clientId: "trading-desk-beta", aum: 9600000, pnl: 178000, pnlPct: 1.85, mtdReturn: 1.85, ytdReturn: 7.21, sharpe: 1.89, positions: 8 },
  { name: "DeFi Ops", client: "DeFi Ops", clientId: "defi-ops", aum: 6000000, pnl: 92000, pnlPct: 1.53, mtdReturn: 1.53, ytdReturn: 12.8, sharpe: 2.45, positions: 6 },
  { name: "Global Macro Fund", client: "Global Macro Fund", clientId: "apex-global-macro", aum: 20500000, pnl: 312000, pnlPct: 1.52, mtdReturn: 1.52, ytdReturn: 6.89, sharpe: 1.67, positions: 5 },
  { name: "Core Strategy", client: "Core Strategy", clientId: "zenith-core", aum: 12300000, pnl: -48000, pnlPct: -0.39, mtdReturn: -0.39, ytdReturn: 3.12, sharpe: 0.95, positions: 4 },
];
export const SEED_BALANCES = [
  { venue: "BINANCE-SPOT", currency: "USDT", free: 2_450_000, locked: 820_000, total: 3_270_000 },
  { venue: "HYPERLIQUID", currency: "USDC", free: 1_800_000, locked: 450_000, total: 2_250_000 },
  { venue: "DERIBIT", currency: "BTC", free: 12.5, locked: 5.2, total: 17.7 },
  { venue: "AAVEV3-ETHEREUM", currency: "WETH", free: 45, locked: 0, total: 45 },
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
    from: "BINANCE-SPOT",
    to: "HYPERLIQUID",
    amount: "$500,000",
    status: "confirmed",
    confirmations: "12/12",
  },
  { time: "2026-03-28T10:15:00Z", from: "DERIBIT", to: "BINANCE-SPOT", amount: "2.5 BTC", status: "settled" },
  {
    time: "2026-03-27T18:42:00Z",
    from: "UNISWAPV3-ETHEREUM",
    to: "AAVEV3-ETHEREUM",
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
    venue: "BINANCE-SPOT",
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
    venue: "DERIBIT",
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
    venue: "OKX-SPOT",
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
    venue: "BYBIT",
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
    venue: "BINANCE-SPOT",
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
    venue: "HYPERLIQUID",
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
    venue: "DERIBIT",
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
    venue: "OKX-SPOT",
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
    venue: "BINANCE-SPOT",
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
    venue: "BYBIT",
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
    venue: "HYPERLIQUID",
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
    venue: "DERIBIT",
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
    venue: "OKX-SPOT",
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
    venue: "BINANCE-SPOT",
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
    venue: "BYBIT",
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
