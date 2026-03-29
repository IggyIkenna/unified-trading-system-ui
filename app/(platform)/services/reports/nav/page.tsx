"use client";

import { PageHeader } from "@/components/platform/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Clock, DollarSign, TrendingUp, Users, Vault } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HourlyNAV {
  hour: string;
  nav: number;
  change: number;
  changePct: number;
}

interface CapitalFlow {
  id: string;
  date: string;
  type: "Subscription" | "Redemption" | "Distribution";
  investor: string;
  amount: number;
  status: "Pending" | "Settled";
}

interface FeeItem {
  category: string;
  rate: string;
  annualAmount: number;
  ytdAccrued: number;
}

interface Investor {
  name: string;
  class: string;
  commitment: number;
  navShare: number;
  pctOfFund: number;
  inceptionDate: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const CURRENT_NAV = 24847321.42;
const DAILY_CHANGE_PCT = 1.2;
const MTD_RETURN_PCT = 3.4;
const AUM = 28100000;
const INVESTOR_COUNT = 12;

const MOCK_HOURLY_NAV: HourlyNAV[] = [
  { hour: "00:00", nav: 24562000, change: 0, changePct: 0 },
  { hour: "01:00", nav: 24570000, change: 8000, changePct: 0.033 },
  { hour: "02:00", nav: 24558000, change: -12000, changePct: -0.049 },
  { hour: "03:00", nav: 24585000, change: 27000, changePct: 0.11 },
  { hour: "04:00", nav: 24602000, change: 17000, changePct: 0.069 },
  { hour: "05:00", nav: 24610000, change: 8000, changePct: 0.033 },
  { hour: "06:00", nav: 24635000, change: 25000, changePct: 0.102 },
  { hour: "07:00", nav: 24660000, change: 25000, changePct: 0.101 },
  { hour: "08:00", nav: 24700000, change: 40000, changePct: 0.162 },
  { hour: "09:00", nav: 24720000, change: 20000, changePct: 0.081 },
  { hour: "10:00", nav: 24750000, change: 30000, changePct: 0.121 },
  { hour: "11:00", nav: 24780000, change: 30000, changePct: 0.121 },
  { hour: "12:00", nav: 24795000, change: 15000, changePct: 0.061 },
  { hour: "13:00", nav: 24810000, change: 15000, changePct: 0.06 },
  { hour: "14:00", nav: 24830000, change: 20000, changePct: 0.081 },
  { hour: "15:00", nav: 24815000, change: -15000, changePct: -0.06 },
  { hour: "16:00", nav: 24825000, change: 10000, changePct: 0.04 },
  { hour: "17:00", nav: 24835000, change: 10000, changePct: 0.04 },
  { hour: "18:00", nav: 24838000, change: 3000, changePct: 0.012 },
  { hour: "19:00", nav: 24840000, change: 2000, changePct: 0.008 },
  { hour: "20:00", nav: 24842000, change: 2000, changePct: 0.008 },
  { hour: "21:00", nav: 24844000, change: 2000, changePct: 0.008 },
  { hour: "22:00", nav: 24846000, change: 2000, changePct: 0.008 },
  { hour: "23:00", nav: 24847321.42, change: 1321.42, changePct: 0.005 },
];

const MOCK_CAPITAL_FLOWS: CapitalFlow[] = [
  {
    id: "CF-001",
    date: "2026-03-28",
    type: "Subscription",
    investor: "Meridian Fund",
    amount: 500000,
    status: "Pending",
  },
  {
    id: "CF-002",
    date: "2026-03-27",
    type: "Subscription",
    investor: "Apex Capital",
    amount: 750000,
    status: "Settled",
  },
  {
    id: "CF-003",
    date: "2026-03-25",
    type: "Redemption",
    investor: "Vertex Partners",
    amount: 200000,
    status: "Pending",
  },
  {
    id: "CF-004",
    date: "2026-03-24",
    type: "Subscription",
    investor: "Quantum Strategies",
    amount: 300000,
    status: "Settled",
  },
  {
    id: "CF-005",
    date: "2026-03-22",
    type: "Distribution",
    investor: "All Investors (Q1)",
    amount: 180000,
    status: "Settled",
  },
  {
    id: "CF-006",
    date: "2026-03-20",
    type: "Redemption",
    investor: "Nova Investments",
    amount: 250000,
    status: "Settled",
  },
  {
    id: "CF-007",
    date: "2026-03-18",
    type: "Subscription",
    investor: "Odum Fund II",
    amount: 1000000,
    status: "Settled",
  },
  { id: "CF-008", date: "2026-03-15", type: "Subscription", investor: "Seed LP", amount: 150000, status: "Settled" },
];

const MOCK_FEES: FeeItem[] = [
  { category: "Management Fee", rate: "2.00%", annualAmount: 497200, ytdAccrued: 124300 },
  { category: "Performance Fee", rate: "20.00%", annualAmount: 1420000, ytdAccrued: 355000 },
  { category: "Admin Fee", rate: "0.15%", annualAmount: 37300, ytdAccrued: 9325 },
  { category: "Custody Fee", rate: "0.05%", annualAmount: 12400, ytdAccrued: 3100 },
];

const MOCK_INVESTORS: Investor[] = [
  {
    name: "Odum Fund I",
    class: "A",
    commitment: 5000000,
    navShare: 4962000,
    pctOfFund: 19.97,
    inceptionDate: "2025-01-15",
  },
  {
    name: "Odum Fund II",
    class: "A",
    commitment: 4000000,
    navShare: 4180000,
    pctOfFund: 16.83,
    inceptionDate: "2025-06-01",
  },
  {
    name: "Seed LP",
    class: "Founder",
    commitment: 3000000,
    navShare: 3480000,
    pctOfFund: 14.0,
    inceptionDate: "2024-09-01",
  },
  {
    name: "Meridian Fund",
    class: "B",
    commitment: 3500000,
    navShare: 3120000,
    pctOfFund: 12.56,
    inceptionDate: "2025-03-15",
  },
  {
    name: "Apex Capital",
    class: "A",
    commitment: 2500000,
    navShare: 2680000,
    pctOfFund: 10.79,
    inceptionDate: "2025-04-01",
  },
  {
    name: "Quantum Strategies",
    class: "B",
    commitment: 2000000,
    navShare: 2240000,
    pctOfFund: 9.01,
    inceptionDate: "2025-07-15",
  },
  {
    name: "Vertex Partners",
    class: "A",
    commitment: 1500000,
    navShare: 1620000,
    pctOfFund: 6.52,
    inceptionDate: "2025-09-01",
  },
  {
    name: "Nova Investments",
    class: "B",
    commitment: 1200000,
    navShare: 1285321.42,
    pctOfFund: 5.17,
    inceptionDate: "2025-11-01",
  },
];

const HIGH_WATER_MARK = 25200000;

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
  const netInflowsMTD = MOCK_CAPITAL_FLOWS.filter((f) => f.status === "Settled").reduce((acc, f) => {
    if (f.type === "Subscription") return acc + f.amount;
    if (f.type === "Redemption") return acc - f.amount;
    return acc;
  }, 0);

  const pendingRedemptions = MOCK_CAPITAL_FLOWS.filter((f) => f.type === "Redemption" && f.status === "Pending").reduce(
    (acc, f) => acc + f.amount,
    0,
  );

  const totalFees = MOCK_FEES.reduce((acc, f) => acc + f.annualAmount, 0);

  return (
    <main className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader title="Shadow NAV" description="Net Asset Value tracking with hourly granularity" />
        <div className="text-right">
          <p className="text-3xl font-bold font-mono">{formatFullCurrency(CURRENT_NAV)}</p>
          <p className={`text-sm font-mono ${pnlColor(DAILY_CHANGE_PCT)}`}>+{DAILY_CHANGE_PCT}% today</p>
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
                <p className="text-xl font-semibold font-mono">{formatCurrency(CURRENT_NAV)}</p>
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
                <p className="text-xl font-semibold font-mono text-[var(--pnl-positive)]">+{DAILY_CHANGE_PCT}%</p>
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
                <p className="text-xl font-semibold font-mono text-[var(--accent-blue)]">+{MTD_RETURN_PCT}%</p>
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
                <p className="text-xl font-semibold font-mono">{formatCurrency(AUM)}</p>
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
                <p className="text-xl font-semibold font-mono">{INVESTOR_COUNT}</p>
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
              <CardTitle className="text-sm">Hourly NAV Movement - Today</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <NavBarChart data={MOCK_HOURLY_NAV} />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono px-1">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:00</span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hour</TableHead>
                    <TableHead className="text-right">NAV</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                    <TableHead className="text-right">% Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_HOURLY_NAV.filter((_, i) => i % 2 === 0 || i === MOCK_HOURLY_NAV.length - 1).map((point) => (
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
                      <p className="text-xs text-muted-foreground">Net Inflows MTD</p>
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
                  data={MOCK_CAPITAL_FLOWS}
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
                    {formatFullCurrency(HIGH_WATER_MARK)}
                  </Badge>
                  {CURRENT_NAV < HIGH_WATER_MARK ? (
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
              {/* Visual stacked bar */}
              <div className="space-y-3">
                {MOCK_FEES.map((fee) => {
                  const widthPct = (fee.annualAmount / totalFees) * 100;
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
                  {MOCK_FEES.map((fee) => (
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
                      {formatCurrency(MOCK_FEES.reduce((acc, f) => acc + f.ytdAccrued, 0))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
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
                  {MOCK_INVESTORS.map((inv) => (
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
