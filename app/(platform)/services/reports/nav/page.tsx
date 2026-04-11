"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ApiError } from "@/components/shared/api-error";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Clock, DollarSign, TrendingUp, Users, Vault } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";
import { useNAV } from "@/hooks/api/use-reports";
import {
  MOCK_CAPITAL_FLOWS,
  MOCK_FEES,
  MOCK_HOURLY_NAV,
  MOCK_INVESTORS_NAV,
  type CapitalFlow,
  type FeeItem,
  type HourlyNAV,
} from "@/lib/mocks/fixtures/reports-nav";
import { isMockDataMode } from "@/lib/runtime/data-mode";
import * as React from "react";

const mockDataMode = isMockDataMode();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${formatNumber(v / 1_000_000, 2)}M`;
  if (abs >= 1_000) return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${formatNumber(v, 2)}`;
}

function formatFullCurrency(v: number): string {
  return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pnlColor(v: number): string {
  if (v > 0) return "text-[var(--pnl-positive)]";
  if (v < 0) return "text-[var(--pnl-negative)]";
  return "text-muted-foreground";
}

function flowTypeBadge(type: CapitalFlow["type"]) {
  const styles: Record<CapitalFlow["type"], string> = {
    Subscription: "bg-[var(--pnl-positive)]/10 text-[var(--pnl-positive)] border-[var(--pnl-positive)]/20",
    Redemption: "bg-[var(--pnl-negative)]/10 text-[var(--pnl-negative)] border-[var(--pnl-negative)]/20",
    Distribution: "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-[var(--accent-blue)]/20",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${styles[type]}`}>
      {type}
    </Badge>
  );
}

function flowStatusBadge(status: CapitalFlow["status"]) {
  const styles: Record<CapitalFlow["status"], string> = {
    Pending: "bg-[var(--status-warning)]/10 text-[var(--status-warning)] border-[var(--status-warning)]/20",
    Settled: "bg-[var(--status-live)]/10 text-[var(--status-live)] border-[var(--status-live)]/20",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${styles[status]}`}>
      {status === "Settled" && <CheckCircle2 className="size-3 mr-1" />}
      {status === "Pending" && <Clock className="size-3 mr-1" />}
      {status}
    </Badge>
  );
}

// Simple inline sparkline-style bar chart for NAV timeline
function NavBarChart({ data }: { data: HourlyNAV[] }) {
  const minNav = Math.min(...data.map((d) => d.nav));
  const maxNav = Math.max(...data.map((d) => d.nav));
  const range = maxNav - minNav || 1;

  return (
    <div className="flex items-end gap-[2px] h-32 w-full">
      {data.map((point) => {
        const height = ((point.nav - minNav) / range) * 100;
        const isPositive = point.change >= 0;
        return (
          <div
            key={point.hour}
            className="flex-1 rounded-t-sm transition-colors hover:opacity-80"
            style={{
              height: `${Math.max(height, 2)}%`,
              backgroundColor: isPositive ? "var(--pnl-positive)" : "var(--pnl-negative)",
              opacity: 0.7,
            }}
            title={`${point.hour}: ${formatFullCurrency(point.nav)} (${point.change >= 0 ? "+" : ""}${formatCurrency(point.change)})`}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <main className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-10 w-48 ml-auto" />
          <Skeleton className="h-4 w-24 ml-auto" />
        </div>
      </div>
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}><CardContent className="pt-4"><Skeleton className="h-16" /></CardContent></Card>
        ))}
      </div>
      <Skeleton className="h-[400px]" />
    </main>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

const capitalFlowColumns: ColumnDef<CapitalFlow>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <span className="font-mono text-sm text-muted-foreground">{row.original.date}</span>,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => flowTypeBadge(row.original.type),
  },
  {
    accessorKey: "investor",
    header: "Investor",
    cell: ({ row }) => <span className="text-sm">{row.original.investor}</span>,
  },
  {
    accessorKey: "amount",
    header: () => <span className="block w-full text-right">Amount</span>,
    cell: ({ row }) => (
      <span className="block text-right font-mono text-sm">{formatCurrency(row.original.amount)}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => flowStatusBadge(row.original.status),
  },
];

export default function ShadowNAVPage() {
  const { data: apiData, isLoading, isError, error, refetch } = useNAV();
  const apiResult = apiData as Record<string, unknown> | undefined;

  // Extract data from API or mock fallback
  const currentNav = (apiResult?.current_nav as number) ?? (mockDataMode ? 24847321.42 : 0);
  const dailyChangePct = (apiResult?.daily_change_pct as number) ?? (mockDataMode ? 1.2 : 0);
  const mtdReturnPct = (apiResult?.mtd_return_pct as number) ?? (mockDataMode ? 3.4 : 0);
  const aum = (apiResult?.aum as number) ?? currentNav;
  const investorCount = (apiResult?.investor_count as number) ?? (mockDataMode ? 12 : 0);
  const highWaterMark = (apiResult?.high_water_mark as number) ?? (mockDataMode ? 25200000 : 0);

  const hourlyNav: HourlyNAV[] = React.useMemo(() => {
    const apiNav = apiResult?.hourly_nav as HourlyNAV[] | undefined;
    if (apiNav?.length) return apiNav;
    return mockDataMode ? MOCK_HOURLY_NAV : [];
  }, [apiResult]);

  const capitalFlows: CapitalFlow[] = React.useMemo(() => {
    const apiFlows = apiResult?.capital_flows as CapitalFlow[] | undefined;
    if (apiFlows?.length) return apiFlows;
    return mockDataMode ? MOCK_CAPITAL_FLOWS : [];
  }, [apiResult]);

  const fees: FeeItem[] = React.useMemo(() => {
    const apiFees = apiResult?.fees as FeeItem[] | undefined;
    if (apiFees?.length) return apiFees;
    return mockDataMode ? MOCK_FEES : [];
  }, [apiResult]);

  const navInvestors = React.useMemo(() => {
    const apiInvestors = apiResult?.investors as Array<Record<string, unknown>> | undefined;
    if (apiInvestors?.length) {
      return apiInvestors.map((inv) => ({
        name: String(inv.name ?? ""),
        class: String(inv.class ?? ""),
        commitment: Number(inv.commitment ?? 0),
        navShare: Number(inv.navShare ?? 0),
        pctOfFund: Number(inv.pctOfFund ?? 0),
        inceptionDate: String(inv.inceptionDate ?? ""),
      }));
    }
    return mockDataMode ? MOCK_INVESTORS_NAV : [];
  }, [apiResult]);

  const netInflowsMTD = capitalFlows
    .filter((f) => f.status === "Settled")
    .reduce((acc, f) => {
      if (f.type === "Subscription") return acc + f.amount;
      if (f.type === "Redemption") return acc - f.amount;
      return acc;
    }, 0);

  const pendingRedemptions = capitalFlows
    .filter((f) => f.type === "Redemption" && f.status === "Pending")
    .reduce((acc, f) => acc + f.amount, 0);

  const totalFees = fees.reduce((acc, f) => acc + f.annualAmount, 0);

  if (isLoading) return <LoadingSkeleton />;

  if (isError && !mockDataMode) {
    return (
      <div className="p-6">
        <ApiError
          error={error instanceof Error ? error : new Error("Failed to load NAV data")}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <main className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader title="Shadow NAV" description="Net Asset Value tracking with daily granularity" />
        <div className="text-right">
          <p className="text-3xl font-bold font-mono">{formatFullCurrency(currentNav)}</p>
          <p className={`text-sm font-mono ${pnlColor(dailyChangePct)}`}>
            {dailyChangePct >= 0 ? "+" : ""}{dailyChangePct}% today
          </p>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-semibold font-mono">{formatCurrency(currentNav)}</p>
                <p className="text-xs text-muted-foreground">NAV</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--pnl-positive)]/10">
                <TrendingUp className="size-5" style={{ color: "var(--pnl-positive)" }} />
              </div>
              <div>
                <p className={`text-xl font-semibold font-mono ${pnlColor(dailyChangePct)}`}>
                  {dailyChangePct >= 0 ? "+" : ""}{dailyChangePct}%
                </p>
                <p className="text-xs text-muted-foreground">Daily Change</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--accent-blue)]/10">
                <ArrowUpRight className="size-5" style={{ color: "var(--accent-blue)" }} />
              </div>
              <div>
                <p className="text-xl font-semibold font-mono text-[var(--accent-blue)]">+{mtdReturnPct}%</p>
                <p className="text-xs text-muted-foreground">MTD Return</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Vault className="size-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xl font-semibold font-mono">{formatCurrency(aum)}</p>
                <p className="text-xs text-muted-foreground">AUM</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Users className="size-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xl font-semibold font-mono">{investorCount}</p>
                <p className="text-xs text-muted-foreground">Investors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="capital-flows">Capital Flows</TabsTrigger>
          <TabsTrigger value="fee-waterfall">Fee Waterfall</TabsTrigger>
          <TabsTrigger value="investor-breakdown">Investor Breakdown</TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">NAV Movement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hourlyNav.length > 0 ? (
                <>
                  <NavBarChart data={hourlyNav} />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono px-1">
                    <span>{hourlyNav[0]?.hour ?? ""}</span>
                    <span>{hourlyNav[Math.floor(hourlyNav.length / 2)]?.hour ?? ""}</span>
                    <span>{hourlyNav[hourlyNav.length - 1]?.hour ?? ""}</span>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">NAV</TableHead>
                        <TableHead className="text-right">Change</TableHead>
                        <TableHead className="text-right">% Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hourlyNav.filter((_, i) => i % 2 === 0 || i === hourlyNav.length - 1).map((point) => (
                        <TableRow key={point.hour}>
                          <TableCell className="font-mono text-sm">{point.hour}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatFullCurrency(point.nav)}</TableCell>
                          <TableCell className={`text-right font-mono text-sm ${pnlColor(point.change)}`}>
                            {point.change > 0 ? "+" : ""}
                            {formatCurrency(point.change)}
                          </TableCell>
                          <TableCell className={`text-right font-mono text-sm ${pnlColor(point.changePct)}`}>
                            {point.changePct > 0 ? "+" : ""}
                            {formatPercent(point.changePct, 3)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No NAV timeline data available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Capital Flows Tab */}
        <TabsContent value="capital-flows">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[var(--pnl-positive)]/10">
                      <ArrowUpRight className="size-5" style={{ color: "var(--pnl-positive)" }} />
                    </div>
                    <div>
                      <p className="text-xl font-semibold font-mono text-[var(--pnl-positive)]">
                        +{formatCurrency(netInflowsMTD)}
                      </p>
                      <p className="text-xs text-muted-foreground">Net Inflows</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[var(--status-warning)]/10">
                      <ArrowDownRight className="size-5" style={{ color: "var(--status-warning)" }} />
                    </div>
                    <div>
                      <p className="text-xl font-semibold font-mono text-[var(--status-warning)]">
                        {formatCurrency(pendingRedemptions)}
                      </p>
                      <p className="text-xs text-muted-foreground">Pending Redemptions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Capital Flows</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={capitalFlowColumns}
                  data={capitalFlows}
                  enableColumnVisibility={false}
                  emptyMessage="No capital flows."
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Fee Waterfall Tab */}
        <TabsContent value="fee-waterfall">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Fee Waterfall</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">High-Water Mark:</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {formatFullCurrency(highWaterMark)}
                  </Badge>
                  {currentNav < highWaterMark ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-[var(--status-warning)]/10 text-[var(--status-warning)] border-[var(--status-warning)]/20"
                    >
                      Below HWM
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-[var(--status-live)]/10 text-[var(--status-live)] border-[var(--status-live)]/20"
                    >
                      Above HWM
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {fees.length > 0 ? (
                <>
                  {/* Visual stacked bar */}
                  <div className="space-y-3">
                    {fees.map((fee) => {
                      const widthPct = totalFees > 0 ? (fee.annualAmount / totalFees) * 100 : 0;
                      return (
                        <div key={fee.category} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>
                              {fee.category} ({fee.rate})
                            </span>
                            <span className="font-mono">{formatCurrency(fee.annualAmount)}/yr</span>
                          </div>
                          <div className="h-6 rounded bg-muted overflow-hidden">
                            <div
                              className="h-full rounded bg-primary/60 transition-all"
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Detail table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fee Category</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead className="text-right">Annual Amount</TableHead>
                        <TableHead className="text-right">YTD Accrued</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fees.map((fee) => (
                        <TableRow key={fee.category}>
                          <TableCell className="text-sm font-medium">{fee.category}</TableCell>
                          <TableCell className="font-mono text-sm">{fee.rate}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatCurrency(fee.annualAmount)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatCurrency(fee.ytdAccrued)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2">
                        <TableCell className="text-sm font-semibold">Total</TableCell>
                        <TableCell />
                        <TableCell className="text-right font-mono text-sm font-semibold">
                          {formatCurrency(totalFees)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold">
                          {formatCurrency(fees.reduce((acc, f) => acc + f.ytdAccrued, 0))}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No fee data available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Investor Breakdown Tab */}
        <TabsContent value="investor-breakdown">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Investor Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {navInvestors.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Investor Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-right">Commitment</TableHead>
                      <TableHead className="text-right">NAV Share</TableHead>
                      <TableHead className="text-right">% of Fund</TableHead>
                      <TableHead>Inception Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {navInvestors.map((inv) => (
                      <TableRow key={inv.name}>
                        <TableCell className="text-sm font-medium">{inv.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            Class {inv.class}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(inv.commitment)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatCurrency(inv.navShare)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatPercent(inv.pctOfFund, 2)}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{inv.inceptionDate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No investor data available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
