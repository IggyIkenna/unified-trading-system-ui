"use client";

import { PageHeader } from "@/components/platform/page-header";
import { GenerateReportModal } from "@/components/reports/generate-report-modal";
import { ScheduleReportModal } from "@/components/reports/schedule-report-modal";
import { useContextState } from "@/components/trading/context-bar";
import { EntityLink } from "@/components/trading/entity-link";
import { PnLChange, PnLValue } from "@/components/trading/pnl-value";
import { ApiError } from "@/components/ui/api-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportDropdown } from "@/components/ui/export-dropdown";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReports, useSettlements } from "@/hooks/api/use-reports";
import { CLIENTS, type FilterContext } from "@/lib/trading-data";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/lib/utils/formatters";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Printer,
  Receipt,
  Send,
  Users,
  Vault,
  Wallet,
} from "lucide-react";
import * as React from "react";

type TransferStatus = "confirming" | "settled" | "confirmed" | "pending" | "failed";

export default function ReportsPage() {
  const {
    data: reportsApiData,
    isLoading: reportsLoading,
    isError: reportsIsError,
    error: reportsErr,
    refetch: refetchReports,
  } = useReports();
  const {
    data: settlementsApiData,
    isLoading: settlementsLoading,
    isError: settlementsIsError,
    refetch: refetchSettlements,
  } = useSettlements();

  const SEED_REPORTS = [
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
  const SEED_SETTLEMENTS = [
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
  const SEED_PORTFOLIO = [
    { client: "Trading Desk Alpha", aum: 13300000, pnl: 245000, pnlPct: 1.84, positions: 12 },
    { client: "Trading Desk Beta", aum: 9600000, pnl: 178000, pnlPct: 1.85, positions: 8 },
    { client: "DeFi Ops", aum: 6000000, pnl: 92000, pnlPct: 1.53, positions: 6 },
    { client: "Global Macro Fund", aum: 20500000, pnl: 312000, pnlPct: 1.52, positions: 5 },
    { client: "Core Strategy", aum: 12300000, pnl: -48000, pnlPct: -0.39, positions: 4 },
  ];
  const SEED_BALANCES = [
    { venue: "Binance", currency: "USDT", free: 2_450_000, locked: 820_000, total: 3_270_000 },
    { venue: "Hyperliquid", currency: "USDC", free: 1_800_000, locked: 450_000, total: 2_250_000 },
    { venue: "Deribit", currency: "BTC", free: 12.5, locked: 5.2, total: 17.7 },
    { venue: "Aave V3", currency: "WETH", free: 45, locked: 0, total: 45 },
  ];
  const SEED_TRANSFERS: Array<{
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
  const allReports: Array<any> = (reportsApiData as any)?.data ?? SEED_REPORTS;
  const allSettlements: Array<any> =
    (settlementsApiData as any)?.settlements ?? (settlementsApiData as any)?.data ?? SEED_SETTLEMENTS;
  const allPortfolioSummary: Array<any> = (reportsApiData as any)?.portfolioSummary ?? SEED_PORTFOLIO;
  const allInvoices: Array<any> = (reportsApiData as any)?.invoices ?? [];
  const accountBalances: Array<any> = (settlementsApiData as any)?.accountBalances ?? SEED_BALANCES;
  const recentTransfers: Array<{
    time: string;
    from: string;
    to: string;
    amount: string;
    status: TransferStatus;
    confirmations?: string;
    txHash?: string;
  }> = (settlementsApiData as any)?.recentTransfers ?? SEED_TRANSFERS;

  const isApiLoading = reportsLoading || settlementsLoading;
  const { context, setContext } = useContextState();

  // Build filter context
  const filterContext: FilterContext = React.useMemo(
    () => ({
      organizationIds: context.organizationIds,
      clientIds: context.clientIds,
      strategyIds: context.strategyIds,
      mode: context.mode,
      date: new Date().toISOString().split("T")[0],
    }),
    [context],
  );

  // Get client IDs that match the current filter
  const relevantClientIds = React.useMemo(() => {
    // If specific clients selected, use those
    if (context.clientIds.length > 0) return context.clientIds;

    // If orgs selected, get all clients in those orgs
    if (context.organizationIds.length > 0) {
      return CLIENTS.filter((c) => context.organizationIds.includes(c.orgId)).map((c) => c.id);
    }

    // No filter = all clients
    return [];
  }, [context.organizationIds, context.clientIds]);

  // Filter data based on context
  const reports = React.useMemo(() => {
    if (relevantClientIds.length === 0) return allReports;
    return allReports.filter((r) => relevantClientIds.includes(r.clientId));
  }, [relevantClientIds, allReports]);

  const settlements = React.useMemo(() => {
    if (relevantClientIds.length === 0) return allSettlements;
    return allSettlements.filter((s) => relevantClientIds.includes(s.clientId));
  }, [relevantClientIds, allSettlements]);

  const portfolioSummary = React.useMemo(() => {
    if (relevantClientIds.length === 0) return allPortfolioSummary;
    return allPortfolioSummary.filter((p) => relevantClientIds.includes(p.clientId));
  }, [relevantClientIds, allPortfolioSummary]);

  const invoices = React.useMemo(() => {
    if (relevantClientIds.length === 0) return allInvoices;
    return allInvoices.filter((i) => relevantClientIds.includes(i.clientId));
  }, [relevantClientIds, allInvoices]);

  // Calculate totals from filtered data
  const totalAum = portfolioSummary.reduce((sum, p) => sum + p.aum, 0);
  const avgMtdReturn =
    portfolioSummary.length > 0
      ? portfolioSummary.reduce((sum, p) => sum + p.mtdReturn, 0) / portfolioSummary.length
      : 0;
  const pendingSettlement = settlements.filter((s) => s.status !== "settled").reduce((sum, s) => sum + s.amount, 0);
  const reportsThisMonth = reports.length;

  const [generateOpen, setGenerateOpen] = React.useState(false);
  const [scheduleOpen, setScheduleOpen] = React.useState(false);

  if (reportsIsError || settlementsIsError)
    return (
      <div className="p-6 max-w-[1600px] mx-auto">
        <ApiError
          error={reportsErr instanceof Error ? reportsErr : new Error("Failed to load reports data")}
          onRetry={() => {
            refetchReports();
            refetchSettlements();
          }}
        />
      </div>
    );

  if (isApiLoading)
    return (
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );

  return (
    <div className="p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <PageHeader
          title="Investment Reporting"
          description={
            <>
              <p>Portfolio performance, attribution, settlements, and client statements</p>
              <p className="text-caption text-muted-foreground/60 font-mono">
                Data as of {formatDate(new Date(), "calendar")} &middot; Reconciled T+1
              </p>
            </>
          }
        >
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="size-4" />
            March 2026
          </Button>
          <Button variant="outline" size="sm" className="gap-2 no-print" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print
          </Button>
          <ExportDropdown
            data={reports.map((r) => ({ ...r }))}
            columns={[
              { key: "id", header: "ID" },
              { key: "name", header: "Report" },
              { key: "type", header: "Type" },
              { key: "status", header: "Status" },
              { key: "date", header: "Date" },
            ]}
            filename="reports-pnl"
          />
          <Button variant="outline" size="sm" className="gap-2 no-print" onClick={() => setScheduleOpen(true)}>
            <CalendarClock className="size-4" />
            Schedule
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setGenerateOpen(true)}>
            <FileText className="size-4" />
            Generate Report
          </Button>
        </PageHeader>

        {/* Summary — premium KPI strip with institutional spacing */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-4 space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Assets Under Management
              </p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight font-mono">
                ${formatNumber(totalAum / 1_000_000, 1)}m
              </p>
              <p className="text-[10px] text-muted-foreground/60">Across {portfolioSummary.length} client mandates</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-4 space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Month-to-Date Return
              </p>
              <p
                className={`text-2xl font-semibold tabular-nums tracking-tight font-mono ${avgMtdReturn >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"}`}
              >
                {avgMtdReturn >= 0 ? "+" : ""}
                {formatPercent(avgMtdReturn, 2)}
              </p>
              <p className="text-[10px] text-muted-foreground/60">Weighted average across all mandates</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-4 space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Pending Settlement
              </p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight font-mono">
                ${formatNumber(pendingSettlement / 1_000, 1)}k
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                {settlements.filter((s) => s.status !== "settled").length} transactions awaiting confirmation
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-4 space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Reports Generated
              </p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight font-mono">{reportsThisMonth}</p>
              <p className="text-[10px] text-muted-foreground/60">
                This period &middot; {reports.filter((r) => r.status === "sent").length} delivered to clients
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="portfolio" className="space-y-6">
          <TabsList>
            <TabsTrigger value="portfolio" className="gap-2">
              <BarChart3 className="size-4" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="size-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="settlements" className="gap-2">
              <Wallet className="size-4" />
              Settlements
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-2">
              <Receipt className="size-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="treasury" className="gap-2">
              <Vault className="size-4" />
              Treasury
            </TabsTrigger>
          </TabsList>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Client Portfolio Summary</CardTitle>
                  <span className="text-[10px] text-muted-foreground/60 font-mono">
                    {portfolioSummary.length} mandate{portfolioSummary.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portfolioSummary.map((row, idx) => {
                    const clientLabel =
                      typeof row.name === "string"
                        ? row.name
                        : typeof row.client === "string"
                          ? row.client
                          : "Unknown client";
                    const clientLinkId =
                      typeof row.clientId === "string" && row.clientId.length > 0
                        ? row.clientId
                        : clientLabel.toLowerCase().replace(/\s+/g, "-");
                    return (
                      <div
                        key={row.clientId ?? `portfolio-${idx}`}
                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Users className="size-5 text-primary" />
                          </div>
                          <div>
                            <EntityLink type="client" id={clientLinkId} label={clientLabel} className="font-semibold" />
                            <p className="text-sm text-muted-foreground">
                              AUM: ${formatNumber((row.aum ?? 0) / 1_000_000, 1)}m
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">MTD</p>
                            <PnLChange value={row.mtdReturn} size="sm" />
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">YTD</p>
                            <PnLChange value={row.ytdReturn} size="sm" />
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Sharpe</p>
                            <p className="font-mono font-semibold">{row.sharpe ?? "—"}</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <ArrowRight className="size-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Generated Reports</CardTitle>
                  <Button size="sm" variant="outline" className="gap-2">
                    <FileText className="size-4" />
                    New Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`size-10 rounded-lg flex items-center justify-center ${
                          report.status === "ready"
                            ? "bg-[var(--status-live)]/10"
                            : report.status === "sent"
                              ? "bg-primary/10"
                              : "bg-muted"
                        }`}
                      >
                        <FileText
                          className="size-5"
                          style={{
                            color:
                              report.status === "ready"
                                ? "var(--status-live)"
                                : report.status === "sent"
                                  ? "var(--primary)"
                                  : "var(--muted-foreground)",
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{report.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {report.client} &bull; {report.date} &bull; {report.format}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {report.generated && (
                        <span className="text-xs text-muted-foreground">Generated {report.generated}</span>
                      )}
                      <Badge
                        variant={
                          report.status === "ready" ? "default" : report.status === "sent" ? "secondary" : "outline"
                        }
                        className={
                          report.status === "ready" ? "bg-[var(--status-live)]/10 text-[var(--status-live)]" : ""
                        }
                      >
                        {report.status === "generating" && <Clock className="size-3 mr-1 animate-spin" />}
                        {report.status}
                      </Badge>
                      {report.status === "ready" && (
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Download className="size-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Send className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settlements Tab */}
          <TabsContent value="settlements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settlement Records</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {settlements.map((settlement) => {
                  const clientRecord = CLIENTS.find((c) => c.id === settlement.clientId);
                  const clientLabel =
                    typeof settlement.client === "string"
                      ? settlement.client
                      : (clientRecord?.name ?? "Unknown client");
                  const typeLine = typeof settlement.type === "string" ? settlement.type.replace(/_/g, " ") : null;
                  const venueLine = typeof settlement.venue === "string" ? settlement.venue : null;
                  const dateLine =
                    typeof settlement.dueDate === "string"
                      ? `Due: ${settlement.dueDate}`
                      : settlement.settledAt
                        ? `Settled: ${new Date(settlement.settledAt).toLocaleDateString()}`
                        : null;
                  const metaLine = [typeLine, venueLine, dateLine].filter(Boolean).join(" • ");

                  return (
                    <div
                      key={settlement.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        {settlement.status === "settled" && (
                          <CheckCircle2 className="size-5 text-[var(--status-live)]" />
                        )}
                        {settlement.status === "confirmed" && (
                          <CheckCircle2 className="size-5 text-[var(--status-warning)]" />
                        )}
                        {settlement.status === "pending" && <Clock className="size-5 text-muted-foreground" />}
                        {(settlement.status === "failed" || settlement.status === "disputed") && (
                          <AlertCircle className="size-5 text-destructive" />
                        )}
                        <div>
                          <EntityLink
                            type="settlement"
                            id={settlement.id}
                            label={clientLabel}
                            className="font-medium"
                          />
                          <p className="text-xs text-muted-foreground">{metaLine || "Settlement"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <PnLValue value={settlement.amount} size="md" showSign />
                        <Badge
                          variant={
                            settlement.status === "settled"
                              ? "default"
                              : settlement.status === "confirmed"
                                ? "secondary"
                                : "outline"
                          }
                          className={
                            settlement.status === "settled"
                              ? "bg-[var(--status-live)]/10 text-[var(--status-live)]"
                              : settlement.status === "confirmed"
                                ? "bg-[var(--status-warning)]/10 text-[var(--status-warning)]"
                                : settlement.status === "failed" || settlement.status === "disputed"
                                  ? "bg-destructive/10 text-destructive"
                                  : ""
                          }
                        >
                          {settlement.status}
                        </Badge>
                        {settlement.status === "pending" && <Button size="sm">Confirm</Button>}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Invoices</CardTitle>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Receipt className="size-4" />
                    New Invoice
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {invoices.map((invoice) => (
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
                        <p className="font-medium font-mono">{invoice.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {invoice.client} &bull; {invoice.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="font-mono font-semibold">{formatCurrency(invoice.amount, "USD", 0)}</span>
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
                      <Button variant="ghost" size="sm">
                        <Download className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Treasury Tab */}
          <TabsContent value="treasury" className="space-y-6">
            {/* Capital Allocation */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Capital Allocation by Venue</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    Total:{" "}
                    <span className="font-semibold text-foreground">
                      {`$${formatNumber(accountBalances.reduce((s, b) => s + b.total, 0) / 1_000_000, 2)}M`}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Venue</TableHead>
                      <TableHead className="text-right">Free</TableHead>
                      <TableHead className="text-right">Locked</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[200px]">Utilization</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountBalances.map((bal) => {
                      const utilization = bal.total > 0 ? (bal.locked / bal.total) * 100 : 0;
                      return (
                        <TableRow key={bal.venue}>
                          <TableCell className="font-medium">{bal.venue}</TableCell>
                          <TableCell className="text-right font-mono text-[var(--pnl-positive)]">
                            ${formatNumber(bal.free / 1000, 0)}k
                          </TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">
                            ${formatNumber(bal.locked / 1000, 0)}k
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            ${formatNumber(bal.total / 1000, 0)}k
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={utilization} className="h-2 flex-1" />
                              <span className="text-xs text-muted-foreground w-10">
                                {formatPercent(utilization, 0)}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Recent Transfers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Transfers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentTransfers.map((transfer, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-4">
                      {transfer.status === "settled" && <CheckCircle2 className="size-5 text-[var(--status-live)]" />}
                      {transfer.status === "confirmed" && <CheckCircle2 className="size-5 text-[var(--accent-blue)]" />}
                      {transfer.status === "confirming" && <Spinner className="size-5 text-[var(--accent-blue)]" />}
                      {transfer.status === "pending" && <Clock className="size-5 text-muted-foreground" />}
                      {transfer.status === "failed" && <AlertCircle className="size-5 text-destructive" />}
                      <div>
                        <p className="font-medium">
                          {transfer.from} <ArrowRight className="size-3 inline mx-1" /> {transfer.to}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transfer.time}
                          {transfer.txHash && <span className="ml-2 font-mono">{transfer.txHash}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono font-medium">{transfer.amount}</span>
                      <Badge
                        variant={
                          transfer.status === "settled" || transfer.status === "confirmed"
                            ? "default"
                            : transfer.status === "confirming"
                              ? "secondary"
                              : transfer.status === "failed"
                                ? "destructive"
                                : "outline"
                        }
                        className={
                          transfer.status === "settled" || transfer.status === "confirmed"
                            ? "bg-[var(--status-live)]/10 text-[var(--status-live)]"
                            : transfer.status === "confirming"
                              ? "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]"
                              : ""
                        }
                      >
                        {transfer.status}
                        {transfer.confirmations && ` (${transfer.confirmations})`}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <GenerateReportModal open={generateOpen} onOpenChange={setGenerateOpen} defaultType="pnl-attribution" />
      <ScheduleReportModal open={scheduleOpen} onOpenChange={setScheduleOpen} />
    </div>
  );
}
