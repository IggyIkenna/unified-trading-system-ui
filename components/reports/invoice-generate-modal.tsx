"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGenerateInvoice } from "@/hooks/api/use-invoices";
import type { InvoiceType } from "@/hooks/api/use-invoices";
import { Loader2 } from "lucide-react";

interface InvoiceGenerateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultOrgId?: string;
}

export function InvoiceGenerateModal({ open, onOpenChange, defaultOrgId }: InvoiceGenerateModalProps) {
  const [orgId, setOrgId] = React.useState(defaultOrgId ?? "org-alpha");
  const [periodMonth, setPeriodMonth] = React.useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  });
  const [invoiceType, setInvoiceType] = React.useState<InvoiceType>("performance_fee");
  const [currency, setCurrency] = React.useState("USD");

  const generateMutation = useGenerateInvoice();

  React.useEffect(() => {
    if (defaultOrgId) setOrgId(defaultOrgId);
  }, [defaultOrgId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    generateMutation.mutate(
      {
        org_id: orgId,
        period_month: periodMonth,
        invoice_type: invoiceType,
        currency,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>Create a new fee invoice for the selected organization and period.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="org-select">Organization</Label>
            <Select value={orgId} onValueChange={setOrgId}>
              <SelectTrigger id="org-select">
                <SelectValue placeholder="Select org" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="org-alpha">Alpha Capital</SelectItem>
                <SelectItem value="org-beta">Beta Fund</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="period-input">Period (YYYY-MM)</Label>
            <Input
              id="period-input"
              type="month"
              value={periodMonth}
              onChange={(e) => setPeriodMonth(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type-select">Invoice Type</Label>
            <Select value={invoiceType} onValueChange={(v) => setInvoiceType(v as InvoiceType)}>
              <SelectTrigger id="type-select">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="performance_fee">Performance Fee</SelectItem>
                <SelectItem value="management_fee">Management Fee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency-input">Currency</Label>
            <Input id="currency-input" value={currency} onChange={(e) => setCurrency(e.target.value)} required />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={generateMutation.isPending}>
              {generateMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Generate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
