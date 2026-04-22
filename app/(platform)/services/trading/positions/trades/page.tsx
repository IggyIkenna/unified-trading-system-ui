"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTradesForPosition } from "@/lib/mocks/fixtures/mock-data-index";
import type { SeedTrade } from "@/lib/mocks/fixtures/mock-data-seed";
import { formatDate } from "@/lib/utils/formatters";
import { ArrowLeft } from "lucide-react";

function PositionTradesInner() {
  const searchParams = useSearchParams();
  const positionId = searchParams.get("position_id") ?? "";
  const [sideFilter, setSideFilter] = React.useState<"all" | "buy" | "sell">("all");
  const [typeFilter, setTypeFilter] = React.useState<"all" | SeedTrade["tradeType"]>("all");

  const allTrades = React.useMemo(() => getTradesForPosition(positionId), [positionId]);

  const filtered = React.useMemo(() => {
    let rows = allTrades;
    if (sideFilter !== "all") rows = rows.filter((t) => t.side === sideFilter);
    if (typeFilter !== "all") rows = rows.filter((t) => t.tradeType === typeFilter);
    return [...rows].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [allTrades, sideFilter, typeFilter]);

  if (!positionId) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <PageHeader title="Position trades" description="Select a position from the positions table to view fills." />
        <Button variant="outline" size="sm" asChild>
          <Link href="/services/trading/positions">
            <ArrowLeft className="size-4 mr-1" />
            Back to positions
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 flex flex-col min-h-0">
      <PageHeader
        title="Position trades"
        description={`Fills linked to position ${positionId}. Mock data from seed trades.`}
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/services/trading/positions">
            <ArrowLeft className="size-4 mr-1" />
            Positions
          </Link>
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Side</span>
          <Select value={sideFilter} onValueChange={(v) => setSideFilter(v as "all" | "buy" | "sell")}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Type</span>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Exchange">Exchange</SelectItem>
              <SelectItem value="OTC">OTC</SelectItem>
              <SelectItem value="DeFi">DeFi</SelectItem>
              <SelectItem value="Manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <WidgetScroll axes="both" className="rounded-md border border-border/40 flex-1 min-h-[200px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Trade ID</TableHead>
              <TableHead className="text-xs">Timestamp</TableHead>
              <TableHead className="text-xs">Side</TableHead>
              <TableHead className="text-xs text-right">Quantity</TableHead>
              <TableHead className="text-xs text-right">Price</TableHead>
              <TableHead className="text-xs text-right">Fees</TableHead>
              <TableHead className="text-xs text-right">Total</TableHead>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Counterparty</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground text-sm py-8">
                  No trades for this position (or filters exclude all rows).
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.id}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{formatDate(t.timestamp, "long")}</TableCell>
                  <TableCell className="text-xs uppercase">{t.side}</TableCell>
                  <TableCell className="text-xs text-right font-mono">{t.quantity.toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-right font-mono">
                    ${t.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono">${t.fees.toFixed(2)}</TableCell>
                  <TableCell className="text-xs text-right font-mono">${t.total.toFixed(2)}</TableCell>
                  <TableCell className="text-xs">{t.tradeType}</TableCell>
                  <TableCell className="text-xs max-w-[140px] truncate">{t.counterparty}</TableCell>
                  <TableCell className="text-xs capitalize">{t.status}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </WidgetScroll>
    </div>
  );
}

export default function PositionTradesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 flex items-center justify-center text-muted-foreground text-sm">Loading trades…</div>
      }
    >
      <PositionTradesInner />
    </Suspense>
  );
}
