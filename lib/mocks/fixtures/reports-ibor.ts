/** Reports — IBOR positions, journal, breaks, snapshots. */

export interface Position {
  id: string;
  instrument: string;
  venue: string;
  quantity: number;
  costBasis: number;
  marketValue: number;
  unrealisedPnl: number;
  source: "Exchange" | "OTC" | "Manual" | "DeFi";
  lastUpdated: string;
  auditTrail: AuditEntry[];
}

export interface AuditEntry {
  timestamp: string;
  action: string;
  detail: string;
}

export interface JournalEntry {
  id: string;
  timestamp: string;
  entryType: "Trade" | "Transfer" | "Corporate Action" | "Adjustment";
  description: string;
  quantity: number;
  value: number;
  counterparty: string;
}

export interface PositionBreak {
  id: string;
  instrument: string;
  ourQty: number;
  venueQty: number;
  difference: number;
  status: "Open" | "Investigating" | "Resolved";
  age: string;
}

export interface Snapshot {
  date: string;
  totalPositions: number;
  totalMarketValue: number;
  totalUnrealisedPnl: number;
  breakCount: number;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

export const MOCK_POSITIONS: Position[] = [
  {
    id: "POS-001",
    instrument: "BTC-USDT",
    venue: "BINANCE-SPOT",
    quantity: 2.4521,
    costBasis: 118430.0,
    marketValue: 122600.0,
    unrealisedPnl: 4170.0,
    source: "Exchange",
    lastUpdated: "2026-03-28T14:32:00Z",
    auditTrail: [
      { timestamp: "2026-03-28T14:32:00Z", action: "Mark Updated", detail: "Price refreshed from Binance feed" },
      { timestamp: "2026-03-28T09:15:00Z", action: "Reconciled", detail: "Matched venue position snapshot" },
      { timestamp: "2026-03-27T16:42:00Z", action: "Filled via Binance", detail: "Buy 0.1521 BTC @ $48,250" },
    ],
  },
  {
    id: "POS-002",
    instrument: "ETH-USDT",
    venue: "BINANCE-SPOT",
    quantity: 18.75,
    costBasis: 59062.5,
    marketValue: 61875.0,
    unrealisedPnl: 2812.5,
    source: "Exchange",
    lastUpdated: "2026-03-28T14:30:00Z",
    auditTrail: [
      { timestamp: "2026-03-28T14:30:00Z", action: "Mark Updated", detail: "Price refreshed from Binance feed" },
      { timestamp: "2026-03-28T09:15:00Z", action: "Reconciled", detail: "Matched venue position snapshot" },
      { timestamp: "2026-03-26T11:20:00Z", action: "Filled via Binance", detail: "Buy 5.0 ETH @ $3,150" },
    ],
  },
  {
    id: "POS-003",
    instrument: "SOL-USDT",
    venue: "OKX-SPOT",
    quantity: 340.0,
    costBasis: 47600.0,
    marketValue: 51000.0,
    unrealisedPnl: 3400.0,
    source: "Exchange",
    lastUpdated: "2026-03-28T14:28:00Z",
    auditTrail: [
      { timestamp: "2026-03-28T14:28:00Z", action: "Mark Updated", detail: "Price refreshed from OKX feed" },
      { timestamp: "2026-03-27T22:00:00Z", action: "Reconciled", detail: "Matched venue position snapshot" },
    ],
  },
  {
    id: "POS-004",
    instrument: "BTC-28MAR26-C-52000",
    venue: "DERIBIT",
    quantity: 10.0,
    costBasis: 28500.0,
    marketValue: 34200.0,
    unrealisedPnl: 5700.0,
    source: "Exchange",
    lastUpdated: "2026-03-28T14:25:00Z",
    auditTrail: [
      { timestamp: "2026-03-28T14:25:00Z", action: "Mark Updated", detail: "IV refreshed, delta = 0.62" },
      { timestamp: "2026-03-25T10:30:00Z", action: "Filled via Deribit", detail: "Buy 10 calls @ $2,850" },
      { timestamp: "2026-03-25T10:30:00Z", action: "Margin Posted", detail: "Initial margin $14,250" },
    ],
  },
  {
    id: "POS-005",
    instrument: "AAVE-WETH LP",
    venue: "UNISWAPV3-ETHEREUM",
    quantity: 1.0,
    costBasis: 42000.0,
    marketValue: 43260.0,
    unrealisedPnl: 1260.0,
    source: "DeFi",
    lastUpdated: "2026-03-28T14:20:00Z",
    auditTrail: [
      { timestamp: "2026-03-28T14:20:00Z", action: "Mark Updated", detail: "LP value recalculated from pool reserves" },
      { timestamp: "2026-03-24T08:45:00Z", action: "Minted LP Position", detail: "Range: 2800-3600 WETH" },
    ],
  },
  {
    id: "POS-006",
    instrument: "ETH-PERP",
    venue: "HYPERLIQUID",
    quantity: -15.0,
    costBasis: -49500.0,
    marketValue: -49875.0,
    unrealisedPnl: -375.0,
    source: "Exchange",
    lastUpdated: "2026-03-28T14:31:00Z",
    auditTrail: [
      { timestamp: "2026-03-28T14:31:00Z", action: "Mark Updated", detail: "Funding rate applied: -0.0012%" },
      { timestamp: "2026-03-28T02:10:00Z", action: "Filled via Hyperliquid", detail: "Sell 5.0 ETH-PERP @ $3,320" },
    ],
  },
  {
    id: "POS-007",
    instrument: "AVAX-USDT",
    venue: "BYBIT",
    quantity: 850.0,
    costBasis: 29750.0,
    marketValue: 30600.0,
    unrealisedPnl: 850.0,
    source: "Exchange",
    lastUpdated: "2026-03-28T14:29:00Z",
    auditTrail: [
      { timestamp: "2026-03-28T14:29:00Z", action: "Mark Updated", detail: "Price refreshed from Bybit feed" },
      { timestamp: "2026-03-28T09:15:00Z", action: "Reconciled", detail: "Matched venue position snapshot" },
    ],
  },
  {
    id: "POS-008",
    instrument: "wstETH Collateral",
    venue: "AAVEV3-ETHEREUM",
    quantity: 12.5,
    costBasis: 41250.0,
    marketValue: 42500.0,
    unrealisedPnl: 1250.0,
    source: "DeFi",
    lastUpdated: "2026-03-28T14:18:00Z",
    auditTrail: [
      { timestamp: "2026-03-28T14:18:00Z", action: "Mark Updated", detail: "Health factor: 1.82" },
      { timestamp: "2026-03-22T15:00:00Z", action: "Supplied to Aave", detail: "12.5 wstETH as collateral" },
      { timestamp: "2026-03-22T15:00:00Z", action: "Borrow Initiated", detail: "18,000 USDC @ 4.2% APR" },
    ],
  },
  {
    id: "POS-009",
    instrument: "LINK-USDT",
    venue: "BINANCE-SPOT",
    quantity: 2400.0,
    costBasis: 36000.0,
    marketValue: 38400.0,
    unrealisedPnl: 2400.0,
    source: "Exchange",
    lastUpdated: "2026-03-28T14:27:00Z",
    auditTrail: [
      { timestamp: "2026-03-28T14:27:00Z", action: "Mark Updated", detail: "Price refreshed" },
      { timestamp: "2026-03-26T13:55:00Z", action: "Filled via Binance", detail: "Buy 1200 LINK @ $15.00" },
    ],
  },
  {
    id: "POS-010",
    instrument: "ARB-USDT",
    venue: "OKX-SPOT",
    quantity: 15000.0,
    costBasis: 16500.0,
    marketValue: 18000.0,
    unrealisedPnl: 1500.0,
    source: "Exchange",
    lastUpdated: "2026-03-28T14:26:00Z",
    auditTrail: [
      { timestamp: "2026-03-28T14:26:00Z", action: "Mark Updated", detail: "Price refreshed from OKX feed" },
    ],
  },
  {
    id: "POS-011",
    instrument: "BTC-PERP",
    venue: "DERIBIT",
    quantity: 1.5,
    costBasis: 72750.0,
    marketValue: 74250.0,
    unrealisedPnl: 1500.0,
    source: "Exchange",
    lastUpdated: "2026-03-28T14:24:00Z",
    auditTrail: [
      { timestamp: "2026-03-28T14:24:00Z", action: "Mark Updated", detail: "Funding rate applied" },
      { timestamp: "2026-03-27T09:30:00Z", action: "Filled via Deribit", detail: "Buy 0.5 BTC-PERP @ $48,500" },
      { timestamp: "2026-03-25T14:15:00Z", action: "Reconciled", detail: "Matched venue margin snapshot" },
    ],
  },
  {
    id: "POS-012",
    instrument: "OP-USDT",
    venue: "BYBIT",
    quantity: 8000.0,
    costBasis: 17600.0,
    marketValue: 18400.0,
    unrealisedPnl: 800.0,
    source: "Exchange",
    lastUpdated: "2026-03-28T14:23:00Z",
    auditTrail: [{ timestamp: "2026-03-28T14:23:00Z", action: "Mark Updated", detail: "Price refreshed" }],
  },
  {
    id: "POS-013",
    instrument: "USDC Lending",
    venue: "AAVEV3-ETHEREUM",
    quantity: 50000.0,
    costBasis: 50000.0,
    marketValue: 50210.0,
    unrealisedPnl: 210.0,
    source: "DeFi",
    lastUpdated: "2026-03-28T14:19:00Z",
    auditTrail: [
      { timestamp: "2026-03-28T14:19:00Z", action: "Yield Accrued", detail: "APY 3.8%, +$42.00 today" },
      { timestamp: "2026-03-20T10:00:00Z", action: "Supplied to Aave", detail: "50,000 USDC lending position" },
    ],
  },
  {
    id: "POS-014",
    instrument: "DOGE-USDT",
    venue: "BINANCE-SPOT",
    quantity: 120000.0,
    costBasis: 19200.0,
    marketValue: 20400.0,
    unrealisedPnl: 1200.0,
    source: "Exchange",
    lastUpdated: "2026-03-28T14:22:00Z",
    auditTrail: [{ timestamp: "2026-03-28T14:22:00Z", action: "Mark Updated", detail: "Price refreshed" }],
  },
  {
    id: "POS-015",
    instrument: "ETH-28MAR26-P-2800",
    venue: "DERIBIT",
    quantity: -5.0,
    costBasis: -4250.0,
    marketValue: -2100.0,
    unrealisedPnl: 2150.0,
    source: "OTC",
    lastUpdated: "2026-03-28T14:21:00Z",
    auditTrail: [
      { timestamp: "2026-03-28T14:21:00Z", action: "Mark Updated", detail: "IV dropped, put decaying" },
      { timestamp: "2026-03-24T16:30:00Z", action: "Booked via OTC Desk", detail: "Sold 5 puts @ $850 premium" },
      { timestamp: "2026-03-24T16:30:00Z", action: "Reconciled", detail: "Confirmed with counterparty" },
      { timestamp: "2026-03-24T16:32:00Z", action: "Margin Calculated", detail: "Maintenance margin $6,200" },
    ],
  },
];

export const MOCK_JOURNAL: JournalEntry[] = [
  {
    id: "JRN-001",
    timestamp: "2026-03-28T14:32:00Z",
    entryType: "Trade",
    description: "Buy 0.15 BTC-USDT on BINANCE-SPOT",
    quantity: 0.15,
    value: 7237.5,
    counterparty: "BINANCE-SPOT",
  },
  {
    id: "JRN-002",
    timestamp: "2026-03-28T13:45:00Z",
    entryType: "Transfer",
    description: "USDC transfer from AAVEV3-ETHEREUM to BINANCE-SPOT",
    quantity: 25000,
    value: 25000,
    counterparty: "Internal",
  },
  {
    id: "JRN-003",
    timestamp: "2026-03-28T12:10:00Z",
    entryType: "Trade",
    description: "Sell 5.0 ETH-PERP on HYPERLIQUID",
    quantity: -5.0,
    value: -16600.0,
    counterparty: "HYPERLIQUID",
  },
  {
    id: "JRN-004",
    timestamp: "2026-03-28T11:30:00Z",
    entryType: "Adjustment",
    description: "Funding rate settlement ETH-PERP",
    quantity: 0,
    value: -18.42,
    counterparty: "HYPERLIQUID",
  },
  {
    id: "JRN-005",
    timestamp: "2026-03-28T10:00:00Z",
    entryType: "Trade",
    description: "Buy 1200 LINK-USDT on BINANCE-SPOT",
    quantity: 1200,
    value: 18000,
    counterparty: "BINANCE-SPOT",
  },
  {
    id: "JRN-006",
    timestamp: "2026-03-28T09:15:00Z",
    entryType: "Corporate Action",
    description: "ARB token airdrop allocation",
    quantity: 5000,
    value: 6000,
    counterparty: "Arbitrum Foundation",
  },
  {
    id: "JRN-007",
    timestamp: "2026-03-28T08:30:00Z",
    entryType: "Transfer",
    description: "ETH deposit to AAVEV3-ETHEREUM",
    quantity: 2.5,
    value: 8250.0,
    counterparty: "AAVEV3-ETHEREUM",
  },
  {
    id: "JRN-008",
    timestamp: "2026-03-28T07:45:00Z",
    entryType: "Trade",
    description: "Sell 5 ETH-28MAR26-P-2800 OTC",
    quantity: -5,
    value: 4250,
    counterparty: "Genesis OTC",
  },
  {
    id: "JRN-009",
    timestamp: "2026-03-28T06:00:00Z",
    entryType: "Adjustment",
    description: "Yield accrual on USDC lending position",
    quantity: 0,
    value: 42.0,
    counterparty: "AAVEV3-ETHEREUM",
  },
  {
    id: "JRN-010",
    timestamp: "2026-03-28T00:00:00Z",
    entryType: "Corporate Action",
    description: "Staking reward distribution wstETH",
    quantity: 0.003,
    value: 9.9,
    counterparty: "LIDO-ETHEREUM",
  },
];

export const MOCK_BREAKS: PositionBreak[] = [
  {
    id: "BRK-001",
    instrument: "BTC-USDT",
    ourQty: 2.4521,
    venueQty: 2.45,
    difference: 0.0021,
    status: "Open",
    age: "2h 15m",
  },
  {
    id: "BRK-002",
    instrument: "ETH-PERP",
    ourQty: -15.0,
    venueQty: -14.95,
    difference: -0.05,
    status: "Investigating",
    age: "6h 42m",
  },
  {
    id: "BRK-003",
    instrument: "SOL-USDT",
    ourQty: 340.0,
    venueQty: 340.5,
    difference: -0.5,
    status: "Resolved",
    age: "1d 3h",
  },
];

export const MOCK_SNAPSHOTS: Snapshot[] = [
  {
    date: "2026-03-28",
    totalPositions: 247,
    totalMarketValue: 24847321.42,
    totalUnrealisedPnl: 1842560.0,
    breakCount: 3,
  },
  {
    date: "2026-03-27",
    totalPositions: 245,
    totalMarketValue: 24612000.0,
    totalUnrealisedPnl: 1723400.0,
    breakCount: 2,
  },
  {
    date: "2026-03-26",
    totalPositions: 242,
    totalMarketValue: 24380500.0,
    totalUnrealisedPnl: 1654200.0,
    breakCount: 1,
  },
  {
    date: "2026-03-25",
    totalPositions: 240,
    totalMarketValue: 24150000.0,
    totalUnrealisedPnl: 1580000.0,
    breakCount: 4,
  },
  {
    date: "2026-03-24",
    totalPositions: 238,
    totalMarketValue: 23920000.0,
    totalUnrealisedPnl: 1490000.0,
    breakCount: 2,
  },
  {
    date: "2026-03-23",
    totalPositions: 236,
    totalMarketValue: 23710000.0,
    totalUnrealisedPnl: 1420000.0,
    breakCount: 0,
  },
  {
    date: "2026-03-22",
    totalPositions: 234,
    totalMarketValue: 23500000.0,
    totalUnrealisedPnl: 1350000.0,
    breakCount: 1,
  },
];
