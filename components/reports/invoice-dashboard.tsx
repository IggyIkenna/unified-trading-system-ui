"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/shared/page-header";
import { useInvoices, useTransitionInvoice, VALID_TRANSITIONS } from "@/hooks/api/use-invoices";
import type { Invoice, InvoiceStatus, TransitionAction } from "@/hooks/api/use-invoices";
import { InvoiceGenerateModal } from "@/components/reports/invoice-generate-modal";
import { InvoiceDetailDrawer } from "@/components/reports/invoice-detail-drawer";
import { ChevronDown, Download, Eye, FileText, Loader2, Plus, RefreshCw, AlertTriangle } from "lucide-react";

// ── Status Badge Styles ────────────────────────────────────────────────────────

const STATUS_BADGE_CLASS: Record<InvoiceStatus, string> = {
  draft: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
  issued: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  accepted: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  disputed: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  voided: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
};

const ACTION_LABELS: Record<TransitionAction, string> = {
  issue: "Issue",
  accept: "Accept",
  pay: "Mark Paid",
  dispute: "Dispute",
  void: "Void",
  reissue: "Re-issue",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ── Loading Skeleton ───────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3 w-28" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Invoice Row Actions ────────────────────────────────────────────────────────

function InvoiceActions({ invoice, onViewDetail }: { invoice: Invoice; onViewDetail: (id: string) => void }) {
  const transitionMutation = useTransitionInvoice();
  const validActions = VALID_TRANSITIONS[invoice.status];

  function handleTransition(action: TransitionAction) {
    transitionMutation.mutate({
      invoice_id: invoice.invoice_id,
      action,
    });
  }

  function handleDownload() {
    if (typeof window !== "undefined") {
      window.open(`/api/reporting/invoices/${invoice.invoice_id}/download`, "_blank");
    }
  }

  return (
    <div className="flex items-center gap-1.5 justify-end">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 text-xs h-7 px-2"
        onClick={() => onViewDetail(invoice.invoice_id)}
      >
        <Eye className="size-3" />
        View
      </Button>
      <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 px-2" onClick={handleDownload}>
        <Download className="size-3" />
        PDF
      </Button>
      {validActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs h-7 px-2"
              disabled={transitionMutation.isPending}
            >
              {transitionMutation.isPending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <>
                  Transition
                  <ChevronDown className="size-3" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {validActions.map((action) => (
              <DropdownMenuItem key={action} onClick={() => handleTransition(action)}>
                {ACTION_LABELS[action]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export function InvoiceDashboard() {
  const [selectedOrg, setSelectedOrg] = React.useState<string>("org-alpha");
  const [generateOpen, setGenerateOpen] = React.useState(false);
  const [detailId, setDetailId] = React.useState<string | null>(null);

  const { data: invoices, isLoading, isError, refetch } = useInvoices(selectedOrg);

  // ── Computed summary stats ───────────────────────────────────────────────
  const summary = React.useMemo(() => {
    const list = invoices ?? [];
    const outstanding = list
      .filter((inv) => inv.status === "issued" || inv.status === "accepted" || inv.status === "disputed")
      .reduce((sum, inv) => sum + inv.total, 0);
    const paid = list.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + inv.total, 0);
    const total = list.length;
    const currentMonthFees = list
      .filter((inv) => {
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        return inv.period_month === month;
      })
      .reduce((sum, inv) => sum + inv.total, 0);
    return { outstanding, paid, total, currentMonthFees };
  }, [invoices]);

  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <div className="p-6">
        <Card className="border-destructive/30">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 py-8">
              <AlertTriangle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Failed to load invoice data.</p>
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

  const list = invoices ?? [];

  return (
    <div className="p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <PageHeader
          title="Invoice Management"
          description={<p>Generate, track, and manage fee invoices across organizations.</p>}
        >
          <Button className="gap-1.5" onClick={() => setGenerateOpen(true)}>
            <Plus className="size-4" />
            Generate Invoice
          </Button>
        </PageHeader>

        {/* Org Selector */}
        <div className="flex items-center gap-3">
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select organization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="org-alpha">Alpha Capital</SelectItem>
              <SelectItem value="org-beta">Beta Fund</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Strip */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-4 space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Total Outstanding
              </p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight font-mono text-amber-600 dark:text-amber-400">
                {formatCurrency(summary.outstanding)}
              </p>
              <p className="text-[10px] text-muted-foreground/60">Issued + Accepted + Disputed</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-4 space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Paid</p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(summary.paid)}
              </p>
              <p className="text-[10px] text-muted-foreground/60">Completed payments</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-4 space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Invoices</p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight font-mono">{summary.total}</p>
              <p className="text-[10px] text-muted-foreground/60">All statuses</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-4 space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Current Month Fees
              </p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight font-mono">
                {formatCurrency(summary.currentMonthFees)}
              </p>
              <p className="text-[10px] text-muted-foreground/60">This billing period</p>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Table */}
        <Card>
          <CardContent className="pt-6">
            {list.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <FileText className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No invoices found for this organization.</p>
              </div>
            ) : (
              <WidgetScroll axes="horizontal" scrollbarSize="thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-3 pr-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Invoice ID
                      </th>
                      <th className="pb-3 pr-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Type
                      </th>
                      <th className="pb-3 pr-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Period
                      </th>
                      <th className="pb-3 pr-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="pb-3 pr-4 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
                        Total
                      </th>
                      <th className="pb-3 pr-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((invoice) => (
                      <tr
                        key={invoice.invoice_id}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 pr-4 font-mono text-xs">{invoice.invoice_id}</td>
                        <td className="py-3 pr-4 text-sm">
                          {invoice.type === "performance_fee" ? "Performance" : "Management"}
                        </td>
                        <td className="py-3 pr-4 text-sm font-mono">{invoice.period_month}</td>
                        <td className="py-3 pr-4">
                          <Badge variant="outline" className={STATUS_BADGE_CLASS[invoice.status]}>
                            {invoice.status}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-right font-mono text-sm">{formatCurrency(invoice.total)}</td>
                        <td className="py-3 pr-4 text-sm">{formatDate(invoice.due_date)}</td>
                        <td className="py-3">
                          <InvoiceActions invoice={invoice} onViewDetail={setDetailId} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </WidgetScroll>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Generate Modal */}
      <InvoiceGenerateModal open={generateOpen} onOpenChange={setGenerateOpen} defaultOrgId={selectedOrg} />

      {/* Detail Drawer */}
      <InvoiceDetailDrawer invoiceId={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}
