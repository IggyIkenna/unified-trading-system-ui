"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { CheckCircle2, Clock, AlertTriangle, Receipt, RefreshCw, FileText, ArrowDownCircle } from "lucide-react";
import { useSettlements } from "@/hooks/api/use-reports";
import { ExportDropdown } from "@/components/ui/export-dropdown";

type SettlementStatus = "pending" | "matched" | "disputed" | "settled";
type Side = "buy" | "sell";

interface Settlement {
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

interface Invoice {
  id: string;
  client: string;
  amount: number;
  status: "paid" | "unpaid";
  date: string;
}

const MOCK_SETTLEMENTS: Settlement[] = [
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

const MOCK_INVOICES: Invoice[] = [
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

function formatVenue(venue: string): string {
  if (!venue) return "—";
  return venue.charAt(0).toUpperCase() + venue.slice(1).toLowerCase();
}

/** Map `/api/reporting/settlements` rows (amount, settledAt, …) into table `Settlement` rows. */
function normalizeSettlementRow(row: unknown): Settlement {
  const r = row as Record<string, unknown>;
  const amount = typeof r.expectedAmount === "number" ? r.expectedAmount : typeof r.amount === "number" ? r.amount : 0;
  const settledExplicit = r.settledAmount;
  const settledAmount =
    typeof settledExplicit === "number" ? settledExplicit : r.settledAt != null && r.settledAt !== "" ? amount : 0;

  const rawStatus = String(r.status ?? "");
  const statusMap: Record<string, SettlementStatus> = {
    pending: "pending",
    matched: "matched",
    disputed: "disputed",
    settled: "settled",
    confirmed: "matched",
    failed: "disputed",
  };
  const status = statusMap[rawStatus] ?? "pending";

  const settledAtStr = typeof r.settledAt === "string" && r.settledAt.length > 0 ? r.settledAt : null;
  const settlementDate =
    typeof r.settlementDate === "string" ? r.settlementDate : settledAtStr ? settledAtStr.split("T")[0]! : "";

  const date =
    typeof r.date === "string" && r.date.length > 0
      ? r.date
      : settlementDate.length > 0
        ? settlementDate
        : new Date().toISOString().split("T")[0]!;

  const venueRaw = typeof r.venue === "string" ? r.venue : "";
  const instrument =
    typeof r.instrument === "string" ? r.instrument : typeof r.currency === "string" ? `${r.currency} settlement` : "—";

  const side: Side = r.side === "sell" || r.side === "buy" ? r.side : "buy";

  return {
    id: String(r.id ?? ""),
    date,
    venue: formatVenue(venueRaw),
    instrument,
    side,
    expectedAmount: amount,
    settledAmount,
    status,
    settlementDate,
  };
}

function formatAmount(amount: number | undefined | null): string {
  const n = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  if (n >= 10000) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
}

function statusBadge(status: SettlementStatus) {
  const config: Record<SettlementStatus, { className: string; icon: React.ReactNode }> = {
    pending: {
      className: "bg-[var(--status-warning)]/10 text-[var(--status-warning)] border-[var(--status-warning)]/20",
      icon: <Clock className="size-3 mr-1" />,
    },
    matched: {
      className: "bg-[var(--status-live)]/10 text-[var(--status-live)] border-[var(--status-live)]/20",
      icon: <CheckCircle2 className="size-3 mr-1" />,
    },
    disputed: {
      className: "bg-destructive/10 text-destructive border-destructive/20",
      icon: <AlertTriangle className="size-3 mr-1" />,
    },
    settled: {
      className: "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-[var(--accent-blue)]/20",
      icon: <ArrowDownCircle className="size-3 mr-1" />,
    },
  };
  const c = config[status];
  return (
    <Badge variant="outline" className={c.className}>
      {c.icon}
      {status}
    </Badge>
  );
}

function sideBadge(side: Side) {
  return side === "buy" ? (
    <Badge
      variant="outline"
      className="bg-[var(--pnl-positive)]/10 text-[var(--pnl-positive)] border-[var(--pnl-positive)]/20"
    >
      Buy
    </Badge>
  ) : (
    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
      Sell
    </Badge>
  );
}

const settlementColumns: ColumnDef<Settlement, unknown>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.getValue<string>("id")}</span>,
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <span className="text-sm">{row.getValue<string>("date")}</span>,
  },
  {
    accessorKey: "venue",
    header: "Venue",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        {row.getValue<string>("venue")}
      </Badge>
    ),
  },
  {
    accessorKey: "instrument",
    header: "Instrument",
    cell: ({ row }) => <span className="font-mono text-sm">{row.getValue<string>("instrument")}</span>,
  },
  {
    accessorKey: "side",
    header: "Side",
    cell: ({ row }) => sideBadge(row.getValue<Side>("side")),
  },
  {
    accessorKey: "expectedAmount",
    header: () => <div className="text-right">Expected</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono text-sm">{formatAmount(row.getValue<number>("expectedAmount"))}</div>
    ),
  },
  {
    accessorKey: "settledAmount",
    header: () => <div className="text-right">Settled</div>,
    cell: ({ row }) => {
      const amount = row.getValue<number | undefined>("settledAmount");
      return (
        <div className="text-right font-mono text-sm">
          {(amount ?? 0) > 0 ? formatAmount(amount) : <span className="text-muted-foreground">--</span>}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => statusBadge(row.getValue<SettlementStatus>("status")),
  },
  {
    accessorKey: "settlementDate",
    header: "Settlement Date",
    cell: ({ row }) => {
      const date = row.getValue<string>("settlementDate");
      return <span className="text-sm">{date || <span className="text-muted-foreground">--</span>}</span>;
    },
  },
];

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-[140px]" />
        <Skeleton className="h-9 w-[140px]" />
        <Skeleton className="h-9 w-[130px]" />
        <Skeleton className="h-9 w-[130px]" />
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettlementPage() {
  const { data: apiData, isLoading, isError, refetch } = useSettlements();

  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [venueFilter, setVenueFilter] = React.useState<string>("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  const rawSettlements: Settlement[] = React.useMemo(() => {
    const apiSettlements = (apiData as Record<string, unknown>)?.settlements as unknown[] | undefined;
    const apiDataArr = (apiData as Record<string, unknown>)?.data as unknown[] | undefined;
    const list = apiSettlements ?? apiDataArr;
    if (list?.length) {
      return list.map(normalizeSettlementRow);
    }
    return MOCK_SETTLEMENTS;
  }, [apiData]);

  const rawInvoices: Invoice[] = React.useMemo(() => {
    const apiInvoices = (apiData as Record<string, unknown>)?.invoices as Invoice[] | undefined;
    return apiInvoices ?? MOCK_INVOICES;
  }, [apiData]);

  const settlements = React.useMemo(() => {
    let filtered = rawSettlements;
    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }
    if (venueFilter !== "all") {
      filtered = filtered.filter((s) => s.venue === venueFilter);
    }
    if (dateFrom) {
      filtered = filtered.filter((s) => s.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((s) => s.date <= dateTo);
    }
    return filtered;
  }, [rawSettlements, statusFilter, venueFilter, dateFrom, dateTo]);

  const venues = React.useMemo(() => [...new Set(rawSettlements.map((s) => s.venue))].sort(), [rawSettlements]);

  const totalCount = rawSettlements.length;
  const pendingCount = rawSettlements.filter((s) => s.status === "pending").length;
  const matchedCount = rawSettlements.filter((s) => s.status === "matched").length;
  const disputedCount = rawSettlements.filter((s) => s.status === "disputed").length;

  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <div className="p-6">
        <Card className="border-destructive/30">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 py-8">
              <AlertTriangle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Failed to load settlement data.</p>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()}>
                <RefreshCw className="size-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Receipt className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{totalCount}</p>
                  <p className="text-xs text-muted-foreground">Total Settlements</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--status-warning)]/10">
                  <Clock className="size-5" style={{ color: "var(--status-warning)" }} />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--status-live)]/10">
                  <CheckCircle2 className="size-5" style={{ color: "var(--status-live)" }} />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{matchedCount}</p>
                  <p className="text-xs text-muted-foreground">Matched</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="size-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{disputedCount}</p>
                  <p className="text-xs text-muted-foreground">Disputed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="matched">Matched</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
              <SelectItem value="settled">Settled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={venueFilter} onValueChange={setVenueFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Venue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Venues</SelectItem>
              {venues.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[150px]"
            placeholder="From"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[150px]"
            placeholder="To"
          />
          {(statusFilter !== "all" || venueFilter !== "all" || dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setVenueFilter("all");
                setDateFrom("");
                setDateTo("");
              }}
            >
              Clear filters
            </Button>
          )}
          <div className="ml-auto">
            <ExportDropdown
              data={settlements.map((s) => ({ ...s }))}
              columns={[
                { key: "id", header: "ID" },
                { key: "date", header: "Date" },
                { key: "venue", header: "Venue" },
                { key: "instrument", header: "Instrument" },
                { key: "side", header: "Side" },
                {
                  key: "expectedAmount",
                  header: "Expected Amount",
                  format: "currency" as const,
                },
                {
                  key: "settledAmount",
                  header: "Settled Amount",
                  format: "currency" as const,
                },
                { key: "status", header: "Status" },
                { key: "settlementDate", header: "Settlement Date" },
              ]}
              filename="settlements"
            />
          </div>
        </div>

        {/* Settlement Table */}
        <Card>
          <CardContent className="pt-6">
            <DataTable
              columns={settlementColumns}
              data={settlements}
              emptyMessage="No settlements match your filters."
            />
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="size-5 text-muted-foreground" />
                Recent Invoices
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {rawInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Receipt
                    className={`size-5 ${
                      invoice.status === "paid" ? "text-[var(--status-live)]" : "text-[var(--status-warning)]"
                    }`}
                  />
                  <div>
                    <p className="font-medium font-mono text-sm">{invoice.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.client} &bull; {invoice.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="font-mono font-semibold">${invoice.amount.toLocaleString()}</span>
                  <Badge
                    variant={invoice.status === "paid" ? "default" : "secondary"}
                    className={
                      invoice.status === "paid"
                        ? "bg-[var(--status-live)]/10 text-[var(--status-live)]"
                        : "bg-[var(--status-warning)]/10 text-[var(--status-warning)]"
                    }
                  >
                    {invoice.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Documents Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Settlement agreements, confirmations, and supporting documents
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5">
              <FileText className="size-3.5" />
              Upload
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                {
                  name: "Settlement_Confirmation_2026_03.pdf",
                  type: "Confirmation",
                  date: "2026-03-20",
                  size: "245 KB",
                },
                {
                  name: "Margin_Agreement_Binance.pdf",
                  type: "Agreement",
                  date: "2026-03-15",
                  size: "1.2 MB",
                },
                {
                  name: "Fee_Schedule_Q1_2026.xlsx",
                  type: "Fee Schedule",
                  date: "2026-03-01",
                  size: "89 KB",
                },
                {
                  name: "Netting_Agreement_Deribit.pdf",
                  type: "Agreement",
                  date: "2026-02-28",
                  size: "512 KB",
                },
              ].map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.type} &bull; {doc.date} &bull; {doc.size}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
