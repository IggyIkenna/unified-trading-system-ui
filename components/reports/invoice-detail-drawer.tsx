"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { useInvoice, useTransitionInvoice, VALID_TRANSITIONS } from "@/hooks/api/use-invoices";
import type { Invoice, InvoiceStatus, TransitionAction } from "@/hooks/api/use-invoices";
import { Download, Loader2 } from "lucide-react";
import { WidgetScroll } from "@/components/shared/widget-scroll";

interface InvoiceDetailDrawerProps {
  invoiceId: string | null;
  onClose: () => void;
}

const STATUS_BADGE_CLASS: Record<InvoiceStatus, string> = {
  draft: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
  issued: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  accepted: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  disputed: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  voided: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
};

const ACTION_LABELS: Record<TransitionAction, string> = {
  issue: "Issue Invoice",
  accept: "Accept",
  pay: "Mark as Paid",
  dispute: "Dispute",
  void: "Void",
  reissue: "Re-issue",
};

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-baseline py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-mono text-right">{value}</span>
    </div>
  );
}

function DrawerBody({ invoice }: { invoice: Invoice }) {
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
    <>
      <SheetHeader>
        <div className="flex items-center gap-3">
          <SheetTitle className="font-mono text-base">{invoice.invoice_id}</SheetTitle>
          <Badge variant="outline" className={STATUS_BADGE_CLASS[invoice.status]}>
            {invoice.status}
          </Badge>
        </div>
        <SheetDescription>{invoice.description}</SheetDescription>
      </SheetHeader>

      <WidgetScroll className="flex-1" viewportClassName="px-4 space-y-5">
        {/* Detail Grid */}
        <div className="space-y-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Details</h4>
          <DetailRow label="Type" value={invoice.type === "performance_fee" ? "Performance Fee" : "Management Fee"} />
          <DetailRow label="Period" value={invoice.period_month} />
          <DetailRow label="Issued At" value={formatDate(invoice.issued_at)} />
          <DetailRow label="Due Date" value={formatDate(invoice.due_date)} />
          <DetailRow label="Currency" value={invoice.currency} />
        </div>

        <Separator />

        {/* Fee Breakdown */}
        <div className="space-y-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Fee Breakdown</h4>
          <DetailRow label="Opening AUM" value={formatCurrency(invoice.opening_aum, invoice.currency)} />
          <DetailRow label="Closing AUM" value={formatCurrency(invoice.closing_aum, invoice.currency)} />
          <DetailRow
            label="P&L"
            value={
              <span
                className={invoice.pnl >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
              >
                {formatCurrency(invoice.pnl, invoice.currency)}
              </span>
            }
          />
          <DetailRow label="Trader HWM (before)" value={formatCurrency(invoice.trader_hwm_before, invoice.currency)} />
          <DetailRow label="Odum HWM (before)" value={formatCurrency(invoice.odum_hwm_before, invoice.currency)} />
          <DetailRow label="Trader Fee" value={formatCurrency(invoice.trader_fee, invoice.currency)} />
          <DetailRow label="Odum Fee" value={formatCurrency(invoice.odum_fee, invoice.currency)} />
          {invoice.is_underwater && (
            <DetailRow
              label="Server Cost"
              value={
                <span className="text-amber-600 dark:text-amber-400">
                  {formatCurrency(invoice.server_cost, invoice.currency)}
                </span>
              }
            />
          )}
        </div>

        <Separator />

        {/* Totals */}
        <div className="space-y-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Totals</h4>
          <DetailRow label="Subtotal" value={formatCurrency(invoice.subtotal, invoice.currency)} />
          <DetailRow label="Tax" value={formatCurrency(invoice.tax, invoice.currency)} />
          <DetailRow
            label="Total"
            value={<span className="text-base font-semibold">{formatCurrency(invoice.total, invoice.currency)}</span>}
          />
        </div>

        {invoice.payment_txid && (
          <>
            <Separator />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Payment</h4>
              <DetailRow
                label="Transaction ID"
                value={<span className="text-xs break-all">{invoice.payment_txid}</span>}
              />
            </div>
          </>
        )}

        {invoice.notes && (
          <>
            <Separator />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Notes</h4>
              <p className="text-sm text-muted-foreground">{invoice.notes}</p>
            </div>
          </>
        )}
      </WidgetScroll>

      <SheetFooter className="border-t border-border pt-4">
        <div className="flex flex-wrap gap-2 w-full">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownload}>
            <Download className="size-3.5" />
            Download PDF
          </Button>
          {validActions.map((action) => (
            <Button
              key={action}
              variant={action === "void" || action === "dispute" ? "destructive" : "default"}
              size="sm"
              disabled={transitionMutation.isPending}
              onClick={() => handleTransition(action)}
            >
              {transitionMutation.isPending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
              {ACTION_LABELS[action]}
            </Button>
          ))}
        </div>
      </SheetFooter>
    </>
  );
}

export function InvoiceDetailDrawer({ invoiceId, onClose }: InvoiceDetailDrawerProps) {
  const { data: invoice, isLoading } = useInvoice(invoiceId ?? undefined);

  return (
    <Sheet open={!!invoiceId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
        {isLoading && (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && invoice && <DrawerBody invoice={invoice} />}
        {!isLoading && !invoice && invoiceId && (
          <div className="flex items-center justify-center flex-1">
            <p className="text-sm text-muted-foreground">Invoice not found.</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
