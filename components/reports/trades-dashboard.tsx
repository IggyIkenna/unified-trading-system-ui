"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { ApiError } from "@/components/shared/api-error";
import { PnLValue } from "@/components/trading/pnl-value";
import { useClients, useTradeHistory } from "@/hooks/api/use-performance";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";
import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Search,
} from "lucide-react";

export function TradesDashboard() {
  const [selectedClientId, setSelectedClientId] = React.useState<string | null>(null);
  const [symbolFilter, setSymbolFilter] = React.useState<string>("");
  const [sideFilter, setSideFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(0);
  const pageSize = 50;

  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: tradesData, isLoading: tradesLoading, isError, error, refetch } = useTradeHistory(
    selectedClientId,
    {
      symbol: symbolFilter || undefined,
      side: sideFilter !== "all" ? sideFilter : undefined,
      limit: pageSize,
      offset: page * pageSize,
    },
  );

  // Auto-select first client
  React.useEffect(() => {
    if (clients && clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  // Reset page on filter change
  React.useEffect(() => { setPage(0); }, [symbolFilter, sideFilter, selectedClientId]);

  const trades = tradesData?.trades ?? [];
  const total = tradesData?.total ?? 0;
  const agg = tradesData?.aggregates;
  const totalPages = Math.ceil(total / pageSize);

  if (clientsLoading) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto">
        <ApiError error={error instanceof Error ? error : new Error("Failed to load trade history")} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <PageHeader
          title="Trade History"
          description="Full order history with fills, fees, and slippage"
        >
          <Select value={selectedClientId ?? ""} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {(clients ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ExportDropdown
            data={trades.map((t) => ({ ...t }))}
            columns={[
              { key: "trade_id", header: "Trade ID" },
              { key: "symbol", header: "Symbol" },
              { key: "side", header: "Side" },
              { key: "quantity", header: "Qty" },
              { key: "price", header: "Price" },
              { key: "notional_usd", header: "Notional" },
              { key: "fee", header: "Fee" },
              { key: "realized_pnl", header: "Realized P&L" },
            ]}
            filename={`${selectedClientId}_trades`}
          />
          <Button variant="outline" size="sm" className="gap-2" onClick={() => {
            if (selectedClientId) {
              window.open(`/api/reporting/exports/trades?client_id=${selectedClientId}`, "_blank");
            }
          }}>
            <Download className="size-4" />
            CSV
          </Button>
        </PageHeader>

        {/* Aggregates strip */}
        {agg && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="border-border/50">
              <CardContent className="pt-5 pb-4 space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Trades</p>
                <p className="text-2xl font-semibold tabular-nums tracking-tight font-mono">{formatNumber(agg.total_trades, 0)}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-5 pb-4 space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Volume</p>
                <p className="text-2xl font-semibold tabular-nums tracking-tight font-mono">{formatCurrency(agg.total_volume_usd, "USD", 0)}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-5 pb-4 space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Fees</p>
                <p className="text-2xl font-semibold tabular-nums tracking-tight font-mono">{formatCurrency(agg.total_fees_usd, "USD", 2)}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-5 pb-4 space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Net Realized P&L</p>
                <p className={`text-2xl font-semibold tabular-nums tracking-tight font-mono ${agg.net_realized_pnl >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"}`}>
                  {agg.net_realized_pnl >= 0 ? "+" : ""}{formatCurrency(agg.net_realized_pnl, "USD", 2)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Filter by symbol..."
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
          <Select value={sideFilter} onValueChange={setSideFilter}>
            <SelectTrigger className="w-[120px]">
              <Filter className="size-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sides</SelectItem>
              <SelectItem value="BUY">Buy</SelectItem>
              <SelectItem value="SELL">Sell</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground ml-auto">
            Showing {trades.length} of {total} trades
          </span>
        </div>

        {/* Trades table */}
        <Card>
          <CardContent className="p-0">
            {tradesLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trade ID</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Notional</TableHead>
                    <TableHead className="text-right">Fee</TableHead>
                    <TableHead className="text-right">Realized P&L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((t) => (
                    <TableRow key={t.trade_id}>
                      <TableCell className="font-mono text-xs">{t.trade_id}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(t.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{t.venue}</Badge>
                      </TableCell>
                      <TableCell className="font-mono font-medium">{t.symbol}</TableCell>
                      <TableCell>
                        <Badge variant={t.side === "BUY" ? "default" : "destructive"} className="text-xs">
                          {t.side}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{t.trade_type}</TableCell>
                      <TableCell className="text-right font-mono">{t.quantity}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(t.price, "USD", 2)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(t.notional_usd, "USD", 0)}</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(t.fee, "USD", 2)}</TableCell>
                      <TableCell className="text-right">
                        {t.realized_pnl !== 0 ? <PnLValue value={t.realized_pnl} size="sm" showSign /> : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {trades.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        No trades found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="size-4 mr-1" /> Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
