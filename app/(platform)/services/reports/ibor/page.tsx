"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  AlertTriangle,
  Clock,
  FileText,
  ChevronDown,
  ChevronRight,
  Database,
  CheckCircle2,
  Search,
  XCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Position {
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

interface AuditEntry {
  timestamp: string;
  action: string;
  detail: string;
}

interface JournalEntry {
  id: string;
  timestamp: string;
  entryType: "Trade" | "Transfer" | "Corporate Action" | "Adjustment";
  description: string;
  quantity: number;
  value: number;
  counterparty: string;
}

interface PositionBreak {
  id: string;
  instrument: string;
  ourQty: number;
  venueQty: number;
  difference: number;
  status: "Open" | "Investigating" | "Resolved";
  age: string;
}

interface Snapshot {
  date: string;
  totalPositions: number;
  totalMarketValue: number;
  totalUnrealisedPnl: number;
  breakCount: number;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_POSITIONS: Position[] = [
  {
    id: "POS-001",
    instrument: "BTC-USDT",
    venue: "Binance",
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
    venue: "Binance",
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
    venue: "OKX",
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
    venue: "Deribit",
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
    venue: "Uniswap V3",
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
    venue: "Hyperliquid",
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
    venue: "Bybit",
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
    venue: "Aave V3",
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
    venue: "Binance",
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
    venue: "OKX",
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
    venue: "Deribit",
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
    venue: "Bybit",
    quantity: 8000.0,
    costBasis: 17600.0,
    marketValue: 18400.0,
    unrealisedPnl: 800.0,
    source: "Exchange",
    lastUpdated: "2026-03-28T14:23:00Z",
    auditTrail: [
      { timestamp: "2026-03-28T14:23:00Z", action: "Mark Updated", detail: "Price refreshed" },
    ],
  },
  {
    id: "POS-013",
    instrument: "USDC Lending",
    venue: "Aave V3",
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
    venue: "Binance",
    quantity: 120000.0,
    costBasis: 19200.0,
    marketValue: 20400.0,
    unrealisedPnl: 1200.0,
    source: "Exchange",
    lastUpdated: "2026-03-28T14:22:00Z",
    auditTrail: [
      { timestamp: "2026-03-28T14:22:00Z", action: "Mark Updated", detail: "Price refreshed" },
    ],
  },
  {
    id: "POS-015",
    instrument: "ETH-28MAR26-P-2800",
    venue: "Deribit",
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

const MOCK_JOURNAL: JournalEntry[] = [
  { id: "JRN-001", timestamp: "2026-03-28T14:32:00Z", entryType: "Trade", description: "Buy 0.15 BTC-USDT on Binance", quantity: 0.15, value: 7237.5, counterparty: "Binance" },
  { id: "JRN-002", timestamp: "2026-03-28T13:45:00Z", entryType: "Transfer", description: "USDC transfer from Aave to Binance", quantity: 25000, value: 25000, counterparty: "Internal" },
  { id: "JRN-003", timestamp: "2026-03-28T12:10:00Z", entryType: "Trade", description: "Sell 5.0 ETH-PERP on Hyperliquid", quantity: -5.0, value: -16600.0, counterparty: "Hyperliquid" },
  { id: "JRN-004", timestamp: "2026-03-28T11:30:00Z", entryType: "Adjustment", description: "Funding rate settlement ETH-PERP", quantity: 0, value: -18.42, counterparty: "Hyperliquid" },
  { id: "JRN-005", timestamp: "2026-03-28T10:00:00Z", entryType: "Trade", description: "Buy 1200 LINK-USDT on Binance", quantity: 1200, value: 18000, counterparty: "Binance" },
  { id: "JRN-006", timestamp: "2026-03-28T09:15:00Z", entryType: "Corporate Action", description: "ARB token airdrop allocation", quantity: 5000, value: 6000, counterparty: "Arbitrum Foundation" },
  { id: "JRN-007", timestamp: "2026-03-28T08:30:00Z", entryType: "Transfer", description: "ETH deposit to Aave V3", quantity: 2.5, value: 8250.0, counterparty: "Aave V3" },
  { id: "JRN-008", timestamp: "2026-03-28T07:45:00Z", entryType: "Trade", description: "Sell 5 ETH-28MAR26-P-2800 OTC", quantity: -5, value: 4250, counterparty: "Genesis OTC" },
  { id: "JRN-009", timestamp: "2026-03-28T06:00:00Z", entryType: "Adjustment", description: "Yield accrual on USDC lending position", quantity: 0, value: 42.0, counterparty: "Aave V3" },
  { id: "JRN-010", timestamp: "2026-03-28T00:00:00Z", entryType: "Corporate Action", description: "Staking reward distribution wstETH", quantity: 0.003, value: 9.9, counterparty: "Lido" },
];

const MOCK_BREAKS: PositionBreak[] = [
  { id: "BRK-001", instrument: "BTC-USDT", ourQty: 2.4521, venueQty: 2.4500, difference: 0.0021, status: "Open", age: "2h 15m" },
  { id: "BRK-002", instrument: "ETH-PERP", ourQty: -15.0, venueQty: -14.95, difference: -0.05, status: "Investigating", age: "6h 42m" },
  { id: "BRK-003", instrument: "SOL-USDT", ourQty: 340.0, venueQty: 340.5, difference: -0.5, status: "Resolved", age: "1d 3h" },
];

const MOCK_SNAPSHOTS: Snapshot[] = [
  { date: "2026-03-28", totalPositions: 247, totalMarketValue: 24847321.42, totalUnrealisedPnl: 1842560.0, breakCount: 3 },
  { date: "2026-03-27", totalPositions: 245, totalMarketValue: 24612000.0, totalUnrealisedPnl: 1723400.0, breakCount: 2 },
  { date: "2026-03-26", totalPositions: 242, totalMarketValue: 24380500.0, totalUnrealisedPnl: 1654200.0, breakCount: 1 },
  { date: "2026-03-25", totalPositions: 240, totalMarketValue: 24150000.0, totalUnrealisedPnl: 1580000.0, breakCount: 4 },
  { date: "2026-03-24", totalPositions: 238, totalMarketValue: 23920000.0, totalUnrealisedPnl: 1490000.0, breakCount: 2 },
  { date: "2026-03-23", totalPositions: 236, totalMarketValue: 23710000.0, totalUnrealisedPnl: 1420000.0, breakCount: 0 },
  { date: "2026-03-22", totalPositions: 234, totalMarketValue: 23500000.0, totalUnrealisedPnl: 1350000.0, breakCount: 1 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${v.toFixed(2)}`;
}

function formatQuantity(v: number): string {
  if (Math.abs(v) >= 1_000) return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (Math.abs(v) < 1 && v !== 0) return v.toFixed(4);
  return v.toFixed(2);
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sourceBadge(source: Position["source"]) {
  const styles: Record<Position["source"], string> = {
    Exchange: "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-[var(--accent-blue)]/20",
    OTC: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    Manual: "bg-[var(--status-warning)]/10 text-[var(--status-warning)] border-[var(--status-warning)]/20",
    DeFi: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${styles[source]}`}>
      {source}
    </Badge>
  );
}

function entryTypeBadge(type: JournalEntry["entryType"]) {
  const styles: Record<JournalEntry["entryType"], string> = {
    Trade: "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-[var(--accent-blue)]/20",
    Transfer: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "Corporate Action": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Adjustment: "bg-[var(--status-warning)]/10 text-[var(--status-warning)] border-[var(--status-warning)]/20",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${styles[type]}`}>
      {type}
    </Badge>
  );
}

function breakStatusBadge(status: PositionBreak["status"]) {
  const styles: Record<PositionBreak["status"], string> = {
    Open: "bg-[var(--pnl-negative)]/10 text-[var(--pnl-negative)] border-[var(--pnl-negative)]/20",
    Investigating: "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-[var(--accent-blue)]/20",
    Resolved: "bg-[var(--status-live)]/10 text-[var(--status-live)] border-[var(--status-live)]/20",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${styles[status]}`}>
      {status}
    </Badge>
  );
}

function pnlColor(v: number): string {
  if (v > 0) return "text-[var(--pnl-positive)]";
  if (v < 0) return "text-[var(--pnl-negative)]";
  return "text-muted-foreground";
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function IBORPage() {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
  const [snapshotDate, setSnapshotDate] = React.useState("2026-03-28");

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedSnapshot = MOCK_SNAPSHOTS.find((s) => s.date === snapshotDate);

  return (
    <main className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Investment Book of Records</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Last snapshot: {formatTime("2026-03-28T14:32:00Z")}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Database className="size-3.5" />
          Force Snapshot
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold font-mono">247</p>
                <p className="text-xs text-muted-foreground">Total Positions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--pnl-negative)]/10">
                <AlertTriangle className="size-5" style={{ color: "var(--pnl-negative)" }} />
              </div>
              <div>
                <p className="text-2xl font-semibold font-mono">3</p>
                <p className="text-xs text-muted-foreground">Position Breaks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--accent-blue)]/10">
                <FileText className="size-5" style={{ color: "var(--accent-blue)" }} />
              </div>
              <div>
                <p className="text-2xl font-semibold font-mono">42</p>
                <p className="text-xs text-muted-foreground">Journal Entries Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--status-live)]/10">
                <Clock className="size-5" style={{ color: "var(--status-live)" }} />
              </div>
              <div>
                <p className="text-2xl font-semibold font-mono">&lt; 5 min</p>
                <p className="text-xs text-muted-foreground">Snapshot Age</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="positions">
        <TabsList>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="journal">Journal</TabsTrigger>
          <TabsTrigger value="breaks">Breaks</TabsTrigger>
          <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
        </TabsList>

        {/* Positions Tab */}
        <TabsContent value="positions">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Instrument</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Cost Basis</TableHead>
                    <TableHead className="text-right">Market Value</TableHead>
                    <TableHead className="text-right">Unrealised P&L</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_POSITIONS.map((pos) => (
                    <React.Fragment key={pos.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleRow(pos.id)}
                      >
                        <TableCell className="w-8">
                          {expandedRows.has(pos.id) ? (
                            <ChevronDown className="size-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="size-3.5 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm font-medium">{pos.instrument}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{pos.venue}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatQuantity(pos.quantity)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCurrency(pos.costBasis)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCurrency(pos.marketValue)}
                        </TableCell>
                        <TableCell className={`text-right font-mono text-sm ${pnlColor(pos.unrealisedPnl)}`}>
                          {pos.unrealisedPnl > 0 ? "+" : ""}
                          {formatCurrency(pos.unrealisedPnl)}
                        </TableCell>
                        <TableCell>{sourceBadge(pos.source)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatTime(pos.lastUpdated)}
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(pos.id) && (
                        <TableRow>
                          <TableCell colSpan={9} className="bg-muted/20 p-0">
                            <div className="px-8 py-3 space-y-1.5">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Audit Trail</p>
                              {pos.auditTrail.map((entry, i) => (
                                <div key={i} className="flex items-center gap-3 text-xs">
                                  <span className="font-mono text-muted-foreground w-36 shrink-0">
                                    {formatTime(entry.timestamp)}
                                  </span>
                                  <Badge variant="outline" className="text-[10px] shrink-0">
                                    {entry.action}
                                  </Badge>
                                  <span className="text-muted-foreground">{entry.detail}</span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Journal Tab */}
        <TabsContent value="journal">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Trade Journal Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Entry Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>Counterparty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_JOURNAL.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {formatTime(entry.timestamp)}
                      </TableCell>
                      <TableCell>{entryTypeBadge(entry.entryType)}</TableCell>
                      <TableCell className="text-sm">{entry.description}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {entry.quantity !== 0 ? formatQuantity(entry.quantity) : "--"}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-sm ${pnlColor(entry.value)}`}>
                        {entry.value > 0 ? "+" : ""}
                        {formatCurrency(entry.value)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{entry.counterparty}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breaks Tab */}
        <TabsContent value="breaks">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Position Discrepancies</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instrument</TableHead>
                    <TableHead className="text-right">Our Qty</TableHead>
                    <TableHead className="text-right">Venue Qty</TableHead>
                    <TableHead className="text-right">Difference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Age</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_BREAKS.map((brk) => (
                    <TableRow key={brk.id}>
                      <TableCell className="font-mono text-sm font-medium">{brk.instrument}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatQuantity(brk.ourQty)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatQuantity(brk.venueQty)}</TableCell>
                      <TableCell className={`text-right font-mono text-sm ${pnlColor(brk.difference)}`}>
                        {brk.difference > 0 ? "+" : ""}{formatQuantity(brk.difference)}
                      </TableCell>
                      <TableCell>{breakStatusBadge(brk.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{brk.age}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Snapshots Tab */}
        <TabsContent value="snapshots">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Daily Position Snapshots</CardTitle>
                <Input
                  type="date"
                  value={snapshotDate}
                  onChange={(e) => setSnapshotDate(e.target.value)}
                  className="w-[180px] h-8 text-xs"
                />
              </div>
            </CardHeader>
            <CardContent>
              {selectedSnapshot ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground">Positions</p>
                      <p className="text-lg font-semibold font-mono">{selectedSnapshot.totalPositions}</p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground">Market Value</p>
                      <p className="text-lg font-semibold font-mono">{formatCurrency(selectedSnapshot.totalMarketValue)}</p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground">Unrealised P&L</p>
                      <p className={`text-lg font-semibold font-mono ${pnlColor(selectedSnapshot.totalUnrealisedPnl)}`}>
                        +{formatCurrency(selectedSnapshot.totalUnrealisedPnl)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground">Breaks</p>
                      <p className="text-lg font-semibold font-mono">{selectedSnapshot.breakCount}</p>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Positions</TableHead>
                        <TableHead className="text-right">Market Value</TableHead>
                        <TableHead className="text-right">Unrealised P&L</TableHead>
                        <TableHead className="text-right">Breaks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MOCK_SNAPSHOTS.map((snap) => (
                        <TableRow
                          key={snap.date}
                          className={snap.date === snapshotDate ? "bg-muted/50" : ""}
                        >
                          <TableCell className="font-mono text-sm">{snap.date}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{snap.totalPositions}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatCurrency(snap.totalMarketValue)}</TableCell>
                          <TableCell className={`text-right font-mono text-sm ${pnlColor(snap.totalUnrealisedPnl)}`}>
                            +{formatCurrency(snap.totalUnrealisedPnl)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {snap.breakCount > 0 ? (
                              <span className="text-[var(--pnl-negative)]">{snap.breakCount}</span>
                            ) : (
                              <CheckCircle2 className="size-3.5 text-[var(--status-live)] inline" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <Search className="size-6" />
                  <p className="text-sm">No snapshot found for {snapshotDate}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
